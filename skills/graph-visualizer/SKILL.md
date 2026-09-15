---
name: graph-visualizer
description: Create and maintain truthful Planning Graphs and Process Graphs as validated Graph Workbench JSON. Use when the user asks to visualize a plan, Wayfinder map, feature workflow, data flow, module flow, or repository feature overview.
---

# Graph Visualizer Skill — v0.1

## Mission

Transform planning state or software/research structure into a **semantic graph**, not a decorative diagram.

The output is Graph Workbench JSON. Do not manually assign canvas coordinates. Layout is performed by the renderer.

## Choose the graph type

Use `planning` when the primary question is:

- What should happen next?
- What depends on what?
- What decisions remain?
- What is blocked?
- Where is the frontier?
- Which future paths are tentative or unknown?

Use `process` when the primary question is:

- How does this feature work?
- How does data move?
- Which stages/modules participate?
- What are the inputs and outputs?
- Which schema/artifact/code belongs to each stage?

Use `repository_overview` when summarizing several feature families in one repository. Prefer child graphs over a giant flattened diagram.

## Planning graph rules

### Never fabricate completeness

A planning graph may stop.

When the route is unknown:
- create an `unknown` / `…` node;
- or leave the destination separated by an explicit unknown continuation.

Do not invent plausible-looking implementation steps just to connect the current state to the final goal.

### Distinguish status from certainty

Status:
- unstarted
- ready
- active
- blocked
- done
- rejected
- out_of_scope

Certainty:
- confirmed
- likely
- speculative
- unknown
- resolved

Do not use `unstarted` as a substitute for `speculative`.

### Preserve Wayfinder semantics

If the source is a Wayfinder map:
- a Wayfinder decision ticket is a decision/investigation node;
- do not silently relabel it as an implementation task;
- preserve ticket IDs/URLs in `source`;
- preserve blockers;
- preserve open/resolved state;
- surface the current frontier.

Wayfinder plans decisions until the route is clear. Implementation tickets belong to the later implementation layer unless the source explicitly says otherwise.

### Candidate branches

If multiple routes are under consideration:
- represent each as `candidate`;
- use `candidate_path` or speculative edges;
- when rejected, keep the branch in the graph with `status: rejected` rather than deleting history unless the user asks to remove it.

## Process graph rules

Extract the smallest useful chain of transformations.

For each meaningful stage capture, when available:
- purpose
- principle
- inputs
- outputs
- schema/example
- implementation/code refs
- artifacts/results
- child graph

Avoid nodes that merely mirror every function/file. Prefer semantic stages.

### Data edges

Use `data_flow` for data moving between stages.

Whenever useful, include:
- sourcePort
- targetPort
- data type/schema label

Use `control_flow` only when sequencing/control is the intended meaning.

## Repository analysis procedure

1. Identify the feature/question being explained.
2. Find entry points.
3. Trace the actual path through the code.
4. Group low-level implementation into semantic stages.
5. Record source code references.
6. Record I/O at stage boundaries.
7. Create child graphs for stages that need more detail.
8. Validate every edge against observed code or explicit architectural documentation.
9. Mark uncertain interpretations; do not present guesses as facts.

## Planning analysis procedure

1. Identify destination/goal.
2. Read existing Wayfinder/spec/tickets if supplied.
3. Extract confirmed decisions and dependencies.
4. Identify actionable frontier.
5. Identify unresolved questions.
6. Separate candidate future work from confirmed future work.
7. Preserve unknown space.
8. Emit/update Graph JSON.
9. Run schema + semantic validation.

## Stable update rules

When updating an existing graph:
- preserve existing node IDs when the semantic entity is the same;
- patch changed nodes/edges;
- add newly discovered nodes;
- mark rejected/out-of-scope rather than deleting useful history;
- never regenerate arbitrary IDs for the whole graph;
- do not reorder meaning solely for layout.

## Node detail quality

A useful node answers:

**What?**
What stage/task/decision is this?

**Why?**
Why does it exist?

**How / principle?**
What principle or mechanism matters?

**Input?**
What enters?

**Output?**
What comes out?

**Evidence?**
What code, artifact, result, or ticket supports this?

Not every node needs every field. Do not pad with generic prose.

## Output contract

Write/patch a `GraphDocument` JSON matching:
`schemas/graph-workbench.schema.json`

Then run the project's validator.

Do not:
- output Mermaid as the canonical representation;
- output React Flow coordinates;
- encode business semantics only in CSS;
- infer a complete future path from insufficient evidence.

## Visual semantics expected by renderer

The renderer maps semantic values to visual forms:

- confirmed -> solid
- likely/speculative -> dashed / reduced emphasis
- unknown -> ellipsis/fog marker
- rejected -> faded/rejected marker
- done -> completion marker
- blocked -> blocker marker
- frontier -> frontier highlight

The skill sets semantics; it does not choose pixel styling.

## Completion checklist

Before finishing:
- [ ] correct graph kind
- [ ] node IDs stable and unique
- [ ] all edge endpoints exist
- [ ] edge semantics are unambiguous
- [ ] uncertainty is explicit
- [ ] unknown future has not been fabricated
- [ ] Wayfinder decisions are not confused with implementation tasks
- [ ] I/O is captured for important process boundaries
- [ ] source provenance is included where available
- [ ] graph validates
