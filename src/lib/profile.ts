import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { siteConfig } from "../config";

export interface ReadmeMD {
  html: string;
  isSuccess: boolean;
}

interface Profile {
  version: number;
  locale: string;
  localeSrc: string;
  sourceHash: string;
  tabSuffix: string;
  tagline: string;
  readme: ReadmeMD;
}

export interface ProfileTrans {
  readme: ReadmeMD;
  tagline: string;
  title: string;
}

const genDir: string = resolve(
  process.cwd(),
  process.env.I18N_OUTPUT_DIR?.trim() || "src/gen/i18n",
);
const profileTrans = new Map<string, Promise<ProfileTrans>>();

async function readGenDoc(locale: string): Promise<Profile> {
  const path: string = resolve(genDir, `${locale}.json`);

  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("tabSuffix" in parsed) ||
      !("tagline" in parsed) ||
      !("readme" in parsed)
    ) {
      throw new Error(`Generated translation file is invalid: ${path}`);
    }
    return parsed as Profile;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      throw new Error(
        `Missing profile content for ${locale}. Run: npm run i18n.`,
        { cause: error },
      );
    }
    throw error;
  }
}

export function getTranslations(locale: string): Promise<ProfileTrans> {
  const cached: Promise<ProfileTrans> | undefined = profileTrans.get(locale);
  if (cached) return cached;

  const content: Promise<ProfileTrans> = readGenDoc(locale).then(
    (gen: Profile): ProfileTrans => ({
      title: `${siteConfig.tabName} — ${gen.tabSuffix}`,
      tagline: gen.tagline,
      readme: gen.readme,
    }),
  );
  profileTrans.set(locale, content);
  return content;
}
