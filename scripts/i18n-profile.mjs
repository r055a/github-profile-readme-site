const ELEM_EXCLUDE = new Set([
  "a",
  "code",
  "kbd",
  "math",
  "pre",
  "samp",
  "script",
  "style",
  "svg",
]);

const ELEM_VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const PATTERN_ATTR = /(\s)(alt|aria-label|title)(\s*=\s*)(["'])([\s\S]*?)\4/gi;
const PATTERN_HTML = /<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g;
const PATTERN_NON_TXT = /^(?:https?:\/\/|mailto:|tel:|#[\w-]+$)/i;
const PATTERN_TAG = /^<\s*(\/?)\s*([A-Za-z][\w:-]*)/;
const PATTERN_TRANS = /[\p{L}\p{N}]/u;

function isTrans(str) {
  const txt = str.trim();
  return (
    txt.length > 0 && PATTERN_TRANS.test(txt) && !PATTERN_NON_TXT.test(txt)
  );
}

function stripSplitWS(str) {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(str);
  return {
    leading: match?.[1] ?? "",
    core: match?.[2] ?? str,
    trailing: match?.[3] ?? "",
  };
}

function getTagIdx(stack, tagName) {
  for (let idx = stack.length - 1; idx >= 0; idx -= 1) {
    if (stack[idx].name === tagName) return idx;
  }
  return -1;
}

export async function transHTML(html, transData) {
  const tokens = html.match(PATTERN_HTML) ?? [html];
  const plans = [];
  const strings = new Set();
  const stack = [];
  let excDepth = 0;

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      if (excDepth > 0) {
        plans.push({ type: "literal", value: token });
        continue;
      }

      const ws = stripSplitWS(token);
      if (!isTrans(ws.core)) {
        plans.push({ type: "literal", value: token });
        continue;
      }
      strings.add(ws.core);
      plans.push({ type: "text", ...ws });
      continue;
    }

    const tagMatch = PATTERN_TAG.exec(token);
    if (!tagMatch) {
      plans.push({ type: "literal", value: token });
      continue;
    }

    const tagName = tagMatch[2].toLowerCase();
    if (tagMatch[1] === "/") {
      plans.push({ type: "literal", value: token });
      const idx = getTagIdx(stack, tagName);
      if (idx >= 0) {
        const removed = stack.splice(idx);
        for (const entry of removed) {
          if (entry.excluded) excDepth -= 1;
        }
      }
      continue;
    }

    const excElem = ELEM_EXCLUDE.has(tagName);
    if (excDepth > 0 || excElem) {
      plans.push({ type: "literal", value: token });
    } else {
      const attrs = new Set();
      for (const match of token.matchAll(PATTERN_ATTR)) {
        const orig = match[5] ?? "";
        if (!isTrans(orig)) continue;
        strings.add(orig);
        attrs.add(orig);
      }
      plans.push(
        attrs.size > 0
          ? { type: "tag", value: token, attrs }
          : { type: "literal", value: token },
      );
    }

    if (!/\/\s*>$/.test(token) || ELEM_VOID.has(tagName)) {
      stack.push({
        name: tagName,
        excluded: excElem,
      });
      if (excElem) excDepth += 1;
    }
  }

  const trans = await transData([...strings]);
  let output = "";

  for (const plan of plans) {
    if (plan.type === "literal") {
      output += plan.value;
      continue;
    }
    if (plan.type === "text") {
      output +=
        plan.leading + (trans.get(plan.core) ?? plan.core) + plan.trailing;
      continue;
    }

    output += plan.value.replace(
      PATTERN_ATTR,
      (match, space, name, equals, quote, orig) => {
        if (!plan.attrs.has(orig)) return match;
        const transLoc = trans.get(orig);
        if (transLoc === undefined) return match;
        return `${space}${name}${equals}${quote}${transLoc}${quote}`;
      },
    );
  }
  return output;
}
