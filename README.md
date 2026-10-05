# Win11-Web — Windows 11 Web MVP

A polished, single-page **Windows 11 Minimum Viable Product** as a web application. It distills Windows 11 to its core value — *a secure, modern, user-friendly OS that runs apps smoothly and boosts productivity with a cleaner interface* — while leaving the door open for growth features.

**Live preview:** `npm run dev` → http://localhost:5173 (proxied as live preview in Arena)

---

## 🎯 MVP Core Value — Implemented

| Pillar | How the web MVP delivers it |
|---|---|
| **Run apps smoothly** | Window manager with drag, resize, minimize / maximize / close, z-ordering, and taskbar running indicators. Apps: File Explorer, Edge (browser), Microsoft Store, Notepad, Calculator, Settings, VS Code, Photos. |
| **Clean, modern interface** | Centered taskbar & Start Menu, rounded 8px corners, acrylic/mica (backdrop-blur), Fluent iconography, Segoe UI, bloom wallpaper (blurred gradient) |
| **Security baseline** | Settings → *Privacy & security* shows TPM 2.0 + Secure Boot + Windows Hello as “✓ Secure”. Toast on boot: *Device meets security baseline* |
| **Productivity & multitasking** | **Snap Layouts** (hover maximize → 6 layouts + drag-to-edge snapping + `Win+Z`), **Virtual Desktops** (Task View → create/switch/close desktops), File Explorer improvements |

Growth-layer hints (non-MVP but included as stubs): Widgets panel (weather, calendar, news, tips), Quick Settings, Notification Center, Store ecosystem.

---

## 🧱 Feature Map

### 1. Simplified UI
- Centered Start Menu with search (filters Pinned + Recommended live)
- Taskbar: Start, Search, Task View, Edge, Explorer, Store + system tray (clock, Wi-Fi, battery, notifications)
- Rounded windows, acrylic start/widgets/quick-settings, soft shadows

### 2. Productivity
- **Snap Layouts** — 6 presets (halves, sidebar, thirds, 2×2 grid, left+stacked, triple). Hover maximize or drag window to edge. Snapped partner auto-fills complementary region.
- **Virtual Desktops** — Task View overlay: desktop thumbnails, window previews, `+ New desktop` (up to 4), per-desktop window isolation, close desktop
- **File Explorer** — sidebar (Home, Quick access, Drives), path bar + back/forward/up, search, grid/list toggle, double-click to open folders/files (Notepad/Photos), “+ New” & command bar

### 3. App Ecosystem
- **Microsoft Store** — featured grid, live search, ratings, *Get → Installing → Installed* flow + notifications
- **Edge** — address bar, tabs, Bing-style new tab with featured cards, shortcut to Store
- **Built-ins** — Notepad (textarea), Calculator (full keypad + keyboard), Settings (Personalization + security card), VS Code mock, Photos gallery

### 4. System Shell
- **Start Menu** — pinned grid (12 apps), recommended recent files, user footer + power
- **Widgets** (left slide) — weather forecast, calendar events, To-Do, Photos, Top stories, Tips (`Win+Z` hint)
- **Quick Settings** (bottom-right) — Wi-Fi, Bluetooth, etc., brightness/volume sliders
- **Notification Center** — toasts + notification list + mini calendar
- Desktop icons (This PC, Recycle Bin, Edge, Documents, VS Code) with select + double-click, desktop right-click context menu, *Show desktop* (far-right taskbar strip), window shadows & animations

---

## 🚀 Run Locally

```bash
npm install
npm run dev      # http://localhost:5173  (Vite, HMR)
npm run build    # production → dist/
npm run preview  # preview build on :4173
```

No backend, no env vars. Static Vite app — deploy `dist/` anywhere (Netlify, Vercel, GitHub Pages).

---

## 🗂 Project Structure

```
Win11-Web/
├─ index.html          # Shell: wallpaper, taskbar, Start, Widgets, Task View, panels
├─ src/
│  ├─ style.css        # Fluent / Mica design system, animations, responsive
│  └─ main.js          # Window manager, desktops, snap, explorer/store/calc logic
├─ vite.config.js      # dev server (0.0.0.0, allowedHosts, HMR)
└─ package.json
```

## ⌨️ Shortcuts

- `Click Start` / `Meta` — Start Menu
- `Win+Z` — Snap Layouts hint
- `Alt+Tab` — Task View
- `Ctrl+D` / `Win+D` — Show desktop (minimize/restore all)
- `F11` — Maximize/restore active window
- `Esc` — Close any overlay
- Drag window titlebar to screen edges to snap; `dblclick` titlebar to maximize

## 📱 Responsive

- Desktop: full windowing
- Tablet (<900px): widgets become bottom sheet, pinned 4-col
- Mobile (<640px): windows go fullscreen, panels full-width

---

*Built as an MVP: the essentials first, polished and performant — Widgets, Teams, gaming & Android support are intentionally left as “growth features” layered on top.*
