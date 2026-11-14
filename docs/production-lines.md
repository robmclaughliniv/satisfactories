# Production lines and allocations

Categories organize production lines. A line keeps its ID, name, recipe,
counts, input assignments, and output allocations when moved to another
category. Deleting a category moves its lines to Uncategorized. Deleting a
connected line removes its allocations after explaining the impact.

Each allocation reserves a fixed amount of one output item per minute, for
one other line in the same factory or one other factory in the current world.
Both allocation dialogs show actual output minus all existing reservations.
Editing an allocation returns its existing reservation to that dialog's budget.
Nothing is automatically split or exported. Recipes with multiple outputs have
separate budgets for each item.

Local inputs belong to the factory and are added in Factory input supply.
Imported resources also arrive at the factory. Lines claim explicit amounts
from these shared pools; the line dialog never creates a source.
Editing or removing a claim leaves the parent source intact.
The same source cannot be reserved twice. A line's actual production is limited
by its least-supplied required input. Unallocated output is surplus.

If production drops below saved output reservations, the requested rates remain
unchanged. Delivery of that item's allocations pauses until the user adjusts
them; no destination receives an automatic priority or a proportional share.
Oversubscribed input pools behave the same way. The UI shows requested and
supplied rates, input deficits, and output overallocation. Circular flows start
without assumed inventory; a convergence warning appears for unstable plans.

Factory exports are shared connections: the same calculated shipment appears
as an export, an import, and a map connection. Receiving lines can assign that
imported supply. Transport is selected on the export allocation. Matching older
routes or vehicle links are retained as transport configuration and do not
create a second shipment. Older transport without a line allocation can move
unreserved raw local inputs; it cannot implicitly export unassigned production.

Schema version 10 migrates existing line IDs and category names, generates line
names, converts category feeds to explicit line requests using their previous
nameplate shares, and converts input claims to fixed rates. Explicit old export
selections use known factory destinations where available. Unresolved intent
is shown as a Needs review allocation that can be edited or removed. Working
and committed snapshots migrate independently. JSON backup loading uses the
same migration as local storage.

Run `npm test` for allocation, migration, transport, and persistence checks.
Run `npm run build` for TypeScript validation and the production build.
