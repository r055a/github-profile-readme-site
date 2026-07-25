# GitHub Profile README Site

Deploy your GitHub profile `README.md` as a static Astro site with profile photo, tagline and icon links using Actions.

### Create Repository

Create a copy (recommended) of this repository by [clicking here](https://github.com/new?template_name=github-profile-readme-site&template_owner=r055a), or a fork by [clicking here](https://github.com/r055a/github-profile-readme-site/fork).

If you don't have a GitHub profile, name the copy the same as your username and edit the `README.md` to make it.

An example can be found here: [r055a/r055a](https://github.com/r055a/r055a)

### Configure Site

To display your profile content in the site, edit the `./site.config.json` file with at least the following:

- GitHub username: `githubUsername`
- GitHub profile display name: `displayName`
- GitHub profile site URL: `siteUrl`
- GitHub profile repo name: `basePath`

```json
{
  "githubUsername": "",
  "displayName": "",
  "description": "",
  "tagline": "",
  "siteUrl": "",
  "basePath": "",
  "language": "",
  "themeCol": "",
  "links": {}
}
```

Each entry in the links `{key: value}` object maps a platform/icon ID (`key`) to its destination URL (`value`).

#### Example

```json
{
  "githubUsername": "r055a",
  "displayName": "Adam Ross",
  "description": "A static Astro site for GitHub profile README markdown content",
  "tagline": "Just a guy who likes ☕",
  "siteUrl": "https://r055a.github.io",
  "basePath": "/r055a",
  "language": "en",
  "themeCol": "",
  "links": {
    "buymeacoffee": "https://example.com",
    "dev.to": "https://example.com",
    "email": "example@email.com",
    "github": "https://example.com",
    "gitlab": "https://example.com",
    "googleScholar": "https://example.com",
    "huggingface": "https://example.com",
    "kaggle": "https://example.com",
    "ko-fi": "https://example.com",
    "linkedin": "https://example.com",
    "mastodon": "https://example.com",
    "medium": "https://example.com",
    "orcid": "https://example.com",
    "researchgate": "https://example.com",
    "stackoverflow": "https://example.com",
    "website": "https://example.com",
    "x": "https://example.com",
    "youtube": "https://example.com"
  }
}
```

A visual of the example when deployed:

![example-site-dark-mode](https://github.com/user-attachments/assets/de90f61e-1456-4cb9-a3a5-6b3c39d37a5c#gh-dark-mode-only)
![example-site-light-mode](https://github.com/user-attachments/assets/68aea52a-7c8c-4a14-9acb-2d386f1bb8de#gh-light-mode-only)

Supports dark and light mode.

## Local Development

### Install

```Bash
npm install
```

### Development

```Bash
npm run dev
```

### Build

```Bash
npm run build
```

```Bash
npm run preview
```

## Contribute

Before making a Pull Request for an existing/created Issue, verify the branch passes:

```Bash
npm run quality:fix
```
