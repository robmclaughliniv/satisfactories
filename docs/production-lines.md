# Production lines and allocations

## Set up production

1. Create a production line, choose a recipe, and set the machine count.
   Categories organize lines. Moving a line keeps its ID and connections.
   Deleting a category moves its lines to **Uncategorized**. Deleting a
   connected line prompts you to confirm removal of its allocations.
2. Add a local node in **Factory input supply**. Local nodes are shared pools
   keyed by node, and incoming shipments are pooled by item at the receiving
   factory. Use **+ Input supply** on a line to claim a fixed rate from either
   pool. Multiple lines can share the same pool up to its available rate.
   Editing or removing a claim leaves the source intact.
3. Under **Output allocations**, use **+ Production Line** to supply another
   line in the same factory that consumes the item. Use **+ Export** to ship
   to another factory in the world and choose the transport there. A receiving
   line must claim the imported supply before it can use it.

Use **Commit** in factory detail to save the current working configuration as
the factory's reset point. **Reset** restores that snapshot. Browser storage
also saves working changes between visits.

## Read rates and resolve shortages

- **Line inputs** compare supplied rates with the recipe requirements at the
  configured machine count. The least-supplied required input determines the
  fraction of nameplate production the line can achieve, up to 100%. Power
  estimates use the configured machine count and recipe power.
- **Line outputs** have a separate allocation budget for each item. Surplus
  here is actual production minus saved requests. Editing an allocation adds
  its existing reservation back to the available budget for that item.
- **Factory resource balance** adds effective production, local supply, and
  delivered imports, then subtracts nameplate recipe demand and delivered
  exports.
- **Factory flows** show delivered shipments on both ends of a connection.
  The map uses the same delivered rates. Factory allocations take precedence
  over legacy routes and vehicle links for the same source, destination, and
  item. Unmatched legacy transport can carry unclaimed raw local supply when
  there is enough for all its requests for that item.
- **Resources** totals effective recipe production and consumption across
  the world, with local node supply included on the production side. An
  individual line can show an input deficit while the world has spare supply
  of that item.

If requests for one line output exceed its actual rate, delivery pauses for
all allocations of that output. If claims on a local node or imported item
exceed that pool's supply, those claims deliver zero. The saved rates remain
in place. Restore supply or edit the affected rates to resume delivery.
Circular flows start with zero assumed supply. Factory detail warns if the
calculation fails to stabilize. An unfed loop can stabilize at zero.

## Save compatibility

Version 9 worlds upgrade to schema version 10 when loaded from browser storage
or a JSON backup. The conversion keeps existing line IDs and categories and
generates missing line names. It converts category feeds into fixed requests
based on recipe rates, machine counts, and compatible targets' demand. Explicit
legacy export destinations use matching route or station rates where available.
Unresolved destinations can appear as **Needs review** allocations that you can
edit or remove. Legacy local and import claims without rates get fixed shares
based on the available legacy supply and the number of lines claiming it.

The migration runs separately on the working copy and committed snapshot.
Keep the original JSON when upgrading older backups. Saves at version 8 or
earlier currently skip the version 9-to-10 production conversion, so legacy
connections may need to be recreated after loading.
