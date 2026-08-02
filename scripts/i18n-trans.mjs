import emojiRegex from "emoji-regex";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { transHTML } from "./i18n-profile.mjs";
import { GH_API_V } from "../src/lib/gh.ts";

const PATTERN_MODEL_TXT = /[\p{L}\p{N}]/u;

const GEN_DIR = resolve(
  process.cwd(),
  process.env.I18N_OUTPUT_DIR?.trim() || "src/gen/i18n",
);
const MODEL_ID = process.env.HF_TRANS_MODEL?.trim() || "Xenova/m2m100_418M";
const MODEL_DTYPE = process.env.HF_TRANS_DTYPE?.trim() || "q8";
const MODEL_TASK = process.env.HF_TRANS_TASK?.trim() || "translation";
const MODEL_CACHE_DIR = resolve(
  process.cwd(),
  process.env.HF_TRANSFORMERS_CACHE?.trim() || ".cache/huggingface",
);
const MODEL_META = Object.freeze({
  provider: "transformers.js",
  model: MODEL_ID,
  dtype: MODEL_DTYPE,
  task: MODEL_TASK,
  emoji: "preserve",
});

const MAX_SEG_CHARS = Math.max(
  80,
  Number.parseInt(process.env.HF_TRANS_MAX_CHARS || "320", 10) || 320,
);
const MAX_NEW_TOKENS = Math.max(
  32,
  Number.parseInt(process.env.HF_TRANS_MAX_NEW_TOKENS || "384", 10) || 384,
);

const HTML_ESC = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
});

const SENTENCE_SEGMENTER = (() => {
  try {
    return new Intl.Segmenter(undefined, { granularity: "sentence" });
  } catch {
    return undefined;
  }
})();

const HTML_MAP = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["copy", "©"],
  ["gt", ">"],
  ["hellip", "…"],
  ["laquo", "«"],
  ["ldquo", "“"],
  ["lsquo", "‘"],
  ["lt", "<"],
  ["mdash", "—"],
  ["nbsp", "\u00a0"],
  ["ndash", "–"],
  ["quot", '"'],
  ["raquo", "»"],
  ["rdquo", "”"],
  ["reg", "®"],
  ["rsquo", "’"],
  ["trade", "™"],
]);

function decodeHTML(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi,
    (match, dec, hexDec, named) => {
      if (!dec && !hexDec) {
        return HTML_MAP.get(String(named).toLowerCase()) ?? match;
      }
      const codePnt = Number.parseInt(dec ? dec : hexDec, dec ? 10 : 16);
      return Number.isSafeInteger(codePnt) &&
        codePnt >= 0 &&
        codePnt <= 0x10ffff
        ? String.fromCodePoint(codePnt)
        : match;
    },
  );
}

function splitTxt(str) {
  if (str.length <= MAX_SEG_CHARS) return [str];

  const strSeg = SENTENCE_SEGMENTER
    ? Array.from(SENTENCE_SEGMENTER.segment(str), ({ seg }) => seg)
    : str.split(/(?<=[.!?])\s+/u);

  const chunks = [];
  let cur = "";

  const pushCur = () => {
    if (cur) chunks.push(cur);
    cur = "";
  };

  for (const line of strSeg) {
    if (!line) continue;
    if (line.length <= MAX_SEG_CHARS) {
      if (cur && cur.length + line.length > MAX_SEG_CHARS) {
        pushCur();
      }
      cur += line;
      continue;
    }

    pushCur();
    const words = line.split(/(\s+)/u);
    for (const word of words) {
      if (cur && cur.length + word.length > MAX_SEG_CHARS) {
        pushCur();
      }
      if (word.length <= MAX_SEG_CHARS) {
        cur += word;
      } else {
        for (let offset = 0; offset < word.length; offset += MAX_SEG_CHARS) {
          chunks.push(word.slice(offset, offset + MAX_SEG_CHARS));
        }
      }
    }
  }

  pushCur();
  return chunks.length ? chunks : [str];
}

function langModel(locale) {
  return localeNorm(locale).toLowerCase().split("-")[0];
}

function isWordsRepeat(value) {
  const words = String(value ?? "")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  if (!words || words.length < 3) return false;

  for (
    let size = 1;
    size <= Math.min(4, Math.floor(words.length / 3));
    size += 1
  ) {
    for (let i = 0; i + size * 3 <= words.length; i += 1) {
      let repeatCnt = 1;
      while (i + size * (repeatCnt + 1) <= words.length) {
        let isDup = true;
        for (let j = 0; j < size; j += 1) {
          if (words[i + j] !== words[i + size * repeatCnt + j]) {
            isDup = false;
            break;
          }
        }
        if (!isDup) break;
        repeatCnt += 1;
      }
      if (repeatCnt >= 3) return true;
    }
  }

  return false;
}

function isCharsRepeat(value) {
  const chars = Array.from(String(value ?? "").replace(/\s+/gu, ""));
  if (chars.length < 8) return false;

  for (
    let size = 1;
    size <= Math.min(8, Math.floor(chars.length / 4));
    size += 1
  ) {
    for (let i = 0; i + size * 4 <= chars.length; i += 1) {
      let repeatCnt = 1;

      while (i + size * (repeatCnt + 1) <= chars.length) {
        let isDup = true;

        for (let j = 0; j < size; j += 1) {
          if (chars[i + j] !== chars[i + size * repeatCnt + j]) {
            isDup = false;
            break;
          }
        }
        if (!isDup) break;
        repeatCnt += 1;
      }
      if (repeatCnt >= 4 && repeatCnt * size >= 8) return true;
    }
  }
  return false;
}

export function isTransValid(src, trans) {
  const isTransValidRes = String(trans ?? "").trim();
  if (!isTransValidRes) return { ok: false, reason: "empty output" };

  const resLen = Array.from(isTransValidRes).length;
  const maxChars = Math.max(
    80,
    Array.from(String(src ?? "").trim()).length * 4 + 24,
  );
  if (resLen > maxChars) {
    return {
      ok: false,
      reason: `output (${resLen} > ${maxChars})`,
    };
  }

  if (isWordsRepeat(isTransValidRes) || isCharsRepeat(isTransValidRes)) {
    return { ok: false, reason: "repetition" };
  }
  return { ok: true };
}

export function maxTokens(src, cap = 384) {
  return Math.min(
    Number.isFinite(cap) ? Math.max(16, cap) : 384,
    Math.max(16, Math.ceil(Array.from(String(src ?? "")).length * 2.5 + 8)),
  );
}

export function getPipelineTxt(res) {
  const init = Array.isArray(res) ? res[0] : res;
  if (init && typeof init.translation_text === "string") {
    return init.translation_text;
  } else if (init && typeof init.generated_text === "string") {
    return init.generated_text;
  }
  return undefined;
}

function splitEmoji(str) {
  const txt = String(str ?? "");
  const seg = [];
  let offset = 0;

  for (const match of txt.matchAll(emojiRegex())) {
    const idx = match.index ?? offset;
    if (idx > offset) {
      seg.push({ type: "text", value: txt.slice(offset, idx) });
    }
    seg.push({ type: "emoji", value: match[0] });
    offset = idx + match[0].length;
  }

  if (offset < txt.length) {
    seg.push({ type: "text", value: txt.slice(offset) });
  }
  return seg.length ? seg : [{ type: "text", value: txt }];
}

export function splitEmojiMap(str) {
  return splitEmoji(str).map((seg) => ({
    protected: seg.type === "emoji",
    value: seg.value,
  }));
}

export function isModelTxt(value) {
  return PATTERN_MODEL_TXT.test(String(value ?? ""));
}

class TransHF {
  constructor(localeSrc) {
    this.localeSrc = localeNorm(localeSrc);
    this.langSrc = langModel(localeSrc);
    this.pipelinePromise = undefined;
    this.transMem = new Map();
  }

  async getPipeline() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = (async () => {
        let transformers;
        try {
          transformers = await import("@huggingface/transformers");
        } catch (error) {
          throw new Error(
            "@huggingface/transformers is not installed. Run: npm install.",
            { cause: error },
          );
        }

        transformers.env.cacheDir = MODEL_CACHE_DIR;
        console.log(`Loading ${MODEL_ID} (${MODEL_DTYPE}, ${MODEL_TASK})...`);
        return transformers.pipeline(MODEL_TASK, MODEL_ID, {
          dtype: MODEL_DTYPE,
        });
      })();
    }
    return this.pipelinePromise;
  }

  optsGen(source, locale, retry = false) {
    const opts = {
      do_sample: false,
      max_new_tokens: maxTokens(
        source,
        retry
          ? Math.max(16, Math.ceil(Array.from(source).length * 1.75 + 8))
          : MAX_NEW_TOKENS,
      ),
      no_repeat_ngram_size: retry ? 2 : 3,
      repetition_penalty: retry ? 1.35 : 1.15,
    };
    if (MODEL_TASK === "translation") {
      opts.src_lang = this.langSrc;
      opts.tgt_lang = langModel(locale);
    }
    return opts;
  }

  async unitTrans(pipeline, src, locale) {
    if (src === undefined) return src;

    let isValidReason = "invalid response";
    for (const retry of [false, true]) {
      const res = await pipeline(src, this.optsGen(src, locale, retry));
      const trans = getPipelineTxt(res);
      if (trans === undefined) {
        isValidReason = "invalid response";
        continue;
      }
      const isValid = isTransValid(src, trans);
      if (isValid.ok) return trans;
      isValidReason = isValid.reason;
    }

    console.warn(
      `Rejected ${this.langSrc} -> ${langModel(locale)} translation (${isValidReason}): ${src.replace(/\s+/gu, " ").slice(0, 80)}`,
    );
    return src;
  }

  async transMany(data, locale) {
    const lang = langModel(locale);
    if (lang === this.langSrc) {
      return new Map(data.map((str) => [str, str]));
    }

    const dataUniq = [...new Set(data.filter(Boolean))];
    const output = new Map();
    const srcPlans = [];
    const units = [];

    for (const str of dataUniq) {
      const memKey = `${MODEL_ID}:${MODEL_DTYPE}:${this.langSrc}:${lang}:${str}`;
      const mem = this.transMem.get(memKey);
      if (mem !== undefined) {
        output.set(str, mem);
        continue;
      }

      const parts = [];
      for (const part of splitEmojiMap(str)) {
        if (part.protected || !isModelTxt(part.value)) {
          parts.push({ literal: part.value });
          continue;
        }

        const ws = /^(\s*)([\s\S]*?)(\s*)$/u.exec(part.value);
        const leading = ws?.[1] ?? "";
        const core = ws?.[2] ?? part.value;
        const trailing = ws?.[3] ?? "";
        if (leading) parts.push({ literal: leading });
        for (const chunk of splitTxt(core)) {
          if (!isModelTxt(chunk)) {
            parts.push({ literal: chunk });
            continue;
          }
          const unit = units.length;
          units.push(chunk);
          parts.push({ unit });
        }
        if (trailing) parts.push({ literal: trailing });
      }
      srcPlans.push({ str, memKey, parts });
    }

    const unitsTrans = [];
    if (units.length) {
      const pl = await this.getPipeline();
      for (const unit of units) {
        unitsTrans.push(await this.unitTrans(pl, unit, locale));
      }
    }

    for (const plan of srcPlans) {
      const trans = plan.parts
        .map((part) =>
          "literal" in part ? part.literal : unitsTrans[part.unit],
        )
        .join("");
      this.transMem.set(plan.memKey, trans);
      output.set(plan.str, trans);
    }
    return output;
  }

  async transHtml(html, locale) {
    return transHTML(html, async (encHTML) => {
      const decodedMap = new Map(encHTML.map((str) => [str, decodeHTML(str)]));
      const trans = await this.transMany(
        [...new Set(decodedMap.values())],
        locale,
      );
      return new Map(
        encHTML.map((orig) => {
          const decoded = decodedMap.get(orig) ?? orig;
          return [orig, escHTML(trans.get(decoded) ?? decoded)];
        }),
      );
    });
  }

  async dispose() {
    if (!this.pipelinePromise) return;
    const pipeline = await this.pipelinePromise.catch(() => undefined);
    if (typeof pipeline?.dispose === "function") await pipeline.dispose();
  }
}

function localeNorm(locale) {
  return String(locale ?? "")
    .trim()
    .replaceAll("_", "-");
}

function localesUniq(localeSrc, locales) {
  return [
    ...new Set(
      [localeSrc, ...(Array.isArray(locales) ? locales : [])]
        .map(localeNorm)
        .filter(Boolean),
    ),
  ];
}

function isLocale(locale) {
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
}

function getRepoUrl(username, path = "") {
  const encoded = encodeURIComponent(username);
  return `https://api.github.com/repos/${encoded}/${encoded}${path}`;
}

async function fetchDefBranch(username, headers) {
  try {
    const res = await fetch(getRepoUrl(username), {
      headers: { ...headers, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return "HEAD";
    const repo = await res.json();
    return typeof repo.default_branch === "string" && repo.default_branch.trim()
      ? repo.default_branch
      : "HEAD";
  } catch {
    return "HEAD";
  }
}

function escHTML(html) {
  return html.replace(/[&<>"']/g, (char) => HTML_ESC[char] ?? char);
}

function invalidReadmeMsg(username, msg) {
  console.warn(`GitHub README: ${msg}`);
  return {
    isSuccess: false,
    html: `\n<h1>${escHTML(username)}</h1>\n<p>The profile README could not be loaded.</p>\n<p><a href="https://github.com/${encodeURIComponent(username)}">Open the GitHub profile</a></p>\n`,
  };
}

function resolveRelUrl(url, baseUrl) {
  const trimUrl = url.trim();
  if (!trimUrl || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(trimUrl)) return url;
  if (trimUrl.startsWith("/")) return `https://github.com${trimUrl}`;
  try {
    return new URL(trimUrl, baseUrl).href;
  } catch {
    return url;
  }
}

function formatAttrUrl(html, tagPattern, attr, baseUrl) {
  return html.replace(
    new RegExp(
      `(<(?:${tagPattern})\\b[^>]*?\\s${attr}\\s*=\\s*)(["'])(.*?)\\2`,
      "gi",
    ),
    (_match, prefix, quote, url) =>
      `${prefix}${quote}${resolveRelUrl(url, baseUrl)}${quote}`,
  );
}

function formatSrcset(html, baseUrl) {
  return html.replace(
    /(<(?:img|source)\b[^>]*?\ssrcset\s*=\s*)(["'])(.*?)\2/gi,
    (_match, prefix, quote, str) => {
      if (str.trim().startsWith("data:"))
        return `${prefix}${quote}${str}${quote}`;
      const formattedStr = str
        .split(",")
        .map((part) => {
          const [url = "", desc] = part.trim().split(/\s+/, 2);
          const res = resolveRelUrl(url, baseUrl);
          return desc ? `${res} ${desc}` : res;
        })
        .join(", ");
      return `${prefix}${quote}${formattedStr}${quote}`;
    },
  );
}

function formatReadmeUrl(html, username, branch) {
  const encUsername = encodeURIComponent(username);
  const encBranch = encodeURIComponent(branch);
  const baseRaw = `https://raw.githubusercontent.com/${encUsername}/${encUsername}/${encBranch}/`;
  const baseBlob = `https://github.com/${encUsername}/${encUsername}/blob/${encBranch}/`;

  const withSrc = formatAttrUrl(
    formatAttrUrl(html, "img|source|video|audio|track|input", "src", baseRaw),
    "img|source",
    "data-src",
    baseRaw,
  );
  return formatAttrUrl(
    formatSrcset(withSrc, baseRaw),
    "a|area",
    "href",
    baseBlob,
  );
}

function stripHeader(html) {
  return html.replace(
    /<a\b[^>]*\bclass\s*=\s*(["'])[^"']*\banchor\b[^"']*\1[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
}

function headerNorm(html) {
  return html
    .replace(
      /<div\b(?=[^>]*\bclass\s*=\s*(["'])[^"']*\bmarkdown-heading\b[^"']*\1)[^>]*>([\s\S]*?)<\/div>/i,
      (wrapper) => {
        const heading = wrapper.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0];
        return heading ? stripHeader(heading) : wrapper;
      },
    )
    .replace(
      /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i,
      (_match, attributes, contents) =>
        `<h1${attributes}>${stripHeader(contents)}</h1>`,
    )
    .replace(
      /(<h1\b[^>]*>[\s\S]*?<\/h1>)\s*<a\b[^>]*\bclass\s*=\s*(["'])[^"']*\banchor\b[^"']*\2[^>]*>[\s\S]*?<\/a>/i,
      "$1",
    );
}

function getMD(html) {
  const md = html.trim().match(/^<article\b([^>]*)>([\s\S]*)<\/article>$/i);
  if (!md || !/\bmarkdown-body\b/i.test(md[1] ?? "")) return html;
  return (md[2] ?? "").trim();
}

function getHeaders(accept) {
  const headers = {
    Accept: accept,
    "X-GitHub-Api-Version": GH_API_V,
    "User-Agent": "github-profile-readme-site",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function addCls(html, tag, clsName) {
  return html.replace(
    new RegExp(`<${tag}\\b([^>]*)>`, "i"),
    (_opening, attrs) => {
      const clsPattern = /\sclass\s*=\s*(["'])(.*?)\1/i;
      const match = attrs.match(clsPattern);
      if (!match) return `<${tag}${attrs} class="${clsName}">`;
      const classes = new Set(match[2].split(/\s+/).filter(Boolean));
      classes.add(clsName);
      return `<${tag}${attrs.replace(
        clsPattern,
        ` class=${match[1]}${[...classes].join(" ")}${match[1]}`,
      )}>`;
    },
  );
}

async function fetchReadme(username) {
  const headers = getHeaders("application/vnd.github.html+json");
  try {
    const [res, defBranch] = await Promise.all([
      fetch(getRepoUrl(username, "/readme"), { headers }),
      fetchDefBranch(username, headers),
    ]);

    if (!res.ok) {
      return invalidReadmeMsg(
        username,
        `GitHub-API returned ${res.status} ${res.statusText} for ${username}/${username} README.`,
      );
    }

    const html = formatReadmeUrl(
      addCls(
        addCls(headerNorm(getMD(await res.text())), "h1", "readme-title"),
        "p",
        "readme-intro",
      ),
      username,
      defBranch,
    );

    return { html, isSuccess: true };
  } catch (error) {
    return invalidReadmeMsg(
      username,
      error instanceof Error
        ? error.message
        : "An unknown network error occurred.",
    );
  }
}

function genPath(locale) {
  return resolve(GEN_DIR, `${locale}.json`);
}

function isCurTrans(existing, { locale, localeSrc, srcHash }) {
  return (
    existing?.locale === locale &&
    existing?.localeSrc === localeSrc &&
    existing?.srcHash === srcHash &&
    existing?.generator?.provider === MODEL_META.provider &&
    existing?.generator?.model === MODEL_META.model &&
    existing?.generator?.dtype === MODEL_META.dtype &&
    existing?.generator?.task === MODEL_META.task &&
    existing?.generator?.emoji === MODEL_META.emoji
  );
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function writeJson(path, data) {
  return writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const conf = await readJson(resolve(process.cwd(), "site.config.json"));
  if (!conf || typeof conf !== "object") {
    throw new Error("site.config.json could not be read.");
  }

  const localeSrc = localeNorm(conf.language) || "en";
  const locales = localesUniq(localeSrc, conf.locales);
  for (const locale of locales) isLocale(locale);

  const username = String(conf.githubUsername ?? "").trim();
  const tagline = String(conf.tagline ?? "");
  const tabSuffix = String(conf.tabSuffix ?? "GitHub Profile");
  let readme = await fetchReadme(username);
  if (!readme.isSuccess) {
    const prevSrc = await readJson(genPath(localeSrc));
    if (prevSrc?.readme?.isSuccess === true) {
      console.warn("Reverting to prior README.");
      readme = prevSrc.readme;
    }
  }

  const srcHash = createHash("sha256")
    .update(JSON.stringify({ localeSrc, tabSuffix, tagline, readme }))
    .digest("hex");

  const sharedDoc = { localeSrc, srcHash };
  await mkdir(GEN_DIR, { recursive: true });
  await writeJson(genPath(localeSrc), {
    ...sharedDoc,
    locale: localeSrc,
    generator: { provider: "source" },
    tabSuffix,
    tagline,
    readme,
  });

  const targetLocales = locales.filter((locale) => locale !== localeSrc);
  const currentTranslations = await Promise.all(
    targetLocales.map(async (locale) =>
      isCurTrans(await readJson(genPath(locale)), {
        locale,
        localeSrc,
        srcHash,
      }),
    ),
  );
  const localesStale = targetLocales.filter(
    (_locale, index) => !currentTranslations[index],
  );
  if (!localesStale.length) {
    console.log("Translations are up to date.");
    return;
  }

  console.log(`Generating: ${localesStale.join(", ")}`);
  const transHF = new TransHF(localeSrc);
  try {
    for (const locale of localesStale) {
      console.log(`Translating ${localeSrc} -> ${locale}...`);
      const txt = await transHF.transMany(
        [tabSuffix, tagline].filter(Boolean),
        locale,
      );
      const transTabSuffix = txt.get(tabSuffix) ?? tabSuffix;
      const transTagline = tagline ? (txt.get(tagline) ?? tagline) : "";
      const transReadme = await transHF.transHtml(readme.html, locale);

      await writeJson(genPath(locale), {
        ...sharedDoc,
        locale,
        generator: MODEL_META,
        tabSuffix: transTabSuffix,
        tagline: transTagline,
        readme: {
          ...readme,
          html: transReadme,
        },
      });
    }
  } finally {
    await transHF.dispose();
  }
  console.log("Profile translations complete.");
}

main().catch((error) => {
  console.error("Failed to translate profile.");
  console.error(error);
  process.exitCode = 1;
});
