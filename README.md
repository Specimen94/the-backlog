# THE BACK-LOG

A universal media backlog and watchlist app that lets you track everything you want to watch, read, play, or listen to — all in one place. No account required.

![Preview](https://id-preview--cffbadfc-9673-4f4f-93f2-c81e5e146076.lovable.app)

<img width="1876" height="1077" alt="image" src="https://github.com/user-attachments/assets/2509d39d-6e12-4895-aa2f-f6bbe5e0bd68" />


---

## What It Does

THE BACK-LOG is a single-page web app for organizing your personal media backlog across every category that matters:

- **Movies & TV** — Track what you want to watch next
- **Video Games** — Build your gaming queue (Steam, console, etc.)
- **Music** — Albums and artists to check out later
- **Books** — Your reading list
- **Comics / Manga / Graphic Novels** — Issues and volumes to read
- **Tabletop / Board Games** — Games to play with friends
- **Podcasts** — Episodes and series to catch up on

Each item gets a **status** (e.g., *Watching*, *Playing*, *Reading*, *Completed*, *On Hold*, *Dropped*) and a **1–10 rating**, so you always know where things stand.

---

## Key Features

### Universal Media Search
Search across multiple free APIs and sources to find metadata for anything you want to add:

- **Archive.org** — Movies, TV, music, books, comics, podcasts, and more
- **Steam + CheapShark** — PC games and deals
- **GiantBomb + BoardGameGeek** — Video games and tabletop games
- **Wikipedia** — General media info

The search uses **fuzzy matching** and is **case-insensitive**, so typos and capitalization never get in the way.

### Save & Load Layouts — No Account Needed
Your backlog is yours. You can save multiple named **layouts** (presets/states) directly in your browser with `localStorage`. Load a layout on demand to switch between different watchlists or moods instantly.

> **Note:** Layouts are saved per-browser. To move your data to another device, use the **Export** / **Import** buttons to save or share your full backlog as a JSON file.

### Status Tracking & Ratings
Every item can be set to a context-aware status:

| Category | Status Options |
|----------|----------------|
| Movies / TV | Watching, Completed, On Hold, Dropped, Plan to Watch |
| Games | Playing, Completed, On Hold, Dropped, Plan to Play |
| Books / Comics | Reading, Completed, On Hold, Dropped, Plan to Read |
| Music | Listening, Completed, On Hold, Dropped, Plan to Listen |
| Podcasts | Listening, Completed, On Hold, Dropped, Plan to Listen |

Rate anything from **1 to 10**. Filter each category by status to see exactly what you need.

### Netflix-Style Layout
Browse your backlog in horizontal scrollable rows, one category at a time. Empty categories are hidden automatically to keep the view clean.

### Export & Import
Your entire backlog can be exported as a portable JSON file and imported anywhere — perfect for backups or switching devices.

---

## How to Use

1. **Add Media** — Click the **+** button and search for any title. Pick the result and it appears in the right category.
2. **Set Status** — Click a card and choose the status that fits.
3. **Rate It** — Give it a score from 1–10.
4. **Save a Layout** — Click the **Layers** icon to save your current backlog as a named preset.
5. **Switch Layouts** — Load a different preset anytime to swap your whole backlog state.
6. **Export / Import** — Use the header buttons to back up or restore your data.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **HashRouter** for static hosting compatibility
- **localStorage** for layouts and media persistence
- **Free public APIs** — no API keys required

---

## Free Hosting on GitHub Pages

This project is configured to deploy automatically to **GitHub Pages** via GitHub Actions. Every push to `main` triggers a build and deploy.

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment** and set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` handles the rest.
4. Your app will be live at:
   ```
   https://<your-github-username>.github.io/<repo-name>/
   ```

---

## Project Structure

```text
src/
  components/        UI components (Header, CategoryRow, Modals, etc.)
  hooks/             Custom hooks (useMediaStore, useLayouts)
  lib/               Utilities (fuzzy search, media search APIs)
  pages/             Main page views
  types/             TypeScript types
```

---

## License

MIT — feel free to fork, remix, and host your own version.
