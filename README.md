# GitHub Profile README Site

Deploy your GitHub profile `README.md` as a static Astro site with profile avatar, tagline and icon links using Actions.

### Create Repository

Create a [template](https://github.com/new?template_name=github-profile-readme-site&template_owner=r055a) copy (recommended) of this repository, or a [fork](https://github.com/r055a/github-profile-readme-site/fork) (for contributing).

If you don't have a GitHub profile `README.md`, name the repo copy the same as your username for creating one.

An example can be found here for a profile: [r055a/r055a](https://github.com/r055a/r055a).

### Configure Site

To display your profile README content in the site, edit the `./site.config.json` file with at least the following:

- GitHub username: `githubUsername`
- GitHub profile site URL: `siteUrl`
- GitHub profile repo name: `basePath`

```json
{
  "githubUsername": "",
  "tabName": "",
  "tabSuffix": "",
  "description": "",
  "tagline": "",
  "siteUrl": "",
  "basePath": "",
  "language": "",
  "locales": [],
  "themeCol": "",
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

> Note: if changing browser languages during sessions, a browser cache refresh may be required to display translations.

#### Icon Links

Each entry in the **links** `{key: value}` object maps a platform/icon ID (`key`) to its destination URL (`value`).

#### Example

```json
{
  "githubUsername": "r055a",
  "tabName": "Adam Ross",
  "tabSuffix": "GitHub Profile",
  "description": "A static Astro site for GitHub profile README markdown content.",
  "tagline": "Just a guy who likes ☕",
  "siteUrl": "https://r055a.github.io",
  "basePath": "/r055a",
  "language": "en",
  "locales": ["en", "sv", "de", "es", "fr", "hi", "zh"],
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
