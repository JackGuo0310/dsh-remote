# @jackguo0310/dsh-remote

[English](README.md) | 中文

<img src="docs/img/preview_zh.png" alt="DeepSeek Harness Web GUI 中的 @jackguo0310/dsh-remote：远程工作区会话与右侧文档预览" width="100%">

<p align="center">
  <img src="docs/img/settings_zh.png" alt="远程开发设置：已保存的机器、认证方式与标记颜色" width="45%">
</p>

## 摘要

本插件为 DeepSeek Harness 提供轻量化远程开发：注册一台 SSH 机器，把远程目录选为会话工作区之后，agent 即可用与本地完全相同的工具（文件工具、shell、搜索）在该远程工作区上工作。路由本身不新增工具：它把文件系统、子进程、bash 三个 provider 替换为路由版本，将本地工具调用翻译为经 SSH 的远程执行。只有两个「路由无法表达」的意图给了显式通道——`fs_remove`（宿主没有面向模型的删除工具）与 `bash_local`（从远程工作区里在本机执行命令）。同时在 Web GUI 中贡献一个带环境检查的设置分区、一个工作区目录选择对话框，在安装了第三方 `dsh-better-sidebar` 时贡献一个「远程文件」标签页，并新增三个用于按需端口转发的小工具（隧道既不是文件操作也不是 shell 操作）。

<a id="核心特性"></a>
## 核心特性

- **同构工具集。** 远程工作区不增加任何工具调用：agent 的工具集与本地工作区完全一致，由插件在底层把调用翻译为远程执行。
- **远程零依赖。** 远程机器不需要任何额外的服务端，一条 SSH 连接即可使用。
- **Web GUI 集成。** 连接管理覆盖密码 / 私钥 / SSH agent、跳板机、主机密钥 TOFU 与连接测试；支持为不同远程工作区设置自定义颜色标记。
- **远程文件就在你常用的地方。** 装了 `dsh-better-sidebar` 时，通过它的公开 `registerTab` 接口多出一个「远程文件」标签页：经 SFTP 浏览会话的远程工作区，点开文件即可在标签页内查看——文本按侧边栏同款配色做语法高亮并带行号，可切换编辑后保存回远程，图片直接预览；文件与文件夹图标也沿用侧边栏自己的图标主题。另支持上传到远程目录、从远程目录下载。侧边栏自带的文件页读的是本机文件系统，所以这里是新增标签页而不是替换它。
- **按需端口转发。** 远程机器上的预览服务无需任何预先配置即可映射到 `127.0.0.1:<端口>`：用户要查看时由 agent 打开，设置页负责列出与关闭。监听只绑定回环地址，插件卸载即关闭。
- **环境检查。** 每个远程会话开始时会在后台异步探测一次机器（bash、rg、git、tar、家目录可写、架构、PATH 及其可写目录），设置页可手动重新检查。缺项给出可复制的安装命令：有 `sudo` 时给 apt 路线，否则给固定版本的静态 ripgrep（装到可写的 PATH 目录）。插件不会自动安装，也不会改动 PATH。
- **失败自带解释。** 远程搜索因缺少 `rg` 而失败时，调用方看到的错误里就带着机器名、安装命令和设置页入口——子进程通道与 `bash` 通道都如此，且不在错误路径里再发 SSH。
- **同一个侧边栏里用远程终端和远程 Git。** 「新建终端」在远程机器上开 shell（SSH pty）；「远程 Git」标签页通过侧边栏公开的 `registerTab` 注册，经 SSH 查看并操作远程仓库的变更——侧边栏自带的 Git 面板在宿主上跑 `git`，远程工作区用不了它。

## 目录

- [核心特性](#核心特性)
- [安装](#安装)
- [兼容性](#兼容性)
- [使用](#使用)
- [理解设计](#理解设计)
- [配置](#配置)
- [已知限制与延期工作](#已知限制与延期工作)
- [开发说明](#开发说明)
  - [第三方代码](#第三方代码)
  - [许可证与致谢](#许可证与致谢)

-----

<a id="安装"></a>
## 安装

先确认宿主的 dsh 版本：

```sh
dsh -V
```

再按[兼容性](#兼容性)选插件版本。

| 你的 dsh | 插件版本 | 安装命令 |
| --- | --- | --- |
| ≥ 0.2.2-rc.1, < 0.3.0 | v0.4.x | `dsh plugin add --profile web @jackguo0310/dsh-remote` |
| ≥ 0.1.7-rc.1, < 0.3.0 | v0.3.x | `dsh plugin add --profile web @jackguo0310/dsh-remote@0.3.13` |
| ≥ 0.1.7-rc.1, < 0.2.0 | v0.2.x | `dsh plugin add --profile web @jackguo0310/dsh-remote@0.3.0` |
| 0.1.2-rc.1 – 0.1.5-rc.x | v0.1.x | `dsh plugin add --profile web github:jackguo0310/dsh-remote#v0.1.0` |

npm 安装取的是 `latest` dist-tag，会跟随新版本发布。需要锁定具体版本时：

```sh
dsh plugin add --profile web @jackguo0310/dsh-remote@0.3.0
```

npm 会在安装时就解析并校验插件的 peer 依赖，因此 dsh 版本不受支持会**当场报错并列出不满足的包**，而不是等到加载时才失败。

v0.1.x 早于 npm 发版，只以 Git tag 形式提供。**该版本一律带 `#<tag>` 安装**：不带 ref 的 `github:` 安装取默认分支 HEAD，会随仓库漂移，而插件与宿主必须同代才能运行。

`lib/` 构建产物同时随 npm tarball 和每个 Git tag 发布，所以两种方式都无需构建，也不会触发 pnpm 对 `prepare` 脚本的 `allowBuilds` 拦截。

换版本：用新的 spec 重新 add 即覆盖；彻底移除则 `dsh plugin remove --profile web @jackguo0310/dsh-remote`。

开发模式则链接本地检出：

```sh
cd dsh-remote
pnpm install          # 自包含 workspace；store 位于 .pnpm-store/
pnpm run build        # 产出 lib/index.js（宿主半）与 lib/client.js（浏览器半）
dsh plugin add --profile web link:/absolute/path/to/dsh-remote
```

`link:` 安装把 profile 指向检出目录，之后每次 `pnpm run build` 重启 harness 即生效，无需重新 add。

<a id="兼容性"></a>
## 兼容性

dsh 在 0.1.7-alpha.1 对 shell seam 做了两处破坏性改动，都没有保留兼容层：执行入口收敛为 `resolve()` + `execute()`（`run()`/`start()` 被删除），本地执行器的 Config 改为活配置访问器（`Volatile`，并新增 `pwshPath`）。因此插件与宿主按代对应：

- **v0.4.x → dsh ≥ 0.2.2-rc.1, < 0.3.0**，`@deepseek-ai/dsh` 声明为 `peerDependencies: >=0.1.7-rc.1 <0.3.0`，各 `dsh-*` 包为 `>=0.1.7-alpha.1 <0.3.0`。v0.4.0 的构建对齐到 0.2.2-rc.3 宿主 API，因为 `fs_remove` 依赖该版本才有的 `ctx.fs.deleteFile`；其余能力仍声明旧下限，旧宿主除该工具外照常可用。
- **v0.3.x → dsh ≥ 0.1.7-rc.1, < 0.3.0**。v0.3.0 的构建对齐 0.2.1-alpha.1 宿主 API（当时唯一的硬变化是 peer 上界）。
- **v0.2.x → dsh ≥ 0.1.7-rc.1, < 0.2.0**。
- **v0.1.x → dsh 0.1.2-rc.1 – 0.1.5-rc.x**（`run()`/`start()` seam）。

宿主在加载插件前会校验每个 `@deepseek-ai/dsh*` peer，范围不满足即拒绝，并列出不满足的包名。`@deepseek-ai/cordis` 不在宿主校验的包之列。

npm 安装会在插件加载前就拒绝版本不匹配的组合，并列出不满足的包。`github:` 与 `link:` 安装没有这道检查，其他典型表现：插件比宿主旧时，启动即抛 `TypeError: Cannot read properties of undefined (reading 'get')`（构造本地执行器时读 `config.pwshPath`）；插件比宿主新时，启动在本地执行器构造处校验失败（`pwsh-local: timeoutMs must be a positive finite number`），命令执行时抛 `ctx.shell.run is not a function`。

宿主发布新一代 alpha 时，peer 范围需要相应更新（semver 的 prerelease 规则不会自动放行新的 alpha）。

<a id="使用"></a>
## 使用

三步就能开工，其余按需启用：

1. **添加机器。** 在 Web GUI 的 **@jackguo0310/dsh-remote** 设置分区填入 host、port、用户名，选择密码 / 私钥 / SSH agent 认证（可选跳板机），先点**测试连接**再保存。已保存的机器可在它自己的卡片上重新测试。
2. **选择远程目录。** 在工作区目录流（hero 的「选择目录」对话框或侧边栏工作区选择器）打开**远程**页签，浏览机器目录，把某个远程目录设为会话工作区。
3. **照常工作。** 到此为止。文件工具、shell、bash、搜索仍以同样的调用方式执行，只是落在远程机器上；模型的工作目录就是远程路径，不需要任何额外说明。仅有的两个显式通道是 `fs_remove`（删除文件）与 `bash_local`（在 DSH 所在机器上执行命令）——这两个意图光靠路由无法表达。所选目录之外的路径保持本地行为，既有会话不受影响。
4. **浏览、打开、上传（可选）。** 装了 `dsh-better-sidebar` 时，打开侧边栏的**远程文件**标签页：列出会话的远程目录，把选中的文件上传进去。点一个文件会在同一标签页里打开——文本可直接编辑并保存回远程，图片直接预览，二进制或过大的文件则提供下载。两个方向都在「远程机器」与「你正在看的浏览器」之间搬运字节。
5. **预览远程服务（可选）。** 让 agent 为远程进程打印的端口打开一个转发，或在设置分区手动打开；返回的 `127.0.0.1:<端口>` 地址即可在运行 DSH 那台电脑的浏览器里访问该远程端口。

其底层机制：设置远程工作区会在 `$DSH_HOME/remote-workspaces/<host>-<user>-<port>/<basename>` 下创建一个**锚点**——一个真实本地目录，元数据记录远程坐标。不存在「当前机器」或默认目标，锚点独自决定其会话工具的执行位置。若该机器随后被删除，工作区上的操作会以明确的「机器已失配（no longer configured）」错误失败，而不是悄悄换到别的机器执行——重新添加机器即可恢复，或删除该工作区目录。

-----

<a id="理解设计"></a>
## 理解设计

三个路由 provider 替换同一服务的基座行，所有本地工具继续可用，只有传输层改变：

- `RoutingFileSystem`（替换沙箱文件系统）——路径解析到远程根的读、写、编辑、删除、列目录经 SFTP 完成；其余调用经 `super()` 委托本地基座。删除遵循宿主的删除契约：带版本守卫，目标缺失或已变化返回 `FS_STALE_VERSION`，非普通文件返回 `FS_NOT_REGULAR_FILE`。
- `RoutingSubprocessRuntime`（替换本地子进程运行时）——以锚点为 cwd 的 spawn 在远程主机上经 SSH exec 通道执行；搜索工具使用的打包 ripgrep 会被改写为远程 `rg` 二进制。路由只看工作目录，所有宿主平台行为一致。
- `RoutingBashExecutor` / `RoutingPwshExecutor`（替换沙箱 bash/pwsh 执行器）——工作目录在锚点下的命令经远程 `bash -c` 执行；后台进程通过进程组 kill 协议拿到真实远程 PID。宿主平台决定挂载哪个执行器——只有**本地回退**与平台相关（POSIX 用本地 bash，Windows 用本地 pwsh）；远程方言始终由远程主机的 POSIX shell 决定。
- **按 agent 的工具可见性。** patch 同时挂载两套 shell 工具栈，并按会话安装作用域限制，隐藏该会话工作区不应使用的方言：远程会话只见 `bash` 工具（不见 `pwsh`），Windows 本机会话只见 `pwsh`（不见插件补入的 `bash`）。POSIX 本机会话两个世界都用 `bash`，与基础组合一致。
- **每机器一条共享 SFTP 会话。** SFTP 协议在单一子系统通道上多路复用所有请求，全部文件操作共享一条会话，而不是每次调用开一条（并泄漏）通道——服务器对单连接的会话数有上限，耗尽后所有打开请求都以通道失败告终。
- **远程工作区在文件树中有标记。** client 会为远程工作区重新着色文件夹图标：host 将每个锚点与其机器的标记颜色（`Machine` 字段，可在设置中编辑）联接，client 把这份清单转成文件树 `data-files-*` 钩子上的属性选择器并以样式表注入。每台机器一个颜色；留空则回退到主题强调色。侧边栏的工作区行没有数据钩子，其规则经行内 `aria-label`（`:has()`）命中，匹配锚点工作区采用目录基名得到的标题。两台机器挂载同一个远程目录时会得到同样的标题，同一条行规则就会把两行都涂成最后一台机器的颜色；因此 host 会为这类锚点定出一个唯一标题（追加机器名，如 `myapp (build-box)`；两台机器同名时退回到远程路径哈希），client 再把工作区改名为该标题。操作者自己改过的标题不会被覆盖；若标题仍然歧义，则该行规则完全不生成，这些行保持主题默认色而不是错色。
- **远程工作区显示远程路径。** shell 展示工作区目录的位置——文件树的根头部与工作区列表的 hover 卡片——显示的是会话工作目录，而远程工作区的会话工作目录是插件的本地锚点目录。client 维护一张别名表（锚点目录 → 远程路径，与标记颜色共用同一份 `/status` 联接），经 mutation observer 把这些展示文本改写为远程路径，只修改既有文本节点的值，React 的协调器因此保留它拥有的每个元素。底层的 `data-files-*` 坐标保持本地：文件树仍按它们导航。

**模型看不到锚点句柄。** harness 的系统提示会报告会话工作目录；远程会话下插件按 agent 覆盖该变量为远程路径，模型可见的 `cwd` 即命令真正运行的目录。作为兜底，命令文本中的锚点目录写法（绝对路径、`~`、`$HOME`、`${HOME}`）会在执行前改写为远程路径——仅限同机锚点，stdin 保持原样。本地会话不受影响。

**仅有的两个例外是显式通道。** 宿主没有面向模型的删除工具，所以 `fs_remove` 调用的是宿主自己的 `ctx.fs.deleteFile`：路由文件系统把远端目标交给 SFTP，本机目标仍交给继承的沙箱。工作区在远程的会话没法操作 DSH 所在的机器，所以 `bash_local` 先解析出本机工作目录，再经 `ctx.shell` 以会话的模式执行，并把 workspaceRoot 重新指向该目录——不重指的话，`workspace-write` 会拿本机路径去和远程工作区比较，拒绝所有本机写入。

**按需转发是独立服务，不是路由 provider。** `ForwardManager` 为每个打开的隧道在 `127.0.0.1` 上持有一个 `net.Server`，每个被接受的连接经该机器的共享连接桥接到 ssh2 的 `direct-tcpip` 通道（`SshPool.forward`）。它不做持久化：记录从 `open()` 存在到 `close()`、插件卸载或 harness 退出，设置页与三个 `remote_forward_*` 工具读的是同一份注册表。监听器从不绑定公网接口。

**远程文件标签页走侧边栏的公开接缝。** `ctx.betterSidebar.registerTab()` 位于一个可选的 cordis 注入中，因此该包不是本插件的依赖：没装 `dsh-better-sidebar` 时服务不存在，注入根本不运行，其余行为不变。标签页本身只知道会话 id——机器归属与目录列表都来自本插件自己的路由，所以上传下载走 SSH，而不是宿主文件系统。

远程变更策略与本地沙箱一致：read-only 模式拒绝远程写入；workspace-write 仅允许写远程工作区根与远程 `/tmp`。远程写入按文件串行化、原子发布（临时文件 + rename），并对过期版本与歧义编辑返回与本地文件系统相同的错误码。

主机密钥采用 TOFU（默认 `accept-new`）：首次见到的密钥被记录，变更的密钥以中间人原因拒绝；每台机器可选 `verify`/`off` 模式。

-----

<a id="配置"></a>
## 配置

机器在设置分区中管理；插件自身通过 cordis.yml 接受配置默认值（均可选）：

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `commandTimeoutMs` | 20000 | 单命令超时；SIGTERM 宽限后关闭通道。 |
| `connectTimeoutMs` | 15000 | SSH 连接建立超时。 |
| `maxOutputChars` | 200000 | 超出后命令输出保留头尾。 |
| `maxFileBytes` | 52428800 | SFTP 单次读写的最大文件体积。 |
| `hostKeyMode` | `accept-new` | `accept-new`、`verify` 或 `off`。 |
| `remoteRipgrep` | `rg` | 打包 ripgrep 改写到的远程二进制。 |
| `localPicker` | `browse` | 「本机」页签默认交互：`browse`（网页内浏览，任何客户端可用）或 `native`（系统选择器，仅适合作者坐在宿主屏幕前）。设置页的选择优先于该默认值。 |
| `anchorRoot` | `$DSH_HOME/remote-workspaces` | 锚点目录的根目录。 |
| `maxForwards` | 8 | 同时打开的按需端口转发上限。 |
| `auditLog` | **开启** | 每次远程执行的追加式审计，每行 `时间戳 \| 用户@主机:端口 \| 命令 \| 退出码`。 |

-----

<a id="已知限制与延期工作"></a>
## 已知限制与延期工作

- **Windows 远程机延期支持。** 远程机器必须运行 POSIX shell；`uname` 探测会以明确错误拒绝 Windows 目标。适配预留到后续阶段。
- **Windows 本机支持远程 shell 路由。** Windows 宿主挂载基于 pwsh 的路由执行器：本地工作目录保持沙箱 pwsh 执行器，锚点工作目录跨到远程主机的 bash。模型在远程会话看到 `bash` 工具，本地会话看到 `pwsh` 工具。
- **远程终端开在远程机器上，但受底层限制。** cwd 落在锚点下的终端会在远程机器上经 SSH pty 开一个交互式 POSIX shell（侧边栏的「新建终端」与宿主的终端入口都走这条路径）：命令、resize、Ctrl-C、进程组终止都可用，并且会先加载机器自己的登录配置，所以别名（`ls` 配色）、PATH 增项与 shell 选项都和机器上一致。可见提示符是 `user@host:path`；宿主终端驱动只认自己的 `dsh>` 提示文本，所以那个 token 仍会输出，但被隐藏并把光标退回去，输入位置紧跟在路径后面。SSH 拿不到前台进程组信息，因此活动状态按契约返回 `unknown`，SIGINT/SIGTSTP 回退到 pty 自身的控制键；除插件注入的标记外没有 shell 集成的提示符探测。持久 shell 工具仍仅限本地。
- **内置 Git 面板仍然看本机。** 它在宿主上用 `child_process.spawn('git')` 直接跑 git（只给 WSL 做了特例），插件无法在不改侧边栏的前提下拦截；远程仓库请用插件另开的「远程 Git」标签页（状态、diff、暂存/取消暂存、提交都经 SSH）。
- **远程会话不支持 `@` 文件引用。** 远程会话中输入 `@` 会给出单条明确的"暂不支持"候选，而不是静默失败；引用源接口已预留到后续阶段。
- **没有镜像或同步层。** 锚点目录只保存元数据，不保存文件副本；每次读写都经 SSH，受 `maxFileBytes` 限制。上传按 SFTP 流式写入临时文件后再改名发布；没有整项目同步、没有冲突处理，也没有远程目录的本地副本。
- **远程文件标签页依赖 `dsh-better-sidebar`。** 它通过该插件的公开 `registerTab` 服务注册，因此没装就没有这个标签页（设置分区仍然可用）。本插件从不修改侧边栏源码或 DOM。
- **转发只绑定回环，且只在 DSH 所在电脑可用。** 预览地址适用于运行 DSH 的那台机器；从另一台电脑访问需要你自己的隧道——本插件刻意不把远程服务发布到网络。
- **转发不会自动恢复。** 关闭后、插件卸载后或 harness 重启后，agent 打开的转发即消失；需要时重新打开，而不是期待一条长期隧道。
- **上传没有断点续传。** 一个 HTTP POST 流式写一个文件到 SFTP；连接中断只中止该文件（正式文件名不会留下半截内容），没有续传或多文件分片。 
- **文件树标记依赖 in-box 的 `data-files-*` 钩子。** 着色目标是文件树的数据属性，它们不是声明过的公开契约；dsh 若重命名这些属性，着色会静默消失（纯展示层，不影响其他功能）。工作区行的标记还依赖工作区标题匹配：重命名工作区、或 dsh 更改侧边栏 `aria-label` 文案，会让行标记失效（文件树标记不受影响）。
- **路径别名依赖展示结构。** 远程路径改写针对树根头部的 span 形状与 hover 卡片的 portal 形状，两者都未声明；dsh 若更改任一形状，本地锚点路径会静默恢复显示（纯展示层——导航、寻址与复制操作不受影响，仍使用真实的本地目录）。
- **SSH 走纯 JS 而非原生加密。** 打包的 `ssh2` 不会加载可选原生加速件，大文件 SFTP 传输的吞吐低于原生构建版本。
- **搜索依赖远程 ripgrep。** 远程机器上必须存在 `rg` 二进制（可用 `remoteRipgrep` 配置）；否则搜索工具在远程路径上失败。失败不再是黑盒：错误里会写明机器名与安装 ripgrep 的命令，设置页的环境检查也会列出同样的路线。本轮只提示——不自动安装、不注入 PATH、不做 chmod 或经 SFTP 落盘。
- **内建目录选择流是被覆盖而非替换。** 两个目录流注册以不同优先级共存（本插件使用 -1，最低者优先渲染）；卸载本插件后槽位交还给内建选择器。
- **「本机」页签默认使用网页内浏览，由设置页决定。** 宿主判定 `native` 的依据是绑定回环地址 + 非 SSH 启动——经隧道从另一台电脑访问时这两条同样成立，但系统选择器会开在**DSH 宿主那台电脑的屏幕**上，远程操作者根本看不到，请求一直挂到隧道超时。更关键的是宿主的 `directoryPicker` 接缝按实际挂载的 capability 闸门：只要它挂着 `native`，`list`/`createDirectory` 就直接以 `directory-picker/unavailable` 拒绝。所以本机页签的浏览与新建文件夹由**插件自己的 HTTP 路由**（`/local/ls`、`/local/dir`、`/local/mkdir`）直接读宿主文件系统实现，完全不经过该接缝。设置页「本机文件夹选择方式」可显式切到「打开系统选择器」；即使选了系统选择器，实际调用失败时也会降级回网页内浏览，而不是弹出错误。
- **删除机器后其工作区被有意搁置。** 锚点在机器删除后仍然存在，所有工具面对它都会以同样的「机器已失配」错误拒绝（fs、bash、subprocess，提示词的 `cwd` 变量回退为本地句柄），而不是换一台机器或在本机执行。

-----

<a id="开发说明"></a>
## 开发说明

插件目录是自包含的 pnpm workspace（`packages: [- .]`、`storeDir: .pnpm-store`），阻断 pnpm 向上探测 harness 仓库的 workspace。dsh 框架包声明为 `peerDependencies`（各 `dsh-*` 包为 `>=0.1.7-alpha.1 <0.3.0`，`@deepseek-ai/dsh` 为 `>=0.1.7-rc.1 <0.3.0`，均由宿主 profile 提供），并在 `devDependencies` 中精确锁同版本用于本地类型与构建；依赖图内不存在相对 `link:` 依赖，因此该目录可在任意位置独立构建。

0.2.x 各包声明的 peer 必须全部出现在 `devDependencies` 里，而不只是本源码直接 import 的那些。0.2.x 把 `dsh-bash-local`、`dsh-util-values`、`dsh-scope` 等声明为钉同版本的 peer，漏掉时 pnpm 会解析到旧副本，TypeScript 看不到基类，报错便表现为 API 破坏（`SandboxBashExecutor.Config` 报不存在、`FsError` 报缺 `name`/`message`）而非缺 peer。

命令：`pnpm run build`（tsdown，双半）、`pnpm run typecheck`、`pnpm run test`（node:test 经 tsx；无需 SSH 服务器——连接池接受注入的 client 工厂，SFTP 表面使用假件）。

`ssh2` 位于 `devDependencies`，因为它是构建输入而非运行时依赖：`pnpm run build` 会把它打进 `lib/index.js`。任何源码改动都要连同重新构建的 `lib/` 一起提交，否则 GitHub 安装拿到的是旧代码。

<a id="第三方代码"></a>
### 第三方代码

`lib/index.js` 内含 `ssh2`（MIT）、`asn1`（MIT）、`safer-buffer`（MIT）、`tweetnacl`（Unlicense）、`bcrypt-pbkdf`（BSD-3-Clause）的打包副本，许可证全文见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

打包把安全更新的责任移到了本仓库：`ssh2` 的安全公告不再经用户自己的 `pnpm update` 到达他们。修补方式是 `pnpm update ssh2 && pnpm run build`，然后把结果提交到这里。

<a id="许可证与致谢"></a>
### 许可证与致谢

MIT，见 [LICENSE](LICENSE)。

Copyright (c) 2026 CJYLZS，本插件原作者。Copyright (c) 2026 JackGuo0310 为分支维护及其后的改动。npm 包 `@jackguo0310/dsh-remote` 是原 `dsh-remote-development` 项目的分支；原作及其作者仍适用同样的 MIT 条款。

本分支的改动见仓库历史，每笔提交都标注了产出它的工具。
