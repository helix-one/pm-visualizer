import Ajv2020 from 'ajv/dist/2020.js';
import schema from '../../schemas/graph-workbench.schema.json';
import type { GraphDocument } from './types';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

export function readGraphDocument(value: unknown): GraphDocument {
  if (!validateSchema(value)) {
    const details = (validateSchema.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
    throw new Error(`Graph JSON schema 校验失败：${details}`);
  }

  const graph = value as unknown as GraphDocument;
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) throw new Error(`重复节点 ID：${node.id}`);
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`重复边 ID：${edge.id}`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.source) || !ids.has(edge.target)) {
      throw new Error(`边 ${edge.id} 引用了不存在的节点`);
    }
    const source = graph.nodes.find((node) => node.id === edge.source)!;
    const target = graph.nodes.find((node) => node.id === edge.target)!;
    if (edge.sourcePort && !source.outputs?.some((port) => port.id === edge.sourcePort)) {
      throw new Error(`边 ${edge.id} 的 sourcePort 不存在：${edge.sourcePort}`);
    }
    if (edge.targetPort && !target.inputs?.some((port) => port.id === edge.targetPort)) {
      throw new Error(`边 ${edge.id} 的 targetPort 不存在：${edge.targetPort}`);
    }
  }
  for (const nodeId of [...(graph.entryNodeIds ?? []), ...(graph.goalNodeIds ?? []), ...(graph.frontier?.nodeIds ?? [])]) {
    if (!ids.has(nodeId)) throw new Error(`图级引用了不存在的节点：${nodeId}`);
  }
  return graph;
}
