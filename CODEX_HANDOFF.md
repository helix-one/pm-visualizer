# Codex Handoff — Graph Workbench

Read these files first:

1. `ARCHITECTURE.md`
2. `schemas/graph-workbench.schema.json`
3. `skills/graph-visualizer/SKILL.md`
4. `examples/planning.json`
5. `examples/process.json`
6. `UI_REFERENCE.md`
7. `REFERENCE_PROTOTYPE.html`

## First implementation request

Implement **Phase 0 only**.

Do not continue into Wayfinder integration or AI graph generation yet.

### Deliverable

A small React + TypeScript application that:

1. loads either example JSON;
2. validates the basic document shape;
3. converts Graph Workbench nodes/edges into React Flow nodes/edges;
4. uses ELK.js for automatic left-to-right layout;
5. renders an interactive canvas;
6. provides a persistent inspector on node click;
7. has a toggle/dropdown for Planning vs Process example;
8. visually distinguishes:
   - confirmed vs likely/speculative
   - unknown `…`
   - done/blocked/rejected status
9. shows frontier nodes in Planning View;
10. shows input/output port information in the Process inspector.

### Architecture constraints

- Canonical graph state must remain Graph Workbench JSON.
- Keep React Flow-specific fields in an adapter/view-model layer.
- Keep ELK behind a layout adapter.
- Do not store generated x/y coordinates back into canonical Graph JSON.
- Do not build a workflow execution engine.
- Do not implement manual freeform editing yet.
- Do not bind the kernel directly to Wayfinder.
- Keep node styles driven by semantic fields, not node-title conventions.

### Definition of done

Phase 0 is done when both example files render meaningfully and the distinction between a partial planning graph and a known process graph is visually obvious.

After Phase 0, stop and report:
- architecture created;
- screenshots or test evidence;
- tradeoffs discovered;
- any schema fields that proved awkward;
- recommended Phase 1 changes.

Do not silently expand scope.


## UI reference

Open `REFERENCE_PROTOTYPE.html` in a browser before implementing the canvas. Treat it as an interaction target, not production code. Preserve the semantic/interaction intent while implementing the real version with Graph JSON + React Flow + ELK.
