# Visual bug check tooling

Automated UI regression suite for Win11-Web: captures a screenshot tour of
every major surface (boot, desktop, start menu, flyouts, task view, all
apps, snap layouts, small viewports) and asserts the known visual bugs
`B1`–`B12` documented in [`REPORT.md`](./REPORT.md).

Works in restricted sandboxes: the browser is provisioned from the **npm
registry** (never the Playwright CDN), and no system packages are required.

## Quick start

```bash
visual-bugcheck/check.sh                    # installs everything it needs, then runs
visual-bugcheck/check.sh --functional       # interactive audit of apps + window manager
```

or step by step:

```bash
visual-bugcheck/install-deps.sh       # vite + playwright-core (--no-save)
visual-bugcheck/install-browser.sh    # headless Chromium into $BROWSER_DIR
visual-bugcheck/check.sh              # screenshot tour + findings table
```

## Scripts

| Script | Purpose |
|---|---|
| `install-deps.sh` | Installs project deps (vite) and `playwright-core`, the CDP driver used by the check. `package.json`/`package-lock.json` are left untouched. |
| `install-browser.sh` | Provisions a headless Chromium from `@sparticuz/chromium` (npm), inflates the brotli pack, wires up bundled GL libs, and assembles a font set (system DejaVu + Noto Color Emoji from npm) that the stripped build needs to paint form controls. Writes `env.sh` next to the install. |
| `check.sh` | Ensures deps → browser → dev server (starts vite on `:5173` if free, kills it on exit), then runs `check.mjs`. Unknown flags are forwarded to `check.mjs`. |
| `check.mjs` | The actual check: Playwright tour + DOM assertions. `--help` and `--list` for details. |
| `functional.mjs` | Interactive audit: clicks, typing, drags through every app and the window manager; classifies each capability as ✅ interactive / 🧱 façade (deliberate MVP mock) / 🐞 bug. Run via `check.sh --functional`. |

## Options & environment

| Where | Name | Effect |
|---|---|---|
| `install-browser.sh` | `--force`, `--dir DIR` | reinstall / install location |
| | `BROWSER_DIR` | default `/tmp/win11web-browser` |
| `check.sh` | `DEV_PORT` | dev server port (default `5173`) |
| `check.mjs` | `--base-url URL` | app under test (default `http://localhost:5173/`, env `BASE_URL`) |
| | `--shots-dir DIR` | screenshot output (default `visual-bugcheck/shots`) |
| | `--skip-shots` | assertions only (fast CI mode) |
| | `--fail-on-bug` | exit code `2` when any bug is detected |
| | `NO_COLOR` | disable ANSI colors (also automatic when not a TTY) |

## CI usage

```bash
npm run setup:visual          # = install-deps.sh + install-browser.sh
npm run dev &                 # or any static server for the built app
node visual-bugcheck/check.mjs --skip-shots --fail-on-bug
```

Exit codes: `0` clean (or bugs without `--fail-on-bug`), `1` infrastructure
error, `2` bugs found with `--fail-on-bug`.

## Outputs

* `shots/` — one PNG per surface/interaction (regenerated on every run,
  committed as documentation).
* Console — per-check `✅ ok` / `🐞 BUG` lines with measurements, then a summary.

## Troubleshooting

* **`npm pack` fails** — the npm registry must be reachable; that is the only
  network requirement.
* **Renderer crashes on `<input>`** — font set missing; re-run
  `install-browser.sh --force` (see the header comment there for why).
* **`/tmp` was wiped** (sandbox restart) — re-run `install-browser.sh`;
  `check.sh` does this automatically when `env.sh` is absent.
