# Graph Workbench v0.1 — System Design

> Status: design baseline for Codex implementation.
> Scope: planning visualization + feature/process explanation. This version does **not** implement an execution engine, multi-agent orchestration, or project management suite.

## 1. What we are building

Graph Workbench is a visual layer for understanding two related but semantically different kinds of structure:

1. **Planning Graph** — a growing, partially-known DAG for large work.
   - Inspired by Matt Pocock's Wayfinder.
   - Represents goals, decisions, investigations, candidate branches, implementation tasks, blockers, and the current planning frontier.
   - The future is intentionally incomplete. Unknown future work must remain unknown instead of being hallucinated into a complete plan.
   - The graph grows as decisions are resolved and work proceeds.

2. **Process Graph** — a mostly-known graph that explains how a feature or repository works.
   - Represents stages, modules, transformations, data/control flow, inputs, outputs, schemas, artifacts, and code locations.
   - Can explain one feature or summarize a repository as a set of feature/process graphs.
   - This is documentation/inspection first, not execution in v0.1.

Both graph types use one shared **Graph Kernel**, but they use different node/edge semantics and different visual conventions.

## 2. Product principles

### P1. One kernel, multiple views
Do not create separate storage models for planning and process diagrams. Both are graphs composed of nodes, edges, ports, artifacts, metadata, and optional child graphs.

### P2. Semantics are explicit
An arrow must never be ambiguous.

Examples:
- `depends_on`: planning dependency.
- `unblocks`: planning consequence.
- `data_flow`: runtime/data transformation.
- `control_flow`: runtime sequencing.
- `produces`: node creates an artifact.
- `references`: documentation/link relation.

### P3. Planning graphs are partial
A planning graph is not a promise that all future work is already known.

Use explicit uncertainty:
- confirmed node/edge
- likely node/edge
- speculative candidate
- unknown continuation (`…`)
- planning frontier

### P4. State and certainty are orthogonal
`todo` is not the same thing as `uncertain`.

A node can be:
- status = `todo`, certainty = `confirmed`
- status = `todo`, certainty = `speculative`
- status = `done`, certainty = `confirmed`
- status = `rejected`, certainty = `resolved`

### P5. Progressive disclosure
The canvas is for structure. The inspector is for depth.

Node surface:
- title
- type
- small state indicators
- compact I/O summary when useful

Node inspector:
- purpose
- what to do
- principle / reasoning
- inputs
- outputs
- schema
- acceptance criteria
- code references
- artifacts
- images / plots / logs
- child graph

### P6. Graphs may recurse
A planning task can open a Process Graph.
A process/module node can open a more detailed Process Graph.

Use `childGraphId`; do not force every level into one giant canvas.

---

## 3. High-level architecture

```text
Human / Codex / Wayfinder / Repo analysis
                  |
                  v
          Graph Adapter Layer
      ---------------------------
      | Wayfinder adapter       |
      | Generic plan adapter    |
      | Repository adapter      |
      | Manual JSON adapter     |
      ---------------------------
                  |
                  v
             Graph Kernel
     Graph / Node / Edge / Port
     Artifact / ChildGraph / View
                  |
          +-------+-------+
          |               |
          v               v
     Planning View    Process View
          |               |
          +-------+-------+
                  |
                  v
           React Flow canvas
                  |
                  v
             ELK layout
                  |
                  v
       Inspector / preview panel
```

The canonical data is **Graph JSON**, not React Flow node state and not Mermaid text.

React Flow is a renderer/editor adapter over Graph JSON.

---

## 4. Graph Kernel

### Graph

Core fields:

```ts
type GraphKind = "planning" | "process" | "repository_overview";

interface GraphDocument {
  schemaVersion: "0.1";
  id: string;
  title: string;
  kind: GraphKind;
  description?: string;

  nodes: GraphNode[];
  edges: GraphEdge[];

  entryNodeIds?: string[];
  goalNodeIds?: string[];

  frontier?: Frontier;
  metadata?: Record<string, unknown>;
}
```

### Node

```ts
type NodeKind =
  | "goal"
  | "decision"
  | "investigation"
  | "task"
  | "candidate"
  | "unknown"
  | "input"
  | "output"
  | "stage"
  | "module"
  | "artifact"
  | "group";

type WorkStatus =
  | "unstarted"
  | "ready"
  | "active"
  | "blocked"
  | "done"
  | "rejected"
  | "out_of_scope";

type Certainty =
  | "confirmed"
  | "likely"
  | "speculative"
  | "unknown"
  | "resolved";

interface GraphNode {
  id: string;
  kind: NodeKind;
  title: string;
  summary?: string;

  status?: WorkStatus;
  certainty?: Certainty;

  purpose?: string;
  principle?: string;

  inputs?: Port[];
  outputs?: Port[];

  acceptance?: string[];
  artifacts?: ArtifactRef[];
  codeRefs?: CodeRef[];

  childGraphId?: string;

  source?: SourceRef;
  tags?: string[];
}
```

### Edge

```ts
type EdgeKind =
  | "depends_on"
  | "unblocks"
  | "candidate_path"
  | "data_flow"
  | "control_flow"
  | "produces"
  | "references";

type EdgeCertainty = "confirmed" | "likely" | "speculative";

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  certainty?: EdgeCertainty;

  sourcePort?: string;
  targetPort?: string;

  schemaRef?: string;
  label?: string;
}
```

### Port

```ts
interface Port {
  id: string;
  name: string;
  dataType?: string;
  schema?: unknown;
  description?: string;
  example?: unknown;
}
```

### Artifact

```ts
type ArtifactKind =
  | "image"
  | "plot"
  | "table"
  | "json"
  | "log"
  | "markdown"
  | "code"
  | "file"
  | "url";

interface ArtifactRef {
  id: string;
  kind: ArtifactKind;
  title: string;
  uri?: string;
  inlinePreview?: unknown;
  description?: string;
}
```

### Source provenance

Every AI-generated node should be traceable when possible.

```ts
interface SourceRef {
  kind: "wayfinder_ticket" | "issue" | "file" | "code" | "conversation" | "manual";
  uri?: string;
  file?: string;
  lineStart?: number;
  lineEnd?: number;
  externalId?: string;
}
```

---

## 5. Planning Graph semantics

### Purpose

Planning Graph answers:

- Where are we trying to go?
- What is currently known?
- What decisions remain?
- What work is ready?
- What is blocked?
- What future work is only provisional?
- Where does reliable planning currently stop?

### Required visual grammar

| Meaning | Visual treatment |
|---|---|
| confirmed node | solid border |
| likely node | dashed border |
| speculative candidate | dashed + reduced emphasis |
| unknown continuation | `…` node / fog marker |
| confirmed dependency | solid edge |
| probable dependency | dashed edge |
| rejected branch | faded, optionally struck/rejected badge |
| done | completion badge |
| blocked | blocker badge |
| frontier | explicit boundary/band or computed highlight |

Do not encode uncertainty only with color; use stroke style/text/badges too.

### Planning Frontier

The frontier is the set of currently actionable nodes at the reliable edge of the plan.

For Wayfinder-like decision maps, a practical frontier can be derived as:

```text
open node
AND not claimed/active
AND all hard blockers resolved
```

The UI may additionally show a broader **knowledge frontier**: where confirmed structure transitions into likely/speculative/unknown structure.

These are related but should not be silently conflated.

### Unknown future

The AI must be allowed to emit:

```json
{
  "id": "unknown-after-validation",
  "kind": "unknown",
  "title": "…",
  "certainty": "unknown"
}
```

This is preferred over inventing five future tasks without evidence.

### Relationship with Wayfinder

Matt Pocock's Wayfinder is decision-first:
- it maps a foggy large effort as decision tickets;
- each ticket should resolve a decision;
- when the map is clear, Wayfinder hands off to spec/build planning.

Graph Workbench should **not redefine Wayfinder's planning protocol**. It consumes or mirrors Wayfinder state and visualizes it.

A later implementation may also visualize implementation tickets after Wayfinder hands off, but those should have distinct node types and provenance.

---

## 6. Process Graph semantics

### Purpose

Process Graph answers:

- What does this feature do?
- What stages does it pass through?
- What modules participate?
- What enters and leaves each stage?
- What data shape moves between stages?
- What code implements the stage?
- What intermediate result can I inspect?

### Example

```text
Raw microscopy data
        |
        v
 Load / validate
        |
        v
 Normalize schema
      /       \
     v         v
Tracking    ERK extraction
     \         /
      v       v
      Statistics
          |
          v
       Figures
```

Clicking `ERK extraction` can show:

- Purpose
- Algorithm/principle
- Input: `CellTrackFrame[]`
- Output: `ERKTrace[]`
- Schema/example JSON
- Code: `src/erk/extract.py:...`
- Figure preview
- Child graph

### Repository overview

A repository can be summarized as a graph of feature groups:

```text
Repository
  |
  +-- Import pipeline -> child graph
  +-- Analysis        -> child graph
  +-- Visualization   -> child graph
  +-- Export          -> child graph
```

Do not flatten an entire repository into a single enormous dependency graph by default.

---

## 7. UI layout

Recommended initial layout:

```text
+--------------------------------------------------------------+
| toolbar: view | graph selector | fit | search | layout       |
+-------------------------------------------+------------------+
|                                           |                  |
|              graph canvas                 |    inspector     |
|                                           |                  |
|                                           | purpose          |
|                                           | principle        |
|                                           | input/output     |
|                                           | schema           |
|                                           | artifacts        |
|                                           | code refs        |
|                                           | child graph      |
+-------------------------------------------+------------------+
```

### Canvas interactions

v0.1:
- pan/zoom
- fit view
- select node
- click edge
- search node
- expand/open child graph
- automatic layout
- highlight upstream/downstream
- toggle speculative/rejected nodes
- toggle frontier

Not required in v0.1:
- full freeform diagram editor
- runtime execution
- collaborative cursors
- complex BPMN editing

### Hover vs click

Hover:
- title
- one sentence summary
- state/certainty

Click:
- persistent inspector with full detail

Important information must never exist only on hover.

---

## 8. Technology choice

### USE — React Flow / xyflow

Role: primary interactive graph renderer.

Why:
- interactive node-based UI
- pan/zoom/select built in
- custom React nodes
- multiple handles/ports
- custom edges
- grouping/subflows
- strong ecosystem
- MIT

Use it as a dependency. Do **not** fork React Flow.

Repository:
https://github.com/xyflow/xyflow

Docs:
https://reactflow.dev/

### USE — ELK.js

Role: automatic layout.

Why:
- designed for directed node-link diagrams
- layered layouts
- explicit ports
- hierarchy support
- good match for DAG/process graphs

Use as a dependency behind a layout adapter.

Repository:
https://github.com/kieler/elkjs

### INTEGRATE / BORROW — Matt Pocock Wayfinder

Role: planning source and planning methodology.

Use:
- Wayfinder-generated map/tickets can be imported.
- Preserve its decision-ticket semantics.
- Build a source adapter rather than rewriting Wayfinder.

Do not:
- couple the entire Graph Kernel to Wayfinder's issue format.
- treat decision tickets as implementation tasks.

Repository:
https://github.com/mattpocock/skills

Wayfinder docs:
https://github.com/mattpocock/skills/blob/main/docs/engineering/wayfinder.md

### BORROW / POSSIBLE ADAPTER — rengwu/wayfinder-maps

Role: strong reference for local Wayfinder map ingestion and derived planning state.

Especially useful concepts:
- `Effort`
- `Frontier()`
- derived status
- fog
- undermined decisions
- lint/fsck model
- read-only projection over planning memory

Do not use its current renderer as our foundation:
- its UI direction is a hand-written 2.5D Canvas star-map;
- Graph Workbench needs structured nodes, inspector panels, rich I/O/schema/artifact rendering, and Process Graphs.

Possible later strategy:
- write a Graph Workbench adapter for its `.plan/<effort>/` contract;
- optionally reuse parsing/model code only if doing so stays clean and license/API boundaries are acceptable.

Repository:
https://github.com/rengwu/wayfinder-maps

### REFERENCE — Rete.js

Role: study its separation of dataflow and control flow.

Do not add as a dependency in v0.1 unless React Flow proves inadequate.

Repository:
https://github.com/retejs/rete

### REFERENCE — LiteGraph.js / ComfyUI

Role: study ports, node I/O, nested graph workflows, and visual-programming interaction.

Do not base v0.1 on LiteGraph because our graph is primarily an explanation/planning surface, not an executable visual program.

Repository:
https://github.com/Comfy-Org/litegraph.js

ComfyUI:
https://github.com/Comfy-Org/ComfyUI

### REFERENCE — n8n / Langflow

Role: interaction references:
- click node -> inspector
- I/O display
- execution/result visibility
- component contracts

Do not fork.

Repositories:
https://github.com/n8n-io/n8n
https://github.com/langflow-ai/langflow

### OPTIONAL EXPORT — Mermaid / D2

Role:
- text/document export
- README embedding
- simple static snapshots

They are not the canonical model and not the main UI.

---

## 9. AI skill

The AI should never directly author React Flow coordinates.

Pipeline:

```text
source material
    |
    v
AI graph extraction / planning
    |
    v
Graph JSON
    |
    v
schema validation
    |
    v
semantic validation
    |
    v
ELK layout
    |
    v
React Flow render
```

The skill is defined separately in `skills/graph-visualizer/SKILL.md`.

Core rule:

> The AI owns graph semantics. The layout engine owns coordinates.

---

## 10. Human + AI workflows

### A. New large project

```text
Human states destination
        |
        v
Human + Wayfinder clarify fog / decisions
        |
        v
Wayfinder map exists
        |
        v
Graph adapter -> Planning Graph JSON
        |
        v
Graph Workbench renders current map
        |
        v
ticket resolved / new uncertainty discovered
        |
        v
incremental graph update
```

### B. After Wayfinder clears

```text
Wayfinder decisions resolved
        |
        v
spec / implementation tickets
        |
        v
Planning Graph may switch/show implementation layer
        |
        v
tasks progress
        |
        v
status updates on graph
```

The implementation layer should remain distinguishable from the original decision map.

### C. Explain one feature

```text
Human selects feature/question
        |
        v
AI reads relevant code
        |
        v
identify stages/modules/I-O
        |
        v
Process Graph JSON
        |
        v
render
        |
        v
click node for code/schema/artifacts
```

### D. Explain a repository

```text
repo
 |
 v
AI identifies major feature families
 |
 v
Repository Overview Graph
 |
 +--> feature child graph
 +--> feature child graph
 +--> feature child graph
```

---

## 11. Persistence

Recommended v0.1 repository layout:

```text
.graph-workbench/
  graphs/
    <graph-id>.json
  artifacts/
    ...
  cache/
    layout/
```

AI-generated graph JSON should be diffable in Git.

React Flow positions should **not** be the main semantic source of truth.

Optional later:
- SQLite/project index
- issue tracker synchronization
- graph revision history

---

## 12. Validation rules

Implement a semantic validator in addition to JSON Schema.

Examples:

1. Planning graph:
   - `unknown` nodes cannot be `done`.
   - speculative edges should not silently become hard confirmed blockers.
   - task nodes should not be presented as Wayfinder decision tickets unless provenance says so.
   - unresolved source nodes must not be visually rendered as resolved.

2. Process graph:
   - `data_flow` should ideally connect ports or declare a data/schema label.
   - input/output ports referenced by edges must exist.
   - code refs must point to valid files when repo context is available.

3. General:
   - IDs unique.
   - edge endpoints exist.
   - child graphs exist when referenced.
   - schema version supported.

---

## 13. Codex implementation sequence

### Phase 0 — skeleton
Deliver:
- React + TypeScript app
- React Flow canvas
- right-side inspector
- load a static Graph JSON example
- ELK automatic layout

Acceptance:
- `examples/planning.json` and `examples/process.json` render correctly.
- selecting a node updates inspector.
- no coordinates are required in source JSON.

### Phase 1 — Graph Kernel
Deliver:
- TypeScript domain types
- JSON schema
- loader
- semantic validator
- Graph -> React Flow adapter
- layout adapter

Acceptance:
- invalid edges/ports produce readable errors.
- kernel is independent from Wayfinder and React Flow.

### Phase 2 — Planning View
Deliver:
- status/certainty rendering
- solid/dashed/speculative/unknown styles
- frontier highlighting
- rejected/out-of-scope display
- upstream/downstream highlight

Acceptance:
- planning example visibly distinguishes "not done" from "not known".

### Phase 3 — Process View
Deliver:
- I/O handles
- schema preview
- artifact preview
- code references
- child graph navigation

Acceptance:
- one realistic feature graph can explain its pipeline without reading raw source.

### Phase 4 — AI graph skill
Deliver:
- installable repo skill
- commands/prompts for:
  - planning graph from structured plan
  - process graph from feature
  - repository overview
  - graph update
- validate generated JSON before accepting

Acceptance:
- AI edits semantic Graph JSON only.
- unchanged nodes retain stable IDs.

### Phase 5 — Wayfinder adapter
Deliver:
- import current Wayfinder map state
- map ticket/blocking/status into kernel
- preserve provenance
- calculate/ingest frontier
- support local markdown first

Acceptance:
- an existing Wayfinder map can be viewed without manually recreating it.

### Phase 6 — polish
Only after real use:
- graph diff/history
- better artifact previews
- source navigation
- issue tracker sync
- manual graph editing
- exports

---

## 14. Explicit non-goals for v0.1

Do not build:
- another issue tracker
- a full workflow execution engine
- n8n replacement
- BPMN suite
- multi-agent scheduler
- AI-generated giant architecture map of every file
- collaborative whiteboard
- automatic project planning that pretends uncertainty does not exist

The first success criterion is much smaller:

> Given a real plan or real feature, Graph Workbench gives a truthful, navigable visual representation that an AI can generate and maintain.

---

## 15. Key upstream references

Verified September 2026:

- Matt Pocock Wayfinder docs:
  https://github.com/mattpocock/skills/blob/main/docs/engineering/wayfinder.md
- Matt Pocock skills repository:
  https://github.com/mattpocock/skills
- Wayfinder Maps:
  https://github.com/rengwu/wayfinder-maps
- Wayfinder Maps star-map design:
  https://github.com/rengwu/wayfinder-maps/blob/main/docs/starmap-design.md
- React Flow / xyflow:
  https://github.com/xyflow/xyflow
  https://reactflow.dev/
- ELK.js:
  https://github.com/kieler/elkjs
- Rete.js:
  https://github.com/retejs/rete
- LiteGraph:
  https://github.com/Comfy-Org/litegraph.js
- n8n:
  https://github.com/n8n-io/n8n
- Langflow:
  https://github.com/langflow-ai/langflow
