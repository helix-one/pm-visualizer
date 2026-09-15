# Graph Workbench

> **开发状态：早期原型（Phase 0），尚未开发完成，不应视为生产可用版本。**

Graph Workbench 是一个面向项目规划与软件理解的可视化工作台。它希望把难以快速读懂的项目进展、决策路径、模块关系、数据流转和最终效果，统一表达为可验证的 Graph JSON，再以交互式图谱呈现。

它可以独立使用，也计划与 Wayfinder 配合：Wayfinder 负责澄清方向与决策，Graph Workbench 负责读取或映射其状态并进行可视化；两者不会在内核层强耦合。

## 想解决的问题

- 快速看清项目当前做到哪里、哪些事项仍待确认，以及下一步是什么。
- 解释一个功能如何跨越前端、后端、数据库和生成物，并展示每一步的数据变化。
- 让流程图不仅是图片，而是有 schema、有来源、有输入输出、可以校验和继续加工的结构化数据。
- 为后续 AI 辅助分析、仓库解析和规划工具接入提供统一的图数据底座。

## 当前已经完成

Phase 0 已实现只读视觉骨架：

- Graph JSON 作为唯一持久化图模型，不保存画布坐标。
- 使用 React Flow 渲染交互画布，使用 ELK 在运行时自动布局。
- 支持规划图、流程图以及节点详情检查。
- 提供基础 schema 与引用校验。
- 提供“模板 JSON 更换”真实案例，分别展示个人模板与官方模板的更新流程。
- 包含构建验证、图数据测试和实际界面截图。

当前**尚未实现**完整 Graph Kernel、图编辑器、执行引擎、Wayfinder adapter、AI graph skill 和自动仓库分析。详细交付状态见 [PHASE0_REPORT.md](./PHASE0_REPORT.md)。

## 快速开始

环境要求：建议使用当前 Node.js LTS 与 npm。

```bash
npm install
npm run dev
```

打开终端显示的本地地址。左侧可以切换示例；也可以使用：

- `?graph=planning`：项目规划示例
- `?graph=process`：软件流程示例
- `?graph=template-release`：个人模板更新案例
- `?graph=official-template`：官方模板更新案例

验证项目：

```bash
npm run test
npm run build
```

## 架构概览

```text
Graph JSON
   ↓ schema / semantic validation
Graph adapter
   ↓
ELK automatic layout
   ↓
React Flow canvas + Inspector
```

正式实现遵循 `Graph JSON + React Flow + ELK`：语义数据与展示层分离，自动生成的坐标不会写回 Graph JSON。完整设计见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 目录

- `src/`：Phase 0 前端、画布组件及最薄图适配层。
- `schemas/`：Graph Workbench JSON Schema。
- `examples/`：规划图和流程图示例。
- `cases/`：来自真实项目的功能与数据流案例。
- `scripts/`：图数据验证脚本。
- `results/`：当前原型的实际渲染截图。
- `skills/`：尚处于实验阶段的图谱相关 AI 指令草案。
- `ARCHITECTURE.md`：整体系统设计和分阶段路线。
- `CODEX_HANDOFF.md`：Phase 0 的实现边界与验收要求。
- `UI_REFERENCE.md` / `REFERENCE_PROTOTYPE.html`：交互与视觉参考，不是正式实现源码。

## 后续计划

以下是方向性路线，具体范围会在每一阶段开始前重新确认：

1. 完善 Graph Kernel：引用关系、端口类型、状态与确定性、跨图链接及清晰的校验错误。
2. 完善规划视图：突出当前决策、阻塞、未知区域和项目进展。
3. 完善流程视图：更清楚地表达模块、数据、接口、数据库、产物与用户可见结果。
4. 增加 AI graph skill：让 AI 只生成或修改语义 Graph JSON，并经过校验后渲染。
5. 增加 Wayfinder adapter：读取 Wayfinder 状态并映射为规划图，而不改变其自身协议。
6. 增加仓库分析与体验优化：在来源可追溯的前提下生成软件结构/数据流程图，并改进大图浏览、聚焦和折叠。

## 重要约束

- 当前项目是开发中的实验版本，接口和 schema 仍可能调整。
- Graph JSON 是规范数据源；React Flow 状态和 ELK 坐标不是。
- 与 Wayfinder、仓库分析器等外部来源通过 adapter 接入，不绑定 Graph Kernel。
- `REFERENCE_PROTOTYPE.html` 只用于理解预期交互，不应被直接复制成硬编码正式实现。
