# Working in Satisfactories

Start with the [README](README.md) for setup and the
[maintainer guide](docs/maintainer-guide.md) for the code map and smoke checks.
For changes to factory math, read [production lines and allocations](docs/production-lines.md).

- Keep flow calculations in the model and state modules. Check that the factory
  detail, sidebars, map, and resource rollup agree when changing shared rates.
- Categories organize lines; connections use stable line and factory IDs.
  Factory inputs are shared supply. Preserve explicit claim and allocation rates.
- For persisted changes, check local storage, JSON backups, demo templates, and
  factory commit/reset together. Reproduce on a sample world or a backup copy.
- Run `npm test` for production and persistence regressions and `npm run build`
  for TypeScript and the production bundle. For UI changes, also exercise the
  affected flow in a browser; the regression script does not render React.
