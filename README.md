# GitHub Profile README Site

Deploy your GitHub user or organization profile `README.md` as a static Astro site using Actions with:

- profile avatar
- tagline
- icon links
- i18n translations
- and full support of GitHub README Markdown format

An example site can be found here: [https://profile-icons.github.io/github-profile-readme-site/](https://profile-icons.github.io/github-profile-readme-site/)

### Create Repository

Create a [template](https://github.com/new?template_name=github-profile-readme-site&template_owner=r055a) copy (recommended) of this repository, or a [fork](https://github.com/r055a/github-profile-readme-site/fork) (for contributing).

#### User profile

If you don't have a GitHub profile `README.md`, name the repo copy the same as your username for creating one.

An example can be found here for a user profile: [r055a/r055a](https://github.com/r055a/r055a).

#### Organization profile

If the profile is for an organization, name it `.github` and create a `profile/README.md` to make it.

An example can be found here for an organization profile: [uni-git-projects/.github](https://github.com/uni-git-projects/.github).

### Configure Site

To display your profile README content in the site, edit the `./site.config.json` file with the following:

- **[required]** GitHub _user_ or _organization_ name: `githubName`
- **[required]** GitHub profile site _URL_: `siteUrl`
- [_optional_] GitHub repo the README data is fetched from (defaults to _profile_ repo): `repoName`
- [_optional_] GitHub repo the profile site is deployed from (defaults to `repoName`): `basePath`
- [_optional_] A brief tagline to complement the profile Avatar (associated with `githubName`): `tagline`
- [_optional_] The tab (user/org) identifier for the profile site (defaults to `githubName`): `tabName`
- [_optional_] The tab title for the profile site (defaults to _"GitHub profile"_): `tabSuffix`
- [_optional_] The site description (not displayed on the deployed site): `description`
- [_optional_] An (RGB, HEX) theme color for the site: `themeCol`
- [_optional_] The language the profile README Markdown is written in (defaults to _"en"_): `language`

```json
{
  "githubName": "",
  "siteUrl": "",
  "repoName": "",
  "basePath": "",
  "tagline": "",
  "tabName": "",
  "tabSuffix": "",
  "description": "",
  "themeCol": "",
  "language": "",
  "locales": [],
  "links": {}
}
```

#### Locales - i18n

Profile translations are generated for **locales** prior to deployment using the [Xenova/m2m100_418M](https://huggingface.co/Xenova/m2m100_418M) model.

<details>
<summary>Valid locales for translation are listed here (mapped to respective language for reference)
</summary>

```json
{
  "English": "en",
  "Afrikaans": "af",
  "Amharic": "am",
  "Arabic": "ar",
  "Asturian": "ast",
  "Azerbaijani": "az",
  "Bashkir": "ba",
  "Belarusian": "be",
  "Bulgarian": "bg",
  "Bengali": "bn",
  "Breton": "br",
  "Bosnian": "bs",
  "Catalan": "ca",
  "Cebuano": "ceb",
  "Czech": "cs",
  "Welsh": "cy",
  "Danish": "da",
  "German": "de",
  "Greek": "el",
  "Spanish": "es",
  "Estonian": "et",
  "Persian": "fa",
  "Fulah": "ff",
  "Finnish": "fi",
  "French": "fr",
  "Western Frisian": "fy",
  "Irish": "ga",
  "Scottish Gaelic": "gd",
  "Galician": "gl",
  "Gujarati": "gu",
  "Hausa": "ha",
  "Hebrew": "he",
  "Hindi": "hi",
  "Croatian": "hr",
  "Haitian Creole": "ht",
  "Hungarian": "hu",
  "Armenian": "hy",
  "Indonesian": "id",
  "Igbo": "ig",
  "Iloko": "ilo",
  "Icelandic": "is",
  "Italian": "it",
  "Japanese": "ja",
  "Javanese": "jv",
  "Georgian": "ka",
  "Kazakh": "kk",
  "Khmer": "km",
  "Kannada": "kn",
  "Korean": "ko",
  "Luxembourgish": "lb",
  "Ganda": "lg",
  "Lingala": "ln",
  "Lao": "lo",
  "Lithuanian": "lt",
  "Latvian": "lv",
  "Malagasy": "mg",
  "Macedonian": "mk",
  "Malayalam": "ml",
  "Mongolian": "mn",
  "Marathi": "mr",
  "Malay": "ms",
  "Burmese": "my",
  "Nepali": "ne",
  "Dutch": "nl",
  "Norwegian": "no",
  "Northern Sotho": "ns",
  "Occitan": "oc",
  "Odia": "or",
  "Punjabi": "pa",
  "Polish": "pl",
  "Pashto": "ps",
  "Portuguese": "pt",
  "Romanian": "ro",
  "Russian": "ru",
  "Sindhi": "sd",
  "Sinhala": "si",
  "Slovak": "sk",
  "Slovenian": "sl",
  "Somali": "so",
  "Albanian": "sq",
  "Serbian": "sr",
  "Swati": "ss",
  "Sundanese": "su",
  "Swedish": "sv",
  "Swahili": "sw",
  "Tamil": "ta",
  "Thai": "th",
  "Tagalog": "tl",
  "Tswana": "tn",
  "Turkish": "tr",
  "Ukrainian": "uk",
  "Urdu": "ur",
  "Uzbek": "uz",
  "Vietnamese": "vi",
  "Wolof": "wo",
  "Xhosa": "xh",
  "Yiddish": "yi",
  "Yoruba": "yo",
  "Chinese": "zh",
  "Zulu": "zu"
}
```

</details>

> Note: if changing browser languages during a session, a cache refresh may be required to render translations.

#### Icon Links

Each entry in the **links** `{key: value}` object maps a platform/icon ID (`key`) to its destination URL (`value`).

#### Example

```json
{
  "githubName": "r055a",
  "siteUrl": "https://r055a.github.io",
  "repoName": "",
  "basePath": "",
  "tagline": "Just a guy who likes ☕",
  "tabName": "Adam Ross",
  "tabSuffix": "GitHub Profile",
  "description": "A static Astro site for GitHub profile README markdown content.",
  "themeCol": "",
  "language": "en",
  "locales": ["sv", "de", "es", "fr", "hi", "zh"],
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

## Local Development

### Install

```Bash
npm install
```

### i18n

```Bash
npm run i18n
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
