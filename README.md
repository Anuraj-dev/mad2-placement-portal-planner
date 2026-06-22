# Placement Portal Planner Site

Single-page static planner for the MAD-II Placement Portal Application V2.

## What this repo contains

- `index.html`: the planner page
- `styles.css`: the site styling
- `app.js`: renders planner sections from `progress.json`
- `progress.json`: day-by-day tracking source of truth
- `assets/placement-portal-wireframe.png`: wireframe reference
- `assets/cover.svg`: planner cover image

## How to update progress

1. Open `progress.json`.
2. Update the current day, overall percent, and current focus in `project`.
3. For the active day, move finished items into `done_tasks`.
4. Adjust `pending_tasks`, `blockers`, `status`, and `percent`.
5. Update milestone status and percent if a checkpoint is completed.
6. Commit and push changes.

## How to preview locally

Use any static file server. Examples:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Vercel

This is a plain static site. Import the repo into Vercel and deploy with the default static configuration.
