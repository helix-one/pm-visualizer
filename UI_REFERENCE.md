# UI Reference Prototype

`REFERENCE_PROTOTYPE.html` is a **visual/interaction reference**, not production architecture.

Codex should use it to understand the intended experience:

- Three concepts are demonstrated:
  1. usage flow;
  2. Planning Graph / Growing DAG;
  3. Process Graph / feature explanation.
- Planning view must communicate certainty, uncertainty, unknown continuation and Planning Frontier.
- Clicking a node opens persistent detail in an Inspector.
- A task/feature may open a child graph.
- Process view should make I/O, schema/artifacts and code references natural to inspect.
- Repository overview should group by meaningful feature areas, not flatten every file.
- AI updates the existing graph as knowledge changes.

Important:
- Do **not** copy the prototype's hard-coded SVG positioning into production.
- Production must use Graph Workbench JSON + React Flow + ELK as described in `ARCHITECTURE.md`.
- The prototype's styling is illustrative, not a frozen design system.
- If production architecture conflicts with this prototype, preserve the interaction intent and follow `ARCHITECTURE.md` for the implementation.

## Desired feeling

The final product should feel like a navigable map of work and mechanism:
- near-term known work is crisp;
- uncertain future is visibly provisional;
- unknown future is allowed to remain unknown;
- feature internals can be progressively expanded;
- detailed evidence stays one click away without cluttering the canvas.
