# Cloudflare Build Badge

[![Cloudflare Build Badge](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg)](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg)

Generate live build status badges for Cloudflare Pages and Workers projects. Display your continuous deployment success seamlessly inside GitHub READMEs or websites.

**Live site:** [cloudflare-build-badge.xeffen25.com](https://cloudflare-build-badge.xeffen25.com)

## What is Cloudflare Build Badge?

Cloudflare Build Badge is a Cloudflare Worker that generates SVG badges showing the build status of any repository deployed with [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), ready to embed in your README or website.

### The problem it solves

GitHub doesn't ship a native status badge for Cloudflare Workers & Pages checks the way it does for GitHub Actions. This project fills that gap by querying the GitHub Checks API and translating the result into a [Shields.io](https://shields.io/) badge, **without requiring any setup in your repository**.

## How it works

Every badge request goes through these four steps at the edge of Cloudflare's network:

1. **The request reaches the Worker** — You request the badge URL for any GitHub repository connected to Cloudflare Workers Builds.
2. **Fetch the check status** — The Worker queries the GitHub API for the latest Cloudflare Workers & Pages check on the requested branch.
3. **Build the badge image** — The check status is mapped to a Shields.io badge and rendered as an SVG image.
4. **Return the badge** — The badge updates automatically every time the URL is requested again.

## Usage

### Badge URL format

```
https://your-domain.com/{username}/{repository}/status.svg
https://your-domain.com/{username}/{repository}/{branch}/status.svg
```

When no branch is specified, the repository's default branch is used.

### Markdown

```markdown
[![Cloudflare Build Badge](https://your-domain.com/username/repository/status.svg)](https://your-domain.com/username/repository/status.svg)
```

### Examples

These are live badges from this project in different Shields.io styles:

| Style       | Badge                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default     | [![Default](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg)](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg)                                         |
| Flat square | [![Flat square](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg?style=flat-square)](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg?style=flat-square) |
| Social      | [![Social](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg?style=social)](https://cloudflare-build-badge.xeffen25.com/Xeffen25/cloudflare-build-badge/status.svg?style=social)                |

Any [Shields.io query parameter](https://shields.io/) is supported. The status color and message are computed automatically from the latest build; the rest of the look is up to you.

### Customization query parameters

| Parameter      | Default              | Description                                                               |
| -------------- | -------------------- | ------------------------------------------------------------------------- |
| `style`        | `flat`               | Badge style: `flat`, `flat-square`, `plastic`, `for-the-badge`, `social`  |
| `logo`         | `cloudflare-workers` | Icon slug from [simple-icons](https://simple-icons.org/)                  |
| `logoColor`    | `#fc7c1e`            | Logo color (hex, rgb, rgba, hsl, hsla, or CSS named colors)               |
| `logoSize`     | auto                 | Set to `auto` for adaptive icon sizing                                    |
| `label`        | `Cloudflare Workers` | Left-hand-side text (URL-encode spaces and special characters)            |
| `labelColor`   | `lightgrey`          | Background color of the left part                                         |
| `color`        | _(computed)_         | Background color of the right part (overrides the automatic status color) |
| `cacheSeconds` | `300`                | HTTP cache lifetime in seconds (minimum 60, maximum 86400)                |

Example with customization:

```
https://your-domain.com/username/repository/status.svg?style=for-the-badge&logo=cloudflare&logoColor=orange&label=Pages
```

## Deploy your own

Start from the template and follow these steps to get your own instance running.

### 1. Copy the template

```bash
pnpm create astro@latest cloudflare-build-badge --template Xeffen25/cloudflare-build-badge --install --git
```

### 2. Push to GitHub and connect Cloudflare

Push the repository to GitHub, connect it in [Cloudflare Workers Builds](https://dash.cloudflare.com/), and ignore the first few failing builds while you finish the setup.

### 3. Update the project identity

Set your domain in `site` inside `astro.config.mjs` and update the worker name in `wrangler.jsonc`.

### 4. Configure Wrangler routing

- **Option A:** keep `route.pattern` to use a custom domain.
- **Option B:** remove `route` and set `workers_dev: true` to use a `workers.dev` subdomain.

### 5. Configure the GitHub token secret

Create a [classic GitHub token](https://github.com/settings/tokens/new) with read-only `repo` access and store it with Wrangler:

```bash
pnpm wrangler secret put GITHUB_TOKEN
```

### 6. Make your next commit

```bash
git add .
git commit -m "Set up for me"
```

## Development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev       # local dev (wrangler types + paraglide watch + astro dev)
pnpm build     # production build
pnpm preview   # build + preview
pnpm deploy    # build + wrangler deploy
pnpm test      # vitest
pnpm github:ci # format check + astro check + test (mirrors CI)
```

## Tech stack

- [Astro 7](https://astro.build/) (SSR on Cloudflare Workers)
- [Svelte 5](https://svelte.dev/) (badge configurator UI)
- [Tailwind CSS 4](https://tailwindcss.com/) + [daisyUI 5](https://daisyui.com/)
- [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (i18n: Spanish base locale, English at `/en/`)
- [eminence-astro-suite](https://github.com/eminence/eminence-astro-suite) (SEO, sitemap, Open Graph)
- [Shields.io](https://shields.io/) (badge rendering)
- [GitHub Checks API](https://docs.github.com/en/rest/checks/runs)

## License

MIT — see [LICENSE](LICENSE).
