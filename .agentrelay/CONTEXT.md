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

### ADR-001: peerDependencies 上界封顶 0.2.0

- 状态：active
- 决策人：user
- 记录人：dsh
- 日期（UTC+8）：2026-09-27
- 理由：`@deepseek-ai/dsh` 与各 `dsh-*` 的 peer 固定为 `>=0.1.7-rc.1 <0.2.0`（低版本 `>=0.1.7-alpha.1 <0.2.0`）。0.x 阶段每次 minor 都可能是破坏性变更，上界是在如实声明「只对 0.1.x 负责」，不是保守。放宽到 `<1.0.0` 会让插件在未验证的 0.2.0 上谎报兼容；DSH 每次发 rc 都动 pre-stable API，0.2.0 大概率有破坏性变更，而宿主的 `pluginCompatibilityWarning` 明写「Running it may cause crashes or data loss」。边界应随发布新版本抬高，而不是提前放宽。rc.1 到 0.2.0-rc.1 全部兼容（按 `plugin-compatibility.ts` 的 `includePrerelease: true` 实算验证），rc.3 照常安装。
- 附带事实：`@deepseek-ai/cordis` **不参与**宿主的 peer 校验——`evaluatePluginCompatibility` 只遍历 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 前缀。peer 里 cordis 那行只是文档，因此它写 `^4.0.2` 而 rc.2 各包声明 `~4.0.4` 的不一致不会导致安装失败。不要因此去「修正」它。
- 失效条件：DSH 发布 0.2.0 时，抬高上界（如 `<0.3.0`）并发布插件新版本；抬高前需在 rc.2 参考源码上验证兼容性。

### ADR-002: DSH 包统一锁 0.1.7-rc.2

- 状态：active
- 决策人：dsh
- 记录人：dsh
- 日期（UTC+8）：2026-09-27
- 理由：devDependencies 精确锁 `0.1.7-rc.2`（peerDependencies 保持范围）。rc.2 的包把 `dsh-bash-local`、`dsh-util-values`、`dsh-scope` 等声明为 peer 且精确钉 `0.1.7-rc.2`；漏列这些 peer 时 pnpm 会装到旧版，TypeScript 解析不到基类，症状伪装成 API 破坏（`SandboxBashExecutor.Config` 报不存在、`FsError` 报缺 `name`/`message`）。补齐 peer 是修好 typecheck 的关键一步。
- 失效条件：升级 DSH 宿主版本时，同步更新 devDependencies 全部 `dsh-*`、补齐新增 peer，并重跑 `pnpm install` + `pnpm run typecheck`。
