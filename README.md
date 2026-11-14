<h1 align="center">Placement Portal Planner</h1>

<p align="center">
  A day-by-day build plan for the Placement Portal Application V2, shown as a static page.<br />
  Tick off tasks in your browser, and commit <code>progress.json</code> to update the shared copy.
</p>

<p align="center">
  <a href="https://mad2-placement-portal-planner.vercel.app">Live site</a>
  ·
  <a href="#running-it">Run it locally</a>
  ·
  <a href="#updating-progress">Update progress</a>
</p>

This repo tracks the MAD-II Placement Portal Application V2 build from 2026-06-23 to 2026-07-10. The plan covers 18 days across three weeks and nine milestones, from repo setup through caching and hardening. The Flask and Vue code for the portal is not in this repo. It holds only the planner.

The planner is one static page: `index.html`, `styles.css` and `app.js`, with no build step. Bootstrap 5.3.7 and Google Fonts load from a CDN. On load, `app.js` fetches `progress.json` and renders the weeks, days, milestones, risks, data model, API routes and acceptance checks from it.

## What you get

- **Checklists for every day.** Each of the 18 days lists its planned tasks as checkboxes. A day turns in progress after its first tick and done when every box is ticked. A day set to `blocked` in `progress.json` overrides both.
- **Progress saved in your browser.** Ticks go to `localStorage` under `placement-planner-progress-v1`. The "Reset day" button clears one day. Nothing leaves the browser.
- **Percentages from the checkboxes.** The overall bar and each day's percent count ticked tasks against planned tasks. The `percent` fields in `progress.json` do not drive these numbers. Milestone percentages still come from the file.
- **One file for the whole plan.** `progress.json` holds the project goal and constraints, three weeks, 18 days, nine milestones, four risks, six architecture cards, eight models, five API groups and six acceptance checks. The page fetches it with `cache: "no-store"`, so a reload shows your latest edit.
- **Blocker count in the summary.** The summary strip counts days marked `blocked` and shows the first milestone with status `in_progress` as the active one. The strip stays pinned to the top while you scroll.

## Running it

There is no install step. Serve the folder with any static file server. With Python 3:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Serve the folder rather than opening `index.html` from disk. The page loads `progress.json` with `fetch`, and browsers block that request from a `file://` page, so the planner shows "Failed to load planner data."

### Deploy on Vercel

Import the repo into Vercel and deploy with the default static settings. `vercel.json` sets `cleanUrls` to true and needs nothing else.

## Updating progress

Edit `progress.json` by hand, then commit and push so the Vercel copy matches the repo.

1. Set `project.current_focus` to what you are working on. It shows in the summary strip.
2. On the active day, move finished items from `pending_tasks` to `done_tasks`. The Done list shows `done_tasks`, and the Next list shows `pending_tasks`.
3. When a day is stuck, set its `status` to `"blocked"` and add the issue to `blockers`.
4. When a checkpoint closes, set the milestone's `status` and `percent`. Use `in_progress` for the active milestone, because that status drives the Active Milestone stat.

The page shows neither `project.overall_percent` nor `project.current_day`. Day percentages come from the checkboxes, so a day's `percent` only applies to a day with no planned tasks.

Checkboxes read only from browser storage, never from `done_tasks`. Ticks on one device do not show on another, and editing `done_tasks` does not tick a box. Keep the two in step by hand.

## License

MIT. See [LICENSE](LICENSE).
