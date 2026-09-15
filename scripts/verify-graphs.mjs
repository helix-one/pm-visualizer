import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import ELK from 'elkjs/lib/elk.bundled.js';

const root = resolve(import.meta.dirname, '..');
const schema = JSON.parse(await readFile(resolve(root, 'schemas/graph-workbench.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const elk = new ELK();
const files = ['examples/planning.json', 'examples/process.json', 'cases/template-json-replacement/process.json', 'cases/template-json-replacement/official-process.json'];
for (const file of files) {
  const graph = JSON.parse(await readFile(resolve(root, file), 'utf8'));
  if (!validate(graph)) throw new Error(`${file}: ${JSON.stringify(validate.errors)}`);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgeIds = new Set();
  if (nodes.size !== graph.nodes.length) throw new Error(`${file}: duplicate node ID`);
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`${file}: duplicate edge ID ${edge.id}`);
    edgeIds.add(edge.id);
    const source = nodes.get(edge.source), target = nodes.get(edge.target);
    if (!source || !target) throw new Error(`${file}: dangling edge ${edge.id}`);
    if (edge.sourcePort && !source.outputs?.some((port) => port.id === edge.sourcePort)) throw new Error(`${file}: invalid source port ${edge.id}`);
    if (edge.targetPort && !target.inputs?.some((port) => port.id === edge.targetPort)) throw new Error(`${file}: invalid target port ${edge.id}`);
  }
  for (const id of [...(graph.entryNodeIds ?? []), ...(graph.goalNodeIds ?? []), ...(graph.frontier?.nodeIds ?? [])]) if (!nodes.has(id)) throw new Error(`${file}: dangling graph node reference ${id}`);
  const laidOut = await elk.layout({ id: graph.id, layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' }, children: graph.nodes.map((node) => ({ id: node.id, width: 272, height: 158 })), edges: graph.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })) });
  if (laidOut.children?.length !== graph.nodes.length || laidOut.children.some((node) => !Number.isFinite(node.x) || !Number.isFinite(node.y))) throw new Error(`${file}: ELK layout incomplete`);
  if (graph.nodes.some((node) => 'x' in node || 'y' in node)) throw new Error(`${file}: persisted canvas coordinates`);
  console.log(`PASS ${file}: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ELK layout`);
}

const malformed = { schemaVersion: '0.1', id: 'bad', title: 'bad', kind: 'process', nodes: [], edges: [{ id: 'e', source: 'missing', target: 'missing', kind: 'data_flow' }] };
if (!validate(malformed)) throw new Error('negative structural fixture unexpectedly failed schema validation');
if (malformed.edges.every((edge) => malformed.nodes.some((node) => node.id === edge.source))) throw new Error('negative referential fixture unexpectedly passed');
console.log('PASS negative fixture: dangling endpoint detected by semantic check');
