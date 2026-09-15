import type { GraphDocument } from './types';

let elkPromise: Promise<InstanceType<typeof import('elkjs/lib/elk.bundled.js').default>> | undefined;
function getElk() {
  elkPromise ??= import('elkjs/lib/elk.bundled.js').then(({ default: ELK }) => new ELK());
  return elkPromise;
}
export const NODE_WIDTH = 272;
export const NODE_HEIGHT = 158;

export async function layoutGraph(graph: GraphDocument): Promise<Map<string, { x: number; y: number }>> {
  const elk = await getElk();
  const result = await elk.layout({
    id: graph.id,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '58',
      'elk.layered.spacing.nodeNodeBetweenLayers': '104',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
    },
    children: graph.nodes.map((node) => ({ id: node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: graph.edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] }))
  });
  return new Map((result.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}
