import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { NODE_HEIGHT, NODE_WIDTH } from './layout';
import type { GraphDocument, GraphNode } from './types';

export interface CardData extends Record<string, unknown> {
  graphNode: GraphNode;
  frontier: boolean;
  selected: boolean;
}

export function toFlow(graph: GraphDocument, positions: Map<string, { x: number; y: number }>, selectedId: string | null) {
  const frontier = new Set(graph.frontier?.nodeIds ?? []);
  const nodes: Node<CardData>[] = graph.nodes.map((graphNode) => ({
    id: graphNode.id,
    type: 'graphCard',
    position: positions.get(graphNode.id) ?? { x: 0, y: 0 },
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    data: { graphNode, frontier: frontier.has(graphNode.id), selected: graphNode.id === selectedId },
    draggable: false,
    selectable: true
  }));
  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourcePort ?? 'out',
    targetHandle: edge.targetPort ?? 'in',
    type: 'smoothstep',
    label: edge.label,
    animated: edge.kind === 'candidate_path',
    className: `flow-edge flow-edge--${edge.kind} flow-edge--${edge.certainty ?? 'confirmed'}`,
    style: { strokeWidth: edge.kind === 'candidate_path' ? 1.5 : 1.8 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 }
  }));
  return { nodes, edges };
}
