import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CardData } from '../graph/toFlow';

const kindName: Record<string, string> = {
  goal: '目标', decision: '决策', investigation: '调查', task: '任务', candidate: '候选',
  unknown: '未知', input: '输入', output: '输出', stage: '阶段', module: '模块', artifact: '产物', group: '分组'
};
const statusName: Record<string, string> = {
  unstarted: '未开始', ready: '待执行', active: '进行中', blocked: '受阻', done: '完成', rejected: '已否决', out_of_scope: '范围外'
};
const certaintyName: Record<string, string> = {
  confirmed: '已确认', likely: '较可能', speculative: '推测', unknown: '未确定', resolved: '已解决'
};

export function GraphCard({ data }: NodeProps) {
  const { graphNode: node, frontier, selected } = data as CardData;
  const inputIds = node.inputs?.map((port) => port.id) ?? [];
  const outputIds = node.outputs?.map((port) => port.id) ?? [];
  return (
    <div className={`graph-card certainty-${node.certainty ?? 'confirmed'} status-${node.status ?? 'none'} ${frontier ? 'is-frontier' : ''} ${selected ? 'is-selected' : ''}`}>
      <div className="card-topline"><span className="card-kind">{kindName[node.kind] ?? node.kind}</span><span className="card-id">{node.id}</span></div>
      <div className="card-title">{node.kind === 'unknown' ? <span className="unknown-mark">··· </span> : null}{node.title}</div>
      <div className="card-summary">{node.summary || node.purpose || '点击查看节点详情与数据接口。'}</div>
      <div className="card-footer">
        <span className={`certainty-pill certainty-pill--${node.certainty ?? 'confirmed'}`}>{certaintyName[node.certainty ?? 'confirmed']}</span>
        {node.status ? <span className={`status-pill status-pill--${node.status}`}>{statusName[node.status]}</span> : null}
        {frontier ? <span className="frontier-pill">FRONTIER</span> : null}
        {node.inputs?.length || node.outputs?.length ? <span className="port-count">{node.inputs?.length ?? 0} IN · {node.outputs?.length ?? 0} OUT</span> : null}
      </div>
      {(inputIds.length ? inputIds : ['in']).map((id, index, all) => <Handle key={`in-${id}`} id={id} type="target" position={Position.Left} style={{ top: `${((index + 1) / (all.length + 1)) * 100}%` }} />)}
      {(outputIds.length ? outputIds : ['out']).map((id, index, all) => <Handle key={`out-${id}`} id={id} type="source" position={Position.Right} style={{ top: `${((index + 1) / (all.length + 1)) * 100}%` }} />)}
    </div>
  );
}
