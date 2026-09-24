## AgentRelay

在开始实质性工作前，先读 `.agentrelay/CONTEXT.md` 与 `.agentrelay/HANDOFF.md`，然后用当前 Git 分支、HEAD、工作树和相关 diff 校验这份交接；若交接与 Git/代码不一致，以 Git 和代码为准。

只有明确要交接、或使用者主动要求时才更新 `.agentrelay/HANDOFF.md`。只有在出现长期有效、无法从代码推导的决策或约束时，才更新 `.agentrelay/CONTEXT.md`。你创建的每一笔提交都必须在 trailer 中包含 `Agent: <agent-id>`。

`HANDOFF.md` 的更新必须单独提交：一笔提交只包含它，不要和代码或其他文件混在一起，否则接手者无法校验交接。

`<agent-id>` 用该工具的英文小写名（推荐值：`codex`、`opencode`、`commandcode`、`dsh`、`claude-code`；其他工具直接用自身名字，例如 `cursor`）。它只是标签，不参与任何校验。

## otherRepo 参考仓库

`otherRepo/` 是本项目专用的本地参考资料目录，内容被 `.gitignore` 忽略，不属于本项目源码，也不应提交。需要在新电脑接手项目或排查兼容性问题时，先创建目录并下载以下仓库：

| 本地目录 | Git 仓库 | 用途 |
| --- | --- | --- |
| `otherRepo/deepseek-harness-0.1.7-rc.1` | `https://github.com/deepseek-ai/deepseek-harness.git` | DSH `0.1.7-rc.1` 宿主源码、插件管理器、热加载和服务生命周期参考 |
| `otherRepo/dsh-remote-development` | `https://github.com/CJYLZS/dsh-remote-development.git` | 原始 dsh-remote 实现参考 |
| `otherRepo/flymysql-dsh-remote` | `https://github.com/flymysql/dsh-remote.git` | 同类远程开发插件参考 |
| `otherRepo/UynajGI-dsh-ssh` | `https://github.com/UynajGI/dsh-ssh.git` | SSH / 远程执行插件参考 |
| `otherRepo/Yan-Zero-dsh-remote-ssh` | `https://github.com/Yan-Zero/dsh-remote-ssh.git` | SSH 远程工作区插件参考 |

建议使用以下命令补齐参考仓库；已存在的目录不要重复 clone：

```powershell
New-Item -ItemType Directory -Force otherRepo | Out-Null
$repos = @{
  'deepseek-harness-0.1.7-rc.1' = 'https://github.com/deepseek-ai/deepseek-harness.git'
  'dsh-remote-development' = 'https://github.com/CJYLZS/dsh-remote-development.git'
  'flymysql-dsh-remote' = 'https://github.com/flymysql/dsh-remote.git'
  'UynajGI-dsh-ssh' = 'https://github.com/UynajGI/dsh-ssh.git'
  'Yan-Zero-dsh-remote-ssh' = 'https://github.com/Yan-Zero/dsh-remote-ssh.git'
}
foreach ($entry in $repos.GetEnumerator()) {
  $dir = Join-Path 'otherRepo' $entry.Key
  if (-not (Test-Path (Join-Path $dir '.git'))) {
    git clone $entry.Value $dir
  }
}
```

其中 DSH 参考仓库应检出 `0.1.7-rc.1` 对应的提交或标签；其他仓库默认使用远程默认分支即可。
