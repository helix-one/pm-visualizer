import { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, ReactFlowProvider, useReactFlow, type Edge, type Node } from '@xyflow/react';
import planningExample from '../examples/planning.json';
import processExample from '../examples/process.json';
import templateProcess from '../cases/template-json-replacement/process.json';
import officialTemplateProcess from '../cases/template-json-replacement/official-process.json';
import { GraphCard } from './components/GraphCard';
import { Inspector } from './components/Inspector';
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH } from './graph/layout';
import { toFlow, type CardData } from './graph/toFlow';
import { readGraphDocument } from './graph/validate';

type Choice = 'planning' | 'process' | 'template-release' | 'official-template';
const sources: Record<Choice, unknown> = { planning: planningExample, process: processExample, 'template-release': templateProcess, 'official-template': officialTemplateProcess };
const nodeTypes = { graphCard: GraphCard };

function initialChoice(): Choice {
  const requested = new URLSearchParams(window.location.search).get('graph');
  return requested === 'planning' || requested === 'process' || requested === 'template-release' || requested === 'official-template' ? requested : 'planning';
}

function Workbench() {
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flowNodes, setFlowNodes] = useState<Node<CardData>[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const { setViewport, setCenter, fitView } = useReactFlow();
  const resolved = useMemo(() => {
    try { return { graph: readGraphDocument(sources[choice]), error: null }; }
    catch (error) { return { graph: null, error: error instanceof Error ? error.message : String(error) }; }
  }, [choice]);
  const graph = resolved.graph;

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('graph', choice);
    window.history.replaceState(null, '', url);
  }, [choice]);

  useEffect(() => {
    if (!graph) return;
    let cancelled = false;
    let frame = 0;
    const firstId = graph.kind === 'planning' ? (graph.frontier?.nodeIds?.[0] ?? graph.nodes[0]?.id) : (graph.goalNodeIds?.[0] ?? graph.nodes[0]?.id ?? null);
    setSelectedId(firstId ?? null);
    setLayoutError(null);
    setFlowNodes([]);
    setFlowEdges([]);
    layoutGraph(graph).then((positions) => {
      if (cancelled) return;
      const flow = toFlow(graph, positions, firstId ?? null);
      setFlowNodes(flow.nodes);
      setFlowEdges(flow.edges);
      frame = requestAnimationFrame(() => {
        const stage = document.querySelector<HTMLElement>('.canvas-stage');
        if (!stage || cancelled || !positions.size) return;
        const xs = [...positions.values()].map((point) => point.x);
        const ys = [...positions.values()].map((point) => point.y);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        const graphWidth = Math.max(...xs) - minX + NODE_WIDTH;
        const graphHeight = Math.max(...ys) - minY + NODE_HEIGHT;
        const overviewZoom = Math.max(0.18, Math.min(0.9, (stage.clientWidth - 84) / graphWidth, (stage.clientHeight - 84) / graphHeight));
        const focusPoint = firstId ? positions.get(firstId) : undefined;
        if (graph.kind === 'process' && graph.nodes.length > 8 && overviewZoom < 0.62 && focusPoint) {
          const zoom = 0.68;
          setViewport({ x: stage.clientWidth / 2 - (focusPoint.x + NODE_WIDTH / 2) * zoom, y: stage.clientHeight / 2 - (focusPoint.y + NODE_HEIGHT / 2) * zoom, zoom }, { duration: 0 });
        } else {
          setViewport({ x: (stage.clientWidth - graphWidth * overviewZoom) / 2 - minX * overviewZoom, y: (stage.clientHeight - graphHeight * overviewZoom) / 2 - minY * overviewZoom, zoom: overviewZoom }, { duration: 0 });
        }
      });
    }).catch((error) => { if (!cancelled) setLayoutError(error instanceof Error ? error.message : String(error)); });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [graph, setViewport]);

  function selectNode(id: string, focus = false) {
    setSelectedId(id);
    setFlowNodes((nodes) => nodes.map((node) => ({ ...node, data: { ...node.data, selected: node.id === id } })));
    if (focus) {
      const node = flowNodes.find((item) => item.id === id);
      if (node) setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2, { zoom: 0.82, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300 });
    }
  }

  function changeChoice(next: Choice) { if (next !== choice) setChoice(next); }
  const selectedNode = graph?.nodes.find((node) => node.id === selectedId);
  const frontierNodes = graph?.frontier?.nodeIds?.map((id) => graph.nodes.find((node) => node.id === id)).filter((node) => node !== undefined) ?? [];
  const goalNodes = graph?.goalNodeIds?.map((id) => graph.nodes.find((node) => node.id === id)).filter((node) => node !== undefined) ?? [];
  const isCase = choice === 'template-release' || choice === 'official-template';

  return <div className="app-shell">
    <header className="app-header">
      <div className="brand"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><div><div className="brand-name">GRAPH WORKBENCH</div><div className="brand-subtitle">SYSTEM MAPS / PHASE 0</div></div></div>
      <div className="header-center"><span className="live-dot" /> GRAPH JSON <span className="header-divider">/</span> REACT FLOW <span className="header-divider">/</span> ELK</div>
      <div className="header-right">READ-ONLY VIEW <span className="header-version">v0.1</span></div>
    </header>
    <div className="app-body">
      <aside className="left-rail">
        <div className="rail-kicker">WORKSPACE <span>{String((Object.keys(sources) as Choice[]).indexOf(choice) + 1).padStart(2, '0')} / 04</span></div>
        <h1>把复杂系统<br /><em>看清楚。</em></h1>
        <p className="rail-intro">同一份语义图数据，呈现计划的未知边界与流程的输入输出。位置由布局引擎计算，不写入 JSON。</p>
        <div className="rail-divider" />
        <div className="rail-label">VIEW MODE</div>
        <div className="mode-switch" role="group" aria-label="图类型">
          <button type="button" className={choice === 'planning' ? 'active' : ''} onClick={() => changeChoice('planning')}>PLANNING</button>
          <button type="button" className={choice !== 'planning' ? 'active' : ''} onClick={() => changeChoice(choice === 'planning' ? 'process' : choice)}>PROCESS</button>
        </div>
        <div className="rail-label document-label">DOCUMENT</div>
        <div className="document-list">
          <button type="button" className={choice === 'planning' ? 'active' : ''} onClick={() => changeChoice('planning')}><span className="doc-number">01</span><span><strong>Planning example</strong><small>示例 · 开放边界</small></span><span className="doc-arrow">↗</span></button>
          <button type="button" className={choice === 'process' ? 'active' : ''} onClick={() => changeChoice('process')}><span className="doc-number">02</span><span><strong>Process example</strong><small>示例 · 数据流</small></span><span className="doc-arrow">↗</span></button>
          <button type="button" className={choice === 'template-release' ? 'active' : ''} onClick={() => changeChoice('template-release')}><span className="doc-number">03</span><span><strong>个人模板：使用效果</strong><small>完整模板 · Q1/Q2 · 批改</small></span><span className="doc-arrow">↗</span></button>
          <button type="button" className={choice === 'official-template' ? 'active' : ''} onClick={() => changeChoice('official-template')}><span className="doc-number">04</span><span><strong>官方模板：更新效果</strong><small>新训练 · 公开 PDF</small></span><span className="doc-arrow">↗</span></button>
        </div>
        {graph?.kind === 'planning' && frontierNodes.length ? <div className="frontier-panel"><div className="rail-label">CURRENT FRONTIER <span>{String(frontierNodes.length).padStart(2, '0')}</span></div><p>{graph.frontier?.description || '这些节点位于当前可推进边界。'}</p>{frontierNodes.map((node) => <button type="button" key={node.id} onClick={() => selectNode(node.id)} className={selectedId === node.id ? 'active' : ''}><span className="frontier-marker" />{node.title}<span>↗</span></button>)}</div> : null}
        <div className="rail-bottom"><span className="small-square" /> SCHEMA 0.1 <span>·</span> NO PERSISTED COORDINATES</div>
      </aside>
      <main className="canvas-column">
        <div className="canvas-header">
          <div className="canvas-heading">
            <div className="canvas-headline-row">
              <div className="canvas-kicker">{graph?.kind === 'planning' ? 'PLANNING MAP' : 'PROCESS MAP'} <span>/ {isCase ? 'FIELD CASE' : 'REFERENCE'}</span></div>
              {isCase ? <div className="case-scope-switch" role="group" aria-label="模板案例视角">
                <button type="button" className={choice === 'template-release' ? 'active' : ''} onClick={() => changeChoice('template-release')}>个人模板</button>
                <button type="button" className={choice === 'official-template' ? 'active' : ''} onClick={() => changeChoice('official-template')}>官方更新</button>
              </div> : null}
            </div>
            <h2>{graph?.title || 'Graph document'}</h2>
            <p>{graph?.description || (graph?.kind === 'planning' ? '已知、推测与未知，共处一张可探索的地图。' : '从输入到输出，沿边追踪数据与依赖。')}</p>
            {graph?.kind === 'process' && goalNodes.length ? <div className="outcome-nav"><span>最终效果</span>{goalNodes.map((node) => <button type="button" key={node.id} className={selectedId === node.id ? 'active' : ''} title={node.summary || node.purpose} onClick={() => selectNode(node.id, true)}>{node.title} ↗</button>)}<button type="button" className="overview-action" onClick={() => fitView({ padding: 0.15, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300 })}>查看全图</button></div> : null}
          </div>
          <div className="canvas-stats"><div><strong>{graph?.nodes.length ?? 0}</strong><span>NODES</span></div><div><strong>{graph?.edges.length ?? 0}</strong><span>EDGES</span></div></div>
        </div>
        <div className="canvas-stage">
          {resolved.error || layoutError
            ? <div className="canvas-error"><strong>图无法渲染</strong><p>{resolved.error || layoutError}</p></div>
            : <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => selectNode(node.id)}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnDrag
                minZoom={0.18}
                maxZoom={1.6}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#53616b" />
                <Controls showInteractive={false} position="bottom-left" />
              </ReactFlow>}
          <div className="canvas-note"><span>◉</span> DRAG TO PAN <span>·</span> SCROLL TO ZOOM <span>·</span> SELECT TO INSPECT</div>
        </div>
        <div className="canvas-footer"><div><span className="legend-line solid" /> 已确认 <span className="legend-line dashed" /> 推测 / 候选 <span className="legend-unknown">···</span> 未知 <span className="legend-frontier" /> 当前边界</div><span>GRAPH ID: {graph?.id ?? '—'}</span></div>
      </main>
      {graph ? <Inspector graph={graph} node={selectedNode} /> : <aside className="inspector" />}
    </div>
  </div>;
}

export default function App() { return <ReactFlowProvider><Workbench /></ReactFlowProvider>; }
