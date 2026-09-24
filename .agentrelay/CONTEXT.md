# AgentRelay 项目上下文

保持本文件精简。只记录无法从代码、Git 或现有项目文档中可靠恢复的长期决策、约束和事实。

## 项目边界

- 目的：
- 明确不做的范围：

## 生效约束

- 由 Agent 创建的提交必须包含 `Agent: <agent-id>` trailer；ID 用该工具的英文小写名（推荐：`codex`、`opencode`、`commandcode`、`dsh`、`claude-code`），它只是标签，不参与校验。人工提交不标记 Agent。
- `.agentrelay/` 必须提交进 Git，不得被 `.gitignore` 或本地排除规则忽略；否则下一位 Agent 看不到交接。
- 只在明确要交接、或使用者主动要求时更新 `.agentrelay/HANDOFF.md`，不要每次暂停都更新；它的更新必须单独提交（一笔提交只包含它，不与代码或其他文件混合）。工作树干净时，先提交功能性变更，再把该 commit SHA 填入 `Git 基线`。
- 首次安装时还没有功能性提交：以复制工具包时的 `HEAD` 作为 `Git 基线`，先把两个 `.agentrelay/` 文件与入口片段提交一次，再更新快照并按上一条提交交接。
- 接手时先校验交接：交接提交的父提交需等于 `Git 基线`，且该提交只改动 `.agentrelay/HANDOFF.md`；不一致即视为交接过期，以 Git 和代码为准重新推导。
- `更新时间（UTC+8）` 填写本次交接提交的真实提交时间（可用 `git log -1 --format=%ci` 取），不要凭记忆估算。
- 同一时刻只允许一个 Agent 修改当前工作树。
- 工作树只对受追踪文件保持干净；各 Agent 工具会各自留下本地元数据（`.omo/` 来自 opencode、`.commandcode/` 来自 CommandCode、`.codegraph/` 是代码索引库等），它们按机器与工具累积、无法预先枚举，加入 `.git/info/exclude` 即可，不要提交。

## 决策

### ADR-001: <简短决策标题>

- 状态：active | superseded | retired
- 决策人：user | <agent-id>
- 记录人：<agent-id>
- 日期（UTC+8）：YYYY-MM-DD
- 理由：<决策依据，以及被否决的备选方案（如相关）>
- 失效条件：<使该决策过期的具体条件>
