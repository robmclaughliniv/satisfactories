# Satisfactories

A factory planner for Satisfactory saves: pin factories on a world map, wire
routes between them, and let the app derive production rates, power draw, and
world-wide surplus/deficit from your recipe lines.

Live at [satisfactories.robmclaughl.in](https://satisfactories.robmclaughl.in).

## Features

- **Map** — factories as draggable pins on a zoomable world map, with animated
  route lines between them and a context sidebar (world overview, factory
  detail, or route flow depending on what you hover).
- **Factory detail** — production lines organized into sections; pick recipes
  (including ALT recipes), set machine counts, and get derived rates, power,
  and a per-item resource balance (made + imported − required − exported).
  Working-state changes can be committed or reset.
- **Resources** — net production across all factories, with favorites and
  per-item producer/consumer drill-downs.
- **Reference** — a wiki of items, recipes, and machines.
- **Worlds** — multiple saves, each with its own map.

Data persists to `localStorage`. A demo world is seeded on first run. From the **Worlds** screen you can also save or load a full JSON backup to your computer.

## Development

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build to dist/
```

Built with React 18, Vite, and TypeScript.

## Deployment

Hosting is provisioned by `terraform/` (S3 + CloudFront on the shared
robmclaughl.in infrastructure) and deployed by `.github/workflows/deploy.yml`
on push to `main`. One-time setup: `scripts/bootstrap.sh`.
