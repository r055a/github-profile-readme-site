const GH_API_V: string = "2026-03-10";

export interface ReadmeRes {
  html: string;
  isSuccess: boolean;
}

function getMD(html: string): string {
  const htmlMatch: RegExpMatchArray | null = html
    .trim()
    .match(/^<article\b([^>]*)>([\s\S]*)<\/article>$/i);
  if (!htmlMatch || !/\bmarkdown-body\b/i.test(htmlMatch[1] ?? "")) {
    return html;
  }
  return (htmlMatch[2] ?? "").trim();
}

function stripPerms(header: string): string {
  return header.replace(
    /<a\b[^>]*\bclass\s*=\s*(["'])[^"']*\banchor\b[^"']*\1[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
}

function normHeadMD(html: string): string {
  const normHtml: string = html.replace(
    /<div\b(?=[^>]*\bclass\s*=\s*(["'])[^"']*\bmarkdown-heading\b[^"']*\1)[^>]*>([\s\S]*?)<\/div>/i,
    (wrapper: string): string => {
      const headMD: string | undefined = wrapper.match(
        /<h1\b[^>]*>[\s\S]*?<\/h1>/i,
      )?.[0];
      return headMD ? stripPerms(headMD) : wrapper;
    },
  );
  return normHtml
    .replace(
      /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i,
      (_match: string, attrs: string, contents: string): string =>
        `<h1${attrs}>` + `${stripPerms(contents)}` + `</h1>`,
    )
    .replace(
      /(<h1\b[^>]*>[\s\S]*?<\/h1>)\s*<a\b[^>]*\bclass\s*=\s*(["'])[^"']*\banchor\b[^"']*\2[^>]*>[\s\S]*?<\/a>/i,
      "$1",
    );
}

function formatTag(html: string, tag: "h1" | "p", cls: string): string {
  return html.replace(
    new RegExp(`<${tag}\\b([^>]*)>`, "i"),
    (_openingTag: string, attrs: string): string => {
      const clsPattern = /\sclass\s*=\s*(["'])(.*?)\1/i;
      if (!clsPattern.test(attrs)) {
        return `<${tag}${attrs} ` + `class="${cls}">`;
      }
      const updated: string = attrs.replace(
        clsPattern,
        (_match: string, quote: string, existingCls: string): string => {
          const clsArr: string[] = existingCls.split(/\s+/).filter(Boolean);
          if (!clsArr.includes(cls)) {
            clsArr.push(cls);
          }
          return ` class=${quote}${clsArr.join(" ")}${quote}`;
        },
      );
      return `<${tag}${updated}>`;
    },
  );
}

function formatAttr(
  html: string,
  tagPat: string,
  attr: string,
  baseUrl: string,
): string {
  return html.replace(
    new RegExp(
      `(<(?:${tagPat})\\b[^>]*?\\s` + `${attr}\\s*=\\s*)(["'])(.*?)\\2`,
      "gi",
    ),
    (_match: string, prefix: string, quote: string, url: string): string =>
      `${prefix}${quote}` + `${formatRelUrl(url, baseUrl)}` + `${quote}`,
  );
}

function formatRelUrl(url: string, baseUrl: string): string {
  const trimUrl: string = url.trim();
  if (!trimUrl || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(trimUrl)) {
    return url;
  } else if (trimUrl.startsWith("/")) {
    return `https://github.com${trimUrl}`;
  }
  try {
    return new URL(trimUrl, baseUrl).href;
  } catch {
    return url;
  }
}

function formatSrcset(html: string, baseUrl: string): string {
  return html.replace(
    /(<(?:img|source)\b[^>]*?\ssrcset\s*=\s*)(["'])(.*?)\2/gi,
    (_match: string, prefix: string, quote: string, val: string): string => {
      if (val.trim().startsWith("data:")) {
        return `${prefix}${quote}${val}${quote}`;
      }
      const formatVal: string = val
        .split(",")
        .map((str: string): string => {
          const [url = "", desc] = str.trim().split(/\s+/, 2);
          const res: string = formatRelUrl(url, baseUrl);
          return desc ? `${res} ${desc}` : res;
        })
        .join(", ");
      return `${prefix}${quote}${formatVal}${quote}`;
    },
  );
}

function formatUrls(html: string, username: string, defBranch: string): string {
  const encUsername: string = encodeURIComponent(username);
  const encBranch: string = encodeURIComponent(defBranch);

  const rawUrl: string =
    `https://raw.githubusercontent.com/` +
    `${encUsername}/${encUsername}/` +
    `${encBranch}/`;
  const res: string = formatAttr(
    formatAttr(html, "img|source|video|audio|track|input", "src", rawUrl),
    "img|source",
    "data-canonical-src",
    rawUrl,
  );
  const blobUrl: string =
    `https://github.com/` +
    `${encUsername}/${encUsername}/blob/` +
    `${encBranch}/`;
  return formatAttr(formatSrcset(res, rawUrl), "a|area", "href", blobUrl);
}

function escHtml(str: string): string {
  return str.replace(
    /[&<>"']/g,
    (char: string): string =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}

function failRes(username: string, msg: string): ReadmeRes {
  console.warn(`[GitHub README] ${msg}`);
  const htmlFB: string = `
    <h1>${escHtml(username)}</h1>
    <p>The profile README could not be loaded.</p>
    <p><a href="https://github.com/${encodeURIComponent(username)}">Open the GitHub profile</a></p>
  `;
  return {
    html: htmlFB,
    isSuccess: false,
  };
}

async function fetchDefBranch(
  username: string,
  headers: Record<string, string>,
): Promise<string> {
  try {
    const res: Response = await fetch(repoApiUrl(username), {
      headers: {
        ...headers,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) {
      return "HEAD";
    }

    const repo = (await res.json()) as {
      default_branch?: unknown;
    };
    const branch: unknown = repo.default_branch;

    return typeof branch === "string" && branch.trim() ? branch : "HEAD";
  } catch {
    return "HEAD";
  }
}

function getHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": GH_API_V,
    "User-Agent": "github-profile-readme-site",
  };
  const gh_token: string | undefined = process.env.GITHUB_TOKEN?.trim();
  if (gh_token) {
    headers.Authorization = `Bearer ${gh_token}`;
  }
  return headers;
}

function repoApiUrl(username: string, path = ""): string {
  const encodedUsername: string = encodeURIComponent(username);
  return (
    "https://api.github.com/repos/" +
    `${encodedUsername}/${encodedUsername}${path}`
  );
}

export async function fetchReadme(username: string): Promise<ReadmeRes> {
  const headers: Record<string, string> = getHeaders(
    "application/vnd.github.html+json",
  );
  try {
    const [res, defBranch] = await Promise.all([
      fetch(repoApiUrl(username, "/readme"), {
        headers,
      }),
      fetchDefBranch(username, headers),
    ]);
    if (!res.ok) {
      return failRes(
        username,
        `GitHub API returned ${res.status} ` +
          `${res.statusText}. Confirm that the public ` +
          `repository ${username}/${username} contains a README.`,
      );
    }

    const html: string = formatUrls(
      formatTag(
        formatTag(normHeadMD(getMD(await res.text())), "h1", "readme-title"),
        "p",
        "readme-intro",
      ),
      username,
      defBranch,
    );
    return {
      html,
      isSuccess: true,
    };
  } catch (error) {
    const msg: string =
      error instanceof Error
        ? error.message
        : "An unknown network error occurred.";
    return failRes(username, msg);
  }
}
