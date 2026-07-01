# Pledge Journey

Pledge Journey is an offline-first fundraising display app that turns donations, pledges, and partial payments into live journey progress.

It was originally created for a youth camp fundraiser from Freetown to Mile 91, but the app is built to be reusable for walkathons, school drives, church campaigns, community challenges, travel fundraisers, and any event where supporters help move a campaign toward a visible target.

## What It Does

- Tracks received donations, pledges, partial payments, and cancelled entries.
- Converts money into distance or progress using your campaign rules.
- Shows a live fullscreen display for projectors, TVs, or a second browser tab.
- Supports route checkpoints such as towns, stages, or milestones.
- Unlocks stretch goals beyond the target distance.
- Stores all data locally in the browser, so the event can run without internet.
- Exports CSV reports and JSON backups.
- Imports validated backups when moving data between machines or restoring an event.

## Core Screens

- `#admin` - donation entry desk for event staff.
- `#display` - live public display for a projector, TV, or second tab.
- `#summary` - reports, ledger, outstanding pledges, exports, and activity history.
- `#settings` - campaign templates, route setup, display theme, and quick amount controls.

## Key Features

### Offline Event Mode

The app stores campaign data in the browser using local storage. Multiple tabs on the same laptop stay in sync through browser storage events and `BroadcastChannel`, so one tab can be used for admin entry while another tab runs the public display.

### Flexible Campaign Setup

You can customize:

- organization name
- campaign title
- start point and destination
- currency label
- pledge unit name
- miles or kilometers
- cost per unit
- target distance
- route checkpoints
- beyond-target unlocks
- quick donation buttons
- display theme

The settings screen validates important campaign rules, including duplicate checkpoint distances, missing target checkpoints, invalid quick amounts, and unlocks that are not beyond the target.

### Pledge Lifecycle

Each donation can be tracked as:

- `Received`
- `Pledged`
- `Partially Received`
- `Cancelled`

Pledges count toward the public journey progress, while reports clearly separate committed, received, and outstanding amounts.

### Live Display

The display screen includes:

- animated route progress
- milestone celebration messages
- rotating supporter shoutouts
- top supporter leaderboard
- recent supporter board
- campaign summary mode
- beyond-target unlock badges
- optional fullscreen mode

### Reporting and Backups

The summary screen includes:

- total committed
- total received
- outstanding pledges
- donor count
- payment type breakdown
- category breakdown
- daily totals
- session totals
- outstanding pledge report
- donation ledger
- recent activity log

The app can export:

- full donation CSV
- outstanding pledges CSV
- full JSON backup

## Tech Stack

- React
- TypeScript
- Vite
- pnpm
- lucide-react icons
- oxlint

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

Useful routes:

```text
http://localhost:5173/#admin
http://localhost:5173/#display
http://localhost:5173/#summary
http://localhost:5173/#settings
```

## Build

Create a production build:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

Run lint checks:

```bash
pnpm lint
```

## Suggested Event Workflow

1. Open `#settings` and configure the campaign.
2. Open `#admin` in one tab for entering donations and pledges.
3. Open `#display` in another tab and put it on the projector or TV.
4. Export a JSON backup before the event starts.
5. Enter donations as they come in.
6. Export another JSON backup and CSV report after the event.

## Data and Privacy

Data is stored locally in the browser on the device running the app. It is not sent to a server by this project.

Because browser storage can be cleared by users, browser resets, or profile changes, export JSON backups regularly during important events.

## Default Preset

The default campaign preset is **Road to Mile 91**, inspired by the Freetown District Youth Council youth camp fundraiser. It includes a Freetown-to-Mile-91 route, checkpoint towns, and beyond-target unlocks.

You can replace the default setup with another campaign template or create a custom route from scratch.

## License

Add a license before publishing the repository publicly.
