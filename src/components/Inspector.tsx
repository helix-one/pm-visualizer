import type { GraphDocument, GraphNode, GraphPort } from '../graph/types';

const statusNames: Record<string, string> = { unstarted: '未开始', ready: '待执行', active: '进行中', blocked: '受阻', done: '已完成', rejected: '已否决', out_of_scope: '范围外' };
const certaintyNames: Record<string, string> = { confirmed: '已确认', likely: '较可能', speculative: '推测', unknown: '未知', resolved: '已解决' };

function PortList({ title, ports }: { title: string; ports?: GraphPort[] }) {
  if (!ports?.length) return null;
  return <section className="inspect-section"><div className="section-label">{title} <span>{String(ports.length).padStart(2, '0')}</span></div><div className="port-list">{ports.map((port) => <div className="port-row" key={port.id}><div><strong>{port.name}</strong><code>{port.dataType || '未声明类型'}</code></div>{port.description ? <p>{port.description}</p> : null}{port.schema !== undefined ? <pre>{JSON.stringify(port.schema, null, 2)}</pre> : null}{port.example !== undefined ? <pre>{JSON.stringify(port.example, null, 2)}</pre> : null}</div>)}</div></section>;
}

export function Inspector({ graph, node }: { graph: GraphDocument; node: GraphNode | undefined }) {
  if (!node) return <aside className="inspector"><div className="inspect-eyebrow">INSPECTOR / 00</div><div className="inspector-empty">选择一个节点，查看其依据、输入与输出。</div></aside>;
  const incoming = graph.edges.filter((edge) => edge.target === node.id);
  const outgoing = graph.edges.filter((edge) => edge.source === node.id);
  return <aside className="inspector">
    <div className="inspect-eyebrow">INSPECTOR <span>/ {node.id}</span></div>
    <div className="inspect-head"><div className="inspect-kind">{node.kind.toUpperCase()}</div><h2>{node.title}</h2><p>{node.summary || node.purpose || '此节点尚无概述。'}</p></div>
    <div className="inspect-meta"><div><span>确定性</span><strong>{certaintyNames[node.certainty ?? 'confirmed']}</strong></div>{node.status ? <div><span>状态</span><strong>{statusNames[node.status]}</strong></div> : null}<div><span>连接</span><strong>{incoming.length} 入 / {outgoing.length} 出</strong></div></div>
    {node.purpose && node.summary ? <section className="inspect-section"><div className="section-label">目的</div><p className="inspect-copy">{node.purpose}</p></section> : null}
    {node.principle ? <section className="inspect-section"><div className="section-label">原理</div><p className="inspect-copy">{node.principle}</p></section> : null}
    {graph.kind === 'process' ? <><PortList title="INPUT PORTS" ports={node.inputs} /><PortList title="OUTPUT PORTS" ports={node.outputs} /></> : null}
    {node.acceptance?.length ? <section className="inspect-section"><div className="section-label">验收条件</div><ul className="inspect-list">{node.acceptance.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null}
    {node.artifacts?.length ? <section className="inspect-section"><div className="section-label">产物</div>{node.artifacts.map((artifact) => <div className="inspect-ref" key={artifact.id}><span className="ref-type">{artifact.kind}</span><strong>{artifact.title}</strong>{artifact.uri ? <code>{artifact.uri}</code> : null}{artifact.description ? <small>{artifact.description}</small> : null}</div>)}</section> : null}
    {node.codeRefs?.length ? <section className="inspect-section"><div className="section-label">代码依据</div>{node.codeRefs.map((ref, index) => <div className="inspect-ref" key={`${ref.file}-${index}`}><strong>{ref.symbol || '文件'}</strong><code>{ref.file}{ref.lineStart ? `:${ref.lineStart}` : ''}</code>{ref.description ? <small>{ref.description}</small> : null}</div>)}</section> : null}
    {node.source ? <section className="inspect-section"><div className="section-label">来源</div><p className="inspect-copy source-copy">{node.source.kind}{node.source.file ? ` · ${node.source.file}` : ''}{node.source.uri ? ` · ${node.source.uri}` : ''}</p></section> : null}
  </aside>;
}
