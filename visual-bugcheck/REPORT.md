# Win11-Web — Visual Bug Check

**Date:** 2026-10-05
**Branch:** `arena/01a10c46-win11-web` (base `b931763`)
**Method:** Automated screenshot tour (Playwright + headless Chromium, 1920×1080 and 1280×720) of every major surface and interaction state, then frame-by-frame review; the findings below are also asserted automatically by [`check.mjs`](./check.mjs). Screenshots: [`shots/`](./shots/).

## Scripts

Full documentation for the tooling (options, environment, CI usage,
troubleshooting) lives in [`README.md`](./README.md).

```bash
npm run test:visual          # = visual-bugcheck/check.sh (self-provisioning)
```

> Environment notes (things that are **not** app bugs): the sandbox has no outbound internet, so external images (Bing logo, news thumbs, user avatar, Photos grid) show broken-image placeholders in the shots; and a minimal font set means a few exotic glyphs (⎘, ⎗, ＋, , 🖥, PUA `󰀀`) render as tofu here although they exist on typical Windows/macOS machines. Those are listed separately at the end as portability notes.

---

## Fix log (2026-10-05)

All 12 findings below were fixed and re-verified — `visual-bugcheck/check.sh` now reports `12 ok, 0 bug(s)` and the screenshots in `shots/` were regenerated from the fixed build.

| Bug | Fix |
|---|---|
| B1 | `#boot-screen` background → `#000` (logo now visible) |
| B2 | titlebar button rule scoped to `.titlebar-controls > button, .snap-trigger > button` so `.snap-option` keeps its styles |
| B3 | `closeWindow()` re-finds the index by id inside the timeout (no stale splice → no ghosts) |
| B4 | snap partner lookup also requires `x.el.isConnected` (and B3 removes ghosts at the source) |
| B5 | `.start-scroll` wrapper with `overflow-y:auto`; search + user footer stay pinned |
| B6 | `#quick-settings.open ~ #toasts, #notification-center.open ~ #toasts { right:388px }` — toasts slide left of open flyouts |
| B7 | `#widgets-panel` `bottom:auto; max-height:calc(100vh - 70px)` — panel hugs content |
| B8 | `#task-view` inset bottom = `var(--taskbar-h)` — timeline visible above taskbar |
| B9 | pinned data corrected: unique labels (`Pictures`), honest ids (`paint`, `spotify`, `terminal` → “coming soon” toast) |
| B10 | `.app-card-footer{flex-wrap:wrap}` + `.rating{white-space:nowrap}` |
| B11 | mini calendar rendered from `new Date()` (`renderMiniCal()` in main.js) |
| B12 | taskbar spacers both `flex:1` with centered `flex:none` cluster — truly centered |

---

## Confirmed visual bugs (as found, all fixed — see log above)

### B1 — Boot screen: Windows logo is invisible (blue-on-blue)
**Shots:** `01-boot.png`
`#boot-screen` has `background:#0078d4` (style.css) while the logo SVG paths in `index.html` use `fill="#0078D4"`. The logo is completely invisible; the boot screen shows only spinner + “Welcome”. Real Windows boots black with a light logo.
**Fix:** make the boot background black (or the logo white).

### B2 — Snap Layouts popup renders as an empty gray box
**Shots:** `17-snap-popup.png`
Hovering maximize opens `.snap-popup`, but all six `.snap-option` buttons are invisible (measured: transparent background, `display:grid`, inner layout-preview spans 0×0, popup height 61px instead of ~112px).
**Root cause:** `.titlebar-controls button{…display:grid;background:transparent;height:100%;width:46px}` (style.css:252) also matches the snap-option buttons because the popup lives inside `.titlebar-controls`, and it wins over `.snap-option` (style.css:260) on specificity.
**Fix:** scope the titlebar rule to `.titlebar-controls > button` (or add an explicit `.snap-popup .snap-option{…}` override).

### B3 — Closing several windows at once leaves “ghost” windows in state
**Shots:** `11-notepad.png`, `13-settings.png`, `16-explorer-grid.png` (taskbar shows a running-app icon for Edge although Edge was closed)
`closeWindow()` captures `idx` at call time and splices 140 ms later in a `setTimeout`. When two windows are closed in the same tick (e.g. “close all”, or a fast user), the first splice shifts the array so the second `windows.splice(idx,1)` removes nothing. The closed window stays in `windows[]` with a detached DOM element.
**Symptoms:** stale taskbar buttons for closed apps; desktop bookkeeping (`desktops[].windows`, active-window restore) references ghosts; clicking a ghost taskbar button calls `bringToFront` on a detached node.
**Fix:** in the timeout, re-find the index by id: `const i = windows.findIndex(w => w.id === id); if (i > -1) windows.splice(i, 1);`

### B4 — Snap “halves” doesn’t move the visible partner window
**Shots:** `19-snap-halves.png` (Notepad snapped left; the right half stays empty while the Explorer peeks out from behind Notepad)
Direct consequence of B3: `handleSnap()` picks `other = windows.find(…)` — which returns the *ghost* window — and applies the complementary rect to the detached element. The visible window never moves, so the “snap left / fill right” showcase silently breaks whenever a ghost exists.
**Fix:** fixing B3 fixes this; additionally guard with `windows.find(x => x.id !== id && x.el.isConnected && …)`.

### B5 — Start menu clips its content on short viewports (no scroll)
**Shots:** `22-small-start.png` (1280×720)
`#start-menu` has `max-height:78vh` but no `overflow` rule, so at 720p the Recommended list is cut mid-row and the user/power footer is unreachable. Content is clipped, not scrollable.
**Fix:** add `overflow-y:auto` to `#start-menu` (and keep the search/footer pinned, e.g. make only the middle sections scroll).

### B6 — Toasts overlap the Quick Settings flyout
**Shots:** `20-toast.png`
`#toasts` is fixed at `right:12px; bottom:60px; z-index:60` — exactly where the Quick Settings / Notification flyouts sit (`right:12px; bottom:58px; z-index:36`). Triggering a brightness/volume change while the flyout is open (the normal flow!) draws the toast on top of the flyout’s footer.
**Fix:** raise toasts above the flyout only when it’s closed, or offset toasts when a flyout is open (or lower the toast z and shift it left).

### B7 — Widgets panel stretches full height with a large empty area
**Shots:** `05-widgets.png`
The panel spans from the top edge down to the taskbar regardless of content, leaving ~300px of blank acrylic under the Tips card. Real Win11 widgets panel hugs its content / scrolls.
**Fix:** size the panel to content (`height:auto; max-height:calc(100vh - 72px)`) with `overflow-y:auto` on `.widgets-grid` container.

### B8 — Task View “Timeline” row is hidden behind the taskbar
**Shots:** `08-taskview.png`
`#task-view` is `inset:0` and its flex column pushes `.tv-timeline` to y≈1029–1056 — underneath the 48px taskbar (z-index 40 > 33). Measured live: the element exists and is “visible” but fully covered.
**Fix:** give `#task-view` `bottom:var(--taskbar-h)` (or padding-bottom) so the timeline sits above the taskbar.

### B9 — Start menu pinned data mismatches (duplicate “Photos”, wrong launch targets)
**Shots:** `03-start-menu.png`
In `pinnedApps` (main.js): two tiles are both named **Photos** (one launches `photos`, one launches `explorer`); **Paint** has `id:'edge'` (clicking Paint opens Edge); **Spotify** has `id:'store'`; **Terminal** has `id:'notepad'`. Visibly confusing (duplicate label) and functionally wrong (icon ≠ launched app).
**Fix:** give each pinned app its own id/launcher (or mark them as demos intentionally).

### B10 — Store card footer wraps badly in the “Installed” state
**Shots:** `10-store.png` (Notion card)
The wider `Installed` button squeezes `.app-card-footer` so the `★ 4.5` rating wraps onto two lines (star alone, then the number), misaligning the card with its siblings.
**Fix:** let the footer wrap gracefully (`flex-wrap` + `min-width:0`, or `white-space:nowrap` on `.rating` and shrink the description instead).

### B11 — Hard-coded dates drift (Notification Center “October 2025”, calendar “today” = 5)
**Shots:** `07-notifications.png`
The mini calendar header/dates and the widget “05 OCT” rows are static markup; the tray clock (correctly) shows the real date, so the two disagree on any day other than Oct 5 2025.
**Fix:** render the mini calendar from `new Date()` like the tray clock.

### B12 — Taskbar icon cluster is not truly centered
**Shots:** `21-small-desktop.png`
`.taskbar-left{width:220px}` is fixed while `.taskbar-right` is auto-sized, so the “centered” icon group sits left of the true screen center (visible at 1280×720). Win11 keeps Start exactly centered.
**Fix:** make left/right spacers equal (e.g. both `flex:1` with right-aligned content) or absolutely center `.taskbar-center`.

---

## Portability / polish notes (not bugs on a normal desktop)

- Emoji/symbol icons (⎘ Copy, ⎗ Paste, ＋ New, ⏻ Power, `󰀀` View in `09-context-menu.png`, 🖥 in Explorer sidebar) depend on the OS font covering those code points; they render as tofu on font-poor Linux. Consider SVG icons for the toolbar glyphs that carry meaning.
- `index.html` loads “Segoe UI” from Google Fonts (it isn’t a webfont; the request 404s even with internet) — harmless, but the link is dead weight; Inter is what actually loads.

---

## Coverage matrix (shots)

| Shot | Surface |
|---|---|
| 01 | Boot screen |
| 02 | Desktop + demo windows |
| 03 / 04 | Start menu (+ search filtering) |
| 05 | Widgets panel |
| 06 | Quick Settings |
| 07 | Notification Center |
| 08 | Task View / virtual desktops |
| 09 | Desktop context menu |
| 10 | Microsoft Store |
| 11 | Notepad |
| 12 / 12b | Calculator (+ 7+5=12 interaction) |
| 13 | Settings |
| 14 | VS Code mock |
| 15 | Photos |
| 16 / 16b | Explorer grid + list views |
| 17 | Snap popup (hover maximize) |
| 18 | Maximized window |
| 19 | Snap halves with partner |
| 20 | Toast over Quick Settings |
| 21 / 22 | 1280×720 overflow pass |
