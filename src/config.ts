import rawConfig from "../site.config.json";

export interface SiteConfig {
  githubUsername: string;
  displayName: string;
  tagline: string;
  description: string;
  siteUrl: string;
  basePath: string;
  language: string;
  themeCol: string;
  links: Record<string, string>;
}

export const siteConfig: {
  githubUsername: string;
  displayName: string;
  tagline: string;
  description: string;
  siteUrl: string;
  basePath: string;
  language: string;
  themeCol: string;
  links: Record<string, string>;
} = rawConfig satisfies SiteConfig;
export const githubProfileUrl = `https://github.com/${siteConfig.githubUsername}`;
export const githubAvatarUrl = `${githubProfileUrl}.png?size=320`;
