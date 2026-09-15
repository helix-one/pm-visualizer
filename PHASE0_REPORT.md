# Phase 0 交付记录

日期：2026-09-12。范围严格限定为 `CODEX_HANDOFF.md` 的 Phase 0。只读取现有模板业务代码用于手工案例分析；未修改业务仓库、数据库或服务器。

## 1. 当前架构

`schemas/graph-workbench.schema.json` 约束 Graph JSON → `src/graph/validate.ts` 做基本结构及引用校验 → `src/graph/layout.ts` 用 ELK 计算位置 → `src/graph/toFlow.ts` 转为 React Flow 节点/边 → React 画布与常驻 Inspector 展示。节点坐标不回写 JSON。ELK 按需加载，以减轻初始 JS 包。

## 2. 已完成

原始 `examples/planning.json` 与 `examples/process.json` 均可切换渲染；真实模板案例拆为个人模板 `cases/template-json-replacement/process.json` 与官方更新 `cases/template-json-replacement/official-process.json`，共四份图。案例先列出“最终效果”，点击可聚焦结果节点，亦可查看全图；节点详情展示输入输出端口、产物和代码依据。仅只读，无图编辑或执行功能。

## 3. 测试与截图

`npm run test`：四份图通过 schema、节点 ID、边端点、端口引用与 ELK 布局检查，且无持久化坐标（规划 7/7；流程示例 5/4；个人模板 11/11；官方更新 9/8）；悬空边反例被语义检查识别。

`npm run build`：TypeScript 检查及 Vite 构建通过。浏览器截图见 `results/planning.png`、`results/process-example.png`、`results/personal-template-flow.png`、`results/official-template-flow.png`。`results/template-json-replacement.png` 是拆图之前的历史截图。未做自动化浏览器点击回归。

## 4. 问题与取舍

- 全图适配会缩小宽流程图的节点文字；因此案例默认聚焦一个最终效果，并提供结果跳转和“查看全图”。Phase 0 未做分组或语义折叠。
- 初次浏览器检查发现自动全图视角存在初始化时序差异；现用 ELK 结果边界计算初始视角。截图中的案例视角分别展示局部聚焦与全图，并非同一缩放状态。
- ELK 浏览器包约 1.44 MB（构建后 gzip 约 439 KB），已拆为按需加载 chunk。初始 JS 约 591 KB（gzip 约 186 KB）。此大小适合本地工作台原型，若面向线上大规模访问需后续测量。
- Phase 0 的节点/边校验只覆盖基础引用；尚无完整图语义规则或跨文档引用解析，这是按阶段留给 Phase 1 的边界。
- UI 保留参考原型的深色工作台、画布与详情层次，但图卡、状态和布局均由 Graph JSON 与 React Flow/ELK 驱动，不复用原型的硬编码坐标。

## 5. Schema 观察

现有 schema 足够描述 Phase 0，但有几个后续应明确的地方：`additionalProperties: true` 对字段笔误不敏感；edge 的 `sourcePort`/`targetPort`、图级 `entryNodeIds`/`frontier.nodeIds`、`childGraphId` 都缺少跨对象引用约束；`data_flow` 不要求端口或类型；`source.file`/`codeRef.file` 没有多仓库根目录/版本语义；节点 `certainty` 可为 `resolved`，边却没有该值，需决定是否刻意不对称。这些不是阻止 Phase 0 的问题，不在本阶段修改 schema。

## 6. 真实案例说明

两张案例图把“输入→模块→数据→用户看到什么”分开表达，详见 `cases/template-json-replacement/CASE_GUIDE.md`。个人请求 JSON 只指定文字/提示微调；后端在官方底稿上生成每个适用年份的**完整个人模板快照**和 PDF，按用户保存到主库；新训练按用户、考试与年份选个人版或官方版，把选中的模板固定在会话中。前端的 Q1/Q2、正文、提交与批改回看均由该模板/会话快照衔接，后续换版不改旧记录。个人微调保持槽位身份、顺序和数量不变，答题卡仍最多 24 槽。官方更新另需后端发布命令生成 PDF/catalog，再用前端同步命令更新公开资料。图中的 `codeRefs` 指向当前本地实现；图不代表已部署或发布。

## 7. 建议 Phase 1

先定义 Graph Kernel 的引用、端口类型兼容、状态/确定性组合与跨图链接规则，并给出可读错误信息；保留 Phase 0 的 JSON → 布局 → 画布管线。其次讨论多仓库 `codeRef` 的基准路径/版本和流程边缺端口时的语义。再考虑大图的聚焦、折叠或多层视图，但不要把画布坐标持久化。Wayfinder adapter、AI skill、repo analyzer 仍须等待单独确认。
