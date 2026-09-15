export type GraphKind = 'planning' | 'process' | 'repository_overview';
export type Certainty = 'confirmed' | 'likely' | 'speculative' | 'unknown' | 'resolved';
export type Status = 'unstarted' | 'ready' | 'active' | 'blocked' | 'done' | 'rejected' | 'out_of_scope';

export interface GraphPort {
  id: string;
  name: string;
  dataType?: string;
  schema?: unknown;
  example?: unknown;
  description?: string;
}

export interface GraphNode {
  id: string;
  kind: string;
  title: string;
  summary?: string;
  status?: Status;
  certainty?: Certainty;
  purpose?: string;
  principle?: string;
  inputs?: GraphPort[];
  outputs?: GraphPort[];
  acceptance?: string[];
  artifacts?: Array<{ id: string; kind: string; title: string; uri?: string; description?: string; inlinePreview?: unknown }>;
  codeRefs?: Array<{ file: string; lineStart?: number; lineEnd?: number; symbol?: string; description?: string }>;
  source?: { kind: string; uri?: string; file?: string; lineStart?: number; lineEnd?: number; externalId?: string };
  tags?: string[];
  childGraphId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
  certainty?: Certainty;
  sourcePort?: string;
  targetPort?: string;
  schemaRef?: string;
  label?: string;
}

export interface GraphDocument {
  schemaVersion: string;
  id: string;
  title: string;
  kind: GraphKind;
  description?: string;
  entryNodeIds?: string[];
  goalNodeIds?: string[];
  frontier?: { nodeIds?: string[]; description?: string };
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: Record<string, unknown>;
}
