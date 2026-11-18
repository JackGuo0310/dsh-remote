window.__ModuleLoader__.load({
	id: "@jackguo0310/dsh-remote",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp$1 = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		var __exportAll$1 = (all, no_symbols) => {
			let target = {};
			for (var name in all) __defProp$1(target, name, {
				get: all[name],
				enumerable: true
			});
			if (!no_symbols) __defProp$1(target, Symbol.toStringTag, { value: "Module" });
			return target;
		};
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp$1(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp$1(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region src/client/api.ts
		const PREFIX = "/dsh-remote-development";
		async function call(method, path, body) {
			const opts = {
				method,
				headers: {}
			};
			if (body !== void 0) {
				opts.headers = { "Content-Type": "application/json" };
				opts.body = JSON.stringify(body);
			}
			const res = await fetch(PREFIX + path, opts);
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.ok === false) throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
			return data;
		}
		/**
		* A probe whose `ok:false` is a result, not a transport failure: the host
		* answers a failed connection with HTTP 200 and the reason in `error`, so the
		* settings page can show "why" instead of a generic request error. Only a
		* transport fault — a dead server, an aborted fetch — has no answer to return,
		* so it resolves as a failed probe carrying that fault's message.
		*/
		async function probe(path, body) {
			const opts = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			};
			let res;
			try {
				res = await fetch(PREFIX + path, opts);
			} catch (err) {
				return {
					ok: false,
					error: err.message
				};
			}
			const data = await res.json().catch(() => ({}));
			if (!res.ok) return {
				ok: false,
				error: typeof data.error === "string" ? data.error : `HTTP ${res.status}`
			};
			return {
				ok: data.ok !== false,
				...typeof data.error === "string" ? { error: data.error } : {},
				...typeof data.platform === "string" ? { platform: data.platform } : {}
			};
		}
		/** List saved machines. */
		function listMachines() {
			return call("GET", "/machines");
		}
		/** Add or update one machine. */
		function saveMachine(machine) {
			return call("POST", "/machines", machine);
		}
		/** Delete one machine by id. */
		function deleteMachine(id) {
			return call("POST", "/machines/delete", { id });
		}
		/**
		* Test one machine's connection. Either a saved `machineId` or the unsaved
		* draft fields. A refusal resolves with `ok:false` and a reason, so the caller
		* reports the host's own message; only a transport fault surfaces as a throw.
		*/
		function testConnection(machine) {
			return probe("/test", machine);
		}
		/** Rename one remote entry inside its directory (never replaces an existing name). */
		function renameRemoteEntry(machineId, path, name) {
			return call("POST", "/files/rename", {
				machineId,
				path,
				name
			});
		}
		/** Delete one remote entry; a directory is removed with everything inside it. */
		function deleteRemoteEntry(machineId, path) {
			return call("POST", "/files/delete", {
				machineId,
				path
			});
		}
		/** List one remote directory level. */
		function listRemoteDir(machineId, path) {
			return call("POST", "/ls", {
				machineId,
				path
			});
		}
		/** Create one child directory on the remote. */
		function createRemoteDir(machineId, path, name) {
			return call("POST", "/mkdir", {
				machineId,
				path,
				name
			});
		}
		/** Create (or reuse) the anchor workspace for a remote path. */
		function createAnchor(machineId, path) {
			return call("POST", "/anchor", {
				machineId,
				path
			});
		}
		/**
		* Whether one session's workspace is remote (and its remote root). `pending`
		* means the host has not loaded that session yet — the tab must retry rather
		* than settle on "not a remote workspace".
		*/
		function sessionRemote(sessionId) {
			return call("GET", `/session-remote?sessionId=${encodeURIComponent(sessionId)}`);
		}
		/** List one remote directory level with its files and subdirectories. */
		function listRemoteFiles(machineId, path) {
			return call("POST", "/files/ls", {
				machineId,
				path
			});
		}
		/**
		* The URL a browser downloads one remote file from. A plain same-origin GET,
		* so it can sit in an anchor and use the browser's own download handling
		* (including its save-location prompt).
		* @param machineId - saved machine.
		* @param path - absolute remote file path.
		* @returns the download URL.
		*/
		function remoteDownloadUrl(machineId, path) {
			return `${PREFIX}/files/download?machineId=${encodeURIComponent(machineId)}&path=${encodeURIComponent(path)}`;
		}
		/**
		* Upload one browser-side file into a remote directory. The body is the raw
		* file (never multipart), so a large upload streams to SFTP instead of being
		* buffered or parsed twice.
		* @param machineId - saved machine.
		* @param dir - absolute remote directory.
		* @param file - the picked file.
		* @returns the published remote path.
		*/
		async function uploadRemoteFile(machineId, dir, file) {
			const query = new URLSearchParams({
				machineId,
				dir,
				name: file.name
			});
			const res = await fetch(`${PREFIX}/files/upload?${query.toString()}`, {
				method: "POST",
				body: file
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
			if (data.ok === false) throw new Error(typeof data.error === "string" ? data.error : "upload failed");
			return {
				ok: true,
				...typeof data.path === "string" ? { path: data.path } : {}
			};
		}
		/** Read one remote text file for the in-tab viewer. */
		function readRemoteFile(machineId, path) {
			return call("POST", "/files/read", {
				machineId,
				path
			});
		}
		/** Save one remote text file (atomic publish on the host). */
		function writeRemoteFile(machineId, path, text) {
			return call("POST", "/files/write", {
				machineId,
				path,
				text
			});
		}
		/** List the forwards this harness currently holds open. */
		function listForwards() {
			return call("GET", "/forwards");
		}
		/**
		* Open one temporary forward to a service on a remote machine.
		* @param input - machine, remote port/host, optional loopback port.
		* @returns the opened forward's record.
		*/
		function openForward(input) {
			return call("POST", "/forwards", input);
		}
		/** Close one forward by id. */
		function closeForward(id) {
			return call("POST", "/forwards/close", { id });
		}
		/**
		* Measure one machine's remote prerequisites. `refresh` is the page's check
		* button; without it the host serves the cached verdict, which is what an
		* already-failed remote search reads.
		* @param machineId - the saved machine.
		* @param refresh - re-probe instead of using the cache.
		* @returns the verdict, or the transport failure.
		*/
		async function checkEnvironment(machineId, refresh = true) {
			let res;
			try {
				res = await fetch(`${PREFIX}/env`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						machineId,
						refresh
					})
				});
			} catch (err) {
				return {
					ok: false,
					error: err.message
				};
			}
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.ok !== true) return {
				ok: false,
				error: typeof data.error === "string" ? data.error : `HTTP ${res.status}`
			};
			return {
				ok: true,
				...data.environment === void 0 ? {} : { environment: data.environment },
				...Array.isArray(data.problems) ? { problems: data.problems } : {}
			};
		}
		/** Read the remote repository's commit history, newest first. */
		function gitLog(machineId, path, limit, all) {
			return gitPost("/git/log", {
				machineId,
				path,
				...limit === void 0 ? {} : { limit },
				...all === void 0 ? {} : { all }
			});
		}
		/** Read one commit's metadata and patch. */
		function gitShow(machineId, path, commit) {
			return gitPost("/git/show", {
				machineId,
				path,
				commit
			});
		}
		/**
		* POST one git request. Unlike {@link call}, a refusal (`ok:false`) is a
		* result the panel renders — a repository that rejects `add` or `commit`
		* explains itself — so it is returned rather than thrown.
		*/
		async function gitPost(path, body) {
			let res;
			try {
				res = await fetch(PREFIX + path, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body)
				});
			} catch (err) {
				return {
					ok: false,
					error: err.message
				};
			}
			const data = await res.json().catch(() => ({}));
			if (!res.ok) return {
				ok: false,
				error: typeof data.error === "string" ? data.error : `HTTP ${res.status}`
			};
			return data;
		}
		/**
		* Read the workspace's repository status.
		* @param machineId - serving machine.
		* @param path - the session's remote workspace root.
		*/
		function gitStatus(machineId, path) {
			return gitPost("/git/status", {
				machineId,
				path
			});
		}
		/**
		* Read one changed file's diff.
		* @param machineId - serving machine.
		* @param path - the session's remote workspace root.
		* @param file - repository-relative path.
		* @param staged - compare the index against HEAD.
		* @param untracked - the file is not in the index at all.
		*/
		function gitDiff(machineId, path, file, staged, untracked) {
			return gitPost("/git/diff", {
				machineId,
				path,
				file,
				staged,
				untracked
			});
		}
		/** Stage selected repository-relative paths. */
		function gitStage(machineId, path, files) {
			return gitPost("/git/stage", {
				machineId,
				path,
				files
			});
		}
		/** Unstage selected repository-relative paths. */
		function gitUnstage(machineId, path, files) {
			return gitPost("/git/unstage", {
				machineId,
				path,
				files
			});
		}
		/** Commit the staged changes with one message. */
		function gitCommit(machineId, path, message) {
			return gitPost("/git/commit", {
				machineId,
				path,
				message
			});
		}
		/** List every remote workspace anchor with its machine's marker color. */
		function anchorStatus() {
			return call("GET", "/status");
		}
		/** Read the composed directory-picker capability from the host. */
		function pickerCapability() {
			return call("GET", "/picker");
		}
		/** Read the saved settings-page preferences. */
		function getPreferences() {
			return call("GET", "/preferences");
		}
		/** Store the 本机 directory-picker interaction. */
		function setPreferences(localPicker) {
			return call("POST", "/preferences", { localPicker });
		}
		/**
		* List one 本机 directory level. The plugin answers from the host filesystem
		* rather than through the host picker seam, which refuses browse verbs while
		* the mounted backend is native.
		* @param path - absolute directory; absent lists the home directory.
		* @returns the level's listing, or the refusal reason.
		*/
		async function listLocalDir(path) {
			if (path === void 0) return await call("GET", "/local/ls");
			return await call("POST", "/local/dir", { path });
		}
		/**
		* Create one child directory under an existing 本机 parent.
		* @param path - absolute existing parent directory.
		* @param name - single non-blank path segment.
		* @returns the created path, or the refusal reason.
		*/
		function createLocalDir(path, name) {
			return call("POST", "/local/mkdir", {
				path,
				name
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Locale dictionaries (zh + en) for the plugin's browser copy. The namespace
		* sits outside the host's merge table; registration uses the untyped form.
		* @module dsh-remote-development/client/locales
		*/
		const NS = "dsh-remote-development";
		const DICTIONARIES = [["zh", {
			"settings.title": "远程开发",
			"settings.intro": "通过 SSH 连接远程机器，把远程目录作为工作区。Agent 使用与本地完全相同的工具，由插件在后台翻译为远程执行。",
			"settings.version": "当前版本 v{version}。",
			"settings.machines": "机器",
			"settings.noMachines": "还没有机器，点击下方按钮添加。",
			"settings.add": "添加机器",
			"settings.edit": "编辑",
			"settings.delete": "删除",
			"settings.deleteTitle": "删除机器",
			"settings.deleteConfirm": "删除机器「{name}」？已创建的远程工作区会保留，但在重新添加该机器前无法连接。",
			"settings.test": "测试连接",
			"settings.testing": "连接中…",
			"settings.name": "名称",
			"settings.host": "主机",
			"settings.port": "端口",
			"settings.username": "用户名",
			"settings.auth": "认证方式",
			"settings.authPassword": "密码",
			"settings.authKey": "私钥",
			"settings.authAgent": "SSH Agent",
			"settings.password": "密码",
			"settings.passwordKeep": "已保存，留空保持不变",
			"settings.privateKeyPath": "私钥路径",
			"settings.advanced": "高级（跳板机 / 交互认证）",
			"settings.proxyHost": "跳板机主机",
			"settings.proxyPort": "跳板机端口",
			"settings.proxyUser": "跳板机用户",
			"settings.keyboardInteractive": "允许 keyboard-interactive 认证",
			"settings.color": "标记颜色",
			"settings.colorDefault": "跟随主题",
			"settings.save": "保存",
			"settings.cancel": "取消",
			"settings.connected": "连接成功",
			"settings.platform": "平台：{platform}",
			"settings.testFailed": "连接失败",
			"settings.confirmDelete": "删除",
			"settings.localPicker": "本机文件夹选择方式",
			"settings.localPickerBrowse": "在网页内浏览（推荐）",
			"settings.localPickerNative": "打开系统选择器",
			"settings.localPickerHint": "网页内浏览在任何位置都能用。系统选择器会在 DSH 所在电脑的屏幕上弹窗，只有你正坐在那台电脑前时才可用；从另一台电脑通过隧道访问时，请保持网页内浏览。",
			"settings.pickerSaved": "已保存本机文件夹选择方式",
			"picker.title": "选择工作区",
			"picker.tabLocal": "本机",
			"picker.tabRemote": "远程",
			"picker.localHint": "选择本机的一个文件夹作为工作区。",
			"picker.localChoose": "选择文件夹…",
			"picker.localFallback": "系统选择器不可用，已切换到浏览器目录选择。",
			"picker.remoteHint": "选择一台机器，浏览并选择远程目录；会创建一个本地工作区句柄与之关联。",
			"picker.machine": "机器",
			"picker.path": "路径",
			"picker.up": "上一级",
			"picker.home": "主目录",
			"picker.drive": "驱动器",
			"picker.refresh": "刷新",
			"picker.newFolder": "新建文件夹",
			"picker.folderName": "文件夹名称",
			"picker.create": "创建",
			"picker.empty": "此目录为空",
			"picker.commit": "设为远程工作区",
			"picker.localCommit": "设为本机工作区",
			"picker.committing": "正在创建…",
			"picker.cancel": "取消",
			"picker.loading": "加载中…",
			"reference.unsupportedName": "远程工作区暂不支持 @ 文件引用",
			"reference.unsupportedDescription": "远程工作区的文件引用将在后续版本提供；当前可直接在对话中粘贴远程路径。",
			"files.tabTitle": "远程文件",
			"files.tabDescription": "浏览远程工作区的文件，上传或下载",
			"files.notRemote": "当前会话不是远程工作区",
			"files.notRemoteHint": "把一个远程目录设为工作区后，这里会显示它的文件。",
			"files.loading": "加载中…",
			"files.loadFailed": "无法列出目录",
			"files.empty": "此目录为空",
			"files.up": "上级",
			"files.refresh": "刷新",
			"files.upload": "上传",
			"files.uploading": "上传中 {count}…",
			"files.downloadHint": "下载 {path}",
			"files.back": "返回",
			"files.download": "下载",
			"files.save": "保存",
			"files.saving": "保存中…",
			"files.saved": "已保存",
			"files.saveFailed": "保存失败",
			"files.binary": "二进制文件，请下载后查看",
			"files.tooLarge": "文件较大，请下载后查看",
			"files.edit": "编辑",
			"files.preview": "预览",
			"files.openFile": "打开",
			"files.openFolder": "打开文件夹",
			"files.uploadIn": "上传到此文件夹",
			"files.uploadHere": "上传到此处",
			"files.copyPath": "复制路径",
			"files.pathCopied": "路径已复制",
			"files.rename": "重命名",
			"files.renameTitle": "重命名",
			"files.renameLabel": "新名称",
			"files.delete": "删除",
			"files.deleteTitle": "删除",
			"files.deleteConfirm": "删除「{name}」？",
			"files.deleteDirWarning": "目录会连同其中的内容一起删除，且无法恢复。",
			"files.newFolder": "新建文件夹",
			"files.newFolderTitle": "新建文件夹",
			"files.newFolderLabel": "文件夹名称",
			"files.cancel": "取消",
			"files.confirm": "确定",
			"files.renamed": "已重命名",
			"files.deleted": "已删除",
			"files.created": "已创建",
			"files.invalidName": "名称不能为空，也不能包含 / 或 \\",
			"files.markdownPreview": "预览",
			"files.markdownSource": "源码",
			"files.actionFailed": "操作失败",
			"forwards.title": "端口转发",
			"forwards.intro": "按需把远程机器上的端口临时映射到本机回环地址。不需要预先配置；关闭后立即失效，DSH 退出时也会全部关闭。",
			"forwards.machine": "机器",
			"forwards.remotePort": "远程端口",
			"forwards.remoteHost": "远程地址",
			"forwards.open": "打开转发",
			"forwards.close": "关闭",
			"forwards.none": "当前没有打开的转发。",
			"forwards.opened": "转发已打开",
			"forwards.closeFailed": "关闭转发失败",
			"forwards.localOnly": "预览地址只适用于运行 DSH 的那台电脑。",
			"settings.envCheck": "环境检查",
			"settings.envChecking": "检查中…",
			"settings.envAgain": "重新检查",
			"settings.envOk": "环境就绪：{platform} / {arch}，缺失的依赖会在这里列出。",
			"settings.envProblems": "发现 {count} 个问题，按下面的命令补装即可（插件不会自动安装）。",
			"settings.envFailed": "检查失败",
			"settings.envCopy": "复制",
			"settings.envCopied": "已复制",
			"settings.envCheckedAt": "检查时间 {time}",
			"env.problem.arch": "无法识别机器架构，安装提示只能使用默认版本。",
			"env.problem.bash": "未找到 bash，远程命令可能失败。",
			"env.problem.rg": "缺少 ripgrep（rg），grep/glob 无法在这台机器上搜索。",
			"env.problem.git": "未找到 git，版本控制命令会失败。",
			"env.problem.tar": "未找到 tar，远程解包会失败。",
			"env.problem.home": "家目录 {home} 不可写，无法在其中创建工具与配置文件。",
			"git.tabTitle": "远程 Git",
			"git.tabDescription": "查看并提交远程工作区的 Git 变更",
			"git.notRemote": "当前会话不是远程工作区",
			"git.notRemoteHint": "把一个远程目录设为工作区后，这里会显示它的 Git 变更。",
			"git.notRepo": "远程工作区不在 Git 仓库内。",
			"git.loading": "加载中…",
			"git.refresh": "刷新",
			"git.stage": "暂存",
			"git.unstage": "取消暂存",
			"git.staged": "已暂存",
			"git.unstaged": "已取消暂存",
			"git.commit": "提交",
			"git.commitPlaceholder": "提交说明",
			"git.clean": "工作区干净，没有待提交的改动。",
			"git.ahead": "领先 {n}",
			"git.behind": "落后 {n}",
			"git.untracked": "未跟踪",
			"git.truncated": "变更过多，仅显示前 {n} 条。",
			"git.diffEmpty": "没有差异文本（可能是二进制文件或仅权限变化）。",
			"git.closeDiff": "关闭",
			"git.committed": "已提交",
			"git.failed": "操作失败",
			"git.viewChanges": "变更",
			"git.viewHistory": "历史",
			"git.noCommits": "还没有提交。",
			"git.justNow": "刚刚",
			"git.minutesAgo": "{n} 分钟前",
			"git.hoursAgo": "{n} 小时前",
			"git.daysAgo": "{n} 天前",
			"git.stagedSection": "已暂存",
			"git.changesSection": "更改",
			"git.stageAll": "全部暂存",
			"git.unstageAll": "全部取消暂存",
			"git.graph": "提交图",
			"git.graphScope": "提交图范围",
			"git.allBranches": "所有分支",
			"git.currentBranch": "当前分支",
			"git.branch": "分支",
			"git.commitPlaceholderOn": "Message ({shortcut} 提交到 \"{branch}\")"
		}], ["en", {
			"settings.title": "Remote Development",
			"settings.intro": "Connect to remote machines over SSH and use a remote directory as a workspace. The agent works with the exact same tools as a local workspace; the plugin translates execution to the remote host.",
			"settings.version": "Installed version v{version}.",
			"settings.machines": "Machines",
			"settings.noMachines": "No machines yet. Add one below.",
			"settings.add": "Add machine",
			"settings.edit": "Edit",
			"settings.delete": "Delete",
			"settings.deleteTitle": "Delete machine",
			"settings.deleteConfirm": "Delete machine \"{name}\"? Existing remote workspaces are kept but cannot connect until the machine is added again.",
			"settings.test": "Test connection",
			"settings.testing": "Connecting…",
			"settings.name": "Name",
			"settings.host": "Host",
			"settings.port": "Port",
			"settings.username": "Username",
			"settings.auth": "Authentication",
			"settings.authPassword": "Password",
			"settings.authKey": "Private key",
			"settings.authAgent": "SSH agent",
			"settings.password": "Password",
			"settings.passwordKeep": "Saved — leave empty to keep",
			"settings.privateKeyPath": "Private key path",
			"settings.advanced": "Advanced (jump host / interactive auth)",
			"settings.proxyHost": "Jump host",
			"settings.proxyPort": "Jump port",
			"settings.proxyUser": "Jump user",
			"settings.keyboardInteractive": "Allow keyboard-interactive auth",
			"settings.color": "Marker color",
			"settings.colorDefault": "Theme default",
			"settings.save": "Save",
			"settings.cancel": "Cancel",
			"settings.connected": "Connected",
			"settings.platform": "Platform: {platform}",
			"settings.testFailed": "Connection failed",
			"settings.confirmDelete": "Delete",
			"settings.localPicker": "Local folder picker",
			"settings.localPickerBrowse": "Browse in the web app (recommended)",
			"settings.localPickerNative": "Open the system chooser",
			"settings.localPickerHint": "Browsing in the web app works from anywhere. The system chooser opens a dialog on the DSH host's screen, so it only works when you sit at that machine; keep the web-app browser when reaching DSH through a tunnel from another computer.",
			"settings.pickerSaved": "Local folder picker saved",
			"picker.title": "Choose workspace",
			"picker.tabLocal": "Local",
			"picker.tabRemote": "Remote",
			"picker.localHint": "Pick a local folder as the workspace.",
			"picker.localChoose": "Choose folder…",
			"picker.localFallback": "The system chooser is unavailable; switched to the in-app browser.",
			"picker.remoteHint": "Pick a machine, browse, and choose a remote directory; a local workspace handle is created for it.",
			"picker.machine": "Machine",
			"picker.path": "Path",
			"picker.up": "Up",
			"picker.home": "Home",
			"picker.drive": "Drive",
			"picker.refresh": "Refresh",
			"picker.newFolder": "New folder",
			"picker.folderName": "Folder name",
			"picker.create": "Create",
			"picker.empty": "This directory is empty",
			"picker.commit": "Set as remote workspace",
			"picker.localCommit": "Set as local workspace",
			"picker.committing": "Creating…",
			"picker.cancel": "Cancel",
			"picker.loading": "Loading…",
			"reference.unsupportedName": "Remote workspaces do not support @ file references yet",
			"reference.unsupportedDescription": "File references for remote workspaces are planned for a later version; paste remote paths directly in the conversation for now.",
			"files.tabTitle": "Remote files",
			"files.tabDescription": "Browse the remote workspace, upload and download",
			"files.notRemote": "This session is not a remote workspace",
			"files.notRemoteHint": "Set a remote directory as the workspace and its files appear here.",
			"files.loading": "Loading…",
			"files.loadFailed": "Cannot list the directory",
			"files.empty": "This directory is empty",
			"files.up": "Up",
			"files.refresh": "Refresh",
			"files.upload": "Upload",
			"files.uploading": "Uploading {count}…",
			"files.downloadHint": "Download {path}",
			"files.back": "Back",
			"files.download": "Download",
			"files.save": "Save",
			"files.saving": "Saving…",
			"files.saved": "Saved",
			"files.saveFailed": "Save failed",
			"files.binary": "Binary file — download to inspect",
			"files.tooLarge": "File is large — download to inspect",
			"files.edit": "Edit",
			"files.preview": "Preview",
			"files.openFile": "Open",
			"files.openFolder": "Open folder",
			"files.uploadIn": "Upload into this folder",
			"files.uploadHere": "Upload here",
			"files.copyPath": "Copy path",
			"files.pathCopied": "Path copied",
			"files.rename": "Rename",
			"files.renameTitle": "Rename",
			"files.renameLabel": "New name",
			"files.delete": "Delete",
			"files.deleteTitle": "Delete",
			"files.deleteConfirm": "Delete \"{name}\"?",
			"files.deleteDirWarning": "The folder and everything inside it are removed, and this cannot be undone.",
			"files.newFolder": "New folder",
			"files.newFolderTitle": "New folder",
			"files.newFolderLabel": "Folder name",
			"files.cancel": "Cancel",
			"files.confirm": "OK",
			"files.renamed": "Renamed",
			"files.deleted": "Deleted",
			"files.created": "Created",
			"files.invalidName": "The name must not be empty or contain / or \\",
			"files.actionFailed": "The action failed",
			"files.markdownPreview": "Preview",
			"files.markdownSource": "Source",
			"forwards.title": "Port forwards",
			"forwards.intro": "Temporarily map a port on a remote machine to a loopback port on this host, on demand. Nothing is preconfigured; a forward ends when closed and when DSH exits.",
			"forwards.machine": "Machine",
			"forwards.remotePort": "Remote port",
			"forwards.remoteHost": "Remote address",
			"forwards.open": "Open forward",
			"forwards.close": "Close",
			"forwards.none": "No forwards are open.",
			"forwards.opened": "Forward opened",
			"forwards.closeFailed": "Closing the forward failed",
			"forwards.localOnly": "The preview URL works only on the machine running DSH.",
			"settings.envCheck": "Check environment",
			"settings.envChecking": "Checking…",
			"settings.envAgain": "Check again",
			"settings.envOk": "Environment ready: {platform} / {arch}. Anything missing is listed here.",
			"settings.envProblems": "{count} problem(s) found. Run the commands below to fix them (the plugin never installs anything).",
			"settings.envFailed": "The check failed",
			"settings.envCopy": "Copy",
			"settings.envCopied": "Copied",
			"settings.envCheckedAt": "Checked {time}",
			"env.problem.arch": "Could not identify the machine architecture; install hints use the default release.",
			"env.problem.bash": "bash was not found; remote commands may fail.",
			"env.problem.rg": "ripgrep (rg) is missing: grep and glob cannot search this machine.",
			"env.problem.git": "git is missing; version-control commands will fail.",
			"env.problem.tar": "tar is missing; unpacking archives remotely will fail.",
			"env.problem.home": "The home directory {home} is not writable.",
			"git.tabTitle": "Remote Git",
			"git.tabDescription": "Review and commit changes in the remote workspace",
			"git.notRemote": "This session is not a remote workspace",
			"git.notRemoteHint": "Pick a remote directory as the workspace and its changes appear here.",
			"git.notRepo": "The remote workspace is not inside a git repository.",
			"git.loading": "Loading…",
			"git.refresh": "Refresh",
			"git.stage": "Stage",
			"git.unstage": "Unstage",
			"git.staged": "Staged",
			"git.unstaged": "Unstaged",
			"git.commit": "Commit",
			"git.commitPlaceholder": "Commit message",
			"git.clean": "The working tree is clean.",
			"git.ahead": "{n} ahead",
			"git.behind": "{n} behind",
			"git.untracked": "Untracked",
			"git.truncated": "Too many changes; showing the first {n}.",
			"git.diffEmpty": "No diff text (binary file or a mode-only change).",
			"git.closeDiff": "Close",
			"git.committed": "Committed",
			"git.failed": "The action failed",
			"git.viewChanges": "Changes",
			"git.viewHistory": "History",
			"git.noCommits": "No commits yet.",
			"git.justNow": "just now",
			"git.minutesAgo": "{n} min ago",
			"git.hoursAgo": "{n} h ago",
			"git.daysAgo": "{n} d ago",
			"git.stagedSection": "Staged",
			"git.changesSection": "Changes",
			"git.stageAll": "Stage all",
			"git.unstageAll": "Unstage all",
			"git.graph": "Commit graph",
			"git.graphScope": "Graph scope",
			"git.allBranches": "All branches",
			"git.currentBranch": "Current branch",
			"git.branch": "Branch",
			"git.commitPlaceholderOn": "Message ({shortcut} to commit on \"{branch}\")"
		}]];
		//#endregion
		//#region src/client/styles.ts
		/**
		* The plugin's stylesheet, injected once per page load. Class names carry the
		* `rdv-` prefix and every color/spacing value reads the harness `--dsw-*`
		* tokens, so light/dark themes follow the shell without extra work.
		* @module dsh-remote-development/client/styles
		*/
		const CSS = `
.rdv-page { display: flex; flex-direction: column; gap: 16px; max-width: 720px; }
.rdv-intro { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.rdv-cards { display: flex; flex-direction: column; gap: 8px; }
.rdv-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.rdv-cardMain { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.rdv-cardName { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 510; line-height: 20px; display: flex; align-items: center; gap: 8px; }
.rdv-cardHost { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-cardActions { display: flex; align-items: center; gap: 4px; flex: none; }
.rdv-form { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }
.rdv-row { display: flex; gap: 10px; }
.rdv-row > * { flex: 1; min-width: 0; }
.rdv-field { display: flex; flex-direction: column; gap: 5px; }
.rdv-label { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 500; line-height: 18px; }
.rdv-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.rdv-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; white-space: pre-wrap; }
.rdv-ok { color: var(--dsw-alias-state-success-primary, var(--dsw-alias-label-primary)); font-size: 12px; line-height: 18px; }
.rdv-dialog { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: var(--dsw-alias-overlay-bg, rgba(0,0,0,0.4)); }
.rdv-sheet { display: flex; flex-direction: column; width: min(640px, calc(100vw - 32px)); height: min(520px, calc(100dvh - 48px)); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l3); border-radius: 14px; box-shadow: 0 18px 48px rgba(0,0,0,0.25); overflow: hidden; }
.rdv-sheetHead { display: flex; align-items: center; gap: 12px; padding: 14px 18px 10px; border-bottom: 1px solid var(--dsw-alias-border-l3); }
.rdv-tabs { display: flex; gap: 2px; padding: 3px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); }
.rdv-tab { border: none; background: transparent; border-radius: 7px; padding: 5px 14px; color: var(--dsw-alias-label-secondary); font-size: 13px; font-weight: 500; cursor: pointer; }
.rdv-tabActive { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
.rdv-sheetTitle { color: var(--dsw-alias-label-primary); font-size: 15px; font-weight: 510; flex: 1; }
.rdv-sheetBody { display: flex; flex-direction: column; gap: 10px; padding: 14px 18px; flex: 1; min-height: 0; overflow-y: auto; }
.rdv-hint { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.rdv-toolbar { display: flex; align-items: center; gap: 6px; }
.rdv-pathInput { flex: 1; min-width: 0; height: 30px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); padding: 0 10px; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; outline: none; }
.rdv-pathInput:focus { border-color: var(--dsw-alias-border-l2); }
.rdv-list { display: flex; flex-direction: column; gap: 1px; flex: 1; min-height: 0; overflow-y: auto; border: 1px solid var(--dsw-alias-border-l4); border-radius: 10px; }
.rdv-itemRow { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: transparent; text-align: left; padding: 8px 12px; color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; }
.rdv-itemRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-itemName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-itemIcon { color: var(--dsw-alias-label-tertiary); flex: none; display: inline-flex; }
.rdv-empty { padding: 24px; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.rdv-sheetFoot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--dsw-alias-border-l3); }
.rdv-spacer { flex: 1; }
.rdv-status { color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.rdv-select { height: 32px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); padding: 0 8px; font-size: 13px; outline: none; min-width: 0; flex: 1; }
/* The native popup does not inherit the page theme: without an explicit
   color-scheme it renders light even under dark tokens, leaving inherited
   near-white option text on a white list. Opaque option colors fix the list
   in every engine; color-scheme under the shell's dark-theme attribute also
   fixes the popup chrome (border, highlight, arrow). */
.rdv-select option { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
body[data-ds-dark-theme] .rdv-select { color-scheme: dark; }
/* Marker-color palette: a trigger button over an anchored 3x3 swatch card.
   The fixed transparent backdrop closes the card on any outside click while
   the card itself sits above it in the same stacking context. */
.rdv-colorTrigger { display: inline-flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; text-align: left; }
.rdv-colorDot { width: 12px; height: 12px; border-radius: 6px; flex: none; border: 1px solid var(--dsw-alias-border-l4); }
.rdv-paletteBackdrop { position: fixed; inset: 0; z-index: 50; background: transparent; border: none; padding: 0; cursor: default; }
.rdv-palette { position: absolute; top: calc(100% + 6px); left: 0; z-index: 51; display: grid; grid-template-columns: repeat(3, 30px); gap: 8px; padding: 10px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
.rdv-swatch { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l4); padding: 0; cursor: pointer; }
.rdv-swatchDefault { background: var(--dsw-alias-bg-layer-2); position: relative; }
.rdv-swatchDefault::after { content: ''; position: absolute; inset: 7px; border: 1.5px dashed var(--dsw-alias-label-tertiary); border-radius: 5px; }
.rdv-swatchActive { outline: 2px solid var(--dsw-alias-label-primary); outline-offset: 2px; }
/* Remote-file tab. It lives in a narrow sidebar column, so every row is one
   line and the path is the only thing that truncates. */
.rdv-files { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--dsw-alias-bg-layer-1); }
.rdv-filesHead { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--dsw-alias-border-l3); flex: none; }
.rdv-filesPath { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
.rdv-filesTools { display: flex; align-items: center; gap: 4px; }
.rdv-filesList { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto; padding: 2px 0; }
.rdv-filesRow { display: flex; align-items: center; gap: 6px; box-sizing: border-box; width: 100%; min-height: 26px; padding: 3px 12px 3px 10px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; text-decoration: none; }
.rdv-filesRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-filesRow:focus-visible { outline: 1px solid var(--dsw-alias-border-l2); outline-offset: -1px; }
.rdv-filesIcon { display: inline-flex; color: var(--dsw-alias-label-tertiary); flex: none; }
.rdv-filesName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesGlyph { color: var(--dsw-alias-label-tertiary); flex: none; font-size: 14px; line-height: 14px; }
.rdv-filesSize { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: none; padding-left: 6px; font-variant-numeric: tabular-nums; }
.rdv-filesViewerBar { display: flex; align-items: center; gap: 6px; }
.rdv-filesViewerName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 510; }
.rdv-filesEditor { flex: 1; box-sizing: border-box; width: 100%; min-height: 0; resize: none; border: none; outline: none; padding: 8px 10px; background: transparent; color: var(--dsw-alias-label-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; tab-size: 2; }
.rdv-filesImage { flex: 1; min-height: 0; overflow: auto; padding: 10px; display: flex; align-items: flex-start; justify-content: center; }
.rdv-filesImage img { max-width: 100%; height: auto; }
/* Rendered Markdown, laid out like the sidebar editor's preview: comfortable
   measure, heading scale from the theme's type ramp, code blocks reusing the
   viewer's highlight palette. */
.rdv-markdown { flex: 1; min-height: 0; overflow: auto; padding: 12px 16px 24px; line-height: 1.65; font-size: 13px; color: var(--dsw-alias-label-primary); overflow-wrap: break-word; }
.rdv-markdown > :first-child { margin-top: 0; }
.rdv-markdown h1, .rdv-markdown h2, .rdv-markdown h3, .rdv-markdown h4, .rdv-markdown h5, .rdv-markdown h6 { margin: 1.2em 0 0.5em; line-height: 1.3; font-weight: 600; }
.rdv-markdown h1 { font-size: 1.7em; padding-bottom: 0.3em; border-bottom: 1px solid var(--dsw-alias-border-l4); }
.rdv-markdown h2 { font-size: 1.4em; padding-bottom: 0.25em; border-bottom: 1px solid var(--dsw-alias-border-l4); }
.rdv-markdown h3 { font-size: 1.2em; }
.rdv-markdown h4 { font-size: 1.05em; }
.rdv-markdown h5, .rdv-markdown h6 { font-size: 1em; color: var(--dsw-alias-label-secondary); }
.rdv-markdown p, .rdv-markdown ul, .rdv-markdown ol, .rdv-markdown blockquote, .rdv-markdown table, .rdv-markdown pre { margin: 0.6em 0; }
.rdv-markdown a { color: var(--dsw-alias-state-business-primary, #3b82f6); text-decoration: none; }
.rdv-markdown a:hover { text-decoration: underline; }
.rdv-markdown ul, .rdv-markdown ol { padding-left: 1.6em; }
.rdv-markdown li { margin: 0.2em 0; }
.rdv-markdown li > ul, .rdv-markdown li > ol { margin: 0.2em 0; }
.rdv-markdown input[type="checkbox"] { margin: 0 0.4em 0 0; vertical-align: middle; }
.rdv-markdown blockquote { padding: 0.2em 0.9em; border-left: 3px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); border-radius: 0 4px 4px 0; }
.rdv-markdown code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; padding: 0.12em 0.35em; border-radius: 3px; background: var(--dsw-alias-bg-layer-2); }
.rdv-markdown pre { padding: 10px 12px; overflow: auto; border-radius: 6px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l4); }
.rdv-markdown pre code { padding: 0; background: transparent; font-size: 12px; line-height: 1.5; }
.rdv-markdown table { border-collapse: collapse; display: block; max-width: 100%; overflow: auto; }
.rdv-markdown th, .rdv-markdown td { padding: 5px 10px; border: 1px solid var(--dsw-alias-border-l3); }
.rdv-markdown th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
.rdv-markdown tr:nth-child(2n) td { background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 60%, transparent); }
.rdv-markdown hr { height: 1px; margin: 1.4em 0; border: 0; background: var(--dsw-alias-border-l3); }
.rdv-markdown img { max-width: 100%; height: auto; }
.rdv-filesNote { flex: none; padding: 4px 10px; border-top: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
/* Read view. One scrolling surface holds a sticky gutter and the highlighted
   source; both share the same 18px line grid, so numbers stay aligned. The
   token colors are the sidebar's one-light / one-dark syntax families, so this
   view reads like its CodeMirror editor. */
.rdv-codeWrap { flex: 1; min-height: 0; overflow: auto; display: flex; align-items: flex-start; }
.rdv-codeGutter { position: sticky; left: 0; z-index: 1; flex: none; padding: 8px 8px 8px 10px; text-align: right; white-space: pre; color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-bg-layer-1); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; user-select: none; }
.rdv-code { margin: 0; padding: 8px 12px 8px 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 18px; tab-size: 2; color: var(--dsw-alias-label-primary); white-space: pre; }
.rdv-code code { font: inherit; color: inherit; }
.rdv-code .hljs-comment, .rdv-code .hljs-quote { color: #a0a1a7; font-style: italic; }
.rdv-code .hljs-keyword, .rdv-code .hljs-literal, .rdv-code .hljs-selector-tag, .rdv-code .hljs-doctag { color: #a626a4; }
.rdv-code .hljs-string, .rdv-code .hljs-regexp, .rdv-code .hljs-addition { color: #50a14f; }
.rdv-code .hljs-number, .rdv-code .hljs-symbol, .rdv-code .hljs-bullet { color: #986801; }
.rdv-code .hljs-title, .rdv-code .hljs-section, .rdv-code .hljs-name { color: #0184bc; }
.rdv-code .hljs-type, .rdv-code .hljs-built_in, .rdv-code .hljs-class .hljs-title { color: #c18401; }
.rdv-code .hljs-attr, .rdv-code .hljs-attribute, .rdv-code .hljs-variable, .rdv-code .hljs-template-variable { color: #e45649; }
.rdv-code .hljs-meta, .rdv-code .hljs-selector-id, .rdv-code .hljs-selector-class { color: #0997b3; }
.rdv-code .hljs-deletion { color: #e45649; }
.rdv-code .hljs-link { color: #4078f2; }
.rdv-code .hljs-emphasis { font-style: italic; }
.rdv-code .hljs-strong { font-weight: 600; }
body[data-ds-dark-theme] .rdv-code .hljs-comment, body[data-ds-dark-theme] .rdv-code .hljs-quote { color: #5c6370; }
body[data-ds-dark-theme] .rdv-code .hljs-keyword, body[data-ds-dark-theme] .rdv-code .hljs-literal, body[data-ds-dark-theme] .rdv-code .hljs-selector-tag, body[data-ds-dark-theme] .rdv-code .hljs-doctag { color: #c678dd; }
body[data-ds-dark-theme] .rdv-code .hljs-string, body[data-ds-dark-theme] .rdv-code .hljs-regexp, body[data-ds-dark-theme] .rdv-code .hljs-addition { color: #98c379; }
body[data-ds-dark-theme] .rdv-code .hljs-number, body[data-ds-dark-theme] .rdv-code .hljs-symbol, body[data-ds-dark-theme] .rdv-code .hljs-bullet { color: #d19a66; }
body[data-ds-dark-theme] .rdv-code .hljs-title, body[data-ds-dark-theme] .rdv-code .hljs-section, body[data-ds-dark-theme] .rdv-code .hljs-name { color: #61afef; }
body[data-ds-dark-theme] .rdv-code .hljs-type, body[data-ds-dark-theme] .rdv-code .hljs-built_in, body[data-ds-dark-theme] .rdv-code .hljs-class .hljs-title { color: #e5c07b; }
body[data-ds-dark-theme] .rdv-code .hljs-attr, body[data-ds-dark-theme] .rdv-code .hljs-attribute, body[data-ds-dark-theme] .rdv-code .hljs-variable, body[data-ds-dark-theme] .rdv-code .hljs-template-variable { color: #e06c75; }
body[data-ds-dark-theme] .rdv-code .hljs-meta, body[data-ds-dark-theme] .rdv-code .hljs-selector-id, body[data-ds-dark-theme] .rdv-code .hljs-selector-class { color: #56b6c2; }
body[data-ds-dark-theme] .rdv-code .hljs-deletion { color: #e06c75; }
body[data-ds-dark-theme] .rdv-code .hljs-link { color: #61afef; }
.rdv-filesError { padding: 6px 10px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; word-break: break-word; }
.rdv-filesFoot { flex: none; padding: 5px 10px; border-top: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesMachine { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
/* Port forwards in the settings page: a compact add row plus live records. */
.rdv-forwardRow { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.rdv-forwardUrl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--dsw-alias-label-primary); }
.rdv-forwardTarget { color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; }
.rdv-sectionTitle { margin: 8px 0 0; color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 510; line-height: 20px; }
/* Environment check: a verdict panel under its machine card, with one row per
   copyable install route. The command wraps instead of scrolling sideways —
   these are meant to be read and copied whole. */
.rdv-env { display: flex; flex-direction: column; gap: 6px; margin-top: -4px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l4); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }
.rdv-envProblem { display: flex; flex-direction: column; gap: 6px; }
.rdv-envCommand { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.rdv-envLabel { flex: none; padding: 1px 6px; border-radius: 5px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
.rdv-envCode { flex: 1 1 320px; min-width: 0; padding: 4px 8px; border-radius: 6px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l4); color: var(--dsw-alias-label-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 16px; white-space: pre-wrap; word-break: break-all; }
/* Remote Git tab: a status list plus the selected file's diff. */
.rdv-gitHead { display: flex; align-items: center; gap: 8px; flex: none; padding: 6px 10px; border-bottom: 1px solid var(--dsw-alias-border-l3); }
.rdv-gitBranch { color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 510; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitTracking { color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; }
.rdv-gitNotice { padding: 4px 10px; }
.rdv-gitRow { display: flex; align-items: center; gap: 6px; padding-right: 6px; }
.rdv-gitRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-gitBadge { flex: none; width: 22px; text-align: center; padding: 1px 0; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.rdv-gitBadgeNew { color: var(--dsw-alias-state-success-primary, var(--dsw-alias-label-primary)); }
.rdv-gitFile { flex: 1; min-width: 0; padding: 6px 2px; }
.rdv-gitRowActions { display: flex; align-items: center; gap: 4px; flex: none; }
.rdv-gitDiffPane { display: flex; flex-direction: column; flex: 1 1 200px; min-height: 120px; border-top: 1px solid var(--dsw-alias-border-l3); }
.rdv-gitDiffHead { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-bottom: 1px solid var(--dsw-alias-border-l4); }
.rdv-gitDiffPath { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.rdv-gitDiff { flex: 1; min-height: 0; margin: 0; padding: 8px 10px; overflow: auto; color: var(--dsw-alias-label-primary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 16px; white-space: pre; }
.rdv-gitCommit { display: flex; align-items: center; gap: 6px; flex: none; padding: 8px 10px; border-top: 1px solid var(--dsw-alias-border-l3); }
.rdv-gitCommit > :first-child { flex: 1; min-width: 0; }
/* Remote-file row context menu. The backdrop is a full-viewport button so a
   click anywhere (and Escape via the dialog host) dismisses the menu. */
.rdv-ctxBackdrop { position: fixed; inset: 0; z-index: 50; margin: 0; padding: 0; border: none; background: transparent; cursor: default; }
.rdv-ctxMenu { position: fixed; z-index: 51; min-width: 190px; padding: 4px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22); display: flex; flex-direction: column; gap: 1px; }
.rdv-ctxItem { display: block; width: 100%; border: none; background: transparent; text-align: left; padding: 6px 10px; border-radius: 6px; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px; cursor: pointer; }
.rdv-ctxItem:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-ctxDanger { color: var(--dsw-alias-state-error-primary); }
.rdv-ctxSep { height: 1px; margin: 4px 6px; background: var(--dsw-alias-border-l4); }
/* Remote Git: changes/history switcher and commit rows. */
.rdv-gitTabs { display: flex; align-items: center; gap: 2px; flex: none; padding: 4px 10px 6px; border-bottom: 1px solid var(--dsw-alias-border-l4); }
.rdv-gitTab { border: none; background: transparent; border-radius: 6px; padding: 4px 10px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; cursor: pointer; }
.rdv-gitTab:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-gitTabActive { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-weight: 510; }
.rdv-gitRowOpen { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-gitBadgeCommit { font-size: 10px; }
.rdv-gitSubject { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
.rdv-gitRef { flex: none; padding: 0 5px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 14px; }
.rdv-gitMeta { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
/* ── Remote Git panel, shaped like the host's own Git lens ─────────────── */
.rdv-gitRoot { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; font: var(--dsw-font-xxs-12); color: var(--dsw-alias-label-primary); }
.rdv-gitRepoBar { display: flex; align-items: flex-end; gap: 2px; flex: none; padding: 4px 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l4); overflow: hidden; }
.rdv-gitRepoTab { flex: none; max-width: 100%; padding: 3px 8px; border-radius: 6px 6px 0 0; background: transparent; color: var(--dsw-alias-label-secondary); font: var(--dsw-font-xxxs-11); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitScroll { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: auto; }
.rdv-gitSection { display: flex; flex-direction: column; flex: none; min-height: 0; }
.rdv-gitSectionGrow { flex: 1; }
.rdv-gitHead { display: flex; align-items: center; gap: 4px; flex: none; height: 28px; padding: 0 6px 0 4px; }
.rdv-gitHeadActions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.rdv-gitDisclosure { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; border: 0; background: transparent; padding: 0; color: var(--dsw-alias-label-primary); font: var(--dsw-font-xxs-strong-12); cursor: pointer; text-align: left; }
.rdv-gitChevron { display: inline-flex; color: var(--dsw-alias-label-tertiary); transition: transform 120ms ease; }
.rdv-gitChevron[data-open="true"] { transform: rotate(90deg); }
.rdv-gitIconAction { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 0; border-radius: 4px; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 1; cursor: pointer; }
.rdv-gitIconAction:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.rdv-gitIconAction:disabled { color: var(--dsw-alias-label-tertiary); cursor: default; opacity: 0.6; }
.rdv-gitSectionBody { display: flex; flex-direction: column; min-height: 0; padding-bottom: 6px; }
.rdv-gitMessageBox { flex: none; margin: 0 8px 6px; }
.rdv-gitMessageInput { display: block; width: 100%; box-sizing: border-box; min-height: 28px; max-height: 96px; resize: vertical; padding: 5px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: var(--dsw-font-xxs-12); }
.rdv-gitMessageInput:focus { outline: none; border-color: var(--dsw-alias-border-l1); }
.rdv-gitClean { padding: 8px 10px; }
.rdv-gitGroup { display: flex; flex-direction: column; flex: none; }
.rdv-gitGroupHead { display: flex; align-items: center; gap: 4px; height: 24px; padding: 0 6px 0 4px; }
.rdv-gitGroupHead .rdv-gitDisclosure { font: var(--dsw-font-xxxs-11); color: var(--dsw-alias-label-secondary); }
.rdv-gitGroupAction { flex: none; width: 20px; height: 20px; border: 0; border-radius: 4px; background: transparent; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1; cursor: pointer; }
.rdv-gitGroupAction:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.rdv-gitGroupBody { display: flex; flex-direction: column; }
.rdv-gitChangeRow { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px 0 10px; cursor: pointer; }
.rdv-gitChangeRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-gitChangeIcon { flex: none; display: inline-flex; width: 14px; justify-content: center; color: var(--dsw-alias-label-secondary); }
.rdv-gitChangeName { flex: none; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitChangePath { flex: 1; min-width: 0; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxxs-11); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitChangeCode { flex: none; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxxs-11); }
.rdv-gitChangeAction { flex: none; width: 20px; height: 20px; border: 0; border-radius: 4px; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 1; cursor: pointer; opacity: 0; }
.rdv-gitChangeRow:hover .rdv-gitChangeAction { opacity: 1; }
.rdv-gitChangeAction:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); color: var(--dsw-alias-label-primary); }
.rdv-gitGraphBody { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.rdv-gitGraphToolbar { flex: none; padding: 0 8px 6px; }
.rdv-gitSelect { display: block; width: 100%; box-sizing: border-box; height: 28px; padding: 0 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 3px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: var(--dsw-font-xxs-12); }
.rdv-gitGraphList { display: flex; flex-direction: column; min-height: 0; overflow: auto; }
.rdv-gitGraphRow { display: flex; align-items: center; gap: 6px; width: 100%; height: 28px; padding: 0 8px 0 4px; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: var(--dsw-font-xxs-12); text-align: left; cursor: pointer; }
.rdv-gitGraphRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-gitGraphRowOpen { background: var(--dsw-alias-interactive-bg-active); }
.rdv-gitRail { flex: none; overflow: visible; }
.rdv-gitLane { fill: none; stroke: currentColor; stroke-width: 1.5; }
.rdv-gitLane.c0, .rdv-gitNode.c0 { color: var(--dsw-alias-state-business-primary, var(--dsw-alias-label-primary)); }
.rdv-gitLane.c1, .rdv-gitNode.c1 { color: var(--dsw-alias-state-success-primary, var(--dsw-alias-label-primary)); }
.rdv-gitLane.c2, .rdv-gitNode.c2 { color: var(--dsw-alias-state-warn-primary, var(--dsw-alias-label-primary)); }
.rdv-gitLane.c3, .rdv-gitNode.c3 { color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-primary)); }
.rdv-gitLane.c4, .rdv-gitNode.c4 { color: var(--dsw-alias-label-secondary); }
.rdv-gitNode { fill: currentColor; stroke: var(--dsw-alias-bg-layer-1); stroke-width: 1; }
.rdv-gitPills { display: inline-flex; align-items: center; gap: 3px; flex: none; min-width: 0; max-width: 60%; overflow: hidden; }
.rdv-gitPill { flex: none; max-width: 140px; height: 16px; padding: 0 5px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font: var(--dsw-font-xxxs-11); line-height: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitPillHead { background: var(--dsw-alias-interactive-bg-active); color: var(--dsw-alias-label-primary); }
.rdv-gitPillTag { border-color: transparent; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #3b82f6) 16%, transparent); color: var(--dsw-alias-state-business-primary, var(--dsw-alias-label-primary)); font-family: var(--dsw-font-mono, monospace); }
.rdv-gitSubject { flex: 1; min-width: 0; padding-left: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-gitSha { flex: none; color: var(--dsw-alias-label-tertiary); font-family: var(--dsw-font-mono, monospace); font-size: 10px; }
.rdv-gitFooter { display: flex; align-items: center; gap: 6px; flex: none; padding: 4px 8px; border-top: 1px solid var(--dsw-alias-border-l4); }
.rdv-gitBranchChip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; background: transparent; color: var(--dsw-alias-label-secondary); font: var(--dsw-font-xxxs-11); }
.rdv-gitSync { color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxxs-11); }
`;
		/** Inject the stylesheet once (idempotent across plugin reloads). */
		function injectStyles() {
			if (typeof document === "undefined") return () => {};
			if (document.querySelector("style[data-plugin-css=\"dsh-remote-development\"]")) return () => {};
			const tag = document.createElement("style");
			tag.dataset.pluginCss = "dsh-remote-development";
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return () => tag.remove();
		}
		//#endregion
		//#region src/client/tree-mark.ts
		/**
		* Remote-workspace presentation in the workspace shell. The in-box tree and
		* workspace list are fixed components the plugin cannot re-render, so the
		* plugin reaches them the only way it can, from its own client bundle:
		* generated attribute selectors that recolor folder icons, and an alias
		* rewriter that shows each anchor's remote path wherever the shell displays
		* the anchor's local directory — the file tree's root header and the
		* workspace list's hover card.
		*
		* Workspace rows carry no data hooks, so their rules match the row's title.
		* Two machines mounting the same remote directory would share that title, so
		* the host settles a unique one (the machine name is appended) and this module
		* renames the colliding Workspaces onto it; a title that stays ambiguous emits
		* no row rule at all rather than painting both rows with one machine's color.
		* @module dsh-remote-development/client/tree-mark
		*/
		/** The marker color for machines that set none. */
		const DEFAULT_TREE_COLOR = "var(--dsw-alias-brand-primary, #4a9eff)";
		/** The charset a color may carry — a hex literal or a CSS named color, nothing that could leave a declaration. */
		const SAFE_COLOR = /^(?:#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/;
		const TAG_SELECTOR = "style[data-plugin-css=\"dsh-remote-development-tree\"]";
		/** Escape one path for use inside a CSS quoted attribute value. */
		function cssString(value) {
			return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
		}
		/** The workspace title an anchor adopts: its directory basename. */
		function workspaceTitleOf(dir) {
			const parts = dir.split(/[\\/]/).filter(Boolean);
			return parts[parts.length - 1] ?? "";
		}
		/**
		* Whether two local paths name the same directory. The shell stores a
		* Workspace's canonical path while the host reports the anchor directory as it
		* was created, so trailing separators are ignored, and two Windows paths
		* compare case-insensitively (POSIX paths stay case-sensitive).
		* @param a - one local path.
		* @param b - the other local path.
		* @returns true when both name the same directory.
		*/
		function sameLocalDir(a, b) {
			const left = a.replace(/\\/g, "/").replace(/\/+$/, "");
			const right = b.replace(/\\/g, "/").replace(/\/+$/, "");
			if (left === right) return true;
			return /^[a-zA-Z]:/.test(left) && /^[a-zA-Z]:/.test(right) && left.toLowerCase() === right.toLowerCase();
		}
		/**
		* Pair every anchor with the title its workspace row shows, and flag the
		* titles that more than one workspace displays. A title two rows share cannot
		* be colored per row — the rules would match both, and the last one would win
		* — so the marker leaves those rows on the theme default instead of painting
		* one of them with the other machine's color. Anchors the Workspace list does
		* not (yet) contain keep the title the host settled for them, and Workspaces
		* that are not anchors still occupy their title.
		* @param anchors - the anchors as the host reports them.
		* @param items - the current Workspace rows.
		* @returns one mark per anchor, in list order.
		*/
		function anchorMarks(anchors, items) {
			const byDir = /* @__PURE__ */ new Map();
			const titleCounts = /* @__PURE__ */ new Map();
			const seenTitle = (title) => {
				titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
			};
			for (const item of items) {
				const anchor = anchors.find((a) => sameLocalDir(a.dir, item.path));
				if (anchor === void 0 || byDir.has(anchor.dir)) {
					seenTitle(item.title);
					continue;
				}
				byDir.set(anchor.dir, item);
				seenTitle(item.title);
			}
			for (const anchor of anchors) if (!byDir.has(anchor.dir)) seenTitle(anchor.title);
			return anchors.map((anchor) => {
				const title = byDir.get(anchor.dir)?.title ?? anchor.title;
				return {
					dir: anchor.dir,
					color: anchor.color,
					title,
					titleUnique: (titleCounts.get(title) ?? 1) === 1
				};
			});
		}
		/**
		* Build the marker stylesheet. One rule block per anchor covers every place
		* the shell can show it: the anchor as a row inside a local file tree (exact
		* match, plus a separator-prefixed selector for its subtree), a file tree
		* rooted at it (every directory row, plus the header's folder icon), and the
		* sidebar's workspace row for it. Workspace rows expose no data hooks, so
		* their rules reach the row through its own `aria-label`s, which carry the
		* workspace title in both locales — zh delimits it with curly quotes, en
		* ends the label with it. A title shared with another workspace is skipped:
		* those rules cannot tell the rows apart, so emitting them would color both
		* rows with the last machine's color.
		* @param anchors - the anchors to mark.
		* @returns the CSS text, empty when there is nothing to mark.
		*/
		function anchorTreeCss(anchors) {
			return anchors.map(({ dir, color, title, titleUnique }) => {
				const value = cssString(dir);
				const subtree = cssString(dir + (dir.includes("\\") ? "\\" : "/"));
				const safe = SAFE_COLOR.test(color) ? color : DEFAULT_TREE_COLOR;
				const selectors = [
					`[data-files-entry="directory"][data-files-path="${value}" i] svg`,
					`[data-files-entry="directory"][data-files-path^="${subtree}" i] svg`,
					`[data-files-root="${value}" i] li[data-files-entry="directory"] svg`,
					`[data-files-root="${value}" i] > div:first-child > svg`
				];
				if (titleUnique !== false) {
					const name = cssString(title ?? workspaceTitleOf(dir));
					selectors.push(`div[role="treeitem"]:has([aria-label*="“${name}”"]) > span:first-child svg`, `div[role="treeitem"]:has([aria-label$=" ${name}"]) > span:first-child svg`);
				}
				return selectors.join(",\n") + ` { color: ${safe}; }\n`;
			}).join("");
		}
		/**
		* The display parts of one remote path, split the way the shell splits a
		* root for its header: the directory keeps its trailing separator and the
		* name is the last segment.
		* @param remotePath - the anchor's remote workspace path.
		* @returns the two spans the tree header draws.
		*/
		function rootLabelParts(remotePath) {
			const trimmed = remotePath.replace(/[/\\]+$/, "");
			if (trimmed === "") return {
				directory: "",
				name: remotePath
			};
			const cut = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\")) + 1;
			return {
				directory: trimmed.slice(0, cut),
				name: trimmed.slice(cut)
			};
		}
		/**
		* The remote path one displayed path text stands for, or `undefined` when the
		* text names no anchor. The shell abbreviates home paths to a leading `~` on
		* POSIX, so the match peels that tilde and compares the remaining suffix
		* against each anchor directory; an unabbreviated text matches exactly.
		* @param text - the displayed path text.
		* @param aliases - the anchor directory to remote path table.
		* @returns the remote path, or undefined.
		*/
		function aliasForHoverText(text, aliases) {
			const candidate = text.startsWith("~") ? text.slice(1) : text;
			if (candidate === "") return void 0;
			for (const [dir, remote] of aliases) if (dir.endsWith(candidate)) return remote;
		}
		/** The anchor directory to remote path table behind the alias rewriter. */
		let aliases = /* @__PURE__ */ new Map();
		let aliasObserver;
		let aliasApplyScheduled = false;
		/** Coalesce one alias pass per mutation burst. */
		function scheduleAliasApply() {
			if (aliasApplyScheduled) return;
			aliasApplyScheduled = true;
			setTimeout(() => {
				aliasApplyScheduled = false;
				applyAliases();
			}, 0);
		}
		/**
		* Rewrite the anchor's local directory to its remote path at every display
		* point the shell renders it. Text changes go through the existing text
		* nodes' values — never their membership — so React's reconciler keeps every
		* element it owns; a re-render that writes the local path back is caught by
		* the observer and rewritten again.
		*/
		function applyAliases() {
			for (const container of document.querySelectorAll("[data-files-state=\"tree\"][data-files-root]")) {
				const remote = aliases.get(container.dataset.filesRoot ?? "");
				const path = container.querySelector("[data-files-path]");
				if (remote === void 0 || path === null) continue;
				const text = path.firstElementChild;
				if (text === null) continue;
				const { directory, name } = rootLabelParts(remote);
				const spans = text.children;
				if (spans.length !== 2) continue;
				const directoryNode = spans[0]?.firstChild;
				const nameNode = spans[1]?.firstChild;
				if (!(directoryNode instanceof Text) || !(nameNode instanceof Text)) continue;
				if (directoryNode.nodeValue !== directory) directoryNode.nodeValue = directory;
				if (nameNode.nodeValue !== name) nameNode.nodeValue = name;
				if (path.title !== remote) path.title = remote;
			}
			for (const portal of document.body.children) {
				if (!(portal instanceof HTMLElement)) continue;
				const content = portal.firstElementChild;
				if (content === null || content.children.length !== 3) continue;
				const row = content.children[1];
				if (!(row instanceof HTMLElement)) continue;
				const node = row.firstChild;
				if (!(node instanceof Text)) continue;
				const remote = aliasForHoverText(node.nodeValue ?? "", aliases);
				if (remote !== void 0 && node.nodeValue !== remote) node.nodeValue = remote;
			}
		}
		/** The service lookup handed in at start; absent in compositions without one. */
		let services;
		/** The Workspace service this module has subscribed to, if any. */
		let subscribedFace;
		let unsubscribeFace;
		/**
		* Workspace titles this module already tried to disambiguate this session.
		* One attempt per workspace and title: if the operator renames the Workspace
		* back, that deliberate choice wins instead of being overwritten on the next
		* refresh.
		*/
		const titleAttempts = /* @__PURE__ */ new Set();
		let refreshInFlight = null;
		let refreshQueued = false;
		/**
		* Resolve the client Workspace service through the context, without depending
		* on its package: the lookup is duck-typed and any missing piece (no service,
		* no snapshot, no rename) simply leaves the titles alone.
		* @returns the service face, or undefined.
		*/
		function workspaceFace() {
			try {
				const service = services?.get("workspaces");
				if (service === null || typeof service !== "object") return void 0;
				const face = service;
				if (typeof face.rename !== "function" || typeof face.list?.getSnapshot !== "function") return void 0;
				return face;
			} catch {
				return;
			}
		}
		/** The current Workspace rows, or an empty list when the service is absent. */
		function workspaceItems() {
			try {
				return workspaceFace()?.list.getSnapshot().items ?? [];
			} catch {
				return [];
			}
		}
		/**
		* Track the Workspace list so a title collision that appears later still
		* resolves: the shell creates the Workspace after the anchor, and a create,
		* delete, or rename can bring a duplicate title into existence at any time.
		* @param face - the resolved Workspace service.
		*/
		function watchWorkspaceTitles(face) {
			if (subscribedFace === face) return;
			unsubscribeFace?.();
			subscribedFace = face;
			try {
				unsubscribeFace = typeof face.list.subscribe === "function" ? face.list.subscribe(() => {
					refreshTreeMark();
				}) : void 0;
			} catch {
				subscribedFace = void 0;
				unsubscribeFace = void 0;
			}
		}
		/**
		* Give colliding remote anchors distinct titles. The host settles the title
		* (machine name appended) and this renames the Workspace onto it. Only a
		* Workspace still showing the shell's own default title is touched, so a name
		* the operator chose is never overwritten.
		* @param anchors - the anchors as the host reports them.
		*/
		async function syncWorkspaceTitles(anchors) {
			const face = workspaceFace();
			if (face === void 0) return;
			watchWorkspaceTitles(face);
			const items = workspaceItems();
			for (const anchor of anchors) {
				if (anchor.title === anchor.defaultTitle) continue;
				const item = items.find((i) => sameLocalDir(i.path, anchor.dir));
				if (item === void 0 || item.title !== anchor.defaultTitle) continue;
				const key = `${item.workspaceId}\u0000${anchor.title}`;
				if (titleAttempts.has(key)) continue;
				titleAttempts.add(key);
				try {
					await face.rename(item.workspaceId, anchor.title);
				} catch {
					titleAttempts.delete(key);
				}
			}
		}
		/**
		* One marker pass: read the anchors, settle the colliding Workspace titles,
		* then rewrite the stylesheet from the titles the rows actually show.
		*/
		async function runRefresh() {
			const { anchors } = await anchorStatus();
			aliases = new Map(anchors.map((a) => [a.dir, a.remotePath]));
			await syncWorkspaceTitles(anchors);
			const tag = document.querySelector(TAG_SELECTOR);
			if (tag) tag.textContent = anchorTreeCss(anchorMarks(anchors, workspaceItems()));
			scheduleAliasApply();
		}
		/**
		* Create the marker stylesheet tag, start the alias observer, and load the
		* initial anchor set. They outlive the call; later changes rewrite them
		* through {@link refreshTreeMark}.
		* @param lookup - context service lookup, for the client Workspace service.
		* @returns the remover (composition teardown).
		*/
		function startTreeMark(lookup) {
			if (typeof document === "undefined") return () => {};
			services = lookup;
			const tag = document.createElement("style");
			tag.dataset.pluginCss = "dsh-remote-development-tree";
			document.head.appendChild(tag);
			if (typeof MutationObserver === "function") {
				aliasObserver = new MutationObserver(scheduleAliasApply);
				aliasObserver.observe(document.body, {
					childList: true,
					subtree: true,
					characterData: true
				});
			}
			refreshTreeMark();
			return () => {
				tag.remove();
				aliasObserver?.disconnect();
				aliasObserver = void 0;
				unsubscribeFace?.();
				unsubscribeFace = void 0;
				subscribedFace = void 0;
				services = void 0;
				titleAttempts.clear();
				aliases = /* @__PURE__ */ new Map();
			};
		}
		/**
		* Re-fetch the anchors and rewrite the marker stylesheet and the alias table.
		* A failed fetch keeps the previous coloring and aliases: a stale marker
		* beats a missing one, and nothing else can act on a failed status read.
		* Calls coalesce: a refresh requested while one runs queues exactly one more
		* pass, so the Workspace subscription cannot pile up overlapping fetches.
		* @returns the running pass.
		*/
		function refreshTreeMark() {
			if (typeof document === "undefined") return Promise.resolve();
			if (refreshInFlight !== null) {
				refreshQueued = true;
				return refreshInFlight;
			}
			refreshInFlight = (async () => {
				do {
					refreshQueued = false;
					try {
						await runRefresh();
					} catch {}
				} while (refreshQueued);
			})().finally(() => {
				refreshInFlight = null;
			});
			return refreshInFlight;
		}
		//#endregion
		//#region src/paths.ts
		/**
		* Collapse `//`, strip a trailing slash (except the root), and resolve `.`/`..`
		* lexically. No I/O: remote realpath is a separate round trip callers opt into.
		* @param p - remote path to normalize.
		* @returns the normalized absolute-or-relative remote path.
		*/
		function normalizeRemotePath(p) {
			let s = String(p ?? "").replace(/\\/g, "/");
			if (!s) return "";
			const absolute = s.startsWith("/");
			const out = [];
			for (const seg of s.split("/")) {
				if (seg === "" || seg === ".") continue;
				if (seg === "..") {
					if (out.length > 0 && out[out.length - 1] !== "..") out.pop();
					else if (!absolute) out.push("..");
					continue;
				}
				out.push(seg);
			}
			const joined = out.join("/");
			if (absolute) return "/" + joined;
			return joined || ".";
		}
		/**
		* The parent directory of a remote path.
		* @param p - remote path.
		* @returns the parent path ('/' for root children, '.' for a bare name).
		*/
		function remoteDirname(p) {
			const norm = normalizeRemotePath(p);
			const i = norm.lastIndexOf("/");
			if (i < 0) return ".";
			if (i === 0) return "/";
			return norm.slice(0, i);
		}
		//#endregion
		//#region src/client/flow.tsx
		/**
		* The workspace directory-flow occupant: fills ui-workspace's two
		* directory-flow holes with one dialog covering both worlds — 本机 reuses the
		* host picker service, 远程 browses the remote machine over the plugin's JSON
		* routes and commits an anchor workspace.
		* @module dsh-remote-development/client/flow
		*/
		/**
		* The composed picker interaction, probed once per page: the host resolves
		* the seam at boot, so the answer is stable for the page's lifetime.
		*/
		let cachedPickerKind = null;
		const FOLDER_ICON$1 = (0, react.createElement)("span", {
			className: "rdv-itemIcon",
			"aria-hidden": true
		}, (0, react.createElement)("svg", {
			width: 14,
			height: 14,
			viewBox: "0 0 16 16",
			fill: "none"
		}, (0, react.createElement)("path", {
			d: "M1.5 4.5A1.5 1.5 0 0 1 3 3h3l1.5 1.5H13A1.5 1.5 0 0 1 14.5 6v5A1.5 1.5 0 0 1 13 12.5H3A1.5 1.5 0 0 1 1.5 11v-6.5Z",
			stroke: "currentColor",
			"stroke-width": 1.2
		})));
		/**
		* The unified picker dialog. Renders nothing while the flow is closed.
		* @param props - owner conversation plus the injected picking face.
		* @returns the dialog element.
		*/
		function RemoteFlow(props) {
			const { open, busy, onPicked, onCancel, t } = props;
			const [tab, setTab] = (0, react.useState)("local");
			const [machines, setMachines] = (0, react.useState)([]);
			const [machineId, setMachineId] = (0, react.useState)("");
			const [path, setPath] = (0, react.useState)("");
			const [entries, setEntries] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [mkdirOpen, setMkdirOpen] = (0, react.useState)(false);
			const [mkdirName, setMkdirName] = (0, react.useState)("");
			const [localKind, setLocalKind] = (0, react.useState)(cachedPickerKind ?? "probing");
			const [localPath, setLocalPath] = (0, react.useState)("");
			const [localCrumbs, setLocalCrumbs] = (0, react.useState)([]);
			const [localEntries, setLocalEntries] = (0, react.useState)([]);
			const [localRoots, setLocalRoots] = (0, react.useState)([]);
			const [localLoading, setLocalLoading] = (0, react.useState)(false);
			const [localBooted, setLocalBooted] = (0, react.useState)(false);
			const [localMkdirOpen, setLocalMkdirOpen] = (0, react.useState)(false);
			const [localMkdirName, setLocalMkdirName] = (0, react.useState)("");
			const dialogRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const dialog = dialogRef.current;
				if (dialog === null) return;
				const scrollerFor = (target) => {
					let el = target instanceof HTMLElement ? target : null;
					while (el !== null && el !== dialog) {
						const overflowY = getComputedStyle(el).overflowY;
						if (el.scrollHeight > el.clientHeight && (overflowY === "auto" || overflowY === "scroll")) return el;
						el = el.parentElement;
					}
					return null;
				};
				const onWheel = (event) => {
					event.preventDefault();
					const scroller = scrollerFor(event.target);
					if (scroller === null) return;
					scroller.scrollTop += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
				};
				dialog.addEventListener("wheel", onWheel, {
					capture: true,
					passive: false
				});
				return () => dialog.removeEventListener("wheel", onWheel, { capture: true });
			}, [open]);
			const loadMachines = (0, react.useCallback)(() => {
				props.listMachines().then((r) => {
					setMachines(r.machines);
					const preferred = r.machines[0];
					if (preferred) setMachineId((prev) => r.machines.some((m) => m.id === prev) ? prev : preferred.id);
				}).catch((err) => setError(err.message));
			}, [props]);
			const loadDir = (0, react.useCallback)((target) => {
				if (!machineId) return;
				setLoading(true);
				setError("");
				props.listRemoteDir(machineId, target).then((r) => {
					setLoading(false);
					if (!r.ok) {
						setError(r.error ?? t("picker.loading"));
						return;
					}
					setPath(r.path);
					setEntries(r.entries);
				}).catch((err) => {
					setLoading(false);
					setError(err.message);
				});
			}, [
				machineId,
				props,
				t
			]);
			(0, react.useEffect)(() => {
				if (open && tab === "remote") loadMachines();
			}, [
				open,
				tab,
				loadMachines
			]);
			(0, react.useEffect)(() => {
				if (open && tab === "remote" && machineId && !path) loadDir("~");
			}, [
				open,
				tab,
				machineId,
				path,
				loadDir
			]);
			const loadLocalDir = (0, react.useCallback)((target) => {
				setLocalLoading(true);
				setError("");
				props.listLocalDir(target).then((r) => {
					setLocalLoading(false);
					if (!r.ok) {
						setError(r.error);
						return;
					}
					setLocalPath(r.listing.path);
					setLocalCrumbs(r.listing.crumbs);
					setLocalEntries(r.listing.entries);
					setLocalRoots(r.listing.roots);
				}).catch((err) => {
					setLocalLoading(false);
					setError(err.message);
				});
			}, [props]);
			(0, react.useEffect)(() => {
				if (!open || tab !== "local") return;
				if (cachedPickerKind) {
					setLocalKind(cachedPickerKind);
					return;
				}
				let cancelled = false;
				props.pickerKind().then((r) => {
					if (cancelled) return;
					if (r.kind === "browse" || r.kind === "native") cachedPickerKind = r.kind;
					setLocalKind(r.kind === "browse" ? "browse" : "native");
				}).catch(() => {
					if (!cancelled) setLocalKind("native");
				});
				return () => {
					cancelled = true;
				};
			}, [
				open,
				tab,
				props
			]);
			(0, react.useEffect)(() => {
				if (open && tab === "local" && localKind === "browse" && !localBooted) {
					setLocalBooted(true);
					loadLocalDir();
				}
			}, [
				open,
				tab,
				localKind,
				localBooted,
				loadLocalDir
			]);
			if (!open) return (0, react.createElement)("div", { style: { display: "contents" } });
			const chooseLocal = () => {
				props.pickLocal().then((picked) => {
					if (picked) onPicked(picked);
				}).catch(() => {
					cachedPickerKind = "browse";
					setLocalKind("browse");
					setLocalBooted(false);
					setError(t("picker.localFallback"));
				});
			};
			const commit = () => {
				setCreating(true);
				setError("");
				props.createAnchor(machineId, path).then((r) => {
					setCreating(false);
					if (r.ok) {
						props.refreshTreeMark();
						onPicked(r.anchorPath);
					} else setError(r.error ?? "");
				}).catch((err) => {
					setCreating(false);
					setError(err.message);
				});
			};
			const mkdir = () => {
				props.createRemoteDir(machineId, path, mkdirName.trim()).then((r) => {
					if (r.ok) {
						setMkdirOpen(false);
						setMkdirName("");
						loadDir(r.path);
					} else setError(r.error ?? "");
				}).catch((err) => setError(err.message));
			};
			/** Jump to the listed directory's parent through its breadcrumb ancestry. */
			const upLocal = () => {
				const parent = localCrumbs.length >= 2 ? localCrumbs[localCrumbs.length - 2] : null;
				if (parent) loadLocalDir(parent.path);
			};
			const localMkdir = () => {
				props.createLocalDir(localPath, localMkdirName.trim()).then((r) => {
					if (!r.ok) {
						setError(r.error);
						return;
					}
					setLocalMkdirOpen(false);
					setLocalMkdirName("");
					loadLocalDir(r.path);
				}).catch((err) => setError(err.message));
			};
			const commitLocal = () => {
				if (localPath) onPicked(localPath);
			};
			return (0, react.createElement)("div", {
				className: "rdv-dialog",
				ref: dialogRef,
				role: "dialog",
				"aria-modal": true,
				"aria-label": t("picker.title"),
				onKeyDown: (e) => {
					if (e.key === "Escape") onCancel();
				}
			}, (0, react.createElement)("div", { className: "rdv-sheet" }, (0, react.createElement)("div", { className: "rdv-sheetHead" }, (0, react.createElement)("div", {
				className: "rdv-tabs",
				role: "tablist"
			}, (0, react.createElement)("button", {
				type: "button",
				role: "tab",
				"aria-selected": tab === "local",
				className: `rdv-tab${tab === "local" ? " rdv-tabActive" : ""}`,
				onClick: () => setTab("local")
			}, t("picker.tabLocal")), (0, react.createElement)("button", {
				type: "button",
				role: "tab",
				"aria-selected": tab === "remote",
				className: `rdv-tab${tab === "remote" ? " rdv-tabActive" : ""}`,
				onClick: () => setTab("remote")
			}, t("picker.tabRemote"))), (0, react.createElement)("div", { className: "rdv-spacer" })), tab === "local" ? localKind === "browse" ? (0, react.createElement)("div", { className: "rdv-sheetBody" }, (0, react.createElement)("p", { className: "rdv-hint" }, t("picker.localHint")), (0, react.createElement)("div", { className: "rdv-toolbar" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				className: "rdv-pathInput",
				value: localPath,
				onChange: (e) => setLocalPath(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") loadLocalDir(localPath);
				},
				placeholder: "/home/dev/project",
				spellCheck: false,
				autoComplete: "off",
				"aria-label": t("picker.path")
			}), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadLocalDir()
			}, t("picker.home")), localRoots.length > 1 && (0, react.createElement)("select", {
				className: "rdv-select",
				value: localRoots.find((root) => localPath.startsWith(root)) ?? localRoots[0] ?? "",
				disabled: localLoading,
				"aria-label": t("picker.drive"),
				onChange: (e) => loadLocalDir(e.target.value)
			}, localRoots.map((root) => (0, react.createElement)("option", {
				key: root,
				value: root
			}, root.length === 3 ? root.slice(0, 2) : root))), localCrumbs.length >= 2 && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: upLocal
			}, t("picker.up")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadLocalDir(localPath)
			}, t("picker.refresh"))), (0, react.createElement)("div", {
				className: "rdv-list",
				role: "listbox"
			}, localLoading && (0, react.createElement)("div", { className: "rdv-empty" }, t("picker.loading")), !localLoading && localEntries.length === 0 && (0, react.createElement)("div", { className: "rdv-empty" }, t("picker.empty")), localEntries.map((e) => (0, react.createElement)("button", {
				key: e.path,
				type: "button",
				role: "option",
				className: "rdv-itemRow",
				onClick: () => loadLocalDir(e.path)
			}, FOLDER_ICON$1, (0, react.createElement)("span", { className: "rdv-itemName" }, e.name)))), (0, react.createElement)("div", { className: "rdv-toolbar" }, localMkdirOpen ? (0, react.createElement)("div", {
				className: "rdv-toolbar",
				style: { flex: 1 }
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				className: "rdv-pathInput",
				value: localMkdirName,
				onChange: (e) => setLocalMkdirName(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") localMkdir();
				},
				placeholder: t("picker.folderName"),
				autoFocus: true,
				"aria-label": t("picker.folderName")
			}), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: localMkdir
			}, t("picker.create"))) : (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => setLocalMkdirOpen(true)
			}, t("picker.newFolder")))) : (0, react.createElement)("div", { className: "rdv-sheetBody" }, (0, react.createElement)("p", { className: "rdv-hint" }, t("picker.localHint")), (0, react.createElement)("div", {
				className: "rdv-actions",
				style: { justifyContent: "flex-start" }
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				onClick: chooseLocal
			}, t("picker.localChoose")))) : (0, react.createElement)("div", { className: "rdv-sheetBody" }, (0, react.createElement)("p", { className: "rdv-hint" }, t("picker.remoteHint")), machines.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("settings.noMachines")) : (0, react.createElement)("div", { className: "rdv-toolbar" }, (0, react.createElement)("select", {
				className: "rdv-select",
				value: machineId,
				"aria-label": t("picker.machine"),
				onChange: (e) => {
					setMachineId(e.target.value);
					setPath("");
					setEntries([]);
				}
			}, machines.map((m) => (0, react.createElement)("option", {
				key: m.id,
				value: m.id
			}, `${m.name} (${m.username}@${m.host})`))), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadDir("~")
			}, t("picker.home")), path.startsWith("/") && path !== "/" && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadDir(remoteDirname(path))
			}, t("picker.up")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadDir(path)
			}, t("picker.refresh"))), machines.length > 0 && (0, react.createElement)("div", { className: "rdv-toolbar" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				className: "rdv-pathInput",
				value: path,
				onChange: (e) => setPath(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") loadDir(path);
				},
				placeholder: "/home/dev/project",
				spellCheck: false,
				autoComplete: "off",
				"aria-label": t("picker.path")
			}), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => loadDir(path)
			}, t("picker.refresh"))), machines.length > 0 && (0, react.createElement)("div", {
				className: "rdv-list",
				role: "listbox"
			}, loading && (0, react.createElement)("div", { className: "rdv-empty" }, t("picker.loading")), !loading && entries.length === 0 && (0, react.createElement)("div", { className: "rdv-empty" }, t("picker.empty")), entries.filter((e) => e.dir).map((e) => (0, react.createElement)("button", {
				key: e.path,
				type: "button",
				role: "option",
				className: "rdv-itemRow",
				onClick: () => loadDir(e.path)
			}, FOLDER_ICON$1, (0, react.createElement)("span", { className: "rdv-itemName" }, e.name)))), machines.length > 0 && (0, react.createElement)("div", { className: "rdv-toolbar" }, mkdirOpen ? (0, react.createElement)("div", {
				className: "rdv-toolbar",
				style: { flex: 1 }
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				className: "rdv-pathInput",
				value: mkdirName,
				onChange: (e) => setMkdirName(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") mkdir();
				},
				placeholder: t("picker.folderName"),
				autoFocus: true,
				"aria-label": t("picker.folderName")
			}), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: mkdir
			}, t("picker.create"))) : (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				onClick: () => setMkdirOpen(true)
			}, t("picker.newFolder")))), error && (0, react.createElement)("div", {
				className: "rdv-error",
				style: { padding: "0 18px 10px" }
			}, error), (0, react.createElement)("div", { className: "rdv-sheetFoot" }, (0, react.createElement)("span", { className: "rdv-status" }, tab === "remote" && path ? path : tab === "local" && localKind === "browse" && localPath ? localPath : ""), (0, react.createElement)("div", { className: "rdv-spacer" }), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, { onClick: onCancel }, t("picker.cancel")), tab === "remote" && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				disabled: busy || creating || loading || !machineId || !path,
				onClick: commit
			}, creating ? t("picker.committing") : t("picker.commit")), tab === "local" && localKind === "browse" && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				disabled: busy || localLoading || !localPath,
				onClick: commitLocal
			}, t("picker.localCommit")))));
		}
		//#endregion
		//#region src/client/settings.tsx
		/**
		* The settings page: the saved-machine registry (add, edit, test, delete).
		* Pure presentation — every fact and callback arrives through the props
		* shares. Machines are standby connection records only: which machine serves
		* a workspace is decided by that workspace's anchor, so there is no
		* "current machine" to pick here.
		* @module dsh-remote-development/client/settings
		*/
		const EMPTY_DRAFT = {
			id: "",
			name: "",
			host: "",
			port: "22",
			username: "root",
			auth: "password",
			password: "",
			hasPassword: false,
			privateKeyPath: "",
			proxyHost: "",
			proxyPort: "22",
			proxyUser: "",
			keyboardInteractive: false,
			color: ""
		};
		/** The `probing` sentinel for a probe of the open form rather than a saved machine. */
		const DRAFT_PROBE = "draft";
		function field(label, value, onChange, placeholder, type) {
			return (0, react.createElement)("label", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, label), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				value,
				type: type ?? "text",
				placeholder,
				onChange: (e) => onChange(e.target.value),
				autoComplete: "off",
				spellCheck: false
			}));
		}
		/** Preset marker colors offered in the palette (readable as icon colors on light and dark themes). */
		const COLOR_PRESETS = [
			"#3b82f6",
			"#22c55e",
			"#ef4444",
			"#f97316",
			"#8b5cf6",
			"#06b6d4",
			"#ec4899",
			"#14b8a6"
		];
		/**
		* The 远程开发 settings section.
		* @param props - owner conversation plus the injected machine API.
		* @returns the section element.
		*/
		function MachinesSection(props) {
			const { t } = props;
			const [machines, setMachines] = (0, react.useState)([]);
			const [draft, setDraft] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
			const [deleteError, setDeleteError] = (0, react.useState)("");
			const [paletteOpen, setPaletteOpen] = (0, react.useState)(false);
			const [probing, setProbing] = (0, react.useState)(null);
			const [draftResult, setDraftResult] = (0, react.useState)(null);
			const [machineResults, setMachineResults] = (0, react.useState)({});
			const [localPicker, setLocalPicker] = (0, react.useState)("browse");
			const [pickerBusy, setPickerBusy] = (0, react.useState)(false);
			const [version, setVersion] = (0, react.useState)("");
			const [forwards, setForwards] = (0, react.useState)([]);
			const [forwardMachine, setForwardMachine] = (0, react.useState)("");
			const [forwardPort, setForwardPort] = (0, react.useState)("");
			const [forwardHost, setForwardHost] = (0, react.useState)("");
			const [forwardBusy, setForwardBusy] = (0, react.useState)(false);
			const [forwardError, setForwardError] = (0, react.useState)("");
			const [envBusy, setEnvBusy] = (0, react.useState)(null);
			const [envResults, setEnvResults] = (0, react.useState)({});
			const [copied, setCopied] = (0, react.useState)("");
			const refreshForwards = (0, react.useCallback)(() => {
				props.listForwards().then((r) => {
					setForwards(r.forwards);
					setForwardError(r.lastError);
				}).catch((err) => setForwardError(err.message));
			}, [props]);
			(0, react.useEffect)(() => {
				refreshForwards();
			}, [refreshForwards]);
			/**
			* Open one forward from the form, defaulting the machine to the first saved
			* one: a single-machine setup never has to pick twice.
			*/
			const openForward = () => {
				const machineId = forwardMachine || machines[0]?.id || "";
				const remotePort = Number(forwardPort);
				if (machineId === "") {
					setForwardError(t("forwards.machine"));
					return;
				}
				if (!Number.isInteger(remotePort) || remotePort < 1 || remotePort > 65535) {
					setForwardError(t("forwards.remotePort"));
					return;
				}
				setForwardBusy(true);
				setForwardError("");
				props.openForward({
					machineId,
					remotePort,
					...forwardHost.trim() === "" ? {} : { remoteHost: forwardHost.trim() }
				}).then(() => {
					setForwardBusy(false);
					setForwardPort("");
					setNotice(t("forwards.opened"));
					refreshForwards();
				}).catch((err) => {
					setForwardBusy(false);
					setForwardError(err.message);
				});
			};
			const closeForward = (id) => {
				setForwardBusy(true);
				setForwardError("");
				props.closeForward(id).then(() => {
					setForwardBusy(false);
					refreshForwards();
				}).catch((err) => {
					setForwardBusy(false);
					setForwardError(t("forwards.closeFailed") + ": " + err.message);
				});
			};
			(0, react.useEffect)(() => {
				props.getPreferences().then((p) => {
					setLocalPicker(p.localPicker);
					if (typeof p.version === "string") setVersion(p.version);
				}).catch((err) => setError(err.message));
			}, [props]);
			/** Store the picked interaction and re-read the page so the dialog follows it. */
			const choosePicker = (mode) => {
				if (mode === localPicker) return;
				setPickerBusy(true);
				setError("");
				props.setPreferences(mode).then((p) => {
					setLocalPicker(p.localPicker);
					setPickerBusy(false);
					setNotice(t("settings.pickerSaved"));
				}).catch((err) => {
					setError(err.message);
					setPickerBusy(false);
				});
			};
			(0, react.useEffect)(() => {
				if (draft === null) setPaletteOpen(false);
			}, [draft]);
			const refresh = (0, react.useCallback)(() => {
				props.listMachines().then((r) => {
					setMachines(r.machines);
				}).catch((err) => setError(err.message));
			}, [props]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			/**
			* The wire payload for the open draft's fields. An untouched stored password
			* is omitted rather than sent empty, so probing a saved machine's edit keeps
			* the secret the host already holds.
			*
			* The machine `id` is deliberately absent: it identifies the record being
			* replaced on save, but naming it on a probe would make the host test the
			* saved machine instead of the fields actually typed into the form.
			*/
			const draftFields = (0, react.useCallback)((d) => ({
				name: d.name || d.host,
				host: d.host.trim(),
				port: Number(d.port) || 22,
				username: d.username.trim(),
				password: d.auth === "password" ? d.password === "" && d.hasPassword ? void 0 : d.password : "",
				privateKeyPath: d.auth === "key" ? d.privateKeyPath.trim() : "",
				useAgent: d.auth === "agent",
				keyboardInteractive: d.keyboardInteractive,
				proxyHost: d.proxyHost.trim(),
				proxyPort: Number(d.proxyPort) || 22,
				proxyUser: d.proxyUser.trim(),
				color: d.color.trim()
			}), []);
			const resultText = (r) => r.ok ? `${t("settings.connected")}${r.platform ? " · " + t("settings.platform").replace("{platform}", r.platform) : ""}` : r.error ?? t("settings.testFailed");
			/** Probe the open draft, without saving it. */
			const testDraft = () => {
				if (!draft) return;
				if (!draft.host.trim()) {
					setError(t("settings.host") + " ?");
					return;
				}
				setError("");
				setDraftResult(null);
				setProbing(DRAFT_PROBE);
				props.testConnection(draftFields(draft)).then((r) => {
					setDraftResult({
						ok: r.ok,
						text: resultText(r)
					});
					setProbing(null);
				}).catch((err) => {
					setDraftResult({
						ok: false,
						text: err.message
					});
					setProbing(null);
				});
			};
			const save = () => {
				if (!draft) return;
				if (!draft.host.trim()) {
					setError(t("settings.host") + " ?");
					return;
				}
				setBusy(true);
				setError("");
				props.saveMachine({
					...draftFields(draft),
					id: draft.id || void 0
				}).then(() => {
					setDraft(null);
					setBusy(false);
					setDraftResult(null);
					refresh();
					props.refreshTreeMark();
				}).catch((err) => {
					setError(err.message);
					setBusy(false);
				});
			};
			/** Probe one saved machine by id. */
			const test = (machine) => {
				setError("");
				setProbing(machine.id);
				props.testConnection({ machineId: machine.id }).then((r) => {
					setMachineResults((prev) => ({
						...prev,
						[machine.id]: {
							ok: r.ok,
							text: resultText(r)
						}
					}));
					setProbing(null);
				}).catch((err) => {
					setMachineResults((prev) => ({
						...prev,
						[machine.id]: {
							ok: false,
							text: err.message
						}
					}));
					setProbing(null);
				});
			};
			const remove = (machine) => {
				setBusy(true);
				setDeleteError("");
				props.deleteMachine(machine.id).then(() => {
					setBusy(false);
					setDeleteTarget(null);
					setMachineResults((prev) => {
						const next = { ...prev };
						delete next[machine.id];
						return next;
					});
					refresh();
					props.refreshTreeMark();
				}).catch((err) => {
					setBusy(false);
					setDeleteError(err.message);
				});
			};
			/**
			* Measure one machine's remote prerequisites. The button is the page's
			* refresh: it always re-probes, so a machine the operator has just fixed
			* reports its new state instead of the cached one.
			* @param machine - the saved machine to check.
			*/
			const checkEnv = (machine) => {
				setEnvBusy(machine.id);
				props.checkEnvironment(machine.id, true).then((result) => {
					setEnvResults((prev) => ({
						...prev,
						[machine.id]: result
					}));
				}).catch((err) => {
					setEnvResults((prev) => ({
						...prev,
						[machine.id]: {
							ok: false,
							error: err.message
						}
					}));
				}).finally(() => setEnvBusy(null));
			};
			/**
			* Copy one install command. The clipboard is best-effort: a browser that
			* refuses it (insecure context) simply does not change the button label.
			* @param command - the command text to copy.
			*/
			const copyCommand = (command) => {
				if (typeof navigator === "undefined" || navigator.clipboard === void 0) return;
				navigator.clipboard.writeText(command).then(() => {
					setCopied(command);
					setTimeout(() => setCopied(""), 1500);
				}).catch(() => {});
			};
			/** The page's own wording for one problem, falling back to the host's. */
			const problemText = (problem, info) => {
				switch (problem.id) {
					case "arch": return t("env.problem.arch");
					case "bash": return t("env.problem.bash");
					case "rg": return t("env.problem.rg");
					case "git": return t("env.problem.git");
					case "tar": return t("env.problem.tar");
					case "home": return t("env.problem.home", { home: info?.home ?? "~" });
					default: return problem.message;
				}
			};
			/** One machine's environment verdict: summary, problems, copyable fixes. */
			const renderEnv = (check) => {
				if (!check.ok) return (0, react.createElement)("div", { className: "rdv-error" }, `${t("settings.envFailed")}: ${check.error ?? ""}`);
				const problems = check.problems ?? [];
				const info = check.environment;
				return (0, react.createElement)("div", { className: "rdv-env" }, (0, react.createElement)("div", { className: problems.length === 0 ? "rdv-ok" : "rdv-hint" }, problems.length === 0 ? t("settings.envOk", {
					platform: info?.platform ?? "?",
					arch: info?.arch ?? "?"
				}) : t("settings.envProblems", { count: problems.length })), info !== void 0 && (0, react.createElement)("div", { className: "rdv-hint" }, t("settings.envCheckedAt", { time: new Date(info.checkedAt).toLocaleString() })), problems.map((problem) => (0, react.createElement)("div", {
					key: problem.id,
					className: "rdv-envProblem"
				}, (0, react.createElement)("div", { className: problem.severity === "error" ? "rdv-error" : "rdv-hint" }, problemText(problem, info)), problem.commands.map((command) => (0, react.createElement)("div", {
					key: command.label,
					className: "rdv-envCommand"
				}, (0, react.createElement)("span", { className: "rdv-envLabel" }, command.label), (0, react.createElement)("code", { className: "rdv-envCode" }, command.command), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					onClick: () => copyCommand(command.command)
				}, copied === command.command ? t("settings.envCopied") : t("settings.envCopy")), command.note !== void 0 && (0, react.createElement)("div", { className: "rdv-hint" }, command.note))))));
			};
			return (0, react.createElement)("div", { className: "rdv-page" }, (0, react.createElement)("p", { className: "rdv-intro" }, t("settings.intro"), version === "" ? "" : " " + t("settings.version").replace("{version}", version)), (0, react.createElement)("div", { className: "rdv-form" }, (0, react.createElement)("div", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("settings.localPicker")), (0, react.createElement)("select", {
				className: "rdv-select",
				value: localPicker,
				disabled: pickerBusy,
				"aria-label": t("settings.localPicker"),
				onChange: (e) => choosePicker(e.target.value)
			}, (0, react.createElement)("option", { value: "browse" }, t("settings.localPickerBrowse")), (0, react.createElement)("option", { value: "native" }, t("settings.localPickerNative"))), (0, react.createElement)("span", { className: "rdv-hint" }, t("settings.localPickerHint")))), draft === null && (0, react.createElement)("div", {
				className: "rdv-actions",
				style: {
					justifyContent: "flex-start",
					marginTop: 0
				}
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				onClick: () => {
					setDraft({ ...EMPTY_DRAFT });
					setError("");
					setNotice("");
					setDraftResult(null);
				}
			}, t("settings.add"))), error && (0, react.createElement)("div", { className: "rdv-error" }, error), notice && (0, react.createElement)("div", { className: "rdv-ok" }, notice), (0, react.createElement)("div", { className: "rdv-cards" }, machines.length === 0 && draft === null ? (0, react.createElement)("div", { className: "rdv-empty" }, t("settings.noMachines")) : machines.map((m) => {
				const result = machineResults[m.id];
				const env = envResults[m.id];
				return (0, react.createElement)(react.Fragment, { key: m.id }, (0, react.createElement)("div", { className: "rdv-card" }, (0, react.createElement)("div", { className: "rdv-cardMain" }, (0, react.createElement)("div", { className: "rdv-cardName" }, m.color !== "" && (0, react.createElement)("span", {
					"aria-hidden": true,
					style: {
						width: 10,
						height: 10,
						borderRadius: 5,
						background: m.color,
						flex: "none"
					}
				}), (0, react.createElement)("span", { style: {
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				} }, m.name)), (0, react.createElement)("div", { className: "rdv-cardHost" }, `${m.username}@${m.host}:${m.port}`)), result && (0, react.createElement)("div", { className: result.ok ? "rdv-ok" : "rdv-error" }, result.text), (0, react.createElement)("div", { className: "rdv-cardActions" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					disabled: busy || probing !== null,
					onClick: () => test(m)
				}, probing === m.id ? t("settings.testing") : t("settings.test")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					disabled: busy || envBusy !== null,
					onClick: () => checkEnv(m)
				}, envBusy === m.id ? t("settings.envChecking") : env !== void 0 ? t("settings.envAgain") : t("settings.envCheck")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					disabled: busy || probing !== null,
					onClick: () => {
						setError("");
						setDraftResult(null);
						setDraft({
							id: m.id,
							name: m.name,
							host: m.host,
							port: String(m.port),
							username: m.username,
							auth: m.hasPassword ? "password" : m.privateKeyPath ? "key" : "agent",
							password: "",
							hasPassword: m.hasPassword,
							privateKeyPath: m.privateKeyPath,
							proxyHost: m.proxyHost,
							proxyPort: String(m.proxyPort || 22),
							proxyUser: m.proxyUser,
							keyboardInteractive: m.keyboardInteractive,
							color: m.color
						});
					}
				}, t("settings.edit")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					disabled: busy || probing !== null,
					onClick: () => {
						setDeleteTarget(m);
						setDeleteError("");
					}
				}, t("settings.delete")))), env !== void 0 && renderEnv(env));
			})), (0, react.createElement)("div", { className: "rdv-sectionTitle" }, t("forwards.title")), (0, react.createElement)("p", { className: "rdv-intro" }, t("forwards.intro")), (0, react.createElement)("div", { className: "rdv-cards" }, forwards.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("forwards.none")) : forwards.map((f) => (0, react.createElement)("div", {
				key: f.id,
				className: "rdv-forwardRow"
			}, (0, react.createElement)("span", {
				className: "rdv-forwardUrl",
				title: f.url
			}, f.url), (0, react.createElement)("span", { className: "rdv-forwardTarget" }, `${f.remoteHost}:${f.remotePort}`), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				disabled: forwardBusy,
				onClick: () => closeForward(f.id)
			}, t("forwards.close"))))), machines.length > 0 && (0, react.createElement)("div", { className: "rdv-row" }, (0, react.createElement)("label", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("forwards.machine")), (0, react.createElement)("select", {
				className: "rdv-select",
				value: forwardMachine || machines[0]?.id || "",
				onChange: (e) => setForwardMachine(e.target.value)
			}, machines.map((m) => (0, react.createElement)("option", {
				key: m.id,
				value: m.id
			}, m.name)))), field(t("forwards.remotePort"), forwardPort, (v) => setForwardPort(v), "3000", "number"), field(t("forwards.remoteHost"), forwardHost, (v) => setForwardHost(v), "127.0.0.1")), machines.length > 0 && (0, react.createElement)("div", {
				className: "rdv-actions",
				style: {
					justifyContent: "flex-start",
					marginTop: 0
				}
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				disabled: forwardBusy,
				onClick: openForward
			}, t("forwards.open"))), (0, react.createElement)("p", { className: "rdv-hint" }, t("forwards.localOnly")), forwardError !== "" && (0, react.createElement)("div", { className: "rdv-error" }, forwardError), draft !== null && (0, react.createElement)("div", { className: "rdv-form" }, (0, react.createElement)("div", { className: "rdv-row" }, field(t("settings.name"), draft.name, (v) => setDraft({
				...draft,
				name: v
			}), draft.host || "my-server"), field(t("settings.host"), draft.host, (v) => setDraft({
				...draft,
				host: v
			}), "203.0.113.10"), field(t("settings.port"), draft.port, (v) => setDraft({
				...draft,
				port: v
			}), "22"), field(t("settings.username"), draft.username, (v) => setDraft({
				...draft,
				username: v
			}), "root")), (0, react.createElement)("div", { className: "rdv-row" }, (0, react.createElement)("label", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("settings.auth")), (0, react.createElement)("select", {
				className: "rdv-select",
				value: draft.auth,
				onChange: (e) => setDraft({
					...draft,
					auth: e.target.value
				})
			}, (0, react.createElement)("option", { value: "password" }, t("settings.authPassword")), (0, react.createElement)("option", { value: "key" }, t("settings.authKey")), (0, react.createElement)("option", { value: "agent" }, t("settings.authAgent")))), draft.auth === "password" && field(t("settings.password"), draft.password, (v) => setDraft({
				...draft,
				password: v
			}), draft.id && draft.hasPassword && !draft.password ? t("settings.passwordKeep") : "", "password"), draft.auth === "key" && field(t("settings.privateKeyPath"), draft.privateKeyPath, (v) => setDraft({
				...draft,
				privateKeyPath: v
			}), "~/.ssh/id_ed25519")), (0, react.createElement)("div", { className: "rdv-row" }, (0, react.createElement)("div", {
				className: "rdv-field",
				style: { position: "relative" }
			}, (0, react.createElement)("span", { className: "rdv-label" }, t("settings.color")), (0, react.createElement)("button", {
				type: "button",
				className: "rdv-colorTrigger",
				onClick: () => setPaletteOpen(!paletteOpen)
			}, draft.color !== "" && (0, react.createElement)("span", {
				className: "rdv-colorDot",
				style: { background: draft.color }
			}), (0, react.createElement)("span", null, draft.color === "" ? t("settings.colorDefault") : draft.color)), paletteOpen && draft !== null && (0, react.createElement)(react.Fragment, null, (0, react.createElement)("div", {
				className: "rdv-paletteBackdrop",
				onClick: () => setPaletteOpen(false)
			}), (0, react.createElement)("div", {
				className: "rdv-palette",
				role: "listbox",
				"aria-label": t("settings.color")
			}, (0, react.createElement)("button", {
				type: "button",
				role: "option",
				"aria-selected": draft.color === "",
				className: "rdv-swatch rdv-swatchDefault" + (draft.color === "" ? " rdv-swatchActive" : ""),
				title: t("settings.colorDefault"),
				onClick: () => {
					setDraft({
						...draft,
						color: ""
					});
					setPaletteOpen(false);
				}
			}), COLOR_PRESETS.map((c) => (0, react.createElement)("button", {
				key: c,
				type: "button",
				role: "option",
				"aria-selected": draft.color.toLowerCase() === c,
				className: "rdv-swatch" + (draft.color.toLowerCase() === c ? " rdv-swatchActive" : ""),
				style: { background: c },
				title: c,
				onClick: () => {
					setDraft({
						...draft,
						color: c
					});
					setPaletteOpen(false);
				}
			})))))), (0, react.createElement)("details", { className: "rdv-field" }, (0, react.createElement)("summary", {
				className: "rdv-label",
				style: { cursor: "pointer" }
			}, t("settings.advanced")), (0, react.createElement)("div", {
				className: "rdv-row",
				style: { marginTop: 8 }
			}, field(t("settings.proxyHost"), draft.proxyHost, (v) => setDraft({
				...draft,
				proxyHost: v
			}), ""), field(t("settings.proxyPort"), draft.proxyPort, (v) => setDraft({
				...draft,
				proxyPort: v
			}), "22"), field(t("settings.proxyUser"), draft.proxyUser, (v) => setDraft({
				...draft,
				proxyUser: v
			}), "")), (0, react.createElement)("label", {
				className: "rdv-label",
				style: {
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginTop: 8
				}
			}, (0, react.createElement)("input", {
				type: "checkbox",
				checked: draft.keyboardInteractive,
				onChange: (e) => setDraft({
					...draft,
					keyboardInteractive: e.target.checked
				})
			}), t("settings.keyboardInteractive"))), draftResult && (0, react.createElement)("div", { className: draftResult.ok ? "rdv-ok" : "rdv-error" }, draftResult.text), (0, react.createElement)("div", { className: "rdv-actions" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				disabled: busy,
				onClick: () => {
					setDraft(null);
					setDraftResult(null);
				}
			}, t("settings.cancel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				disabled: busy || probing !== null,
				onClick: testDraft
			}, probing === DRAFT_PROBE ? t("settings.testing") : t("settings.test")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "primary",
				disabled: busy,
				onClick: save
			}, t("settings.save")))), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: deleteTarget !== null,
				onClose: () => {
					if (!busy) setDeleteTarget(null);
				},
				title: t("settings.deleteTitle"),
				closeLabel: t("settings.cancel"),
				description: deleteTarget === null ? "" : t("settings.deleteConfirm").replace("{name}", `${deleteTarget.name} (${deleteTarget.username}@${deleteTarget.host}:${deleteTarget.port})`),
				footer: (0, react.createElement)(react.Fragment, null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					autoFocus: true,
					disabled: busy,
					onClick: () => setDeleteTarget(null)
				}, t("settings.cancel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: busy || deleteTarget === null,
					onClick: () => {
						if (deleteTarget !== null) remove(deleteTarget);
					}
				}, t("settings.confirmDelete")))
			}, deleteError === "" ? null : (0, react.createElement)("p", {
				className: "rdv-error",
				style: { margin: 0 }
			}, deleteError)));
		}
		//#endregion
		//#region src/client/reference.ts
		/**
		* Register the notice source on the `@` trigger.
		* @param ctx - client root context.
		* @param sessionRemoteFn - the session-remote API call.
		* @param t - localized copy.
		*/
		function registerReferenceSource(ctx, sessionRemoteFn, t) {
			const source = {
				trigger: "@",
				name: "@jackguo0310/dsh-remote",
				showGroupTitle: false,
				async candidates(session, req) {
					if (req.quoted === true) return [];
					let remote = false;
					try {
						remote = (await sessionRemoteFn(session.sessionId)).remote;
					} catch {
						return [];
					}
					if (!remote) return [];
					return [{
						name: t("reference.unsupportedName"),
						description: t("reference.unsupportedDescription"),
						value: "rdv:reference-unsupported"
					}];
				},
				onPick: () => "handled"
			};
			ctx.effect(() => ctx.inputTriggers.registerSource(source), "dsh-remote-development: @ source");
		}
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/core.js
		var require_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function deepFreeze(obj) {
				if (obj instanceof Map) obj.clear = obj.delete = obj.set = function() {
					throw new Error("map is read-only");
				};
				else if (obj instanceof Set) obj.add = obj.clear = obj.delete = function() {
					throw new Error("set is read-only");
				};
				Object.freeze(obj);
				Object.getOwnPropertyNames(obj).forEach((name) => {
					const prop = obj[name];
					const type = typeof prop;
					if ((type === "object" || type === "function") && !Object.isFrozen(prop)) deepFreeze(prop);
				});
				return obj;
			}
			/** @typedef {import('highlight.js').CallbackResponse} CallbackResponse */
			/** @typedef {import('highlight.js').CompiledMode} CompiledMode */
			/** @implements CallbackResponse */
			var Response = class {
				/**
				* @param {CompiledMode} mode
				*/
				constructor(mode) {
					if (mode.data === void 0) mode.data = {};
					this.data = mode.data;
					this.isMatchIgnored = false;
				}
				ignoreMatch() {
					this.isMatchIgnored = true;
				}
			};
			/**
			* @param {string} value
			* @returns {string}
			*/
			function escapeHTML(value) {
				return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
			}
			/**
			* performs a shallow merge of multiple objects into one
			*
			* @template T
			* @param {T} original
			* @param {Record<string,any>[]} objects
			* @returns {T} a single new object
			*/
			function inherit$1(original, ...objects) {
				/** @type Record<string,any> */
				const result = Object.create(null);
				for (const key in original) result[key] = original[key];
				objects.forEach(function(obj) {
					for (const key in obj) result[key] = obj[key];
				});
				return result;
			}
			/**
			* @typedef {object} Renderer
			* @property {(text: string) => void} addText
			* @property {(node: Node) => void} openNode
			* @property {(node: Node) => void} closeNode
			* @property {() => string} value
			*/
			/** @typedef {{scope?: string, language?: string, sublanguage?: boolean}} Node */
			/** @typedef {{walk: (r: Renderer) => void}} Tree */
			/** */
			const SPAN_CLOSE = "</span>";
			/**
			* Determines if a node needs to be wrapped in <span>
			*
			* @param {Node} node */
			const emitsWrappingTags = (node) => {
				return !!node.scope;
			};
			/**
			*
			* @param {string} name
			* @param {{prefix:string}} options
			*/
			const scopeToCSSClass = (name, { prefix }) => {
				if (name.startsWith("language:")) return name.replace("language:", "language-");
				if (name.includes(".")) {
					const pieces = name.split(".");
					return [`${prefix}${pieces.shift()}`, ...pieces.map((x, i) => `${x}${"_".repeat(i + 1)}`)].join(" ");
				}
				return `${prefix}${name}`;
			};
			/** @type {Renderer} */
			var HTMLRenderer = class {
				/**
				* Creates a new HTMLRenderer
				*
				* @param {Tree} parseTree - the parse tree (must support `walk` API)
				* @param {{classPrefix: string}} options
				*/
				constructor(parseTree, options) {
					this.buffer = "";
					this.classPrefix = options.classPrefix;
					parseTree.walk(this);
				}
				/**
				* Adds texts to the output stream
				*
				* @param {string} text */
				addText(text) {
					this.buffer += escapeHTML(text);
				}
				/**
				* Adds a node open to the output stream (if needed)
				*
				* @param {Node} node */
				openNode(node) {
					if (!emitsWrappingTags(node)) return;
					const className = scopeToCSSClass(node.scope, { prefix: this.classPrefix });
					this.span(className);
				}
				/**
				* Adds a node close to the output stream (if needed)
				*
				* @param {Node} node */
				closeNode(node) {
					if (!emitsWrappingTags(node)) return;
					this.buffer += SPAN_CLOSE;
				}
				/**
				* returns the accumulated buffer
				*/
				value() {
					return this.buffer;
				}
				/**
				* Builds a span element
				*
				* @param {string} className */
				span(className) {
					this.buffer += `<span class="${className}">`;
				}
			};
			/** @typedef {{scope?: string, language?: string, children: Node[]} | string} Node */
			/** @typedef {{scope?: string, language?: string, children: Node[]} } DataNode */
			/** @typedef {import('highlight.js').Emitter} Emitter */
			/**  */
			/** @returns {DataNode} */
			const newNode = (opts = {}) => {
				/** @type DataNode */
				const result = { children: [] };
				Object.assign(result, opts);
				return result;
			};
			var TokenTree = class TokenTree {
				constructor() {
					/** @type DataNode */
					this.rootNode = newNode();
					this.stack = [this.rootNode];
				}
				get top() {
					return this.stack[this.stack.length - 1];
				}
				get root() {
					return this.rootNode;
				}
				/** @param {Node} node */
				add(node) {
					this.top.children.push(node);
				}
				/** @param {string} scope */
				openNode(scope) {
					/** @type Node */
					const node = newNode({ scope });
					this.add(node);
					this.stack.push(node);
				}
				closeNode() {
					if (this.stack.length > 1) return this.stack.pop();
				}
				closeAllNodes() {
					while (this.closeNode());
				}
				toJSON() {
					return JSON.stringify(this.rootNode, null, 4);
				}
				/**
				* @typedef { import("./html_renderer").Renderer } Renderer
				* @param {Renderer} builder
				*/
				walk(builder) {
					return this.constructor._walk(builder, this.rootNode);
				}
				/**
				* @param {Renderer} builder
				* @param {Node} node
				*/
				static _walk(builder, node) {
					if (typeof node === "string") builder.addText(node);
					else if (node.children) {
						builder.openNode(node);
						node.children.forEach((child) => this._walk(builder, child));
						builder.closeNode(node);
					}
					return builder;
				}
				/**
				* @param {Node} node
				*/
				static _collapse(node) {
					if (typeof node === "string") return;
					if (!node.children) return;
					if (node.children.every((el) => typeof el === "string")) node.children = [node.children.join("")];
					else node.children.forEach((child) => {
						TokenTree._collapse(child);
					});
				}
			};
			/**
			Currently this is all private API, but this is the minimal API necessary
			that an Emitter must implement to fully support the parser.
			
			Minimal interface:
			
			- addText(text)
			- __addSublanguage(emitter, subLanguageName)
			- startScope(scope)
			- endScope()
			- finalize()
			- toHTML()
			
			*/
			/**
			* @implements {Emitter}
			*/
			var TokenTreeEmitter = class extends TokenTree {
				/**
				* @param {*} options
				*/
				constructor(options) {
					super();
					this.options = options;
				}
				/**
				* @param {string} text
				*/
				addText(text) {
					if (text === "") return;
					this.add(text);
				}
				/** @param {string} scope */
				startScope(scope) {
					this.openNode(scope);
				}
				endScope() {
					this.closeNode();
				}
				/**
				* @param {Emitter & {root: DataNode}} emitter
				* @param {string} name
				*/
				__addSublanguage(emitter, name) {
					/** @type DataNode */
					const node = emitter.root;
					if (name) node.scope = `language:${name}`;
					this.add(node);
				}
				toHTML() {
					return new HTMLRenderer(this, this.options).value();
				}
				finalize() {
					this.closeAllNodes();
					return true;
				}
			};
			/**
			* @param {string} value
			* @returns {RegExp}
			* */
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function source(re) {
				if (!re) return null;
				if (typeof re === "string") return re;
				return re.source;
			}
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function lookahead(re) {
				return concat("(?=", re, ")");
			}
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function anyNumberOfTimes(re) {
				return concat("(?:", re, ")*");
			}
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function optional(re) {
				return concat("(?:", re, ")?");
			}
			/**
			* @param {...(RegExp | string) } args
			* @returns {string}
			*/
			function concat(...args) {
				return args.map((x) => source(x)).join("");
			}
			/**
			* @param { Array<string | RegExp | Object> } args
			* @returns {object}
			*/
			function stripOptionsFromArgs(args) {
				const opts = args[args.length - 1];
				if (typeof opts === "object" && opts.constructor === Object) {
					args.splice(args.length - 1, 1);
					return opts;
				} else return {};
			}
			/** @typedef { {capture?: boolean} } RegexEitherOptions */
			/**
			* Any of the passed expresssions may match
			*
			* Creates a huge this | this | that | that match
			* @param {(RegExp | string)[] | [...(RegExp | string)[], RegexEitherOptions]} args
			* @returns {string}
			*/
			function either(...args) {
				return "(" + (stripOptionsFromArgs(args).capture ? "" : "?:") + args.map((x) => source(x)).join("|") + ")";
			}
			/**
			* @param {RegExp | string} re
			* @returns {number}
			*/
			function countMatchGroups(re) {
				return new RegExp(re.toString() + "|").exec("").length - 1;
			}
			/**
			* Does lexeme start with a regular expression match at the beginning
			* @param {RegExp} re
			* @param {string} lexeme
			*/
			function startsWith(re, lexeme) {
				const match = re && re.exec(lexeme);
				return match && match.index === 0;
			}
			const BACKREF_RE = new RegExp(either(/\[(?:[^\\\]]|\\.)*\]/, /\(\?<(?![=!])[^>]+>/, /\(\?'[^']+'/, /\(\??/, /\\([1-9][0-9]*)/, /\\./));
			/**
			* @param {(string | RegExp)[]} regexps
			* @param {{joinWith: string}} opts
			* @returns {string}
			*/
			function _rewriteBackreferences(regexps, { joinWith }) {
				let numCaptures = 0;
				return regexps.map((regex) => {
					numCaptures += 1;
					const offset = numCaptures;
					let re = source(regex);
					let out = "";
					while (re.length > 0) {
						const match = BACKREF_RE.exec(re);
						if (!match) {
							out += re;
							break;
						}
						out += re.substring(0, match.index);
						re = re.substring(match.index + match[0].length);
						if (match[0][0] === "\\" && match[1]) out += "\\" + String(Number(match[1]) + offset);
						else {
							out += match[0];
							if (match[0] === "(" || /^\(\?[<']/.test(match[0])) numCaptures++;
						}
					}
					return out;
				}).map((re) => `(${re})`).join(joinWith);
			}
			/** @typedef {import('highlight.js').Mode} Mode */
			/** @typedef {import('highlight.js').ModeCallback} ModeCallback */
			const MATCH_NOTHING_RE = /\b\B/;
			const IDENT_RE = "[a-zA-Z]\\w*";
			const UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
			const NUMBER_RE = "\\b\\d+(\\.\\d+)?";
			const C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
			const BINARY_NUMBER_RE = "\\b(0b[01]+)";
			const RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
			/**
			* @param { Partial<Mode> & {binary?: string | RegExp} } opts
			*/
			const SHEBANG = (opts = {}) => {
				const beginShebang = /^#![ ]*\//;
				if (opts.binary) opts.begin = concat(beginShebang, /.*\b/, opts.binary, /\b.*/);
				return inherit$1({
					scope: "meta",
					begin: beginShebang,
					end: /$/,
					relevance: 0,
					/** @type {ModeCallback} */
					"on:begin": (m, resp) => {
						if (m.index !== 0) resp.ignoreMatch();
					}
				}, opts);
			};
			const BACKSLASH_ESCAPE = {
				begin: "\\\\[\\s\\S]",
				relevance: 0
			};
			const APOS_STRING_MODE = {
				scope: "string",
				begin: "'",
				end: "'",
				illegal: "\\n",
				contains: [BACKSLASH_ESCAPE]
			};
			const QUOTE_STRING_MODE = {
				scope: "string",
				begin: "\"",
				end: "\"",
				illegal: "\\n",
				contains: [BACKSLASH_ESCAPE]
			};
			const PHRASAL_WORDS_MODE = { begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/ };
			/**
			* Creates a comment mode
			*
			* @param {string | RegExp} begin
			* @param {string | RegExp} end
			* @param {Mode | {}} [modeOptions]
			* @returns {Partial<Mode>}
			*/
			const COMMENT = function(begin, end, modeOptions = {}) {
				const mode = inherit$1({
					scope: "comment",
					begin,
					end,
					contains: []
				}, modeOptions);
				mode.contains.push({
					scope: "doctag",
					begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
					end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
					excludeBegin: true,
					relevance: 0
				});
				const ENGLISH_WORD = either("I", "a", "is", "so", "us", "to", "at", "if", "in", "it", "on", /[A-Za-z]+['](d|ve|re|ll|t|s|n)/, /[A-Za-z]+[-][a-z]+/, /[A-Za-z][a-z]{2,}/);
				mode.contains.push({ begin: concat(/[ ]+/, "(", ENGLISH_WORD, /[.]?[:]?([.][ ]|[ ])/, "){3}") });
				return mode;
			};
			const C_LINE_COMMENT_MODE = COMMENT("//", "$");
			const C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
			const HASH_COMMENT_MODE = COMMENT("#", "$");
			const NUMBER_MODE = {
				scope: "number",
				begin: NUMBER_RE,
				relevance: 0
			};
			const C_NUMBER_MODE = {
				scope: "number",
				begin: C_NUMBER_RE,
				relevance: 0
			};
			const BINARY_NUMBER_MODE = {
				scope: "number",
				begin: BINARY_NUMBER_RE,
				relevance: 0
			};
			const REGEXP_MODE = {
				scope: "regexp",
				begin: /\/(?=[^/\n]*\/)/,
				end: /\/[gimuy]*/,
				contains: [BACKSLASH_ESCAPE, {
					begin: /\[/,
					end: /\]/,
					relevance: 0,
					contains: [BACKSLASH_ESCAPE]
				}]
			};
			const TITLE_MODE = {
				scope: "title",
				begin: IDENT_RE,
				relevance: 0
			};
			const UNDERSCORE_TITLE_MODE = {
				scope: "title",
				begin: UNDERSCORE_IDENT_RE,
				relevance: 0
			};
			const METHOD_GUARD = {
				begin: "\\.\\s*[a-zA-Z_]\\w*",
				relevance: 0
			};
			/**
			* Adds end same as begin mechanics to a mode
			*
			* Your mode must include at least a single () match group as that first match
			* group is what is used for comparison
			* @param {Partial<Mode>} mode
			*/
			const END_SAME_AS_BEGIN = function(mode) {
				return Object.assign(mode, {
					/** @type {ModeCallback} */
					"on:begin": (m, resp) => {
						resp.data._beginMatch = m[1];
					},
					/** @type {ModeCallback} */
					"on:end": (m, resp) => {
						if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
					}
				});
			};
			var MODES = /*#__PURE__*/ Object.freeze({
				__proto__: null,
				APOS_STRING_MODE,
				BACKSLASH_ESCAPE,
				BINARY_NUMBER_MODE,
				BINARY_NUMBER_RE,
				COMMENT,
				C_BLOCK_COMMENT_MODE,
				C_LINE_COMMENT_MODE,
				C_NUMBER_MODE,
				C_NUMBER_RE,
				END_SAME_AS_BEGIN,
				HASH_COMMENT_MODE,
				IDENT_RE,
				MATCH_NOTHING_RE,
				METHOD_GUARD,
				NUMBER_MODE,
				NUMBER_RE,
				PHRASAL_WORDS_MODE,
				QUOTE_STRING_MODE,
				REGEXP_MODE,
				RE_STARTERS_RE,
				SHEBANG,
				TITLE_MODE,
				UNDERSCORE_IDENT_RE,
				UNDERSCORE_TITLE_MODE
			});
			/**
			@typedef {import('highlight.js').CallbackResponse} CallbackResponse
			@typedef {import('highlight.js').CompilerExt} CompilerExt
			*/
			/**
			* Skip a match if it has a preceding dot
			*
			* This is used for `beginKeywords` to prevent matching expressions such as
			* `bob.keyword.do()`. The mode compiler automatically wires this up as a
			* special _internal_ 'on:begin' callback for modes with `beginKeywords`
			* @param {RegExpMatchArray} match
			* @param {CallbackResponse} response
			*/
			function skipIfHasPrecedingDot(match, response) {
				if (match.input[match.index - 1] === ".") response.ignoreMatch();
			}
			/**
			*
			* @type {CompilerExt}
			*/
			function scopeClassName(mode, _parent) {
				if (mode.className !== void 0) {
					mode.scope = mode.className;
					delete mode.className;
				}
			}
			/**
			* `beginKeywords` syntactic sugar
			* @type {CompilerExt}
			*/
			function beginKeywords(mode, parent) {
				if (!parent) return;
				if (!mode.beginKeywords) return;
				mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
				mode.__beforeBegin = skipIfHasPrecedingDot;
				mode.keywords = mode.keywords || mode.beginKeywords;
				delete mode.beginKeywords;
				if (mode.relevance === void 0) mode.relevance = 0;
			}
			/**
			* Allow `illegal` to contain an array of illegal values
			* @type {CompilerExt}
			*/
			function compileIllegal(mode, _parent) {
				if (!Array.isArray(mode.illegal)) return;
				mode.illegal = either(...mode.illegal);
			}
			/**
			* `match` to match a single expression for readability
			* @type {CompilerExt}
			*/
			function compileMatch(mode, _parent) {
				if (!mode.match) return;
				if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
				mode.begin = mode.match;
				delete mode.match;
			}
			/**
			* provides the default 1 relevance to all modes
			* @type {CompilerExt}
			*/
			function compileRelevance(mode, _parent) {
				if (mode.relevance === void 0) mode.relevance = 1;
			}
			const beforeMatchExt = (mode, parent) => {
				if (!mode.beforeMatch) return;
				if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
				const originalMode = Object.assign({}, mode);
				Object.keys(mode).forEach((key) => {
					delete mode[key];
				});
				mode.keywords = originalMode.keywords;
				mode.begin = concat(originalMode.beforeMatch, lookahead(originalMode.begin));
				mode.starts = {
					relevance: 0,
					contains: [Object.assign(originalMode, { endsParent: true })]
				};
				mode.relevance = 0;
				delete originalMode.beforeMatch;
			};
			const COMMON_KEYWORDS = [
				"of",
				"and",
				"for",
				"in",
				"not",
				"or",
				"if",
				"then",
				"parent",
				"list",
				"value"
			];
			const DEFAULT_KEYWORD_SCOPE = "keyword";
			/**
			* Given raw keywords from a language definition, compile them.
			*
			* @param {string | Record<string,string|string[]> | Array<string>} rawKeywords
			* @param {boolean} caseInsensitive
			*/
			function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
				/** @type {import("highlight.js/private").KeywordDict} */
				const compiledKeywords = Object.create(null);
				if (typeof rawKeywords === "string") compileList(scopeName, rawKeywords.split(" "));
				else if (Array.isArray(rawKeywords)) compileList(scopeName, rawKeywords);
				else Object.keys(rawKeywords).forEach(function(scopeName) {
					Object.assign(compiledKeywords, compileKeywords(rawKeywords[scopeName], caseInsensitive, scopeName));
				});
				return compiledKeywords;
				/**
				* Compiles an individual list of keywords
				*
				* Ex: "for if when while|5"
				*
				* @param {string} scopeName
				* @param {Array<string>} keywordList
				*/
				function compileList(scopeName, keywordList) {
					if (caseInsensitive) keywordList = keywordList.map((x) => x.toLowerCase());
					keywordList.forEach(function(keyword) {
						const pair = keyword.split("|");
						compiledKeywords[pair[0]] = [scopeName, scoreForKeyword(pair[0], pair[1])];
					});
				}
			}
			/**
			* Returns the proper score for a given keyword
			*
			* Also takes into account comment keywords, which will be scored 0 UNLESS
			* another score has been manually assigned.
			* @param {string} keyword
			* @param {string} [providedScore]
			*/
			function scoreForKeyword(keyword, providedScore) {
				if (providedScore) return Number(providedScore);
				return commonKeyword(keyword) ? 0 : 1;
			}
			/**
			* Determines if a given keyword is common or not
			*
			* @param {string} keyword */
			function commonKeyword(keyword) {
				return COMMON_KEYWORDS.includes(keyword.toLowerCase());
			}
			/**
			* @type {Record<string, boolean>}
			*/
			const seenDeprecations = {};
			/**
			* @param {string} message
			*/
			const error = (message) => {
				console.error(message);
			};
			/**
			* @param {string} message
			* @param {any} args
			*/
			const warn = (message, ...args) => {
				console.log(`WARN: ${message}`, ...args);
			};
			/**
			* @param {string} version
			* @param {string} message
			*/
			const deprecated = (version, message) => {
				if (seenDeprecations[`${version}/${message}`]) return;
				console.log(`Deprecated as of ${version}. ${message}`);
				seenDeprecations[`${version}/${message}`] = true;
			};
			/**
			@typedef {import('highlight.js').CompiledMode} CompiledMode
			*/
			const MultiClassError = /* @__PURE__ */ new Error();
			/**
			* Renumbers labeled scope names to account for additional inner match
			* groups that otherwise would break everything.
			*
			* Lets say we 3 match scopes:
			*
			*   { 1 => ..., 2 => ..., 3 => ... }
			*
			* So what we need is a clean match like this:
			*
			*   (a)(b)(c) => [ "a", "b", "c" ]
			*
			* But this falls apart with inner match groups:
			*
			* (a)(((b)))(c) => ["a", "b", "b", "b", "c" ]
			*
			* Our scopes are now "out of alignment" and we're repeating `b` 3 times.
			* What needs to happen is the numbers are remapped:
			*
			*   { 1 => ..., 2 => ..., 5 => ... }
			*
			* We also need to know that the ONLY groups that should be output
			* are 1, 2, and 5.  This function handles this behavior.
			*
			* @param {CompiledMode} mode
			* @param {Array<RegExp | string>} regexes
			* @param {{key: "beginScope"|"endScope"}} opts
			*/
			function remapScopeNames(mode, regexes, { key }) {
				let offset = 0;
				const scopeNames = mode[key];
				/** @type Record<number,boolean> */
				const emit = {};
				/** @type Record<number,string> */
				const positions = {};
				for (let i = 1; i <= regexes.length; i++) {
					positions[i + offset] = scopeNames[i];
					emit[i + offset] = true;
					offset += countMatchGroups(regexes[i - 1]);
				}
				mode[key] = positions;
				mode[key]._emit = emit;
				mode[key]._multi = true;
			}
			/**
			* @param {CompiledMode} mode
			*/
			function beginMultiClass(mode) {
				if (!Array.isArray(mode.begin)) return;
				if (mode.skip || mode.excludeBegin || mode.returnBegin) {
					error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
					throw MultiClassError;
				}
				if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
					error("beginScope must be object");
					throw MultiClassError;
				}
				remapScopeNames(mode, mode.begin, { key: "beginScope" });
				mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
			}
			/**
			* @param {CompiledMode} mode
			*/
			function endMultiClass(mode) {
				if (!Array.isArray(mode.end)) return;
				if (mode.skip || mode.excludeEnd || mode.returnEnd) {
					error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
					throw MultiClassError;
				}
				if (typeof mode.endScope !== "object" || mode.endScope === null) {
					error("endScope must be object");
					throw MultiClassError;
				}
				remapScopeNames(mode, mode.end, { key: "endScope" });
				mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
			}
			/**
			* this exists only to allow `scope: {}` to be used beside `match:`
			* Otherwise `beginScope` would necessary and that would look weird
			
			{
			match: [ /def/, /\w+/ ]
			scope: { 1: "keyword" , 2: "title" }
			}
			
			* @param {CompiledMode} mode
			*/
			function scopeSugar(mode) {
				if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
					mode.beginScope = mode.scope;
					delete mode.scope;
				}
			}
			/**
			* @param {CompiledMode} mode
			*/
			function MultiClass(mode) {
				scopeSugar(mode);
				if (typeof mode.beginScope === "string") mode.beginScope = { _wrap: mode.beginScope };
				if (typeof mode.endScope === "string") mode.endScope = { _wrap: mode.endScope };
				beginMultiClass(mode);
				endMultiClass(mode);
			}
			/**
			@typedef {import('highlight.js').Mode} Mode
			@typedef {import('highlight.js').CompiledMode} CompiledMode
			@typedef {import('highlight.js').Language} Language
			@typedef {import('highlight.js').HLJSPlugin} HLJSPlugin
			@typedef {import('highlight.js').CompiledLanguage} CompiledLanguage
			*/
			/**
			* Compiles a language definition result
			*
			* Given the raw result of a language definition (Language), compiles this so
			* that it is ready for highlighting code.
			* @param {Language} language
			* @returns {CompiledLanguage}
			*/
			function compileLanguage(language) {
				/**
				* Builds a regex with the case sensitivity of the current language
				*
				* @param {RegExp | string} value
				* @param {boolean} [global]
				*/
				function langRe(value, global) {
					return new RegExp(source(value), "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : ""));
				}
				/**
				Stores multiple regular expressions and allows you to quickly search for
				them all in a string simultaneously - returning the first match.  It does
				this by creating a huge (a|b|c) regex - each individual item wrapped with ()
				and joined by `|` - using match groups to track position.  When a match is
				found checking which position in the array has content allows us to figure
				out which of the original regexes / match groups triggered the match.
				
				The match object itself (the result of `Regex.exec`) is returned but also
				enhanced by merging in any meta-data that was registered with the regex.
				This is how we keep track of which mode matched, and what type of rule
				(`illegal`, `begin`, end, etc).
				*/
				class MultiRegex {
					constructor() {
						this.matchIndexes = {};
						this.regexes = [];
						this.matchAt = 1;
						this.position = 0;
					}
					addRule(re, opts) {
						opts.position = this.position++;
						this.matchIndexes[this.matchAt] = opts;
						this.regexes.push([opts, re]);
						this.matchAt += countMatchGroups(re) + 1;
					}
					compile() {
						if (this.regexes.length === 0) this.exec = () => null;
						const terminators = this.regexes.map((el) => el[1]);
						this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
						this.lastIndex = 0;
					}
					/** @param {string} s */
					exec(s) {
						this.matcherRe.lastIndex = this.lastIndex;
						const match = this.matcherRe.exec(s);
						if (!match) return null;
						const i = match.findIndex((el, i) => i > 0 && el !== void 0);
						const matchData = this.matchIndexes[i];
						match.splice(0, i);
						return Object.assign(match, matchData);
					}
				}
				class ResumableMultiRegex {
					constructor() {
						this.rules = [];
						this.multiRegexes = [];
						this.count = 0;
						this.lastIndex = 0;
						this.regexIndex = 0;
					}
					getMatcher(index) {
						if (this.multiRegexes[index]) return this.multiRegexes[index];
						const matcher = new MultiRegex();
						this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
						matcher.compile();
						this.multiRegexes[index] = matcher;
						return matcher;
					}
					resumingScanAtSamePosition() {
						return this.regexIndex !== 0;
					}
					considerAll() {
						this.regexIndex = 0;
					}
					addRule(re, opts) {
						this.rules.push([re, opts]);
						if (opts.type === "begin") this.count++;
					}
					/** @param {string} s */
					exec(s) {
						const m = this.getMatcher(this.regexIndex);
						m.lastIndex = this.lastIndex;
						let result = m.exec(s);
						if (this.resumingScanAtSamePosition()) {
							if (result && result.index === this.lastIndex);
							else {
								const m2 = this.getMatcher(0);
								m2.lastIndex = this.lastIndex + 1;
								result = m2.exec(s);
							}
						}
						if (result) {
							this.regexIndex += result.position + 1;
							if (this.regexIndex === this.count) this.considerAll();
						}
						return result;
					}
				}
				/**
				* Given a mode, builds a huge ResumableMultiRegex that can be used to walk
				* the content and find matches.
				*
				* @param {CompiledMode} mode
				* @returns {ResumableMultiRegex}
				*/
				function buildModeRegex(mode) {
					const mm = new ResumableMultiRegex();
					mode.contains.forEach((term) => mm.addRule(term.begin, {
						rule: term,
						type: "begin"
					}));
					if (mode.terminatorEnd) mm.addRule(mode.terminatorEnd, { type: "end" });
					if (mode.illegal) mm.addRule(mode.illegal, { type: "illegal" });
					return mm;
				}
				/** skip vs abort vs ignore
				*
				* @skip   - The mode is still entered and exited normally (and contains rules apply),
				*           but all content is held and added to the parent buffer rather than being
				*           output when the mode ends.  Mostly used with `sublanguage` to build up
				*           a single large buffer than can be parsed by sublanguage.
				*
				*             - The mode begin ands ends normally.
				*             - Content matched is added to the parent mode buffer.
				*             - The parser cursor is moved forward normally.
				*
				* @abort  - A hack placeholder until we have ignore.  Aborts the mode (as if it
				*           never matched) but DOES NOT continue to match subsequent `contains`
				*           modes.  Abort is bad/suboptimal because it can result in modes
				*           farther down not getting applied because an earlier rule eats the
				*           content but then aborts.
				*
				*             - The mode does not begin.
				*             - Content matched by `begin` is added to the mode buffer.
				*             - The parser cursor is moved forward accordingly.
				*
				* @ignore - Ignores the mode (as if it never matched) and continues to match any
				*           subsequent `contains` modes.  Ignore isn't technically possible with
				*           the current parser implementation.
				*
				*             - The mode does not begin.
				*             - Content matched by `begin` is ignored.
				*             - The parser cursor is not moved forward.
				*/
				/**
				* Compiles an individual mode
				*
				* This can raise an error if the mode contains certain detectable known logic
				* issues.
				* @param {Mode} mode
				* @param {CompiledMode | null} [parent]
				* @returns {CompiledMode | never}
				*/
				function compileMode(mode, parent) {
					const cmode = mode;
					if (mode.isCompiled) return cmode;
					[
						scopeClassName,
						compileMatch,
						MultiClass,
						beforeMatchExt
					].forEach((ext) => ext(mode, parent));
					language.compilerExtensions.forEach((ext) => ext(mode, parent));
					mode.__beforeBegin = null;
					[
						beginKeywords,
						compileIllegal,
						compileRelevance
					].forEach((ext) => ext(mode, parent));
					mode.isCompiled = true;
					let keywordPattern = null;
					if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
						mode.keywords = Object.assign({}, mode.keywords);
						keywordPattern = mode.keywords.$pattern;
						delete mode.keywords.$pattern;
					}
					keywordPattern = keywordPattern || /\w+/;
					if (mode.keywords) mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
					cmode.keywordPatternRe = langRe(keywordPattern, true);
					if (parent) {
						if (!mode.begin) mode.begin = /\B|\b/;
						cmode.beginRe = langRe(cmode.begin);
						if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
						if (mode.end) cmode.endRe = langRe(cmode.end);
						cmode.terminatorEnd = source(cmode.end) || "";
						if (mode.endsWithParent && parent.terminatorEnd) cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
					}
					if (mode.illegal) cmode.illegalRe = langRe(mode.illegal);
					if (!mode.contains) mode.contains = [];
					mode.contains = [].concat(...mode.contains.map(function(c) {
						return expandOrCloneMode(c === "self" ? mode : c);
					}));
					mode.contains.forEach(function(c) {
						compileMode(c, cmode);
					});
					if (mode.starts) compileMode(mode.starts, parent);
					cmode.matcher = buildModeRegex(cmode);
					return cmode;
				}
				if (!language.compilerExtensions) language.compilerExtensions = [];
				if (language.contains && language.contains.includes("self")) throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
				language.classNameAliases = inherit$1(language.classNameAliases || {});
				return compileMode(language);
			}
			/**
			* Determines if a mode has a dependency on it's parent or not
			*
			* If a mode does have a parent dependency then often we need to clone it if
			* it's used in multiple places so that each copy points to the correct parent,
			* where-as modes without a parent can often safely be re-used at the bottom of
			* a mode chain.
			*
			* @param {Mode | null} mode
			* @returns {boolean} - is there a dependency on the parent?
			* */
			function dependencyOnParent(mode) {
				if (!mode) return false;
				return mode.endsWithParent || dependencyOnParent(mode.starts);
			}
			/**
			* Expands a mode or clones it if necessary
			*
			* This is necessary for modes with parental dependenceis (see notes on
			* `dependencyOnParent`) and for nodes that have `variants` - which must then be
			* exploded into their own individual modes at compile time.
			*
			* @param {Mode} mode
			* @returns {Mode | Mode[]}
			* */
			function expandOrCloneMode(mode) {
				if (mode.variants && !mode.cachedVariants) mode.cachedVariants = mode.variants.map(function(variant) {
					return inherit$1(mode, { variants: null }, variant);
				});
				if (mode.cachedVariants) return mode.cachedVariants;
				if (dependencyOnParent(mode)) return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
				if (Object.isFrozen(mode)) return inherit$1(mode);
				return mode;
			}
			var version = "11.12.0";
			var HTMLInjectionError = class extends Error {
				constructor(reason, html) {
					super(reason);
					this.name = "HTMLInjectionError";
					this.html = html;
				}
			};
			/**
			@typedef {import('highlight.js').Mode} Mode
			@typedef {import('highlight.js').CompiledMode} CompiledMode
			@typedef {import('highlight.js').CompiledScope} CompiledScope
			@typedef {import('highlight.js').Language} Language
			@typedef {import('highlight.js').HLJSApi} HLJSApi
			@typedef {import('highlight.js').HLJSPlugin} HLJSPlugin
			@typedef {import('highlight.js').PluginEvent} PluginEvent
			@typedef {import('highlight.js').HLJSOptions} HLJSOptions
			@typedef {import('highlight.js').LanguageFn} LanguageFn
			@typedef {import('highlight.js').HighlightedHTMLElement} HighlightedHTMLElement
			@typedef {import('highlight.js').BeforeHighlightContext} BeforeHighlightContext
			@typedef {import('highlight.js/private').MatchType} MatchType
			@typedef {import('highlight.js/private').KeywordData} KeywordData
			@typedef {import('highlight.js/private').EnhancedMatch} EnhancedMatch
			@typedef {import('highlight.js/private').AnnotatedError} AnnotatedError
			@typedef {import('highlight.js').AutoHighlightResult} AutoHighlightResult
			@typedef {import('highlight.js').HighlightOptions} HighlightOptions
			@typedef {import('highlight.js').HighlightResult} HighlightResult
			*/
			const escape = escapeHTML;
			const inherit = inherit$1;
			const NO_MATCH = Symbol("nomatch");
			const MAX_KEYWORD_HITS = 7;
			/**
			* @param {any} hljs - object that is extended (legacy)
			* @returns {HLJSApi}
			*/
			const HLJS = function(hljs) {
				/** @type {Record<string, Language>} */
				const languages = Object.create(null);
				/** @type {Record<string, string>} */
				const aliases = Object.create(null);
				/** @type {HLJSPlugin[]} */
				const plugins = [];
				let SAFE_MODE = true;
				const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
				/** @type {Language} */
				const PLAINTEXT_LANGUAGE = {
					disableAutodetect: true,
					name: "Plain text",
					contains: []
				};
				/** @type HLJSOptions */
				let options = {
					ignoreUnescapedHTML: false,
					throwUnescapedHTML: false,
					noHighlightRe: /^(no-?highlight)$/i,
					languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
					classPrefix: "hljs-",
					cssSelector: "pre code",
					languages: null,
					__emitter: TokenTreeEmitter
				};
				/**
				* Tests a language name to see if highlighting should be skipped
				* @param {string} languageName
				*/
				function shouldNotHighlight(languageName) {
					return options.noHighlightRe.test(languageName);
				}
				/**
				* @param {HighlightedHTMLElement} block - the HTML element to determine language for
				*/
				function blockLanguage(block) {
					let classes = block.className + " ";
					classes += block.parentNode ? block.parentNode.className : "";
					const match = options.languageDetectRe.exec(classes);
					if (match) {
						const language = getLanguage(match[1]);
						if (!language) {
							warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
							warn("Falling back to no-highlight mode for this block.", block);
						}
						return language ? match[1] : "no-highlight";
					}
					return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
				}
				/**
				* Core highlighting function.
				*
				* OLD API
				* highlight(lang, code, ignoreIllegals, continuation)
				*
				* NEW API
				* highlight(code, {lang, ignoreIllegals})
				*
				* @param {string} codeOrLanguageName - the language to use for highlighting
				* @param {string | HighlightOptions} optionsOrCode - the code to highlight
				* @param {boolean} [ignoreIllegals] - whether to ignore illegal matches, default is to bail
				*
				* @returns {HighlightResult} Result - an object that represents the result
				* @property {string} language - the language name
				* @property {number} relevance - the relevance score
				* @property {string} value - the highlighted HTML code
				* @property {string} code - the original raw code
				* @property {CompiledMode} top - top of the current mode stack
				* @property {boolean} illegal - indicates whether any illegal matches were found
				*/
				function highlight(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
					let code = "";
					let languageName = "";
					if (typeof optionsOrCode === "object") {
						code = codeOrLanguageName;
						ignoreIllegals = optionsOrCode.ignoreIllegals;
						languageName = optionsOrCode.language;
					} else {
						deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
						deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
						languageName = codeOrLanguageName;
						code = optionsOrCode;
					}
					if (ignoreIllegals === void 0) ignoreIllegals = true;
					/** @type {BeforeHighlightContext} */
					const context = {
						code,
						language: languageName
					};
					fire("before:highlight", context);
					const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
					result.code = context.code;
					fire("after:highlight", result);
					return result;
				}
				/**
				* private highlight that's used internally and does not fire callbacks
				*
				* @param {string} languageName - the language to use for highlighting
				* @param {string} codeToHighlight - the code to highlight
				* @param {boolean?} [ignoreIllegals] - whether to ignore illegal matches, default is to bail
				* @param {CompiledMode?} [continuation] - current continuation mode, if any
				* @returns {HighlightResult} - result of the highlight operation
				*/
				function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
					const keywordHits = Object.create(null);
					/**
					* Return keyword data if a match is a keyword
					* @param {CompiledMode} mode - current mode
					* @param {string} matchText - the textual match
					* @returns {KeywordData | false}
					*/
					function keywordData(mode, matchText) {
						return mode.keywords[matchText];
					}
					function processKeywords() {
						if (!top.keywords) {
							emitter.addText(modeBuffer);
							return;
						}
						let lastIndex = 0;
						top.keywordPatternRe.lastIndex = 0;
						let match = top.keywordPatternRe.exec(modeBuffer);
						let buf = "";
						while (match) {
							buf += modeBuffer.substring(lastIndex, match.index);
							const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
							const data = keywordData(top, word);
							if (data) {
								const [kind, keywordRelevance] = data;
								emitter.addText(buf);
								buf = "";
								keywordHits[word] = (keywordHits[word] || 0) + 1;
								if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
								if (kind.startsWith("_")) buf += match[0];
								else {
									const cssClass = language.classNameAliases[kind] || kind;
									emitKeyword(match[0], cssClass);
								}
							} else buf += match[0];
							lastIndex = top.keywordPatternRe.lastIndex;
							match = top.keywordPatternRe.exec(modeBuffer);
						}
						buf += modeBuffer.substring(lastIndex);
						emitter.addText(buf);
					}
					function processSubLanguage() {
						if (modeBuffer === "") return;
						/** @type HighlightResult */
						let result = null;
						if (typeof top.subLanguage === "string") {
							if (!languages[top.subLanguage]) {
								emitter.addText(modeBuffer);
								return;
							}
							result = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
							continuations[top.subLanguage] = result._top;
						} else result = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
						if (top.relevance > 0) relevance += result.relevance;
						emitter.__addSublanguage(result._emitter, result.language);
					}
					function processBuffer() {
						if (top.subLanguage != null) processSubLanguage();
						else processKeywords();
						modeBuffer = "";
					}
					/**
					* @param {string} text
					* @param {string} scope
					*/
					function emitKeyword(keyword, scope) {
						if (keyword === "") return;
						emitter.startScope(scope);
						emitter.addText(keyword);
						emitter.endScope();
					}
					/**
					* @param {CompiledScope} scope
					* @param {RegExpMatchArray} match
					*/
					function emitMultiClass(scope, match) {
						let i = 1;
						const max = match.length - 1;
						while (i <= max) {
							if (!scope._emit[i]) {
								i++;
								continue;
							}
							const klass = language.classNameAliases[scope[i]] || scope[i];
							const text = match[i];
							if (klass) emitKeyword(text, klass);
							else {
								modeBuffer = text;
								processKeywords();
								modeBuffer = "";
							}
							i++;
						}
					}
					/**
					* @param {CompiledMode} mode - new mode to start
					* @param {RegExpMatchArray} match
					*/
					function startNewMode(mode, match) {
						if (mode.scope && typeof mode.scope === "string") emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
						if (mode.beginScope) {
							if (mode.beginScope._wrap) {
								emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
								modeBuffer = "";
							} else if (mode.beginScope._multi) {
								emitMultiClass(mode.beginScope, match);
								modeBuffer = "";
							}
						}
						top = Object.create(mode, { parent: { value: top } });
						return top;
					}
					/**
					* @param {CompiledMode } mode - the mode to potentially end
					* @param {RegExpMatchArray} match - the latest match
					* @param {string} matchPlusRemainder - match plus remainder of content
					* @returns {CompiledMode | void} - the next mode, or if void continue on in current mode
					*/
					function endOfMode(mode, match, matchPlusRemainder) {
						let matched = startsWith(mode.endRe, matchPlusRemainder);
						if (matched) {
							if (mode["on:end"]) {
								const resp = new Response(mode);
								mode["on:end"](match, resp);
								if (resp.isMatchIgnored) matched = false;
							}
							if (matched) {
								while (mode.endsParent && mode.parent) mode = mode.parent;
								return mode;
							}
						}
						if (mode.endsWithParent) return endOfMode(mode.parent, match, matchPlusRemainder);
					}
					/**
					* Handle matching but then ignoring a sequence of text
					*
					* @param {string} lexeme - string containing full match text
					*/
					function doIgnore(lexeme) {
						if (top.matcher.regexIndex === 0) {
							modeBuffer += lexeme[0];
							return 1;
						} else {
							resumeScanAtSamePosition = true;
							return 0;
						}
					}
					/**
					* Handle the start of a new potential mode match
					*
					* @param {EnhancedMatch} match - the current match
					* @returns {number} how far to advance the parse cursor
					*/
					function doBeginMatch(match) {
						const lexeme = match[0];
						const newMode = match.rule;
						const resp = new Response(newMode);
						const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
						for (const cb of beforeCallbacks) {
							if (!cb) continue;
							cb(match, resp);
							if (resp.isMatchIgnored) return doIgnore(lexeme);
						}
						if (newMode.skip) modeBuffer += lexeme;
						else {
							if (newMode.excludeBegin) modeBuffer += lexeme;
							processBuffer();
							if (!newMode.returnBegin && !newMode.excludeBegin) modeBuffer = lexeme;
						}
						startNewMode(newMode, match);
						return newMode.returnBegin ? 0 : lexeme.length;
					}
					/**
					* Handle the potential end of mode
					*
					* @param {RegExpMatchArray} match - the current match
					*/
					function doEndMatch(match) {
						const lexeme = match[0];
						const matchPlusRemainder = codeToHighlight.substring(match.index);
						const endMode = endOfMode(top, match, matchPlusRemainder);
						if (!endMode) return NO_MATCH;
						const origin = top;
						if (top.endScope && top.endScope._wrap) {
							processBuffer();
							emitKeyword(lexeme, top.endScope._wrap);
						} else if (top.endScope && top.endScope._multi) {
							processBuffer();
							emitMultiClass(top.endScope, match);
						} else if (origin.skip) modeBuffer += lexeme;
						else {
							if (!(origin.returnEnd || origin.excludeEnd)) modeBuffer += lexeme;
							processBuffer();
							if (origin.excludeEnd) modeBuffer = lexeme;
						}
						do {
							if (top.scope) emitter.closeNode();
							if (!top.skip && !top.subLanguage) relevance += top.relevance;
							top = top.parent;
						} while (top !== endMode.parent);
						if (endMode.starts) startNewMode(endMode.starts, match);
						return origin.returnEnd ? 0 : lexeme.length;
					}
					function processContinuations() {
						const list = [];
						for (let current = top; current !== language; current = current.parent) if (current.scope) list.unshift(current.scope);
						list.forEach((item) => emitter.openNode(item));
					}
					/** @type {{type?: MatchType, index?: number, rule?: Mode}}} */
					let lastMatch = {};
					/**
					*  Process an individual match
					*
					* @param {string} textBeforeMatch - text preceding the match (since the last match)
					* @param {EnhancedMatch} [match] - the match itself
					*/
					function processLexeme(textBeforeMatch, match) {
						const lexeme = match && match[0];
						modeBuffer += textBeforeMatch;
						if (lexeme == null) {
							processBuffer();
							return 0;
						}
						if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
							modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
							if (!SAFE_MODE) {
								/** @type {AnnotatedError} */
								const err = /* @__PURE__ */ new Error(`0 width match regex (${languageName})`);
								err.languageName = languageName;
								err.badRule = lastMatch.rule;
								throw err;
							}
							return 1;
						}
						lastMatch = match;
						if (match.type === "begin") return doBeginMatch(match);
						else if (match.type === "illegal" && !ignoreIllegals) {
							/** @type {AnnotatedError} */
							const err = /* @__PURE__ */ new Error("Illegal lexeme \"" + lexeme + "\" for mode \"" + (top.scope || "<unnamed>") + "\"");
							err.mode = top;
							throw err;
						} else if (match.type === "end") {
							const processed = doEndMatch(match);
							if (processed !== NO_MATCH) return processed;
						}
						if (match.type === "illegal" && lexeme === "") {
							if (match.index === codeToHighlight.length);
							else modeBuffer += "\n";
							return 1;
						}
						if (iterations > 1e5 && iterations > match.index * 3) throw /* @__PURE__ */ new Error("potential infinite loop, way more iterations than matches");
						modeBuffer += lexeme;
						return lexeme.length;
					}
					const language = getLanguage(languageName);
					if (!language) {
						error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
						throw new Error("Unknown language: \"" + languageName + "\"");
					}
					const md = compileLanguage(language);
					let result = "";
					/** @type {CompiledMode} */
					let top = continuation || md;
					/** @type Record<string,CompiledMode> */
					const continuations = {};
					const emitter = new options.__emitter(options);
					processContinuations();
					let modeBuffer = "";
					let relevance = 0;
					let index = 0;
					let iterations = 0;
					let resumeScanAtSamePosition = false;
					try {
						if (!language.__emitTokens) {
							top.matcher.considerAll();
							for (;;) {
								iterations++;
								if (resumeScanAtSamePosition) resumeScanAtSamePosition = false;
								else top.matcher.considerAll();
								top.matcher.lastIndex = index;
								const match = top.matcher.exec(codeToHighlight);
								if (!match) break;
								const processedCount = processLexeme(codeToHighlight.substring(index, match.index), match);
								index = match.index + processedCount;
							}
							processLexeme(codeToHighlight.substring(index));
						} else language.__emitTokens(codeToHighlight, emitter);
						emitter.finalize();
						result = emitter.toHTML();
						return {
							language: languageName,
							value: result,
							relevance,
							illegal: false,
							_emitter: emitter,
							_top: top
						};
					} catch (err) {
						if (err.message && err.message.includes("Illegal")) return {
							language: languageName,
							value: escape(codeToHighlight),
							illegal: true,
							relevance: 0,
							_illegalBy: {
								message: err.message,
								index,
								context: codeToHighlight.slice(index - 100, index + 100),
								mode: err.mode,
								resultSoFar: result
							},
							_emitter: emitter
						};
						else if (SAFE_MODE) return {
							language: languageName,
							value: escape(codeToHighlight),
							illegal: false,
							relevance: 0,
							errorRaised: err,
							_emitter: emitter,
							_top: top
						};
						else throw err;
					}
				}
				/**
				* returns a valid highlight result, without actually doing any actual work,
				* auto highlight starts with this and it's possible for small snippets that
				* auto-detection may not find a better match
				* @param {string} code
				* @returns {HighlightResult}
				*/
				function justTextHighlightResult(code) {
					const result = {
						value: escape(code),
						illegal: false,
						relevance: 0,
						_top: PLAINTEXT_LANGUAGE,
						_emitter: new options.__emitter(options)
					};
					result._emitter.addText(code);
					return result;
				}
				/**
				Highlighting with language detection. Accepts a string with the code to
				highlight. Returns an object with the following properties:
				
				- language (detected language)
				- relevance (int)
				- value (an HTML string with highlighting markup)
				- secondBest (object with the same structure for second-best heuristically
				detected language, may be absent)
				
				@param {string} code
				@param {Array<string>} [languageSubset]
				@returns {AutoHighlightResult}
				*/
				function highlightAuto(code, languageSubset) {
					languageSubset = languageSubset || options.languages || Object.keys(languages);
					const plaintext = justTextHighlightResult(code);
					const results = languageSubset.filter(getLanguage).filter(autoDetection).map((name) => _highlight(name, code, false));
					results.unshift(plaintext);
					const [best, secondBest] = results.sort((a, b) => {
						if (a.relevance !== b.relevance) return b.relevance - a.relevance;
						if (a.language && b.language) {
							if (getLanguage(a.language).supersetOf === b.language) return 1;
							else if (getLanguage(b.language).supersetOf === a.language) return -1;
						}
						return 0;
					});
					/** @type {AutoHighlightResult} */
					const result = best;
					result.secondBest = secondBest;
					return result;
				}
				/**
				* Builds new class name for block given the language name
				*
				* @param {HTMLElement} element
				* @param {string} [currentLang]
				* @param {string} [resultLang]
				*/
				function updateClassName(element, currentLang, resultLang) {
					const language = currentLang && aliases[currentLang] || resultLang;
					element.classList.add("hljs");
					element.classList.add(`language-${language}`);
				}
				/**
				* Applies highlighting to a DOM node containing code.
				*
				* @param {HighlightedHTMLElement} element - the HTML element to highlight
				*/
				function highlightElement(element) {
					/** @type HTMLElement */
					let node = null;
					const language = blockLanguage(element);
					if (shouldNotHighlight(language)) return;
					fire("before:highlightElement", {
						el: element,
						language
					});
					if (element.dataset.highlighted) {
						console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
						return;
					}
					if (element.children.length > 0) {
						if (!options.ignoreUnescapedHTML) {
							console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
							console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
							console.warn("The element with unescaped HTML:");
							console.warn(element);
						}
						if (options.throwUnescapedHTML) throw new HTMLInjectionError("One of your code blocks includes unescaped HTML.", element.innerHTML);
					}
					node = element;
					const text = node.textContent;
					const result = language ? highlight(text, {
						language,
						ignoreIllegals: true
					}) : highlightAuto(text);
					element.innerHTML = result.value;
					element.dataset.highlighted = "yes";
					updateClassName(element, language, result.language);
					element.result = {
						language: result.language,
						re: result.relevance,
						relevance: result.relevance
					};
					if (result.secondBest) element.secondBest = {
						language: result.secondBest.language,
						relevance: result.secondBest.relevance
					};
					fire("after:highlightElement", {
						el: element,
						result,
						text
					});
				}
				/**
				* Updates highlight.js global options with the passed options
				*
				* @param {Partial<HLJSOptions>} userOptions
				*/
				function configure(userOptions) {
					options = inherit(options, userOptions);
				}
				const initHighlighting = () => {
					highlightAll();
					deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
				};
				function initHighlightingOnLoad() {
					highlightAll();
					deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
				}
				let wantsHighlight = false;
				/**
				* auto-highlights all pre>code elements on the page
				*/
				function highlightAll() {
					function boot() {
						highlightAll();
					}
					if (document.readyState === "loading") {
						if (!wantsHighlight) window.addEventListener("DOMContentLoaded", boot, false);
						wantsHighlight = true;
						return;
					}
					document.querySelectorAll(options.cssSelector).forEach(highlightElement);
				}
				/**
				* Register a language grammar module
				*
				* @param {string} languageName
				* @param {LanguageFn} languageDefinition
				*/
				function registerLanguage(languageName, languageDefinition) {
					let lang = null;
					try {
						lang = languageDefinition(hljs);
					} catch (error$1) {
						error("Language definition for '{}' could not be registered.".replace("{}", languageName));
						if (!SAFE_MODE) throw error$1;
						else error(error$1);
						lang = PLAINTEXT_LANGUAGE;
					}
					if (!lang.name) lang.name = languageName;
					languages[languageName] = lang;
					lang.rawDefinition = languageDefinition.bind(null, hljs);
					if (lang.aliases) registerAliases(lang.aliases, { languageName });
				}
				/**
				* Remove a language grammar module
				*
				* @param {string} languageName
				*/
				function unregisterLanguage(languageName) {
					delete languages[languageName];
					for (const alias of Object.keys(aliases)) if (aliases[alias] === languageName) delete aliases[alias];
				}
				/**
				* @returns {string[]} List of language internal names
				*/
				function listLanguages() {
					return Object.keys(languages);
				}
				/**
				* @param {string} name - name of the language to retrieve
				* @returns {Language | undefined}
				*/
				function getLanguage(name) {
					name = (name || "").toLowerCase();
					return languages[name] || languages[aliases[name]];
				}
				/**
				*
				* @param {string|string[]} aliasList - single alias or list of aliases
				* @param {{languageName: string}} opts
				*/
				function registerAliases(aliasList, { languageName }) {
					if (typeof aliasList === "string") aliasList = [aliasList];
					aliasList.forEach((alias) => {
						aliases[alias.toLowerCase()] = languageName;
					});
				}
				/**
				* Determines if a given language has auto-detection enabled
				* @param {string} name - name of the language
				*/
				function autoDetection(name) {
					const lang = getLanguage(name);
					return lang && !lang.disableAutodetect;
				}
				/**
				* Upgrades the old highlightBlock plugins to the new
				* highlightElement API
				* @param {HLJSPlugin} plugin
				*/
				function upgradePluginAPI(plugin) {
					if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) plugin["before:highlightElement"] = (data) => {
						plugin["before:highlightBlock"](Object.assign({ block: data.el }, data));
					};
					if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) plugin["after:highlightElement"] = (data) => {
						plugin["after:highlightBlock"](Object.assign({ block: data.el }, data));
					};
				}
				/**
				* @param {HLJSPlugin} plugin
				*/
				function addPlugin(plugin) {
					upgradePluginAPI(plugin);
					plugins.push(plugin);
				}
				/**
				* @param {HLJSPlugin} plugin
				*/
				function removePlugin(plugin) {
					const index = plugins.indexOf(plugin);
					if (index !== -1) plugins.splice(index, 1);
				}
				/**
				*
				* @param {PluginEvent} event
				* @param {any} args
				*/
				function fire(event, args) {
					const cb = event;
					plugins.forEach(function(plugin) {
						if (plugin[cb]) plugin[cb](args);
					});
				}
				/**
				* DEPRECATED
				* @param {HighlightedHTMLElement} el
				*/
				function deprecateHighlightBlock(el) {
					deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
					deprecated("10.7.0", "Please use highlightElement now.");
					return highlightElement(el);
				}
				Object.assign(hljs, {
					highlight,
					highlightAuto,
					highlightAll,
					highlightElement,
					highlightBlock: deprecateHighlightBlock,
					configure,
					initHighlighting,
					initHighlightingOnLoad,
					registerLanguage,
					unregisterLanguage,
					listLanguages,
					getLanguage,
					registerAliases,
					autoDetection,
					inherit,
					addPlugin,
					removePlugin
				});
				hljs.debugMode = function() {
					SAFE_MODE = false;
				};
				hljs.safeMode = function() {
					SAFE_MODE = true;
				};
				hljs.versionString = version;
				hljs.regex = {
					concat,
					lookahead,
					either,
					optional,
					anyNumberOfTimes
				};
				for (const key in MODES) if (typeof MODES[key] === "object") deepFreeze(MODES[key]);
				Object.assign(hljs, MODES);
				return hljs;
			};
			const highlight = HLJS({});
			highlight.newInstance = () => HLJS({});
			module.exports = highlight;
			highlight.HighlightJS = highlight;
			highlight.default = highlight;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/xml.js
		var require_xml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function xml(hljs) {
				const regex = hljs.regex;
				const TAG_NAME_RE = regex.concat(/[\p{L}_]/u, regex.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u);
				const XML_IDENT_RE = /[\p{L}0-9._:-]+/u;
				const XML_ENTITIES = {
					className: "symbol",
					begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
				};
				const XML_META_KEYWORDS = {
					begin: /\s/,
					contains: [{
						className: "keyword",
						begin: /#?[a-z_][a-z1-9_-]+/,
						illegal: /\n/
					}]
				};
				const XML_META_PAR_KEYWORDS = hljs.inherit(XML_META_KEYWORDS, {
					begin: /\(/,
					end: /\)/
				});
				const APOS_META_STRING_MODE = hljs.inherit(hljs.APOS_STRING_MODE, { className: "string" });
				const QUOTE_META_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, { className: "string" });
				const TAG_INTERNALS = {
					endsWithParent: true,
					illegal: /</,
					relevance: 0,
					contains: [{
						className: "attr",
						begin: XML_IDENT_RE,
						relevance: 0
					}, {
						begin: /=\s*/,
						relevance: 0,
						contains: [{
							className: "string",
							endsParent: true,
							variants: [
								{
									begin: /"/,
									end: /"/,
									contains: [XML_ENTITIES]
								},
								{
									begin: /'/,
									end: /'/,
									contains: [XML_ENTITIES]
								},
								{ begin: /[^\s"'=<>`]+/ }
							]
						}]
					}]
				};
				return {
					name: "HTML, XML",
					aliases: [
						"html",
						"xhtml",
						"rss",
						"atom",
						"xjb",
						"xsd",
						"xsl",
						"plist",
						"wsf",
						"svg"
					],
					case_insensitive: true,
					unicodeRegex: true,
					contains: [
						{
							className: "meta",
							begin: /<![a-z]/,
							end: />/,
							relevance: 10,
							contains: [
								XML_META_KEYWORDS,
								QUOTE_META_STRING_MODE,
								APOS_META_STRING_MODE,
								XML_META_PAR_KEYWORDS,
								{
									begin: /\[/,
									end: /\]/,
									contains: [{
										className: "meta",
										begin: /<![a-z]/,
										end: />/,
										contains: [
											XML_META_KEYWORDS,
											XML_META_PAR_KEYWORDS,
											QUOTE_META_STRING_MODE,
											APOS_META_STRING_MODE
										]
									}]
								}
							]
						},
						hljs.COMMENT(/<!--/, /-->/, { relevance: 10 }),
						{
							begin: /<!\[CDATA\[/,
							end: /\]\]>/,
							relevance: 10
						},
						XML_ENTITIES,
						{
							className: "meta",
							end: /\?>/,
							variants: [{
								begin: /<\?xml/,
								relevance: 10,
								contains: [QUOTE_META_STRING_MODE]
							}, { begin: /<\?[a-z][a-z0-9]+/ }]
						},
						{
							className: "tag",
							begin: /<style(?=\s|>)/,
							end: />/,
							keywords: { name: "style" },
							contains: [TAG_INTERNALS],
							starts: {
								end: /<\/style>/,
								returnEnd: true,
								subLanguage: "css"
							}
						},
						{
							className: "tag",
							begin: /<script(?=\s|>)/,
							end: />/,
							keywords: { name: "script" },
							contains: [TAG_INTERNALS],
							starts: {
								end: /<\/script>/,
								returnEnd: true,
								subLanguage: "javascript"
							}
						},
						{
							className: "tag",
							begin: /<>|<\/>/
						},
						{
							className: "tag",
							begin: regex.concat(/</, regex.lookahead(regex.concat(TAG_NAME_RE, regex.either(/\/>/, />/, /\s/)))),
							end: /\/?>/,
							contains: [{
								className: "name",
								begin: TAG_NAME_RE,
								relevance: 0,
								starts: TAG_INTERNALS
							}]
						},
						{
							className: "tag",
							begin: regex.concat(/<\//, regex.lookahead(regex.concat(TAG_NAME_RE, />/))),
							contains: [{
								className: "name",
								begin: TAG_NAME_RE,
								relevance: 0
							}, {
								begin: />/,
								relevance: 0,
								endsParent: true
							}]
						}
					]
				};
			}
			module.exports = xml;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/bash.js
		var require_bash = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function bash(hljs) {
				const regex = hljs.regex;
				const VAR = {};
				const BRACED_VAR = {
					begin: /\$\{/,
					end: /\}/,
					contains: ["self", {
						begin: /:-/,
						contains: [VAR]
					}]
				};
				Object.assign(VAR, {
					className: "variable",
					variants: [{ begin: regex.concat(/\$[\w\d#@][\w\d_]*/, `(?![\\w\\d])(?![$])`) }, BRACED_VAR]
				});
				const SUBST = {
					className: "subst",
					begin: /\$\(/,
					end: /\)/,
					contains: [hljs.BACKSLASH_ESCAPE]
				};
				const COMMENT = hljs.inherit(hljs.COMMENT(), {
					match: [/(^|\s)/, /#.*$/],
					scope: { 2: "comment" }
				});
				const HERE_DOC = {
					begin: /<<-?\s*(?=\w+)/,
					starts: { contains: [hljs.END_SAME_AS_BEGIN({
						begin: /(\w+)/,
						end: /(\w+)/,
						className: "string"
					})] }
				};
				const QUOTE_STRING = {
					className: "string",
					begin: /"/,
					end: /"/,
					contains: [
						hljs.BACKSLASH_ESCAPE,
						VAR,
						SUBST
					]
				};
				SUBST.contains.push(QUOTE_STRING);
				const ESCAPED_QUOTE = { match: /\\"/ };
				const APOS_STRING = {
					className: "string",
					begin: /'/,
					end: /'/
				};
				const ESCAPED_APOS = { match: /\\'/ };
				const ARITHMETIC = {
					begin: /\$?\(\(/,
					end: /\)\)/,
					contains: [
						{
							begin: /\d+#[0-9a-f]+/,
							className: "number"
						},
						hljs.NUMBER_MODE,
						VAR
					]
				};
				const KNOWN_SHEBANG = hljs.SHEBANG({
					binary: `(${[
						"fish",
						"bash",
						"zsh",
						"sh",
						"csh",
						"ksh",
						"tcsh",
						"dash",
						"scsh"
					].join("|")})`,
					relevance: 10
				});
				const FUNCTION = {
					className: "function",
					begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
					returnBegin: true,
					contains: [hljs.inherit(hljs.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
					relevance: 0
				};
				const KEYWORDS = [
					"if",
					"then",
					"else",
					"elif",
					"fi",
					"time",
					"for",
					"while",
					"until",
					"in",
					"do",
					"done",
					"case",
					"esac",
					"coproc",
					"function",
					"select"
				];
				const LITERALS = ["true", "false"];
				const PATH_MODE = { match: /(\/[a-z._-]+)+/ };
				const SHELL_BUILT_INS = [
					"break",
					"cd",
					"continue",
					"eval",
					"exec",
					"exit",
					"export",
					"getopts",
					"hash",
					"pwd",
					"readonly",
					"return",
					"shift",
					"test",
					"times",
					"trap",
					"umask",
					"unset"
				];
				const BASH_BUILT_INS = [
					"alias",
					"bind",
					"builtin",
					"caller",
					"command",
					"declare",
					"echo",
					"enable",
					"help",
					"let",
					"local",
					"logout",
					"mapfile",
					"printf",
					"read",
					"readarray",
					"source",
					"sudo",
					"type",
					"typeset",
					"ulimit",
					"unalias"
				];
				const ZSH_BUILT_INS = [
					"autoload",
					"bg",
					"bindkey",
					"bye",
					"cap",
					"chdir",
					"clone",
					"comparguments",
					"compcall",
					"compctl",
					"compdescribe",
					"compfiles",
					"compgroups",
					"compquote",
					"comptags",
					"comptry",
					"compvalues",
					"dirs",
					"disable",
					"disown",
					"echotc",
					"echoti",
					"emulate",
					"fc",
					"fg",
					"float",
					"functions",
					"getcap",
					"getln",
					"history",
					"integer",
					"jobs",
					"kill",
					"limit",
					"log",
					"noglob",
					"popd",
					"print",
					"pushd",
					"pushln",
					"rehash",
					"sched",
					"setcap",
					"setopt",
					"stat",
					"suspend",
					"ttyctl",
					"unfunction",
					"unhash",
					"unlimit",
					"unsetopt",
					"vared",
					"wait",
					"whence",
					"where",
					"which",
					"zcompile",
					"zformat",
					"zftp",
					"zle",
					"zmodload",
					"zparseopts",
					"zprof",
					"zpty",
					"zregexparse",
					"zsocket",
					"zstyle",
					"ztcp"
				];
				const GNU_CORE_UTILS = [
					"chcon",
					"chgrp",
					"chown",
					"chmod",
					"cp",
					"dd",
					"df",
					"dir",
					"dircolors",
					"ln",
					"ls",
					"mkdir",
					"mkfifo",
					"mknod",
					"mktemp",
					"mv",
					"realpath",
					"rm",
					"rmdir",
					"shred",
					"sync",
					"touch",
					"truncate",
					"vdir",
					"b2sum",
					"base32",
					"base64",
					"cat",
					"cksum",
					"comm",
					"csplit",
					"cut",
					"expand",
					"fmt",
					"fold",
					"head",
					"join",
					"md5sum",
					"nl",
					"numfmt",
					"od",
					"paste",
					"ptx",
					"pr",
					"sha1sum",
					"sha224sum",
					"sha256sum",
					"sha384sum",
					"sha512sum",
					"shuf",
					"sort",
					"split",
					"sum",
					"tac",
					"tail",
					"tr",
					"tsort",
					"unexpand",
					"uniq",
					"wc",
					"arch",
					"basename",
					"chroot",
					"date",
					"dirname",
					"du",
					"echo",
					"env",
					"expr",
					"factor",
					"groups",
					"hostid",
					"id",
					"link",
					"logname",
					"nice",
					"nohup",
					"nproc",
					"pathchk",
					"pinky",
					"printenv",
					"printf",
					"pwd",
					"readlink",
					"runcon",
					"seq",
					"sleep",
					"stat",
					"stdbuf",
					"stty",
					"tee",
					"test",
					"timeout",
					"tty",
					"uname",
					"unlink",
					"uptime",
					"users",
					"who",
					"whoami",
					"yes"
				];
				return {
					name: "Bash",
					aliases: ["sh", "zsh"],
					keywords: {
						$pattern: /\b[a-z][a-z0-9._-]+\b/,
						keyword: KEYWORDS,
						literal: LITERALS,
						built_in: [
							...SHELL_BUILT_INS,
							...BASH_BUILT_INS,
							"set",
							"shopt",
							...ZSH_BUILT_INS,
							...GNU_CORE_UTILS
						]
					},
					contains: [
						KNOWN_SHEBANG,
						hljs.SHEBANG(),
						FUNCTION,
						ARITHMETIC,
						COMMENT,
						HERE_DOC,
						PATH_MODE,
						QUOTE_STRING,
						ESCAPED_QUOTE,
						APOS_STRING,
						ESCAPED_APOS,
						VAR
					]
				};
			}
			module.exports = bash;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/c.js
		var require_c = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function c(hljs) {
				const regex = hljs.regex;
				const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
				const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
				const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
				const FUNCTION_TYPE_RE = "(decltype\\(auto\\)|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional("<[^<>]+>") + ")";
				const TYPES = {
					className: "type",
					variants: [{ begin: "\\b[a-z\\d_]*_t\\b" }, { match: regex.concat(/\batomic_/, regex.either("bool", "char", "schar", "uchar", "short", "ushort", "int", "uint", "long", "ulong", "llong", "ullong", "char16_t", "char32_t", "wchar_t", "int_least8_t", "uint_least8_t", "int_least16_t", "uint_least16_t", "int_least32_t", "uint_least32_t", "int_least64_t", "uint_least64_t", "int_fast8_t", "uint_fast8_t", "int_fast16_t", "uint_fast16_t", "int_fast32_t", "uint_fast32_t", "int_fast64_t", "uint_fast64_t", "intptr_t", "uintptr_t", "size_t", "ptrdiff_t", "intmax_t", "uintmax_t"), /\b/) }]
				};
				const STRINGS = {
					className: "string",
					variants: [
						{
							begin: "(u8?|U|L)?\"",
							end: "\"",
							illegal: "\\n",
							contains: [hljs.BACKSLASH_ESCAPE]
						},
						{
							begin: "(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
							end: "'",
							illegal: "."
						},
						hljs.END_SAME_AS_BEGIN({
							begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
							end: /\)([^()\\\s"]{0,16})"/
						})
					]
				};
				const NUMBERS = {
					className: "number",
					variants: [
						{ match: /\b(0b[01']+)/ },
						{ match: /(-?)\b([\d']+(\.[\d']*)?|\.[\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)/ },
						{ match: /(-?)\b(0[xX][a-fA-F0-9]+(?:'[a-fA-F0-9]+)*(?:\.[a-fA-F0-9]*(?:'[a-fA-F0-9]*)*)?(?:[pP][-+]?[0-9]+)?(l|L)?(u|U)?)/ },
						{ match: /(-?)\b\d+(?:'\d+)*(?:\.\d*(?:'\d*)*)?(?:[eE][-+]?\d+)?/ }
					],
					relevance: 0
				};
				const PREPROCESSOR_INCLUDE = {
					scope: "meta",
					begin: /#\s*include\b/,
					end: /$/,
					keywords: { keyword: "include" },
					contains: [
						{ begin: /\\\n/ },
						STRINGS,
						{
							scope: "string",
							begin: /<.*?>/
						},
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE
					]
				};
				const PREPROCESSOR = {
					className: "meta",
					begin: /#\s*[a-z]+\b/,
					end: /$/,
					keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef elifdef elifndef include" },
					contains: [
						{
							begin: /\\\n/,
							relevance: 0
						},
						hljs.inherit(STRINGS, { className: "string" }),
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE
					]
				};
				const PREPROCESSORS = [PREPROCESSOR_INCLUDE, PREPROCESSOR];
				const TITLE_MODE = {
					className: "title",
					begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
					relevance: 0
				};
				const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
				const KEYWORDS = {
					keyword: [
						"asm",
						"auto",
						"break",
						"case",
						"continue",
						"default",
						"do",
						"else",
						"enum",
						"extern",
						"for",
						"fortran",
						"goto",
						"if",
						"inline",
						"register",
						"restrict",
						"return",
						"sizeof",
						"typeof",
						"typeof_unqual",
						"struct",
						"switch",
						"typedef",
						"union",
						"volatile",
						"while",
						"_Alignas",
						"_Alignof",
						"_Atomic",
						"_Generic",
						"_Noreturn",
						"_Static_assert",
						"_Thread_local",
						"alignas",
						"alignof",
						"noreturn",
						"static_assert",
						"thread_local",
						"_Pragma"
					],
					type: [
						"float",
						"double",
						"signed",
						"unsigned",
						"int",
						"short",
						"long",
						"char",
						"void",
						"_Bool",
						"_BitInt",
						"_Complex",
						"_Imaginary",
						"_Decimal32",
						"_Decimal64",
						"_Decimal96",
						"_Decimal128",
						"_Decimal64x",
						"_Decimal128x",
						"_Float16",
						"_Float32",
						"_Float64",
						"_Float128",
						"_Float32x",
						"_Float64x",
						"_Float128x",
						"const",
						"static",
						"constexpr",
						"complex",
						"bool",
						"imaginary"
					],
					literal: "true false NULL",
					built_in: "std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan vfprintf vprintf vsprintf endl initializer_list unique_ptr"
				};
				const EXPRESSION_CONTAINS = [
					...PREPROCESSORS,
					TYPES,
					C_LINE_COMMENT_MODE,
					hljs.C_BLOCK_COMMENT_MODE,
					NUMBERS,
					STRINGS
				];
				const EXPRESSION_CONTEXT = {
					variants: [
						{
							begin: /=/,
							end: /;/
						},
						{
							begin: /\(/,
							end: /\)/
						},
						{
							beginKeywords: "new throw return else",
							end: /;/
						}
					],
					keywords: KEYWORDS,
					contains: EXPRESSION_CONTAINS.concat([{
						begin: /\(/,
						end: /\)/,
						keywords: KEYWORDS,
						contains: EXPRESSION_CONTAINS.concat(["self"]),
						relevance: 0
					}]),
					relevance: 0
				};
				const FUNCTION_DECLARATION = {
					begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+){1,12}" + FUNCTION_TITLE,
					returnBegin: true,
					end: /[{;=]/,
					excludeEnd: true,
					keywords: KEYWORDS,
					illegal: /[^\w\s\*&:<>.]/,
					contains: [
						{
							begin: DECLTYPE_AUTO_RE,
							keywords: KEYWORDS,
							relevance: 0
						},
						{
							begin: FUNCTION_TITLE,
							returnBegin: true,
							contains: [hljs.inherit(TITLE_MODE, { className: "title.function" })],
							relevance: 0
						},
						{
							relevance: 0,
							match: /,/
						},
						{
							className: "params",
							begin: /\(/,
							end: /\)/,
							keywords: KEYWORDS,
							relevance: 0,
							contains: [
								C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE,
								STRINGS,
								NUMBERS,
								TYPES,
								{
									begin: /\(/,
									end: /\)/,
									keywords: KEYWORDS,
									relevance: 0,
									contains: [
										"self",
										C_LINE_COMMENT_MODE,
										hljs.C_BLOCK_COMMENT_MODE,
										STRINGS,
										NUMBERS,
										TYPES
									]
								}
							]
						},
						TYPES,
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						...PREPROCESSORS
					]
				};
				return {
					name: "C",
					aliases: ["h"],
					keywords: KEYWORDS,
					disableAutodetect: true,
					illegal: "</",
					contains: [].concat(EXPRESSION_CONTEXT, FUNCTION_DECLARATION, EXPRESSION_CONTAINS, [
						...PREPROCESSORS,
						{
							begin: hljs.IDENT_RE + "::",
							keywords: KEYWORDS
						},
						{
							className: "class",
							beginKeywords: "enum class struct union",
							end: /[{;:<>=]/,
							contains: [{ beginKeywords: "final class struct" }, hljs.TITLE_MODE]
						}
					]),
					exports: {
						preprocessor: PREPROCESSOR,
						strings: STRINGS,
						keywords: KEYWORDS
					}
				};
			}
			module.exports = c;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/cpp.js
		var require_cpp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function cpp(hljs) {
				const regex = hljs.regex;
				const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
				const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
				const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
				const FUNCTION_TYPE_RE = "(?!struct)(decltype\\(auto\\)|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional("<[^<>]+>") + ")";
				const CPP_PRIMITIVE_TYPES = {
					className: "type",
					begin: "\\b[a-z\\d_]*_t\\b"
				};
				const STRINGS = {
					className: "string",
					variants: [
						{
							begin: "(u8?|U|L)?\"",
							end: "\"",
							illegal: "\\n",
							contains: [hljs.BACKSLASH_ESCAPE]
						},
						{
							begin: "(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",
							end: "'",
							illegal: "."
						},
						hljs.END_SAME_AS_BEGIN({
							begin: /(?:u8?|U|L)?R"([^()\\\s"]{0,16})\(/,
							end: /\)([^()\\\s"]{0,16})"/
						})
					]
				};
				const NUMBERS = {
					className: "number",
					variants: [{ begin: "[+-]?(?:(?:\\b[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|\\b[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|\\b0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)" }, { begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)" }],
					relevance: 0
				};
				const PREPROCESSORS = [{
					scope: "meta",
					begin: /#\s*include\b/,
					end: /$/,
					keywords: { keyword: "include" },
					contains: [
						{ begin: /\\\n/ },
						STRINGS,
						{
							scope: "string",
							begin: /<.*?>/
						},
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE
					]
				}, {
					className: "meta",
					begin: /#\s*[a-z]+\b/,
					end: /$/,
					keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
					contains: [
						{
							begin: /\\\n/,
							relevance: 0
						},
						hljs.inherit(STRINGS, { className: "string" }),
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE
					]
				}];
				const TITLE_MODE = {
					className: "title",
					begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
					relevance: 0
				};
				const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
				const RESERVED_KEYWORDS = [
					"alignas",
					"alignof",
					"and",
					"and_eq",
					"asm",
					"atomic_cancel",
					"atomic_commit",
					"atomic_noexcept",
					"auto",
					"bitand",
					"bitor",
					"break",
					"case",
					"catch",
					"class",
					"co_await",
					"co_return",
					"co_yield",
					"compl",
					"concept",
					"const_cast|10",
					"consteval",
					"constexpr",
					"constinit",
					"continue",
					"decltype",
					"default",
					"delete",
					"do",
					"dynamic_cast|10",
					"else",
					"enum",
					"explicit",
					"export",
					"extern",
					"false",
					"final",
					"for",
					"friend",
					"goto",
					"if",
					"import",
					"inline",
					"module",
					"mutable",
					"namespace",
					"new",
					"noexcept",
					"not",
					"not_eq",
					"nullptr",
					"operator",
					"or",
					"or_eq",
					"override",
					"private",
					"protected",
					"public",
					"reflexpr",
					"register",
					"reinterpret_cast|10",
					"requires",
					"return",
					"sizeof",
					"static_assert",
					"static_cast|10",
					"struct",
					"switch",
					"synchronized",
					"template",
					"this",
					"thread_local",
					"throw",
					"transaction_safe",
					"transaction_safe_dynamic",
					"true",
					"try",
					"typedef",
					"typeid",
					"typename",
					"union",
					"using",
					"virtual",
					"volatile",
					"while",
					"xor",
					"xor_eq"
				];
				const RESERVED_TYPES = [
					"bool",
					"char",
					"char16_t",
					"char32_t",
					"char8_t",
					"double",
					"float",
					"int",
					"long",
					"short",
					"void",
					"wchar_t",
					"unsigned",
					"signed",
					"const",
					"static"
				];
				const TYPE_HINTS = [
					"any",
					"auto_ptr",
					"barrier",
					"binary_semaphore",
					"bitset",
					"complex",
					"condition_variable",
					"condition_variable_any",
					"counting_semaphore",
					"deque",
					"false_type",
					"flat_map",
					"flat_set",
					"future",
					"imaginary",
					"initializer_list",
					"istringstream",
					"jthread",
					"latch",
					"lock_guard",
					"multimap",
					"multiset",
					"mutex",
					"optional",
					"ostringstream",
					"packaged_task",
					"pair",
					"promise",
					"priority_queue",
					"queue",
					"recursive_mutex",
					"recursive_timed_mutex",
					"scoped_lock",
					"set",
					"shared_future",
					"shared_lock",
					"shared_mutex",
					"shared_timed_mutex",
					"shared_ptr",
					"stack",
					"string_view",
					"stringstream",
					"timed_mutex",
					"thread",
					"true_type",
					"tuple",
					"unique_lock",
					"unique_ptr",
					"unordered_map",
					"unordered_multimap",
					"unordered_multiset",
					"unordered_set",
					"variant",
					"vector",
					"weak_ptr",
					"wstring",
					"wstring_view"
				];
				const FUNCTION_HINTS = [
					"abort",
					"abs",
					"acos",
					"apply",
					"as_const",
					"asin",
					"atan",
					"atan2",
					"calloc",
					"ceil",
					"cerr",
					"cin",
					"clog",
					"cos",
					"cosh",
					"cout",
					"declval",
					"endl",
					"exchange",
					"exit",
					"exp",
					"fabs",
					"floor",
					"fmod",
					"forward",
					"fprintf",
					"fputs",
					"free",
					"frexp",
					"fscanf",
					"future",
					"invoke",
					"isalnum",
					"isalpha",
					"iscntrl",
					"isdigit",
					"isgraph",
					"islower",
					"isprint",
					"ispunct",
					"isspace",
					"isupper",
					"isxdigit",
					"labs",
					"launder",
					"ldexp",
					"log",
					"log10",
					"make_pair",
					"make_shared",
					"make_shared_for_overwrite",
					"make_tuple",
					"make_unique",
					"malloc",
					"memchr",
					"memcmp",
					"memcpy",
					"memset",
					"modf",
					"move",
					"pow",
					"printf",
					"putchar",
					"puts",
					"realloc",
					"scanf",
					"sin",
					"sinh",
					"snprintf",
					"sprintf",
					"sqrt",
					"sscanf",
					"std",
					"stderr",
					"stdin",
					"stdout",
					"strcat",
					"strchr",
					"strcmp",
					"strcpy",
					"strcspn",
					"strlen",
					"strncat",
					"strncmp",
					"strncpy",
					"strpbrk",
					"strrchr",
					"strspn",
					"strstr",
					"swap",
					"tan",
					"tanh",
					"terminate",
					"to_underlying",
					"tolower",
					"toupper",
					"vfprintf",
					"visit",
					"vprintf",
					"vsprintf"
				];
				const CPP_KEYWORDS = {
					type: RESERVED_TYPES,
					keyword: RESERVED_KEYWORDS,
					literal: [
						"NULL",
						"false",
						"nullopt",
						"nullptr",
						"true"
					],
					built_in: ["_Pragma"],
					_type_hints: TYPE_HINTS
				};
				const FUNCTION_DISPATCH = {
					className: "function.dispatch",
					relevance: 0,
					keywords: { _hint: FUNCTION_HINTS },
					begin: regex.concat(/\b/, `(?!${RESERVED_KEYWORDS.join("|")})`, hljs.IDENT_RE, regex.lookahead(/(<[^<>]+>|)\s*\(/))
				};
				const EXPRESSION_CONTAINS = [
					FUNCTION_DISPATCH,
					...PREPROCESSORS,
					CPP_PRIMITIVE_TYPES,
					C_LINE_COMMENT_MODE,
					hljs.C_BLOCK_COMMENT_MODE,
					NUMBERS,
					STRINGS
				];
				const EXPRESSION_CONTEXT = {
					variants: [
						{
							begin: /=/,
							end: /;/
						},
						{
							begin: /\(/,
							end: /\)/
						},
						{
							beginKeywords: "new throw return else",
							end: /;/
						}
					],
					keywords: CPP_KEYWORDS,
					contains: EXPRESSION_CONTAINS.concat([{
						begin: /\(/,
						end: /\)/,
						keywords: CPP_KEYWORDS,
						contains: EXPRESSION_CONTAINS.concat(["self"]),
						relevance: 0
					}]),
					relevance: 0
				};
				const FUNCTION_DECLARATION = {
					className: "function",
					begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+){1,12}" + FUNCTION_TITLE,
					returnBegin: true,
					end: /[{;=]/,
					excludeEnd: true,
					keywords: CPP_KEYWORDS,
					illegal: /[^\w\s\*&:<>.]/,
					contains: [
						{
							begin: DECLTYPE_AUTO_RE,
							keywords: CPP_KEYWORDS,
							relevance: 0
						},
						{
							begin: FUNCTION_TITLE,
							returnBegin: true,
							contains: [TITLE_MODE],
							relevance: 0
						},
						{
							begin: /::/,
							relevance: 0
						},
						{
							begin: /:/,
							endsWithParent: true,
							contains: [STRINGS, NUMBERS]
						},
						{
							relevance: 0,
							match: /,/
						},
						{
							className: "params",
							begin: /\(/,
							end: /\)/,
							keywords: CPP_KEYWORDS,
							relevance: 0,
							contains: [
								C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE,
								STRINGS,
								NUMBERS,
								CPP_PRIMITIVE_TYPES,
								{
									begin: /\(/,
									end: /\)/,
									keywords: CPP_KEYWORDS,
									relevance: 0,
									contains: [
										"self",
										C_LINE_COMMENT_MODE,
										hljs.C_BLOCK_COMMENT_MODE,
										STRINGS,
										NUMBERS,
										CPP_PRIMITIVE_TYPES
									]
								}
							]
						},
						CPP_PRIMITIVE_TYPES,
						C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						...PREPROCESSORS
					]
				};
				return {
					name: "C++",
					aliases: [
						"cc",
						"c++",
						"h++",
						"hpp",
						"hh",
						"hxx",
						"cxx"
					],
					keywords: CPP_KEYWORDS,
					illegal: "</",
					classNameAliases: { "function.dispatch": "built_in" },
					contains: [].concat(EXPRESSION_CONTEXT, FUNCTION_DECLARATION, FUNCTION_DISPATCH, EXPRESSION_CONTAINS, [
						...PREPROCESSORS,
						{
							begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
							end: ">",
							keywords: CPP_KEYWORDS,
							contains: ["self", CPP_PRIMITIVE_TYPES]
						},
						{
							begin: hljs.IDENT_RE + "::",
							keywords: CPP_KEYWORDS
						},
						{
							match: [
								/\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
								/\s+/,
								/\w+/
							],
							className: {
								1: "keyword",
								3: "title.class"
							}
						}
					])
				};
			}
			module.exports = cpp;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/csharp.js
		var require_csharp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function csharp(hljs) {
				const BUILT_IN_KEYWORDS = [
					"bool",
					"byte",
					"char",
					"decimal",
					"delegate",
					"double",
					"dynamic",
					"enum",
					"float",
					"int",
					"long",
					"nint",
					"nuint",
					"object",
					"sbyte",
					"short",
					"string",
					"ulong",
					"uint",
					"ushort"
				];
				const FUNCTION_MODIFIERS = [
					"public",
					"private",
					"protected",
					"static",
					"internal",
					"protected",
					"abstract",
					"async",
					"extern",
					"override",
					"unsafe",
					"virtual",
					"new",
					"sealed",
					"partial"
				];
				const KEYWORDS = {
					keyword: [
						"abstract",
						"as",
						"base",
						"break",
						"case",
						"catch",
						"class",
						"const",
						"continue",
						"do",
						"else",
						"event",
						"explicit",
						"extern",
						"finally",
						"fixed",
						"for",
						"foreach",
						"goto",
						"if",
						"implicit",
						"in",
						"interface",
						"internal",
						"is",
						"lock",
						"namespace",
						"new",
						"operator",
						"out",
						"override",
						"params",
						"private",
						"protected",
						"public",
						"readonly",
						"record",
						"ref",
						"return",
						"scoped",
						"sealed",
						"sizeof",
						"stackalloc",
						"static",
						"struct",
						"switch",
						"this",
						"throw",
						"try",
						"typeof",
						"unchecked",
						"unsafe",
						"using",
						"virtual",
						"void",
						"volatile",
						"while"
					].concat([
						"add",
						"alias",
						"and",
						"ascending",
						"args",
						"async",
						"await",
						"by",
						"descending",
						"dynamic",
						"equals",
						"file",
						"from",
						"get",
						"global",
						"group",
						"init",
						"into",
						"join",
						"let",
						"nameof",
						"not",
						"notnull",
						"on",
						"or",
						"orderby",
						"partial",
						"record",
						"remove",
						"required",
						"scoped",
						"select",
						"set",
						"unmanaged",
						"value|0",
						"var",
						"when",
						"where",
						"with",
						"yield"
					]),
					built_in: BUILT_IN_KEYWORDS,
					literal: [
						"default",
						"false",
						"null",
						"true"
					]
				};
				const TITLE_MODE = hljs.inherit(hljs.TITLE_MODE, { begin: "[a-zA-Z](\\.?\\w)*" });
				const INTEGER_SUFFIX = "([uU][lL]?|[lL][uU]?)?";
				const NUMBERS = {
					className: "number",
					variants: [
						{ begin: "\\b0[bB]_*[01](_*[01])*" + INTEGER_SUFFIX },
						{ begin: "(-?)\\b0[xX]_*[a-fA-F0-9](_*[a-fA-F0-9])*" + INTEGER_SUFFIX },
						{ begin: "(-?)(\\b\\d(_*\\d)*(\\.(\\d(_*\\d)*)?)?|\\.\\d(_*\\d)*)([eE][-+]?\\d(_*\\d)*)?([fFdDmM]|[uU][lL]?|[lL][uU]?)?" }
					],
					relevance: 0
				};
				const RAW_STRING = {
					className: "string",
					begin: /"""("*)(?!")(.|\n)*?"""\1/,
					relevance: 1
				};
				const VERBATIM_STRING = {
					className: "string",
					begin: "@\"",
					end: "\"",
					contains: [{ begin: "\"\"" }]
				};
				const VERBATIM_STRING_NO_LF = hljs.inherit(VERBATIM_STRING, { illegal: /\n/ });
				const SUBST = {
					className: "subst",
					begin: /\{/,
					end: /\}/,
					keywords: KEYWORDS
				};
				const SUBST_NO_LF = hljs.inherit(SUBST, { illegal: /\n/ });
				const INTERPOLATED_STRING = {
					className: "string",
					begin: /\$"/,
					end: "\"",
					illegal: /\n/,
					contains: [
						{ begin: /\{\{/ },
						{ begin: /\}\}/ },
						hljs.BACKSLASH_ESCAPE,
						SUBST_NO_LF
					]
				};
				const INTERPOLATED_VERBATIM_STRING = {
					className: "string",
					begin: /\$@"/,
					end: "\"",
					contains: [
						{ begin: /\{\{/ },
						{ begin: /\}\}/ },
						{ begin: "\"\"" },
						SUBST
					]
				};
				const INTERPOLATED_VERBATIM_STRING_NO_LF = hljs.inherit(INTERPOLATED_VERBATIM_STRING, {
					illegal: /\n/,
					contains: [
						{ begin: /\{\{/ },
						{ begin: /\}\}/ },
						{ begin: "\"\"" },
						SUBST_NO_LF
					]
				});
				SUBST.contains = [
					INTERPOLATED_VERBATIM_STRING,
					INTERPOLATED_STRING,
					VERBATIM_STRING,
					hljs.APOS_STRING_MODE,
					hljs.QUOTE_STRING_MODE,
					NUMBERS,
					hljs.C_BLOCK_COMMENT_MODE
				];
				SUBST_NO_LF.contains = [
					INTERPOLATED_VERBATIM_STRING_NO_LF,
					INTERPOLATED_STRING,
					VERBATIM_STRING_NO_LF,
					hljs.APOS_STRING_MODE,
					hljs.QUOTE_STRING_MODE,
					NUMBERS,
					hljs.inherit(hljs.C_BLOCK_COMMENT_MODE, { illegal: /\n/ })
				];
				const STRING = { variants: [
					RAW_STRING,
					INTERPOLATED_VERBATIM_STRING,
					INTERPOLATED_STRING,
					VERBATIM_STRING,
					hljs.APOS_STRING_MODE,
					hljs.QUOTE_STRING_MODE
				] };
				const GENERIC_MODIFIER = {
					begin: "<",
					end: ">",
					contains: [{ beginKeywords: "in out" }, TITLE_MODE]
				};
				const TYPE_IDENT_RE = hljs.IDENT_RE + "(<" + hljs.IDENT_RE + "(\\s*,\\s*" + hljs.IDENT_RE + ")*>)?(\\[\\])?";
				const AT_IDENTIFIER = {
					begin: "@" + hljs.IDENT_RE,
					relevance: 0
				};
				return {
					name: "C#",
					aliases: ["cs", "c#"],
					keywords: KEYWORDS,
					illegal: /::/,
					contains: [
						hljs.COMMENT("///", "$", {
							returnBegin: true,
							contains: [{
								className: "doctag",
								variants: [
									{
										begin: "///",
										relevance: 0
									},
									{ begin: "<!--|-->" },
									{
										begin: "</?",
										end: ">"
									}
								]
							}]
						}),
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						{
							className: "meta",
							begin: "#",
							end: "$",
							keywords: { keyword: "if else elif endif define undef warning error line region endregion pragma checksum" }
						},
						STRING,
						NUMBERS,
						{
							beginKeywords: "class interface",
							relevance: 0,
							end: /[{;=]/,
							illegal: /[^\s:,]/,
							contains: [
								{ beginKeywords: "where class" },
								TITLE_MODE,
								GENERIC_MODIFIER,
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						{
							beginKeywords: "namespace",
							relevance: 0,
							end: /[{;=]/,
							illegal: /[^\s:]/,
							contains: [
								TITLE_MODE,
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						{
							beginKeywords: "record",
							relevance: 0,
							end: /[{;=]/,
							illegal: /[^\s:]/,
							contains: [
								TITLE_MODE,
								GENERIC_MODIFIER,
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						{
							className: "meta",
							begin: "^\\s*\\[(?=[\\w])",
							excludeBegin: true,
							end: "\\]",
							excludeEnd: true,
							contains: [{
								className: "string",
								begin: /"/,
								end: /"/
							}]
						},
						{
							beginKeywords: "new return throw await else",
							relevance: 0
						},
						{
							className: "function",
							begin: "(" + TYPE_IDENT_RE + "\\s+)+" + hljs.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
							returnBegin: true,
							end: /\s*[{;=]/,
							excludeEnd: true,
							keywords: KEYWORDS,
							contains: [
								{
									beginKeywords: FUNCTION_MODIFIERS.join(" "),
									relevance: 0
								},
								{
									begin: hljs.IDENT_RE + "\\s*(<[^=]+>\\s*)?\\(",
									returnBegin: true,
									contains: [hljs.TITLE_MODE, GENERIC_MODIFIER],
									relevance: 0
								},
								{ match: /\(\)/ },
								{
									className: "params",
									begin: /\(/,
									end: /\)/,
									excludeBegin: true,
									excludeEnd: true,
									keywords: KEYWORDS,
									relevance: 0,
									contains: [
										STRING,
										NUMBERS,
										hljs.C_BLOCK_COMMENT_MODE
									]
								},
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						AT_IDENTIFIER
					]
				};
			}
			module.exports = csharp;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/css.js
		var require_css = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const MODES = (hljs) => {
				return {
					IMPORTANT: {
						scope: "meta",
						begin: "!important"
					},
					BLOCK_COMMENT: hljs.C_BLOCK_COMMENT_MODE,
					HEXCOLOR: {
						scope: "number",
						begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
					},
					UNICODE_RANGE: {
						scope: "number",
						begin: /\b[Uu]\+[0-9A-Fa-f][0-9A-Fa-f?]{0,5}(-[0-9A-Fa-f][0-9A-Fa-f]{0,5})?/
					},
					FUNCTION_DISPATCH: {
						className: "built_in",
						begin: /[\w-]+(?=\()/
					},
					ATTRIBUTE_SELECTOR_MODE: {
						scope: "selector-attr",
						begin: /\[/,
						end: /\]/,
						illegal: "$",
						contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
					},
					CSS_NUMBER_MODE: {
						scope: "number",
						begin: hljs.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
						relevance: 0
					},
					CSS_VARIABLE: {
						className: "attr",
						begin: /--[A-Za-z_][A-Za-z0-9_-]*/
					}
				};
			};
			const HTML_TAGS = [
				"a",
				"abbr",
				"address",
				"article",
				"aside",
				"audio",
				"b",
				"blockquote",
				"body",
				"button",
				"canvas",
				"caption",
				"cite",
				"code",
				"dd",
				"del",
				"details",
				"dfn",
				"div",
				"dl",
				"dt",
				"em",
				"fieldset",
				"figcaption",
				"figure",
				"footer",
				"form",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"header",
				"hgroup",
				"html",
				"i",
				"iframe",
				"img",
				"input",
				"ins",
				"kbd",
				"label",
				"legend",
				"li",
				"main",
				"mark",
				"menu",
				"nav",
				"object",
				"ol",
				"optgroup",
				"option",
				"p",
				"picture",
				"q",
				"quote",
				"samp",
				"section",
				"select",
				"source",
				"span",
				"strong",
				"summary",
				"sup",
				"table",
				"tbody",
				"td",
				"textarea",
				"tfoot",
				"th",
				"thead",
				"time",
				"tr",
				"ul",
				"var",
				"video"
			];
			const SVG_TAGS = [
				"defs",
				"g",
				"marker",
				"mask",
				"pattern",
				"svg",
				"switch",
				"symbol",
				"feBlend",
				"feColorMatrix",
				"feComponentTransfer",
				"feComposite",
				"feConvolveMatrix",
				"feDiffuseLighting",
				"feDisplacementMap",
				"feFlood",
				"feGaussianBlur",
				"feImage",
				"feMerge",
				"feMorphology",
				"feOffset",
				"feSpecularLighting",
				"feTile",
				"feTurbulence",
				"linearGradient",
				"radialGradient",
				"stop",
				"circle",
				"ellipse",
				"image",
				"line",
				"path",
				"polygon",
				"polyline",
				"rect",
				"text",
				"use",
				"textPath",
				"tspan",
				"foreignObject",
				"clipPath"
			];
			const TAGS = [...HTML_TAGS, ...SVG_TAGS];
			const MEDIA_FEATURES = [
				"any-hover",
				"any-pointer",
				"aspect-ratio",
				"color",
				"color-gamut",
				"color-index",
				"device-aspect-ratio",
				"device-height",
				"device-width",
				"display-mode",
				"forced-colors",
				"grid",
				"height",
				"hover",
				"inverted-colors",
				"monochrome",
				"orientation",
				"overflow-block",
				"overflow-inline",
				"pointer",
				"prefers-color-scheme",
				"prefers-contrast",
				"prefers-reduced-motion",
				"prefers-reduced-transparency",
				"resolution",
				"scan",
				"scripting",
				"update",
				"width",
				"min-width",
				"max-width",
				"min-height",
				"max-height"
			].sort().reverse();
			const PSEUDO_CLASSES = [
				"active",
				"any-link",
				"blank",
				"checked",
				"current",
				"default",
				"defined",
				"dir",
				"disabled",
				"drop",
				"empty",
				"enabled",
				"first",
				"first-child",
				"first-of-type",
				"fullscreen",
				"future",
				"focus",
				"focus-visible",
				"focus-within",
				"has",
				"host",
				"host-context",
				"hover",
				"indeterminate",
				"in-range",
				"invalid",
				"is",
				"lang",
				"last-child",
				"last-of-type",
				"left",
				"link",
				"local-link",
				"not",
				"nth-child",
				"nth-col",
				"nth-last-child",
				"nth-last-col",
				"nth-last-of-type",
				"nth-of-type",
				"only-child",
				"only-of-type",
				"optional",
				"out-of-range",
				"past",
				"placeholder-shown",
				"read-only",
				"read-write",
				"required",
				"right",
				"root",
				"scope",
				"target",
				"target-within",
				"user-invalid",
				"valid",
				"visited",
				"where"
			].sort().reverse();
			const PSEUDO_ELEMENTS = [
				"after",
				"backdrop",
				"before",
				"cue",
				"cue-region",
				"first-letter",
				"first-line",
				"grammar-error",
				"marker",
				"part",
				"placeholder",
				"selection",
				"slotted",
				"spelling-error"
			].sort().reverse();
			const ATTRIBUTES = [
				"accent-color",
				"align-content",
				"align-items",
				"align-self",
				"alignment-baseline",
				"all",
				"anchor-name",
				"animation",
				"animation-composition",
				"animation-delay",
				"animation-direction",
				"animation-duration",
				"animation-fill-mode",
				"animation-iteration-count",
				"animation-name",
				"animation-play-state",
				"animation-range",
				"animation-range-end",
				"animation-range-start",
				"animation-timeline",
				"animation-timing-function",
				"appearance",
				"aspect-ratio",
				"backdrop-filter",
				"backface-visibility",
				"background",
				"background-attachment",
				"background-blend-mode",
				"background-clip",
				"background-color",
				"background-image",
				"background-origin",
				"background-position",
				"background-position-x",
				"background-position-y",
				"background-repeat",
				"background-size",
				"baseline-shift",
				"block-size",
				"border",
				"border-block",
				"border-block-color",
				"border-block-end",
				"border-block-end-color",
				"border-block-end-style",
				"border-block-end-width",
				"border-block-start",
				"border-block-start-color",
				"border-block-start-style",
				"border-block-start-width",
				"border-block-style",
				"border-block-width",
				"border-bottom",
				"border-bottom-color",
				"border-bottom-left-radius",
				"border-bottom-right-radius",
				"border-bottom-style",
				"border-bottom-width",
				"border-collapse",
				"border-color",
				"border-end-end-radius",
				"border-end-start-radius",
				"border-image",
				"border-image-outset",
				"border-image-repeat",
				"border-image-slice",
				"border-image-source",
				"border-image-width",
				"border-inline",
				"border-inline-color",
				"border-inline-end",
				"border-inline-end-color",
				"border-inline-end-style",
				"border-inline-end-width",
				"border-inline-start",
				"border-inline-start-color",
				"border-inline-start-style",
				"border-inline-start-width",
				"border-inline-style",
				"border-inline-width",
				"border-left",
				"border-left-color",
				"border-left-style",
				"border-left-width",
				"border-radius",
				"border-right",
				"border-right-color",
				"border-right-style",
				"border-right-width",
				"border-spacing",
				"border-start-end-radius",
				"border-start-start-radius",
				"border-style",
				"border-top",
				"border-top-color",
				"border-top-left-radius",
				"border-top-right-radius",
				"border-top-style",
				"border-top-width",
				"border-width",
				"bottom",
				"box-align",
				"box-decoration-break",
				"box-direction",
				"box-flex",
				"box-flex-group",
				"box-lines",
				"box-ordinal-group",
				"box-orient",
				"box-pack",
				"box-shadow",
				"box-sizing",
				"break-after",
				"break-before",
				"break-inside",
				"caption-side",
				"caret-color",
				"clear",
				"clip",
				"clip-path",
				"clip-rule",
				"color",
				"color-interpolation",
				"color-interpolation-filters",
				"color-profile",
				"color-rendering",
				"color-scheme",
				"column-count",
				"column-fill",
				"column-gap",
				"column-rule",
				"column-rule-color",
				"column-rule-style",
				"column-rule-width",
				"column-span",
				"column-width",
				"columns",
				"contain",
				"contain-intrinsic-block-size",
				"contain-intrinsic-height",
				"contain-intrinsic-inline-size",
				"contain-intrinsic-size",
				"contain-intrinsic-width",
				"container",
				"container-name",
				"container-type",
				"content",
				"content-visibility",
				"corner-bottom-left-shape",
				"corner-bottom-right-shape",
				"corner-shape",
				"corner-top-left-shape",
				"corner-top-right-shape",
				"counter-increment",
				"counter-reset",
				"counter-set",
				"cue",
				"cue-after",
				"cue-before",
				"cursor",
				"cx",
				"cy",
				"direction",
				"display",
				"dominant-baseline",
				"empty-cells",
				"enable-background",
				"field-sizing",
				"fill",
				"fill-opacity",
				"fill-rule",
				"filter",
				"flex",
				"flex-basis",
				"flex-direction",
				"flex-flow",
				"flex-grow",
				"flex-shrink",
				"flex-wrap",
				"float",
				"flood-color",
				"flood-opacity",
				"flow",
				"font",
				"font-display",
				"font-family",
				"font-feature-settings",
				"font-kerning",
				"font-language-override",
				"font-optical-sizing",
				"font-palette",
				"font-size",
				"font-size-adjust",
				"font-smooth",
				"font-smoothing",
				"font-stretch",
				"font-style",
				"font-synthesis",
				"font-synthesis-position",
				"font-synthesis-small-caps",
				"font-synthesis-style",
				"font-synthesis-weight",
				"font-variant",
				"font-variant-alternates",
				"font-variant-caps",
				"font-variant-east-asian",
				"font-variant-emoji",
				"font-variant-ligatures",
				"font-variant-numeric",
				"font-variant-position",
				"font-variation-settings",
				"font-weight",
				"forced-color-adjust",
				"gap",
				"glyph-orientation-horizontal",
				"glyph-orientation-vertical",
				"grid",
				"grid-area",
				"grid-auto-columns",
				"grid-auto-flow",
				"grid-auto-rows",
				"grid-column",
				"grid-column-end",
				"grid-column-start",
				"grid-gap",
				"grid-row",
				"grid-row-end",
				"grid-row-start",
				"grid-template",
				"grid-template-areas",
				"grid-template-columns",
				"grid-template-rows",
				"hanging-punctuation",
				"height",
				"hyphenate-character",
				"hyphenate-limit-chars",
				"hyphens",
				"icon",
				"image-orientation",
				"image-rendering",
				"image-resolution",
				"ime-mode",
				"initial-letter",
				"initial-letter-align",
				"inline-size",
				"inset",
				"inset-area",
				"inset-block",
				"inset-block-end",
				"inset-block-start",
				"inset-inline",
				"inset-inline-end",
				"inset-inline-start",
				"isolation",
				"justify-content",
				"justify-items",
				"justify-self",
				"kerning",
				"left",
				"letter-spacing",
				"lighting-color",
				"line-break",
				"line-height",
				"line-height-step",
				"list-style",
				"list-style-image",
				"list-style-position",
				"list-style-type",
				"margin",
				"margin-block",
				"margin-block-end",
				"margin-block-start",
				"margin-bottom",
				"margin-inline",
				"margin-inline-end",
				"margin-inline-start",
				"margin-left",
				"margin-right",
				"margin-top",
				"margin-trim",
				"marker",
				"marker-end",
				"marker-mid",
				"marker-start",
				"marks",
				"mask",
				"mask-border",
				"mask-border-mode",
				"mask-border-outset",
				"mask-border-repeat",
				"mask-border-slice",
				"mask-border-source",
				"mask-border-width",
				"mask-clip",
				"mask-composite",
				"mask-image",
				"mask-mode",
				"mask-origin",
				"mask-position",
				"mask-repeat",
				"mask-size",
				"mask-type",
				"masonry-auto-flow",
				"math-depth",
				"math-shift",
				"math-style",
				"max-block-size",
				"max-height",
				"max-inline-size",
				"max-width",
				"min-block-size",
				"min-height",
				"min-inline-size",
				"min-width",
				"mix-blend-mode",
				"nav-down",
				"nav-index",
				"nav-left",
				"nav-right",
				"nav-up",
				"none",
				"normal",
				"object-fit",
				"object-position",
				"offset",
				"offset-anchor",
				"offset-distance",
				"offset-path",
				"offset-position",
				"offset-rotate",
				"opacity",
				"order",
				"orphans",
				"outline",
				"outline-color",
				"outline-offset",
				"outline-style",
				"outline-width",
				"overflow",
				"overflow-anchor",
				"overflow-block",
				"overflow-clip-margin",
				"overflow-inline",
				"overflow-wrap",
				"overflow-x",
				"overflow-y",
				"overlay",
				"overscroll-behavior",
				"overscroll-behavior-block",
				"overscroll-behavior-inline",
				"overscroll-behavior-x",
				"overscroll-behavior-y",
				"padding",
				"padding-block",
				"padding-block-end",
				"padding-block-start",
				"padding-bottom",
				"padding-inline",
				"padding-inline-end",
				"padding-inline-start",
				"padding-left",
				"padding-right",
				"padding-top",
				"page",
				"page-break-after",
				"page-break-before",
				"page-break-inside",
				"paint-order",
				"pause",
				"pause-after",
				"pause-before",
				"perspective",
				"perspective-origin",
				"place-content",
				"place-items",
				"place-self",
				"pointer-events",
				"position",
				"position-anchor",
				"position-visibility",
				"print-color-adjust",
				"quotes",
				"r",
				"resize",
				"rest",
				"rest-after",
				"rest-before",
				"right",
				"rotate",
				"row-gap",
				"ruby-align",
				"ruby-position",
				"scale",
				"scroll-behavior",
				"scroll-margin",
				"scroll-margin-block",
				"scroll-margin-block-end",
				"scroll-margin-block-start",
				"scroll-margin-bottom",
				"scroll-margin-inline",
				"scroll-margin-inline-end",
				"scroll-margin-inline-start",
				"scroll-margin-left",
				"scroll-margin-right",
				"scroll-margin-top",
				"scroll-padding",
				"scroll-padding-block",
				"scroll-padding-block-end",
				"scroll-padding-block-start",
				"scroll-padding-bottom",
				"scroll-padding-inline",
				"scroll-padding-inline-end",
				"scroll-padding-inline-start",
				"scroll-padding-left",
				"scroll-padding-right",
				"scroll-padding-top",
				"scroll-snap-align",
				"scroll-snap-stop",
				"scroll-snap-type",
				"scroll-timeline",
				"scroll-timeline-axis",
				"scroll-timeline-name",
				"scrollbar-color",
				"scrollbar-gutter",
				"scrollbar-width",
				"shape-image-threshold",
				"shape-margin",
				"shape-outside",
				"shape-rendering",
				"speak",
				"speak-as",
				"src",
				"stop-color",
				"stop-opacity",
				"stroke",
				"stroke-dasharray",
				"stroke-dashoffset",
				"stroke-linecap",
				"stroke-linejoin",
				"stroke-miterlimit",
				"stroke-opacity",
				"stroke-width",
				"tab-size",
				"table-layout",
				"text-align",
				"text-align-all",
				"text-align-last",
				"text-anchor",
				"text-combine-upright",
				"text-decoration",
				"text-decoration-color",
				"text-decoration-line",
				"text-decoration-skip",
				"text-decoration-skip-ink",
				"text-decoration-style",
				"text-decoration-thickness",
				"text-emphasis",
				"text-emphasis-color",
				"text-emphasis-position",
				"text-emphasis-style",
				"text-indent",
				"text-justify",
				"text-orientation",
				"text-overflow",
				"text-rendering",
				"text-shadow",
				"text-size-adjust",
				"text-transform",
				"text-underline-offset",
				"text-underline-position",
				"text-wrap",
				"text-wrap-mode",
				"text-wrap-style",
				"timeline-scope",
				"top",
				"touch-action",
				"transform",
				"transform-box",
				"transform-origin",
				"transform-style",
				"transition",
				"transition-behavior",
				"transition-delay",
				"transition-duration",
				"transition-property",
				"transition-timing-function",
				"translate",
				"unicode-bidi",
				"unicode-range",
				"user-modify",
				"user-select",
				"vector-effect",
				"vertical-align",
				"view-timeline",
				"view-timeline-axis",
				"view-timeline-inset",
				"view-timeline-name",
				"view-transition-name",
				"visibility",
				"voice-balance",
				"voice-duration",
				"voice-family",
				"voice-pitch",
				"voice-range",
				"voice-rate",
				"voice-stress",
				"voice-volume",
				"white-space",
				"white-space-collapse",
				"widows",
				"width",
				"will-change",
				"word-break",
				"word-spacing",
				"word-wrap",
				"writing-mode",
				"x",
				"y",
				"z-index",
				"zoom"
			].sort().reverse();
			/** @type LanguageFn */
			function css(hljs) {
				const regex = hljs.regex;
				const modes = MODES(hljs);
				const VENDOR_PREFIX = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ };
				const AT_MODIFIERS = "and or not only";
				const AT_PROPERTY_RE = /@-?\w[\w]*(-\w+)*/;
				const STRINGS = [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE];
				return {
					name: "CSS",
					case_insensitive: true,
					illegal: /[=|'\$]/,
					keywords: { keyframePosition: "from to" },
					classNameAliases: { keyframePosition: "selector-tag" },
					contains: [
						modes.BLOCK_COMMENT,
						VENDOR_PREFIX,
						modes.CSS_NUMBER_MODE,
						{
							className: "selector-id",
							begin: /#[A-Za-z0-9_-]+/,
							relevance: 0
						},
						{
							className: "selector-class",
							begin: "\\.[a-zA-Z-][a-zA-Z0-9_-]*",
							relevance: 0
						},
						modes.ATTRIBUTE_SELECTOR_MODE,
						{
							className: "selector-pseudo",
							variants: [{ begin: ":(" + PSEUDO_CLASSES.join("|") + ")" }, { begin: ":(:)?(" + PSEUDO_ELEMENTS.join("|") + ")" }]
						},
						modes.CSS_VARIABLE,
						{
							className: "attribute",
							begin: "\\b(" + ATTRIBUTES.join("|") + ")\\b"
						},
						{
							begin: /:/,
							end: /[;}{]/,
							contains: [
								modes.BLOCK_COMMENT,
								modes.HEXCOLOR,
								modes.IMPORTANT,
								modes.CSS_NUMBER_MODE,
								modes.UNICODE_RANGE,
								...STRINGS,
								{
									begin: /(url|data-uri)\(/,
									end: /\)/,
									relevance: 0,
									keywords: { built_in: "url data-uri" },
									contains: [...STRINGS, {
										className: "string",
										begin: /[^)]/,
										endsWithParent: true,
										excludeEnd: true
									}]
								},
								modes.FUNCTION_DISPATCH
							]
						},
						{
							begin: regex.lookahead(/@/),
							end: "[{;]",
							relevance: 0,
							illegal: /:/,
							contains: [{
								className: "keyword",
								begin: AT_PROPERTY_RE
							}, {
								begin: /\s/,
								endsWithParent: true,
								excludeEnd: true,
								relevance: 0,
								keywords: {
									$pattern: /[a-z-]+/,
									keyword: AT_MODIFIERS,
									attribute: MEDIA_FEATURES.join(" ")
								},
								contains: [
									{
										begin: /[a-z-]+(?=:)/,
										className: "attribute"
									},
									...STRINGS,
									modes.CSS_NUMBER_MODE
								]
							}]
						},
						{
							className: "selector-tag",
							begin: "\\b(" + TAGS.join("|") + ")\\b"
						}
					]
				};
			}
			module.exports = css;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/markdown.js
		var require_markdown = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function markdown(hljs) {
				const regex = hljs.regex;
				const INLINE_HTML = {
					begin: /<\/?[A-Za-z_]/,
					end: ">",
					subLanguage: "xml",
					relevance: 0
				};
				const HORIZONTAL_RULE = { match: /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/ };
				const CODE = {
					className: "code",
					variants: [
						{ begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
						{ begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
						{
							begin: "```",
							end: "```+[ ]*$"
						},
						{
							begin: "~~~",
							end: "~~~+[ ]*$"
						},
						{ begin: "`.+?`" },
						{
							begin: "(?=^( {4}|\\t))",
							contains: [{
								begin: "^( {4}|\\t)",
								end: "(\\n)$"
							}],
							relevance: 0
						}
					]
				};
				const LIST = {
					className: "bullet",
					begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
					end: "\\s+",
					excludeEnd: true
				};
				const LINK_REFERENCE = {
					begin: /^\[[^\n]+\]:/,
					returnBegin: true,
					contains: [{
						className: "symbol",
						begin: /\[/,
						end: /\]/,
						excludeBegin: true,
						excludeEnd: true
					}, {
						className: "link",
						begin: /:\s*/,
						end: /$/,
						excludeBegin: true
					}]
				};
				const LINK = {
					variants: [
						{
							begin: /\[.+?\]\[.*?\]/,
							relevance: 0
						},
						{
							begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
							relevance: 2
						},
						{
							begin: regex.concat(/\[.+?\]\(/, /[A-Za-z][A-Za-z0-9+.-]*/, /:\/\/.*?\)/),
							relevance: 2
						},
						{
							begin: /\[.+?\]\([./?&#].*?\)/,
							relevance: 1
						},
						{
							begin: /\[.*?\]\(.*?\)/,
							relevance: 0
						}
					],
					returnBegin: true,
					contains: [
						{ match: /\[(?=\])/ },
						{
							className: "string",
							relevance: 0,
							begin: "\\[",
							end: "\\]",
							excludeBegin: true,
							returnEnd: true
						},
						{
							className: "link",
							relevance: 0,
							begin: "\\]\\(",
							end: "\\)",
							excludeBegin: true,
							excludeEnd: true
						},
						{
							className: "symbol",
							relevance: 0,
							begin: "\\]\\[",
							end: "\\]",
							excludeBegin: true,
							excludeEnd: true
						}
					]
				};
				const BOLD = {
					className: "strong",
					contains: [],
					variants: [{
						begin: /_{2}(?!\s)/,
						end: /_{2}/
					}, {
						begin: /\*{2}(?!\s)/,
						end: /\*{2}/
					}]
				};
				const ITALIC = {
					className: "emphasis",
					contains: [],
					variants: [{
						begin: /\*(?![*\s])/,
						end: /\*/
					}, {
						begin: /_(?![_\s])/,
						end: /_/,
						relevance: 0
					}]
				};
				const BOLD_WITHOUT_ITALIC = hljs.inherit(BOLD, { contains: [] });
				const ITALIC_WITHOUT_BOLD = hljs.inherit(ITALIC, { contains: [] });
				BOLD.contains.push(ITALIC_WITHOUT_BOLD);
				ITALIC.contains.push(BOLD_WITHOUT_ITALIC);
				let CONTAINABLE = [INLINE_HTML, LINK];
				[
					BOLD,
					ITALIC,
					BOLD_WITHOUT_ITALIC,
					ITALIC_WITHOUT_BOLD
				].forEach((m) => {
					m.contains = m.contains.concat(CONTAINABLE);
				});
				CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);
				return {
					name: "Markdown",
					aliases: [
						"md",
						"mkdown",
						"mkd"
					],
					contains: [
						{
							className: "section",
							variants: [{
								begin: "^#{1,6}",
								end: "$",
								contains: CONTAINABLE
							}, {
								begin: "(?=^.+?\\n[=-]{2,}$)",
								contains: [{ begin: "^[=-]*$" }, {
									begin: "^",
									end: "\\n",
									contains: CONTAINABLE
								}]
							}]
						},
						INLINE_HTML,
						LIST,
						HORIZONTAL_RULE,
						BOLD,
						ITALIC,
						{
							className: "quote",
							begin: "^>\\s+",
							contains: CONTAINABLE,
							end: "$"
						},
						CODE,
						LINK,
						LINK_REFERENCE,
						{
							scope: "literal",
							match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
						}
					]
				};
			}
			module.exports = markdown;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/diff.js
		var require_diff = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function diff(hljs) {
				const regex = hljs.regex;
				return {
					name: "Diff",
					aliases: ["patch"],
					contains: [
						{
							className: "meta",
							relevance: 10,
							match: regex.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/, /^@@ +-\d+ +\+\d+,\d+ +@@/, /^@@ +-\d+,\d+ +\+\d+ +@@/, /^@@ +-\d+ +\+\d+ +@@/, /^\*\*\* +\d+,\d+ +\*\*\*\*$/, /^--- +\d+,\d+ +----$/)
						},
						{
							className: "comment",
							variants: [{
								begin: regex.either(/Index: /, /^index/, /={3,}/, /^-{3}/, /^\*{3} /, /^\+{3}/, /^diff --git/),
								end: /$/
							}, { match: /^\*{15}$/ }]
						},
						{
							className: "addition",
							begin: /^\+/,
							end: /$/
						},
						{
							className: "deletion",
							begin: /^-/,
							end: /$/
						},
						{
							className: "addition",
							begin: /^!/,
							end: /$/
						}
					]
				};
			}
			module.exports = diff;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/ruby.js
		var require_ruby = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function ruby(hljs) {
				const regex = hljs.regex;
				const RUBY_METHOD_RE = "([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)";
				const CLASS_NAME_RE = regex.either(/\b([A-Z]+[a-z0-9]+)+/, /\b([A-Z]+[a-z0-9]+)+[A-Z]+/);
				const CLASS_NAME_WITH_NAMESPACE_RE = regex.concat(CLASS_NAME_RE, /(::\w+)*/);
				const RUBY_KEYWORDS = {
					"variable.constant": [
						"__FILE__",
						"__LINE__",
						"__ENCODING__"
					],
					"variable.language": ["self", "super"],
					keyword: [
						"alias",
						"and",
						"begin",
						"BEGIN",
						"break",
						"case",
						"class",
						"defined",
						"do",
						"else",
						"elsif",
						"end",
						"END",
						"ensure",
						"for",
						"if",
						"in",
						"module",
						"next",
						"not",
						"or",
						"redo",
						"require",
						"rescue",
						"retry",
						"return",
						"then",
						"undef",
						"unless",
						"until",
						"when",
						"while",
						"yield",
						...[
							"include",
							"extend",
							"prepend",
							"public",
							"private",
							"protected",
							"raise",
							"throw"
						]
					],
					built_in: [
						"proc",
						"lambda",
						"attr_accessor",
						"attr_reader",
						"attr_writer",
						"define_method",
						"private_constant",
						"module_function"
					],
					literal: [
						"true",
						"false",
						"nil"
					]
				};
				const YARDOCTAG = {
					className: "doctag",
					begin: "@[A-Za-z]+"
				};
				const IRB_OBJECT = {
					begin: "#<",
					end: ">"
				};
				const COMMENT_MODES = [
					hljs.COMMENT("#", "$", { contains: [YARDOCTAG] }),
					hljs.COMMENT("^=begin", "^=end", {
						contains: [YARDOCTAG],
						relevance: 10
					}),
					hljs.COMMENT("^__END__", hljs.MATCH_NOTHING_RE)
				];
				const SUBST = {
					className: "subst",
					begin: /#\{/,
					end: /\}/,
					keywords: RUBY_KEYWORDS
				};
				const STRING = {
					className: "string",
					contains: [hljs.BACKSLASH_ESCAPE, SUBST],
					variants: [
						{
							begin: /'/,
							end: /'/
						},
						{
							begin: /"/,
							end: /"/
						},
						{
							begin: /`/,
							end: /`/
						},
						{
							begin: /%[qQwWx]?\(/,
							end: /\)/
						},
						{
							begin: /%[qQwWx]?\[/,
							end: /\]/
						},
						{
							begin: /%[qQwWx]?\{/,
							end: /\}/
						},
						{
							begin: /%[qQwWx]?</,
							end: />/
						},
						{
							begin: /%[qQwWx]?\//,
							end: /\//
						},
						{
							begin: /%[qQwWx]?%/,
							end: /%/
						},
						{
							begin: /%[qQwWx]?-/,
							end: /-/
						},
						{
							begin: /%[qQwWx]?\|/,
							end: /\|/
						},
						{ begin: /\B\?(\\\d{1,3})/ },
						{ begin: /\B\?(\\x[A-Fa-f0-9]{1,2})/ },
						{ begin: /\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/ },
						{ begin: /\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/ },
						{ begin: /\B\?\\(c|C-)[\x20-\x7e]/ },
						{ begin: /\B\?\\?\S/ },
						{
							begin: regex.concat(/<<[-~]?'?/, regex.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)),
							contains: [hljs.END_SAME_AS_BEGIN({
								begin: /(\w+)/,
								end: /(\w+)/,
								contains: [hljs.BACKSLASH_ESCAPE, SUBST]
							})]
						}
					]
				};
				const decimal = "[1-9](_?[0-9])*|0";
				const digits = "[0-9](_?[0-9])*";
				const NUMBER = {
					className: "number",
					relevance: 0,
					variants: [
						{ begin: `\\b(${decimal})(\\.(${digits}))?([eE][+-]?(${digits})|r)?i?\\b` },
						{ begin: "\\b0[dD][0-9](_?[0-9])*r?i?\\b" },
						{ begin: "\\b0[bB][0-1](_?[0-1])*r?i?\\b" },
						{ begin: "\\b0[oO][0-7](_?[0-7])*r?i?\\b" },
						{ begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b" },
						{ begin: "\\b0(_?[0-7])+r?i?\\b" }
					]
				};
				const PARAMS = { variants: [{ match: /\(\)/ }, {
					className: "params",
					begin: /\(/,
					end: /(?=\))/,
					excludeBegin: true,
					endsParent: true,
					keywords: RUBY_KEYWORDS
				}] };
				const RUBY_DEFAULT_CONTAINS = [
					STRING,
					{
						variants: [{ match: [
							/class\s+/,
							CLASS_NAME_WITH_NAMESPACE_RE,
							/\s+<\s+/,
							CLASS_NAME_WITH_NAMESPACE_RE
						] }, { match: [/\b(class|module)\s+/, CLASS_NAME_WITH_NAMESPACE_RE] }],
						scope: {
							2: "title.class",
							4: "title.class.inherited"
						},
						keywords: RUBY_KEYWORDS
					},
					{
						match: [/(include|extend)\s+/, CLASS_NAME_WITH_NAMESPACE_RE],
						scope: { 2: "title.class" },
						keywords: RUBY_KEYWORDS
					},
					{
						relevance: 0,
						match: [CLASS_NAME_WITH_NAMESPACE_RE, /\.new[. (]/],
						scope: { 1: "title.class" }
					},
					{
						relevance: 0,
						match: /\b[A-Z][A-Z_0-9]+\b/,
						className: "variable.constant"
					},
					{
						relevance: 0,
						match: CLASS_NAME_RE,
						scope: "title.class"
					},
					{
						match: [
							/def/,
							/\s+/,
							RUBY_METHOD_RE
						],
						scope: {
							1: "keyword",
							3: "title.function"
						},
						contains: [PARAMS]
					},
					{ begin: "::" },
					{
						className: "symbol",
						begin: hljs.UNDERSCORE_IDENT_RE + "(!|\\?)?:",
						relevance: 0
					},
					{
						className: "symbol",
						begin: ":(?!\\s)",
						contains: [STRING, { begin: RUBY_METHOD_RE }],
						relevance: 0
					},
					NUMBER,
					{
						className: "variable",
						begin: "(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])(?![A-Za-z])(?![@$?'])"
					},
					{
						className: "params",
						begin: /\|(?!=)/,
						end: /\|/,
						excludeBegin: true,
						excludeEnd: true,
						relevance: 0,
						keywords: RUBY_KEYWORDS
					},
					{
						begin: "(" + hljs.RE_STARTERS_RE + "|unless)\\s*",
						keywords: "unless",
						contains: [{
							className: "regexp",
							contains: [hljs.BACKSLASH_ESCAPE, SUBST],
							illegal: /\n/,
							variants: [
								{
									begin: "/",
									end: "/[a-z]*"
								},
								{
									begin: /%r\{/,
									end: /\}[a-z]*/
								},
								{
									begin: "%r\\(",
									end: "\\)[a-z]*"
								},
								{
									begin: "%r!",
									end: "![a-z]*"
								},
								{
									begin: "%r\\[",
									end: "\\][a-z]*"
								}
							]
						}].concat(IRB_OBJECT, COMMENT_MODES),
						relevance: 0
					}
				].concat(IRB_OBJECT, COMMENT_MODES);
				SUBST.contains = RUBY_DEFAULT_CONTAINS;
				PARAMS.contains = RUBY_DEFAULT_CONTAINS;
				const IRB_DEFAULT = [{
					begin: /^\s*=>/,
					starts: {
						end: "$",
						contains: RUBY_DEFAULT_CONTAINS
					}
				}, {
					className: "meta.prompt",
					begin: "^([>?]>|[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]|(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>)(?=[ ])",
					starts: {
						end: "$",
						keywords: RUBY_KEYWORDS,
						contains: RUBY_DEFAULT_CONTAINS
					}
				}];
				COMMENT_MODES.unshift(IRB_OBJECT);
				return {
					name: "Ruby",
					aliases: [
						"rb",
						"gemspec",
						"podspec",
						"thor",
						"irb"
					],
					keywords: RUBY_KEYWORDS,
					illegal: /\/\*/,
					contains: [hljs.SHEBANG({ binary: "ruby" })].concat(IRB_DEFAULT).concat(COMMENT_MODES).concat(RUBY_DEFAULT_CONTAINS)
				};
			}
			module.exports = ruby;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/go.js
		var require_go = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function go(hljs) {
				const KEYWORDS = {
					keyword: [
						"break",
						"case",
						"chan",
						"const",
						"continue",
						"default",
						"defer",
						"else",
						"fallthrough",
						"for",
						"func",
						"go",
						"goto",
						"if",
						"import",
						"interface",
						"map",
						"package",
						"range",
						"return",
						"select",
						"struct",
						"switch",
						"type",
						"var"
					],
					type: [
						"bool",
						"byte",
						"complex64",
						"complex128",
						"error",
						"float32",
						"float64",
						"int8",
						"int16",
						"int32",
						"int64",
						"string",
						"uint8",
						"uint16",
						"uint32",
						"uint64",
						"int",
						"uint",
						"uintptr",
						"rune"
					],
					literal: [
						"true",
						"false",
						"iota",
						"nil"
					],
					built_in: [
						"append",
						"cap",
						"close",
						"complex",
						"copy",
						"imag",
						"len",
						"make",
						"new",
						"panic",
						"print",
						"println",
						"real",
						"recover",
						"delete"
					]
				};
				return {
					name: "Go",
					aliases: ["golang"],
					keywords: KEYWORDS,
					illegal: "</",
					contains: [
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						{
							className: "string",
							variants: [
								hljs.QUOTE_STRING_MODE,
								hljs.APOS_STRING_MODE,
								{
									begin: "`",
									end: "`"
								}
							]
						},
						{
							className: "number",
							variants: [
								{
									match: /-?\b0[xX]\.[a-fA-F0-9](_?[a-fA-F0-9])*[pP][+-]?\d(_?\d)*i?/,
									relevance: 0
								},
								{
									match: /-?\b0[xX](_?[a-fA-F0-9])+((\.([a-fA-F0-9](_?[a-fA-F0-9])*)?)?[pP][+-]?\d(_?\d)*)?i?/,
									relevance: 0
								},
								{
									match: /-?\b0[oO](_?[0-7])*i?/,
									relevance: 0
								},
								{
									match: /-?\b0[bB](_?[01])*i?/,
									relevance: 0
								},
								{
									match: /-?\.\d(_?\d)*([eE][+-]?\d(_?\d)*)?i?/,
									relevance: 0
								},
								{
									match: /-?\b\d(_?\d)*(\.(\d(_?\d)*)?)?([eE][+-]?\d(_?\d)*)?i?/,
									relevance: 0
								}
							]
						},
						{ begin: /:=/ },
						{
							className: "function",
							beginKeywords: "func",
							end: "\\s*(\\{|$)",
							excludeEnd: true,
							contains: [hljs.TITLE_MODE, {
								className: "params",
								begin: /\(/,
								end: /\)/,
								endsParent: true,
								keywords: KEYWORDS,
								illegal: /["']/
							}]
						}
					]
				};
			}
			module.exports = go;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/graphql.js
		var require_graphql = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function graphql(hljs) {
				const regex = hljs.regex;
				return {
					name: "GraphQL",
					aliases: ["gql"],
					case_insensitive: true,
					disableAutodetect: false,
					keywords: {
						keyword: [
							"query",
							"mutation",
							"subscription",
							"type",
							"input",
							"schema",
							"directive",
							"interface",
							"union",
							"scalar",
							"fragment",
							"enum",
							"on"
						],
						literal: [
							"true",
							"false",
							"null"
						]
					},
					contains: [
						hljs.HASH_COMMENT_MODE,
						hljs.QUOTE_STRING_MODE,
						hljs.NUMBER_MODE,
						{
							scope: "punctuation",
							match: /[.]{3}/,
							relevance: 0
						},
						{
							scope: "punctuation",
							begin: /[\!\(\)\:\=\[\]\{\|\}]{1}/,
							relevance: 0
						},
						{
							scope: "variable",
							begin: /\$/,
							end: /\W/,
							excludeEnd: true,
							relevance: 0
						},
						{
							scope: "meta",
							match: /@\w+/,
							excludeEnd: true
						},
						{
							scope: "symbol",
							begin: regex.concat(/[_A-Za-z][_0-9A-Za-z]*/, regex.lookahead(/\s*:/)),
							relevance: 0
						}
					],
					illegal: [/[;<']/, /BEGIN/]
				};
			}
			module.exports = graphql;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/ini.js
		var require_ini = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function ini(hljs) {
				const regex = hljs.regex;
				const NUMBERS = {
					className: "number",
					relevance: 0,
					variants: [{ begin: /([+-]+)?[\d]+_[\d_]+/ }, { begin: hljs.NUMBER_RE }]
				};
				const COMMENTS = hljs.COMMENT();
				COMMENTS.variants = [{
					begin: /;/,
					end: /$/
				}, {
					begin: /#/,
					end: /$/
				}];
				const VARIABLES = {
					className: "variable",
					variants: [{ begin: /\$[\w\d"][\w\d_]*/ }, { begin: /\$\{(.*?)\}/ }]
				};
				const LITERALS = {
					className: "literal",
					begin: /\bon|off|true|false|yes|no\b/
				};
				const STRINGS = {
					className: "string",
					contains: [hljs.BACKSLASH_ESCAPE],
					variants: [
						{
							begin: "'''",
							end: "'''",
							relevance: 10
						},
						{
							begin: "\"\"\"",
							end: "\"\"\"",
							relevance: 10
						},
						{
							begin: "\"",
							end: "\""
						},
						{
							begin: "'",
							end: "'"
						}
					]
				};
				const ARRAY = {
					begin: /\[/,
					end: /\]/,
					contains: [
						COMMENTS,
						LITERALS,
						VARIABLES,
						STRINGS,
						NUMBERS,
						"self"
					],
					relevance: 0
				};
				const ANY_KEY = regex.either(/[A-Za-z0-9_-]+/, /"(\\"|[^"])*"/, /'[^']*'/);
				return {
					name: "TOML, also INI",
					aliases: ["toml"],
					case_insensitive: true,
					illegal: /\S/,
					contains: [
						COMMENTS,
						{
							className: "section",
							begin: /\[+/,
							end: /\]+/
						},
						{
							begin: regex.concat(ANY_KEY, "(\\s*\\.\\s*", ANY_KEY, ")*", regex.lookahead(/\s*=\s*[^#\s]/)),
							className: "attr",
							starts: {
								end: /$/,
								contains: [
									COMMENTS,
									ARRAY,
									LITERALS,
									VARIABLES,
									STRINGS,
									NUMBERS
								]
							}
						}
					]
				};
			}
			module.exports = ini;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/java.js
		var require_java = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			var decimalDigits = "[0-9](_*[0-9])*";
			var frac = `\\.(${decimalDigits})`;
			var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
			var NUMERIC = {
				className: "number",
				variants: [
					{ begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
					{ begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
					{ begin: `(${frac})[fFdD]?\\b` },
					{ begin: `\\b(${decimalDigits})[fFdD]\\b` },
					{ begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
					{ begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
					{ begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
					{ begin: "\\b0(_*[0-7])*[lL]?\\b" },
					{ begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
				],
				relevance: 0
			};
			/**
			* Allows recursive regex expressions to a given depth
			*
			* ie: recurRegex("(abc~~~)", /~~~/g, 2) becomes:
			* (abc(abc(abc)))
			*
			* @param {string} re
			* @param {RegExp} substitution (should be a g mode regex)
			* @param {number} depth
			* @returns {string}``
			*/
			function recurRegex(re, substitution, depth) {
				if (depth === -1) return "";
				return re.replace(substitution, (_) => {
					return recurRegex(re, substitution, depth - 1);
				});
			}
			/** @type LanguageFn */
			function java(hljs) {
				const regex = hljs.regex;
				const JAVA_IDENT_RE = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*";
				const ARRAY_BRACKETS_OPTIONAL_RE = "(?:(?:\\s*\\[\\s*])+)?";
				const TYPE_ARG_RE = "(?:\\?(?:\\s+(?:extends|super)\\s+[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?)?|[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?)";
				const TYPE_ARGS_OPTIONAL_RE = recurRegex("(?:\\s*<\\s*" + TYPE_ARG_RE + "(?:\\s*,\\s*" + TYPE_ARG_RE + ")*\\s*>)?", /<@@@>/g, 2);
				const KEYWORDS = {
					keyword: [
						"synchronized",
						"abstract",
						"private",
						"var",
						"static",
						"if",
						"const ",
						"for",
						"while",
						"strictfp",
						"finally",
						"protected",
						"import",
						"native",
						"final",
						"void",
						"enum",
						"else",
						"break",
						"transient",
						"catch",
						"instanceof",
						"volatile",
						"case",
						"assert",
						"package",
						"default",
						"public",
						"try",
						"switch",
						"continue",
						"throws",
						"protected",
						"public",
						"private",
						"module",
						"requires",
						"exports",
						"do",
						"sealed",
						"yield",
						"permits",
						"goto",
						"when"
					],
					literal: [
						"false",
						"true",
						"null"
					],
					type: [
						"char",
						"boolean",
						"long",
						"float",
						"int",
						"byte",
						"short",
						"double"
					],
					built_in: ["super", "this"]
				};
				const ANNOTATION = {
					className: "meta",
					begin: "@" + JAVA_IDENT_RE,
					contains: [{
						begin: /\(/,
						end: /\)/,
						contains: ["self"]
					}]
				};
				const PARAMS = {
					className: "params",
					begin: /\(/,
					end: /\)/,
					keywords: KEYWORDS,
					relevance: 0,
					contains: [hljs.C_BLOCK_COMMENT_MODE],
					endsParent: true
				};
				return {
					name: "Java",
					aliases: ["jsp"],
					keywords: KEYWORDS,
					illegal: /<\/|#/,
					contains: [
						hljs.COMMENT("/\\*\\*", "\\*/", {
							relevance: 0,
							contains: [{
								begin: /\w+@/,
								relevance: 0
							}, {
								className: "doctag",
								begin: "@[A-Za-z]+"
							}]
						}),
						{
							begin: /import java\.[a-z]+\./,
							keywords: "import",
							relevance: 2
						},
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						{
							begin: /"""/,
							end: /"""/,
							className: "string",
							contains: [hljs.BACKSLASH_ESCAPE]
						},
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE,
						{
							match: [
								/\b(?:class|interface|enum|extends|implements|new)/,
								/\s+/,
								JAVA_IDENT_RE
							],
							className: {
								1: "keyword",
								3: "title.class"
							}
						},
						{
							match: /non-sealed/,
							scope: "keyword"
						},
						{
							beginKeywords: "new throw return else yield assert",
							relevance: 0
						},
						{
							begin: [
								JAVA_IDENT_RE,
								regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
								JAVA_IDENT_RE,
								ARRAY_BRACKETS_OPTIONAL_RE,
								/\s*/,
								/=(?!=)/
							],
							className: {
								1: "type",
								3: "variable",
								6: "operator"
							}
						},
						{
							begin: [
								/record/,
								/\s+/,
								JAVA_IDENT_RE
							],
							className: {
								1: "keyword",
								3: "title.class"
							},
							contains: [
								PARAMS,
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						{
							begin: [
								JAVA_IDENT_RE,
								regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
								JAVA_IDENT_RE,
								/\s*(?=\()/
							],
							className: {
								1: "type",
								3: "title.function"
							},
							keywords: KEYWORDS,
							contains: [
								{
									className: "params",
									begin: /\(/,
									end: /\)/,
									keywords: KEYWORDS,
									relevance: 0,
									contains: [
										ANNOTATION,
										hljs.APOS_STRING_MODE,
										hljs.QUOTE_STRING_MODE,
										NUMERIC,
										hljs.C_BLOCK_COMMENT_MODE
									]
								},
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						NUMERIC,
						ANNOTATION
					]
				};
			}
			module.exports = java;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/javascript.js
		var require_javascript = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
			const KEYWORDS = [
				"as",
				"in",
				"of",
				"if",
				"for",
				"while",
				"finally",
				"var",
				"new",
				"function",
				"do",
				"return",
				"void",
				"else",
				"break",
				"catch",
				"instanceof",
				"with",
				"throw",
				"case",
				"default",
				"try",
				"switch",
				"continue",
				"typeof",
				"delete",
				"let",
				"yield",
				"const",
				"class",
				"debugger",
				"async",
				"await",
				"static",
				"import",
				"from",
				"export",
				"extends",
				"using"
			];
			const LITERALS = [
				"true",
				"false",
				"null",
				"undefined",
				"NaN",
				"Infinity"
			];
			const TYPES = [
				"Object",
				"Function",
				"Boolean",
				"Symbol",
				"Math",
				"Date",
				"Number",
				"BigInt",
				"String",
				"RegExp",
				"Array",
				"Float32Array",
				"Float64Array",
				"Int8Array",
				"Uint8Array",
				"Uint8ClampedArray",
				"Int16Array",
				"Int32Array",
				"Uint16Array",
				"Uint32Array",
				"BigInt64Array",
				"BigUint64Array",
				"Set",
				"Map",
				"WeakSet",
				"WeakMap",
				"ArrayBuffer",
				"SharedArrayBuffer",
				"Atomics",
				"DataView",
				"JSON",
				"Promise",
				"Generator",
				"GeneratorFunction",
				"AsyncFunction",
				"Reflect",
				"Proxy",
				"Intl",
				"WebAssembly"
			];
			const ERROR_TYPES = [
				"Error",
				"EvalError",
				"InternalError",
				"RangeError",
				"ReferenceError",
				"SyntaxError",
				"TypeError",
				"URIError"
			];
			const BUILT_IN_GLOBALS = [
				"setInterval",
				"setTimeout",
				"clearInterval",
				"clearTimeout",
				"require",
				"exports",
				"eval",
				"isFinite",
				"isNaN",
				"parseFloat",
				"parseInt",
				"decodeURI",
				"decodeURIComponent",
				"encodeURI",
				"encodeURIComponent",
				"escape",
				"unescape"
			];
			const BUILT_IN_VARIABLES = [
				"arguments",
				"this",
				"super",
				"console",
				"window",
				"document",
				"localStorage",
				"sessionStorage",
				"module",
				"self",
				"global"
			];
			const BUILT_INS = [].concat(BUILT_IN_GLOBALS, TYPES, ERROR_TYPES);
			/** @type LanguageFn */
			function javascript(hljs) {
				const regex = hljs.regex;
				/**
				* Takes a string like "<Booger" and checks to see
				* if we can find a matching "</Booger" later in the
				* content.
				* @param {RegExpMatchArray} match
				* @param {{after:number}} param1
				*/
				const hasClosingTag = (match, { after }) => {
					const tag = "</" + match[0].slice(1);
					return match.input.indexOf(tag, after) !== -1;
				};
				const IDENT_RE$1 = IDENT_RE;
				const FRAGMENT = {
					begin: "<>",
					end: "</>"
				};
				const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
				const XML_TAG = {
					begin: /<[A-Za-z0-9\\._:-]+/,
					end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
					/**
					* @param {RegExpMatchArray} match
					* @param {CallbackResponse} response
					*/
					isTrulyOpeningTag: (match, response) => {
						const afterMatchIndex = match[0].length + match.index;
						const nextChar = match.input[afterMatchIndex];
						if (nextChar === "<" || nextChar === ",") {
							response.ignoreMatch();
							return;
						}
						if (nextChar === ">") {
							if (!hasClosingTag(match, { after: afterMatchIndex })) response.ignoreMatch();
						}
						let m;
						const afterMatch = match.input.substring(afterMatchIndex);
						if (m = afterMatch.match(/^\s*=/)) {
							response.ignoreMatch();
							return;
						}
						if (m = afterMatch.match(/^\s+extends\s+/)) {
							if (m.index === 0) {
								response.ignoreMatch();
								return;
							}
						}
					}
				};
				const KEYWORDS$1 = {
					$pattern: IDENT_RE,
					keyword: KEYWORDS,
					literal: LITERALS,
					built_in: BUILT_INS,
					"variable.language": BUILT_IN_VARIABLES
				};
				const decimalDigits = "[0-9](_?[0-9])*";
				const frac = `\\.(${decimalDigits})`;
				const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
				const NUMBER = {
					className: "number",
					variants: [
						{ begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})\\b` },
						{ begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b` },
						{ begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
						{ begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
						{ begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
						{ begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
						{ begin: "\\b0[0-7]+n?\\b" }
					],
					relevance: 0
				};
				const SUBST = {
					className: "subst",
					begin: "\\$\\{",
					end: "\\}",
					keywords: KEYWORDS$1,
					contains: []
				};
				const HTML_TEMPLATE = {
					begin: ".?html`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "xml"
					}
				};
				const CSS_TEMPLATE = {
					begin: ".?css`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "css"
					}
				};
				const GRAPHQL_TEMPLATE = {
					begin: ".?gql`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "graphql"
					}
				};
				const TEMPLATE_STRING = {
					className: "string",
					begin: "`",
					end: "`",
					contains: [hljs.BACKSLASH_ESCAPE, SUBST]
				};
				const COMMENT = {
					className: "comment",
					variants: [
						hljs.COMMENT(/\/\*\*(?!\/)/, "\\*/", {
							relevance: 0,
							contains: [{
								begin: "(?=@[A-Za-z]+)",
								relevance: 0,
								contains: [
									{
										className: "doctag",
										begin: "@[A-Za-z]+"
									},
									{
										className: "type",
										begin: "\\{",
										end: "\\}",
										excludeEnd: true,
										excludeBegin: true,
										relevance: 0
									},
									{
										className: "variable",
										begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
										endsParent: true,
										relevance: 0
									},
									{
										begin: /(?=[^\n])\s/,
										relevance: 0
									}
								]
							}]
						}),
						hljs.C_BLOCK_COMMENT_MODE,
						hljs.C_LINE_COMMENT_MODE
					]
				};
				const SUBST_INTERNALS = [
					hljs.APOS_STRING_MODE,
					hljs.QUOTE_STRING_MODE,
					HTML_TEMPLATE,
					CSS_TEMPLATE,
					GRAPHQL_TEMPLATE,
					TEMPLATE_STRING,
					{ match: /\$\d+/ },
					NUMBER
				];
				SUBST.contains = SUBST_INTERNALS.concat({
					begin: /\{/,
					end: /\}/,
					keywords: KEYWORDS$1,
					contains: ["self"].concat(SUBST_INTERNALS)
				});
				const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
				const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([{
					begin: /(\s*)\(/,
					end: /\)/,
					keywords: KEYWORDS$1,
					contains: ["self"].concat(SUBST_AND_COMMENTS)
				}]);
				const PARAMS = {
					className: "params",
					begin: /(\s*)\(/,
					end: /\)/,
					excludeBegin: true,
					excludeEnd: true,
					keywords: KEYWORDS$1,
					contains: PARAMS_CONTAINS
				};
				const CLASS_OR_EXTENDS = { variants: [{
					match: [
						/class/,
						/\s+/,
						IDENT_RE$1,
						/\s+/,
						/extends/,
						/\s+/,
						regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
					],
					scope: {
						1: "keyword",
						3: "title.class",
						5: "keyword",
						7: "title.class.inherited"
					}
				}, {
					match: [
						/class/,
						/\s+/,
						IDENT_RE$1
					],
					scope: {
						1: "keyword",
						3: "title.class"
					}
				}] };
				const CLASS_REFERENCE = {
					relevance: 0,
					match: regex.either(/\bJSON/, /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/, /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/, /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
					className: "title.class",
					keywords: { _: [...TYPES, ...ERROR_TYPES] }
				};
				const USE_STRICT = {
					label: "use_strict",
					className: "meta",
					relevance: 10,
					begin: /^\s*['"]use (strict|asm)['"]/
				};
				const FUNCTION_DEFINITION = {
					variants: [{ match: [
						/function/,
						/\s+/,
						IDENT_RE$1,
						/(?=\s*\()/
					] }, { match: [/function/, /\s*(?=\()/] }],
					className: {
						1: "keyword",
						3: "title.function"
					},
					label: "func.def",
					contains: [PARAMS],
					illegal: /%/
				};
				const UPPER_CASE_CONSTANT = {
					relevance: 0,
					match: /\b[A-Z][A-Z_0-9]+\b/,
					className: "variable.constant"
				};
				function noneOf(list) {
					return regex.concat("(?!", list.join("|"), ")");
				}
				const FUNCTION_CALL = {
					match: regex.concat(/\b/, noneOf([
						...BUILT_IN_GLOBALS,
						"super",
						"import",
						"await"
					].map((x) => `${x}\\s*\\(`)), IDENT_RE$1, regex.lookahead(/\s*\(/)),
					className: "title.function",
					relevance: 0
				};
				const PROPERTY_ACCESS = {
					begin: regex.concat(/\./, regex.lookahead(regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/))),
					end: IDENT_RE$1,
					excludeBegin: true,
					keywords: "prototype",
					className: "property",
					relevance: 0
				};
				const GETTER_OR_SETTER = {
					match: [
						/get|set/,
						/\s+/,
						IDENT_RE$1,
						/(?=\()/
					],
					className: {
						1: "keyword",
						3: "title.function"
					},
					contains: [{ begin: /\(\)/ }, PARAMS]
				};
				const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
				const FUNCTION_VARIABLE = {
					match: [
						/const|var|let/,
						/\s+/,
						IDENT_RE$1,
						/\s*/,
						/=\s*/,
						/(async\s*)?/,
						regex.lookahead(FUNC_LEAD_IN_RE)
					],
					keywords: "async",
					className: {
						1: "keyword",
						3: "title.function"
					},
					contains: [PARAMS]
				};
				return {
					name: "JavaScript",
					aliases: [
						"js",
						"jsx",
						"mjs",
						"cjs"
					],
					keywords: KEYWORDS$1,
					exports: {
						PARAMS_CONTAINS,
						CLASS_REFERENCE
					},
					illegal: /#(?![$_A-Za-z])/,
					contains: [
						hljs.SHEBANG({
							label: "shebang",
							binary: "node",
							relevance: 5
						}),
						USE_STRICT,
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE,
						HTML_TEMPLATE,
						CSS_TEMPLATE,
						GRAPHQL_TEMPLATE,
						TEMPLATE_STRING,
						COMMENT,
						{ match: /\$\d+/ },
						NUMBER,
						CLASS_REFERENCE,
						{
							scope: "attr",
							match: IDENT_RE$1 + regex.lookahead(":"),
							relevance: 0
						},
						FUNCTION_VARIABLE,
						{
							begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
							keywords: "return throw case",
							relevance: 0,
							contains: [
								COMMENT,
								hljs.REGEXP_MODE,
								{
									className: "function",
									begin: FUNC_LEAD_IN_RE,
									returnBegin: true,
									end: "\\s*=>",
									contains: [{
										className: "params",
										variants: [
											{
												begin: hljs.UNDERSCORE_IDENT_RE,
												relevance: 0
											},
											{
												className: null,
												begin: /\(\s*\)/,
												skip: true
											},
											{
												begin: /(\s*)\(/,
												end: /\)/,
												excludeBegin: true,
												excludeEnd: true,
												keywords: KEYWORDS$1,
												contains: PARAMS_CONTAINS
											}
										]
									}]
								},
								{
									begin: /,/,
									relevance: 0
								},
								{
									match: /\s+/,
									relevance: 0
								},
								{
									variants: [
										{
											begin: FRAGMENT.begin,
											end: FRAGMENT.end
										},
										{ match: XML_SELF_CLOSING },
										{
											begin: XML_TAG.begin,
											"on:begin": XML_TAG.isTrulyOpeningTag,
											end: XML_TAG.end
										}
									],
									subLanguage: "xml",
									contains: [{
										begin: XML_TAG.begin,
										end: XML_TAG.end,
										skip: true,
										contains: ["self"]
									}]
								}
							]
						},
						FUNCTION_DEFINITION,
						{ beginKeywords: "while if switch catch for" },
						{
							begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
							returnBegin: true,
							label: "func.def",
							contains: [PARAMS, hljs.inherit(hljs.TITLE_MODE, {
								begin: IDENT_RE$1,
								className: "title.function"
							})]
						},
						{
							match: /\.\.\./,
							relevance: 0
						},
						PROPERTY_ACCESS,
						{
							match: "\\$" + IDENT_RE$1,
							relevance: 0
						},
						{
							match: [/\bconstructor(?=\s*\()/],
							className: { 1: "title.function" },
							contains: [PARAMS]
						},
						FUNCTION_CALL,
						UPPER_CASE_CONSTANT,
						CLASS_OR_EXTENDS,
						GETTER_OR_SETTER,
						{ match: /\$[(.]/ }
					]
				};
			}
			module.exports = javascript;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/json.js
		var require_json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const EXTENDED_NUMBER_MODE = {
				scope: "number",
				match: "([-+]?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)|NaN|[-+]?Infinity",
				relevance: 0
			};
			function json(hljs) {
				const ATTRIBUTE = {
					className: "attr",
					begin: /(("(\\.|[^\\"\r\n])*")|('(\\.|[^\\'\r\n])*'))(?=\s*:)/,
					relevance: 1.01
				};
				const PUNCTUATION = {
					match: /[{}[\],:]/,
					className: "punctuation",
					relevance: 0
				};
				const LITERALS = [
					"true",
					"false",
					"null"
				];
				const LITERALS_MODE = {
					scope: "literal",
					beginKeywords: LITERALS.join(" ")
				};
				return {
					name: "JSON",
					aliases: ["jsonc", "json5"],
					keywords: { literal: LITERALS },
					contains: [
						ATTRIBUTE,
						PUNCTUATION,
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE,
						LITERALS_MODE,
						EXTENDED_NUMBER_MODE,
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE
					],
					illegal: "\\S"
				};
			}
			module.exports = json;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/kotlin.js
		var require_kotlin = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			var decimalDigits = "[0-9](_*[0-9])*";
			var frac = `\\.(${decimalDigits})`;
			var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
			var NUMERIC = {
				className: "number",
				variants: [
					{ begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
					{ begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
					{ begin: `(${frac})[fFdD]?\\b` },
					{ begin: `\\b(${decimalDigits})[fFdD]\\b` },
					{ begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
					{ begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
					{ begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
					{ begin: "\\b0(_*[0-7])*[lL]?\\b" },
					{ begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
				],
				relevance: 0
			};
			function kotlin(hljs) {
				const KEYWORDS = {
					keyword: "abstract as val var vararg get set class object open private protected public noinline crossinline dynamic final enum if else do while for when throw try catch finally import package is in fun override companion reified inline lateinit init interface annotation data sealed internal infix operator out by constructor super tailrec where const inner suspend typealias external expect actual",
					built_in: "Byte Short Char Int Long Boolean Float Double Void Unit Nothing",
					literal: "true false null"
				};
				const KEYWORDS_WITH_LABEL = {
					className: "keyword",
					begin: /\b(break|continue|return|this)\b/,
					starts: { contains: [{
						className: "symbol",
						begin: /@\w+/
					}] }
				};
				const LABEL = {
					className: "symbol",
					begin: hljs.UNDERSCORE_IDENT_RE + "@"
				};
				const SUBST = {
					className: "subst",
					begin: /\$\{/,
					end: /\}/,
					contains: [hljs.C_NUMBER_MODE]
				};
				const VARIABLE = {
					className: "variable",
					begin: "\\$" + hljs.UNDERSCORE_IDENT_RE
				};
				const STRING = {
					className: "string",
					variants: [
						{
							begin: "\"\"\"",
							end: "\"\"\"(?=[^\"])",
							contains: [VARIABLE, SUBST]
						},
						{
							begin: "'",
							end: "'",
							illegal: /\n/,
							contains: [hljs.BACKSLASH_ESCAPE]
						},
						{
							begin: "\"",
							end: "\"",
							illegal: /\n/,
							contains: [
								hljs.BACKSLASH_ESCAPE,
								VARIABLE,
								SUBST
							]
						}
					]
				};
				SUBST.contains.push(STRING);
				const ANNOTATION_USE_SITE = {
					className: "meta",
					begin: "@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*" + hljs.UNDERSCORE_IDENT_RE + ")?"
				};
				const ANNOTATION = {
					className: "meta",
					begin: "@" + hljs.UNDERSCORE_IDENT_RE,
					contains: [{
						begin: /\(/,
						end: /\)/,
						contains: [hljs.inherit(STRING, { className: "string" }), "self"]
					}]
				};
				const KOTLIN_NUMBER_MODE = NUMERIC;
				const KOTLIN_NESTED_COMMENT = hljs.COMMENT("/\\*", "\\*/", { contains: [hljs.C_BLOCK_COMMENT_MODE] });
				const KOTLIN_PAREN_TYPE = { variants: [{
					className: "type",
					begin: hljs.UNDERSCORE_IDENT_RE
				}, {
					begin: /\(/,
					end: /\)/,
					contains: []
				}] };
				const KOTLIN_PAREN_TYPE2 = KOTLIN_PAREN_TYPE;
				KOTLIN_PAREN_TYPE2.variants[1].contains = [KOTLIN_PAREN_TYPE];
				KOTLIN_PAREN_TYPE.variants[1].contains = [KOTLIN_PAREN_TYPE2];
				return {
					name: "Kotlin",
					aliases: [
						"kt",
						"kts",
						"ktm",
						"ktx"
					],
					keywords: KEYWORDS,
					contains: [
						hljs.COMMENT("/\\*\\*", "\\*/", {
							relevance: 0,
							contains: [{
								className: "doctag",
								begin: "@[A-Za-z]+"
							}]
						}),
						hljs.C_LINE_COMMENT_MODE,
						KOTLIN_NESTED_COMMENT,
						KEYWORDS_WITH_LABEL,
						LABEL,
						ANNOTATION_USE_SITE,
						ANNOTATION,
						{
							className: "function",
							beginKeywords: "fun",
							end: "[(]|$",
							returnBegin: true,
							excludeEnd: true,
							keywords: KEYWORDS,
							relevance: 5,
							contains: [
								{
									begin: hljs.UNDERSCORE_IDENT_RE + "\\s*\\(",
									returnBegin: true,
									relevance: 0,
									contains: [hljs.UNDERSCORE_TITLE_MODE]
								},
								{
									className: "type",
									begin: /</,
									end: />/,
									keywords: "reified",
									relevance: 0
								},
								{
									className: "params",
									begin: /\(/,
									end: /\)/,
									endsParent: true,
									keywords: KEYWORDS,
									relevance: 0,
									contains: [
										{
											begin: /:/,
											end: /[=,\/]/,
											endsWithParent: true,
											contains: [
												KOTLIN_PAREN_TYPE,
												hljs.C_LINE_COMMENT_MODE,
												KOTLIN_NESTED_COMMENT
											],
											relevance: 0
										},
										hljs.C_LINE_COMMENT_MODE,
										KOTLIN_NESTED_COMMENT,
										ANNOTATION_USE_SITE,
										ANNOTATION,
										STRING,
										hljs.C_NUMBER_MODE
									]
								},
								KOTLIN_NESTED_COMMENT
							]
						},
						{
							begin: [
								/class|interface|trait/,
								/\s+/,
								hljs.UNDERSCORE_IDENT_RE
							],
							beginScope: { 3: "title.class" },
							keywords: "class interface trait",
							end: /[:\{(]|$/,
							excludeEnd: true,
							illegal: "extends implements",
							contains: [
								{ beginKeywords: "public protected internal private constructor" },
								hljs.UNDERSCORE_TITLE_MODE,
								{
									className: "type",
									begin: /</,
									end: />/,
									excludeBegin: true,
									excludeEnd: true,
									relevance: 0
								},
								{
									className: "type",
									begin: /[,:]\s*/,
									end: /[<\(,){\s]|$/,
									excludeBegin: true,
									returnEnd: true
								},
								ANNOTATION_USE_SITE,
								ANNOTATION
							]
						},
						STRING,
						{
							className: "meta",
							begin: "^#!/usr/bin/env",
							end: "$",
							illegal: "\n"
						},
						KOTLIN_NUMBER_MODE
					]
				};
			}
			module.exports = kotlin;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/less.js
		var require_less = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const MODES = (hljs) => {
				return {
					IMPORTANT: {
						scope: "meta",
						begin: "!important"
					},
					BLOCK_COMMENT: hljs.C_BLOCK_COMMENT_MODE,
					HEXCOLOR: {
						scope: "number",
						begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
					},
					UNICODE_RANGE: {
						scope: "number",
						begin: /\b[Uu]\+[0-9A-Fa-f][0-9A-Fa-f?]{0,5}(-[0-9A-Fa-f][0-9A-Fa-f]{0,5})?/
					},
					FUNCTION_DISPATCH: {
						className: "built_in",
						begin: /[\w-]+(?=\()/
					},
					ATTRIBUTE_SELECTOR_MODE: {
						scope: "selector-attr",
						begin: /\[/,
						end: /\]/,
						illegal: "$",
						contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
					},
					CSS_NUMBER_MODE: {
						scope: "number",
						begin: hljs.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
						relevance: 0
					},
					CSS_VARIABLE: {
						className: "attr",
						begin: /--[A-Za-z_][A-Za-z0-9_-]*/
					}
				};
			};
			const HTML_TAGS = [
				"a",
				"abbr",
				"address",
				"article",
				"aside",
				"audio",
				"b",
				"blockquote",
				"body",
				"button",
				"canvas",
				"caption",
				"cite",
				"code",
				"dd",
				"del",
				"details",
				"dfn",
				"div",
				"dl",
				"dt",
				"em",
				"fieldset",
				"figcaption",
				"figure",
				"footer",
				"form",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"header",
				"hgroup",
				"html",
				"i",
				"iframe",
				"img",
				"input",
				"ins",
				"kbd",
				"label",
				"legend",
				"li",
				"main",
				"mark",
				"menu",
				"nav",
				"object",
				"ol",
				"optgroup",
				"option",
				"p",
				"picture",
				"q",
				"quote",
				"samp",
				"section",
				"select",
				"source",
				"span",
				"strong",
				"summary",
				"sup",
				"table",
				"tbody",
				"td",
				"textarea",
				"tfoot",
				"th",
				"thead",
				"time",
				"tr",
				"ul",
				"var",
				"video"
			];
			const SVG_TAGS = [
				"defs",
				"g",
				"marker",
				"mask",
				"pattern",
				"svg",
				"switch",
				"symbol",
				"feBlend",
				"feColorMatrix",
				"feComponentTransfer",
				"feComposite",
				"feConvolveMatrix",
				"feDiffuseLighting",
				"feDisplacementMap",
				"feFlood",
				"feGaussianBlur",
				"feImage",
				"feMerge",
				"feMorphology",
				"feOffset",
				"feSpecularLighting",
				"feTile",
				"feTurbulence",
				"linearGradient",
				"radialGradient",
				"stop",
				"circle",
				"ellipse",
				"image",
				"line",
				"path",
				"polygon",
				"polyline",
				"rect",
				"text",
				"use",
				"textPath",
				"tspan",
				"foreignObject",
				"clipPath"
			];
			const TAGS = [...HTML_TAGS, ...SVG_TAGS];
			const MEDIA_FEATURES = [
				"any-hover",
				"any-pointer",
				"aspect-ratio",
				"color",
				"color-gamut",
				"color-index",
				"device-aspect-ratio",
				"device-height",
				"device-width",
				"display-mode",
				"forced-colors",
				"grid",
				"height",
				"hover",
				"inverted-colors",
				"monochrome",
				"orientation",
				"overflow-block",
				"overflow-inline",
				"pointer",
				"prefers-color-scheme",
				"prefers-contrast",
				"prefers-reduced-motion",
				"prefers-reduced-transparency",
				"resolution",
				"scan",
				"scripting",
				"update",
				"width",
				"min-width",
				"max-width",
				"min-height",
				"max-height"
			].sort().reverse();
			const PSEUDO_CLASSES = [
				"active",
				"any-link",
				"blank",
				"checked",
				"current",
				"default",
				"defined",
				"dir",
				"disabled",
				"drop",
				"empty",
				"enabled",
				"first",
				"first-child",
				"first-of-type",
				"fullscreen",
				"future",
				"focus",
				"focus-visible",
				"focus-within",
				"has",
				"host",
				"host-context",
				"hover",
				"indeterminate",
				"in-range",
				"invalid",
				"is",
				"lang",
				"last-child",
				"last-of-type",
				"left",
				"link",
				"local-link",
				"not",
				"nth-child",
				"nth-col",
				"nth-last-child",
				"nth-last-col",
				"nth-last-of-type",
				"nth-of-type",
				"only-child",
				"only-of-type",
				"optional",
				"out-of-range",
				"past",
				"placeholder-shown",
				"read-only",
				"read-write",
				"required",
				"right",
				"root",
				"scope",
				"target",
				"target-within",
				"user-invalid",
				"valid",
				"visited",
				"where"
			].sort().reverse();
			const PSEUDO_ELEMENTS = [
				"after",
				"backdrop",
				"before",
				"cue",
				"cue-region",
				"first-letter",
				"first-line",
				"grammar-error",
				"marker",
				"part",
				"placeholder",
				"selection",
				"slotted",
				"spelling-error"
			].sort().reverse();
			const ATTRIBUTES = [
				"accent-color",
				"align-content",
				"align-items",
				"align-self",
				"alignment-baseline",
				"all",
				"anchor-name",
				"animation",
				"animation-composition",
				"animation-delay",
				"animation-direction",
				"animation-duration",
				"animation-fill-mode",
				"animation-iteration-count",
				"animation-name",
				"animation-play-state",
				"animation-range",
				"animation-range-end",
				"animation-range-start",
				"animation-timeline",
				"animation-timing-function",
				"appearance",
				"aspect-ratio",
				"backdrop-filter",
				"backface-visibility",
				"background",
				"background-attachment",
				"background-blend-mode",
				"background-clip",
				"background-color",
				"background-image",
				"background-origin",
				"background-position",
				"background-position-x",
				"background-position-y",
				"background-repeat",
				"background-size",
				"baseline-shift",
				"block-size",
				"border",
				"border-block",
				"border-block-color",
				"border-block-end",
				"border-block-end-color",
				"border-block-end-style",
				"border-block-end-width",
				"border-block-start",
				"border-block-start-color",
				"border-block-start-style",
				"border-block-start-width",
				"border-block-style",
				"border-block-width",
				"border-bottom",
				"border-bottom-color",
				"border-bottom-left-radius",
				"border-bottom-right-radius",
				"border-bottom-style",
				"border-bottom-width",
				"border-collapse",
				"border-color",
				"border-end-end-radius",
				"border-end-start-radius",
				"border-image",
				"border-image-outset",
				"border-image-repeat",
				"border-image-slice",
				"border-image-source",
				"border-image-width",
				"border-inline",
				"border-inline-color",
				"border-inline-end",
				"border-inline-end-color",
				"border-inline-end-style",
				"border-inline-end-width",
				"border-inline-start",
				"border-inline-start-color",
				"border-inline-start-style",
				"border-inline-start-width",
				"border-inline-style",
				"border-inline-width",
				"border-left",
				"border-left-color",
				"border-left-style",
				"border-left-width",
				"border-radius",
				"border-right",
				"border-right-color",
				"border-right-style",
				"border-right-width",
				"border-spacing",
				"border-start-end-radius",
				"border-start-start-radius",
				"border-style",
				"border-top",
				"border-top-color",
				"border-top-left-radius",
				"border-top-right-radius",
				"border-top-style",
				"border-top-width",
				"border-width",
				"bottom",
				"box-align",
				"box-decoration-break",
				"box-direction",
				"box-flex",
				"box-flex-group",
				"box-lines",
				"box-ordinal-group",
				"box-orient",
				"box-pack",
				"box-shadow",
				"box-sizing",
				"break-after",
				"break-before",
				"break-inside",
				"caption-side",
				"caret-color",
				"clear",
				"clip",
				"clip-path",
				"clip-rule",
				"color",
				"color-interpolation",
				"color-interpolation-filters",
				"color-profile",
				"color-rendering",
				"color-scheme",
				"column-count",
				"column-fill",
				"column-gap",
				"column-rule",
				"column-rule-color",
				"column-rule-style",
				"column-rule-width",
				"column-span",
				"column-width",
				"columns",
				"contain",
				"contain-intrinsic-block-size",
				"contain-intrinsic-height",
				"contain-intrinsic-inline-size",
				"contain-intrinsic-size",
				"contain-intrinsic-width",
				"container",
				"container-name",
				"container-type",
				"content",
				"content-visibility",
				"corner-bottom-left-shape",
				"corner-bottom-right-shape",
				"corner-shape",
				"corner-top-left-shape",
				"corner-top-right-shape",
				"counter-increment",
				"counter-reset",
				"counter-set",
				"cue",
				"cue-after",
				"cue-before",
				"cursor",
				"cx",
				"cy",
				"direction",
				"display",
				"dominant-baseline",
				"empty-cells",
				"enable-background",
				"field-sizing",
				"fill",
				"fill-opacity",
				"fill-rule",
				"filter",
				"flex",
				"flex-basis",
				"flex-direction",
				"flex-flow",
				"flex-grow",
				"flex-shrink",
				"flex-wrap",
				"float",
				"flood-color",
				"flood-opacity",
				"flow",
				"font",
				"font-display",
				"font-family",
				"font-feature-settings",
				"font-kerning",
				"font-language-override",
				"font-optical-sizing",
				"font-palette",
				"font-size",
				"font-size-adjust",
				"font-smooth",
				"font-smoothing",
				"font-stretch",
				"font-style",
				"font-synthesis",
				"font-synthesis-position",
				"font-synthesis-small-caps",
				"font-synthesis-style",
				"font-synthesis-weight",
				"font-variant",
				"font-variant-alternates",
				"font-variant-caps",
				"font-variant-east-asian",
				"font-variant-emoji",
				"font-variant-ligatures",
				"font-variant-numeric",
				"font-variant-position",
				"font-variation-settings",
				"font-weight",
				"forced-color-adjust",
				"gap",
				"glyph-orientation-horizontal",
				"glyph-orientation-vertical",
				"grid",
				"grid-area",
				"grid-auto-columns",
				"grid-auto-flow",
				"grid-auto-rows",
				"grid-column",
				"grid-column-end",
				"grid-column-start",
				"grid-gap",
				"grid-row",
				"grid-row-end",
				"grid-row-start",
				"grid-template",
				"grid-template-areas",
				"grid-template-columns",
				"grid-template-rows",
				"hanging-punctuation",
				"height",
				"hyphenate-character",
				"hyphenate-limit-chars",
				"hyphens",
				"icon",
				"image-orientation",
				"image-rendering",
				"image-resolution",
				"ime-mode",
				"initial-letter",
				"initial-letter-align",
				"inline-size",
				"inset",
				"inset-area",
				"inset-block",
				"inset-block-end",
				"inset-block-start",
				"inset-inline",
				"inset-inline-end",
				"inset-inline-start",
				"isolation",
				"justify-content",
				"justify-items",
				"justify-self",
				"kerning",
				"left",
				"letter-spacing",
				"lighting-color",
				"line-break",
				"line-height",
				"line-height-step",
				"list-style",
				"list-style-image",
				"list-style-position",
				"list-style-type",
				"margin",
				"margin-block",
				"margin-block-end",
				"margin-block-start",
				"margin-bottom",
				"margin-inline",
				"margin-inline-end",
				"margin-inline-start",
				"margin-left",
				"margin-right",
				"margin-top",
				"margin-trim",
				"marker",
				"marker-end",
				"marker-mid",
				"marker-start",
				"marks",
				"mask",
				"mask-border",
				"mask-border-mode",
				"mask-border-outset",
				"mask-border-repeat",
				"mask-border-slice",
				"mask-border-source",
				"mask-border-width",
				"mask-clip",
				"mask-composite",
				"mask-image",
				"mask-mode",
				"mask-origin",
				"mask-position",
				"mask-repeat",
				"mask-size",
				"mask-type",
				"masonry-auto-flow",
				"math-depth",
				"math-shift",
				"math-style",
				"max-block-size",
				"max-height",
				"max-inline-size",
				"max-width",
				"min-block-size",
				"min-height",
				"min-inline-size",
				"min-width",
				"mix-blend-mode",
				"nav-down",
				"nav-index",
				"nav-left",
				"nav-right",
				"nav-up",
				"none",
				"normal",
				"object-fit",
				"object-position",
				"offset",
				"offset-anchor",
				"offset-distance",
				"offset-path",
				"offset-position",
				"offset-rotate",
				"opacity",
				"order",
				"orphans",
				"outline",
				"outline-color",
				"outline-offset",
				"outline-style",
				"outline-width",
				"overflow",
				"overflow-anchor",
				"overflow-block",
				"overflow-clip-margin",
				"overflow-inline",
				"overflow-wrap",
				"overflow-x",
				"overflow-y",
				"overlay",
				"overscroll-behavior",
				"overscroll-behavior-block",
				"overscroll-behavior-inline",
				"overscroll-behavior-x",
				"overscroll-behavior-y",
				"padding",
				"padding-block",
				"padding-block-end",
				"padding-block-start",
				"padding-bottom",
				"padding-inline",
				"padding-inline-end",
				"padding-inline-start",
				"padding-left",
				"padding-right",
				"padding-top",
				"page",
				"page-break-after",
				"page-break-before",
				"page-break-inside",
				"paint-order",
				"pause",
				"pause-after",
				"pause-before",
				"perspective",
				"perspective-origin",
				"place-content",
				"place-items",
				"place-self",
				"pointer-events",
				"position",
				"position-anchor",
				"position-visibility",
				"print-color-adjust",
				"quotes",
				"r",
				"resize",
				"rest",
				"rest-after",
				"rest-before",
				"right",
				"rotate",
				"row-gap",
				"ruby-align",
				"ruby-position",
				"scale",
				"scroll-behavior",
				"scroll-margin",
				"scroll-margin-block",
				"scroll-margin-block-end",
				"scroll-margin-block-start",
				"scroll-margin-bottom",
				"scroll-margin-inline",
				"scroll-margin-inline-end",
				"scroll-margin-inline-start",
				"scroll-margin-left",
				"scroll-margin-right",
				"scroll-margin-top",
				"scroll-padding",
				"scroll-padding-block",
				"scroll-padding-block-end",
				"scroll-padding-block-start",
				"scroll-padding-bottom",
				"scroll-padding-inline",
				"scroll-padding-inline-end",
				"scroll-padding-inline-start",
				"scroll-padding-left",
				"scroll-padding-right",
				"scroll-padding-top",
				"scroll-snap-align",
				"scroll-snap-stop",
				"scroll-snap-type",
				"scroll-timeline",
				"scroll-timeline-axis",
				"scroll-timeline-name",
				"scrollbar-color",
				"scrollbar-gutter",
				"scrollbar-width",
				"shape-image-threshold",
				"shape-margin",
				"shape-outside",
				"shape-rendering",
				"speak",
				"speak-as",
				"src",
				"stop-color",
				"stop-opacity",
				"stroke",
				"stroke-dasharray",
				"stroke-dashoffset",
				"stroke-linecap",
				"stroke-linejoin",
				"stroke-miterlimit",
				"stroke-opacity",
				"stroke-width",
				"tab-size",
				"table-layout",
				"text-align",
				"text-align-all",
				"text-align-last",
				"text-anchor",
				"text-combine-upright",
				"text-decoration",
				"text-decoration-color",
				"text-decoration-line",
				"text-decoration-skip",
				"text-decoration-skip-ink",
				"text-decoration-style",
				"text-decoration-thickness",
				"text-emphasis",
				"text-emphasis-color",
				"text-emphasis-position",
				"text-emphasis-style",
				"text-indent",
				"text-justify",
				"text-orientation",
				"text-overflow",
				"text-rendering",
				"text-shadow",
				"text-size-adjust",
				"text-transform",
				"text-underline-offset",
				"text-underline-position",
				"text-wrap",
				"text-wrap-mode",
				"text-wrap-style",
				"timeline-scope",
				"top",
				"touch-action",
				"transform",
				"transform-box",
				"transform-origin",
				"transform-style",
				"transition",
				"transition-behavior",
				"transition-delay",
				"transition-duration",
				"transition-property",
				"transition-timing-function",
				"translate",
				"unicode-bidi",
				"unicode-range",
				"user-modify",
				"user-select",
				"vector-effect",
				"vertical-align",
				"view-timeline",
				"view-timeline-axis",
				"view-timeline-inset",
				"view-timeline-name",
				"view-transition-name",
				"visibility",
				"voice-balance",
				"voice-duration",
				"voice-family",
				"voice-pitch",
				"voice-range",
				"voice-rate",
				"voice-stress",
				"voice-volume",
				"white-space",
				"white-space-collapse",
				"widows",
				"width",
				"will-change",
				"word-break",
				"word-spacing",
				"word-wrap",
				"writing-mode",
				"x",
				"y",
				"z-index",
				"zoom"
			].sort().reverse();
			const PSEUDO_SELECTORS = PSEUDO_CLASSES.concat(PSEUDO_ELEMENTS).sort().reverse();
			/** @type LanguageFn */
			function less(hljs) {
				const modes = MODES(hljs);
				const PSEUDO_SELECTORS$1 = PSEUDO_SELECTORS;
				const AT_MODIFIERS = "and or not only";
				const INTERP_IDENT_RE = "([\\w-]+|@\\{[\\w-]+\\})";
				const RULES = [];
				const VALUE_MODES = [];
				const STRING_MODE = function(c) {
					return {
						className: "string",
						begin: "~?" + c + ".*?" + c
					};
				};
				const IDENT_MODE = function(name, begin, relevance) {
					return {
						className: name,
						begin,
						relevance
					};
				};
				const AT_KEYWORDS = {
					$pattern: /[a-z-]+/,
					keyword: AT_MODIFIERS,
					attribute: MEDIA_FEATURES.join(" ")
				};
				const PARENS_MODE = {
					begin: "\\(",
					end: "\\)",
					contains: VALUE_MODES,
					keywords: AT_KEYWORDS,
					relevance: 0
				};
				VALUE_MODES.push(hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, STRING_MODE("'"), STRING_MODE("\""), modes.CSS_NUMBER_MODE, {
					begin: "(url|data-uri)\\(",
					starts: {
						className: "string",
						end: "[\\)\\n]",
						excludeEnd: true
					}
				}, modes.UNICODE_RANGE, modes.HEXCOLOR, PARENS_MODE, IDENT_MODE("variable", "@@?[\\w-]+", 10), IDENT_MODE("variable", "@\\{[\\w-]+\\}"), IDENT_MODE("built_in", "~?`[^`]*?`"), {
					className: "attribute",
					begin: "[\\w-]+\\s*:",
					end: ":",
					returnBegin: true,
					excludeEnd: true
				}, modes.IMPORTANT, { beginKeywords: "and not" }, modes.FUNCTION_DISPATCH);
				const VALUE_WITH_RULESETS = VALUE_MODES.concat({
					begin: /\{/,
					end: /\}/,
					contains: RULES
				});
				const MIXIN_GUARD_MODE = {
					beginKeywords: "when",
					endsWithParent: true,
					contains: [{ beginKeywords: "and not" }].concat(VALUE_MODES)
				};
				const RULE_MODE = {
					begin: INTERP_IDENT_RE + "\\s*:",
					returnBegin: true,
					end: /[;}]/,
					relevance: 0,
					contains: [
						{ begin: /-(webkit|moz|ms|o)-/ },
						modes.CSS_VARIABLE,
						{
							className: "attribute",
							begin: "\\b(" + ATTRIBUTES.join("|") + ")\\b",
							end: /(?=:)/,
							starts: {
								endsWithParent: true,
								illegal: "[<=$]",
								relevance: 0,
								contains: VALUE_MODES
							}
						}
					]
				};
				const AT_RULE_MODE = {
					className: "keyword",
					begin: "@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b",
					starts: {
						end: "[;{}]",
						keywords: AT_KEYWORDS,
						returnEnd: true,
						contains: VALUE_MODES,
						relevance: 0
					}
				};
				const VAR_RULE_MODE = {
					className: "variable",
					variants: [{
						begin: "@[\\w-]+\\s*:",
						relevance: 15
					}, { begin: "@[\\w-]+" }],
					starts: {
						end: "[;}]",
						returnEnd: true,
						contains: VALUE_WITH_RULESETS
					}
				};
				const SELECTOR_MODE = {
					variants: [{
						begin: "[\\.#:&\\[>]",
						end: "[;{}]"
					}, {
						begin: INTERP_IDENT_RE,
						end: /\{/
					}],
					returnBegin: true,
					returnEnd: true,
					illegal: "[<='$\"]",
					relevance: 0,
					contains: [
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						MIXIN_GUARD_MODE,
						IDENT_MODE("keyword", "all\\b"),
						IDENT_MODE("variable", "@\\{[\\w-]+\\}"),
						{
							begin: "\\b(" + TAGS.join("|") + ")\\b",
							className: "selector-tag"
						},
						modes.CSS_NUMBER_MODE,
						IDENT_MODE("selector-tag", INTERP_IDENT_RE, 0),
						IDENT_MODE("selector-id", "#" + INTERP_IDENT_RE),
						IDENT_MODE("selector-class", "\\." + INTERP_IDENT_RE, 0),
						IDENT_MODE("selector-tag", "&", 0),
						modes.ATTRIBUTE_SELECTOR_MODE,
						{
							className: "selector-pseudo",
							begin: ":(" + PSEUDO_CLASSES.join("|") + ")"
						},
						{
							className: "selector-pseudo",
							begin: ":(:)?(" + PSEUDO_ELEMENTS.join("|") + ")"
						},
						{
							begin: /\(/,
							end: /\)/,
							relevance: 0,
							contains: VALUE_WITH_RULESETS
						},
						{ begin: "!important" },
						modes.FUNCTION_DISPATCH
					]
				};
				const PSEUDO_SELECTOR_MODE = {
					begin: `[\\w-]+:(:)?(${PSEUDO_SELECTORS$1.join("|")})`,
					returnBegin: true,
					contains: [SELECTOR_MODE]
				};
				RULES.push(hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, AT_RULE_MODE, VAR_RULE_MODE, PSEUDO_SELECTOR_MODE, RULE_MODE, SELECTOR_MODE, MIXIN_GUARD_MODE, modes.FUNCTION_DISPATCH);
				return {
					name: "Less",
					case_insensitive: true,
					illegal: "[=>'/<($\"]",
					contains: RULES
				};
			}
			module.exports = less;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/lua.js
		var require_lua = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function lua(hljs) {
				const OPENING_LONG_BRACKET = "\\[=*\\[";
				const CLOSING_LONG_BRACKET = "\\]=*\\]";
				const LONG_BRACKETS = {
					begin: OPENING_LONG_BRACKET,
					end: CLOSING_LONG_BRACKET,
					contains: ["self"]
				};
				const COMMENTS = [hljs.COMMENT("--(?!\\[=*\\[)", "$"), hljs.COMMENT("--\\[=*\\[", CLOSING_LONG_BRACKET, {
					contains: [LONG_BRACKETS],
					relevance: 10
				})];
				return {
					name: "Lua",
					aliases: ["pluto"],
					keywords: {
						$pattern: hljs.UNDERSCORE_IDENT_RE,
						literal: "true false nil",
						keyword: "and break do else elseif end for goto if in local global not or repeat return then until while",
						built_in: "_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len __gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring module next pairs pcall print rawequal rawget rawset require select setfenv setmetatable tonumber tostring type unpack xpcall arg self coroutine resume yield status wrap create running debug getupvalue debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv io lines write close flush open output type read stderr stdin input stdout popen tmpfile math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower table setn insert getn foreachi maxn foreach concat sort remove"
					},
					contains: COMMENTS.concat([
						{
							className: "function",
							beginKeywords: "function",
							end: "\\)",
							contains: [hljs.inherit(hljs.TITLE_MODE, { begin: "([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*" }), {
								className: "params",
								begin: "\\(",
								endsWithParent: true,
								contains: COMMENTS
							}].concat(COMMENTS)
						},
						hljs.C_NUMBER_MODE,
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE,
						{
							className: "string",
							begin: OPENING_LONG_BRACKET,
							end: CLOSING_LONG_BRACKET,
							contains: [LONG_BRACKETS],
							relevance: 5
						}
					])
				};
			}
			module.exports = lua;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/makefile.js
		var require_makefile = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function makefile(hljs) {
				const VARIABLE = {
					className: "variable",
					variants: [{
						begin: "\\$\\(" + hljs.UNDERSCORE_IDENT_RE + "\\)",
						contains: [hljs.BACKSLASH_ESCAPE]
					}, { begin: /\$[@%<?\^\+\*]/ }]
				};
				const QUOTE_STRING = {
					className: "string",
					begin: /"/,
					end: /"/,
					contains: [hljs.BACKSLASH_ESCAPE, VARIABLE]
				};
				const FUNC = {
					className: "variable",
					begin: /\$\([\w-]+\s/,
					end: /\)/,
					keywords: { built_in: "subst patsubst strip findstring filter filter-out sort word wordlist firstword lastword dir notdir suffix basename addsuffix addprefix join wildcard realpath abspath error warning shell origin flavor foreach if or and call eval file value" },
					contains: [VARIABLE, QUOTE_STRING]
				};
				const ASSIGNMENT = { begin: "^" + hljs.UNDERSCORE_IDENT_RE + "\\s*(?=[:+?]?=)" };
				const META = {
					className: "meta",
					begin: /^\.PHONY:/,
					end: /$/,
					keywords: {
						$pattern: /[\.\w]+/,
						keyword: ".PHONY"
					}
				};
				const TARGET = {
					className: "section",
					begin: /^[^\s]+:/,
					end: /$/,
					contains: [VARIABLE]
				};
				return {
					name: "Makefile",
					aliases: [
						"mk",
						"mak",
						"make"
					],
					keywords: {
						$pattern: /[\w-]+/,
						keyword: "define endef undefine ifdef ifndef ifeq ifneq else endif include -include sinclude override export unexport private vpath"
					},
					contains: [
						hljs.HASH_COMMENT_MODE,
						VARIABLE,
						QUOTE_STRING,
						FUNC,
						ASSIGNMENT,
						META,
						TARGET
					]
				};
			}
			module.exports = makefile;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/perl.js
		var require_perl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function perl(hljs) {
				const regex = hljs.regex;
				const KEYWORDS = [
					"abs",
					"accept",
					"alarm",
					"and",
					"atan2",
					"bind",
					"binmode",
					"bless",
					"break",
					"caller",
					"chdir",
					"chmod",
					"chomp",
					"chop",
					"chown",
					"chr",
					"chroot",
					"class",
					"close",
					"closedir",
					"connect",
					"continue",
					"cos",
					"crypt",
					"dbmclose",
					"dbmopen",
					"defined",
					"delete",
					"die",
					"do",
					"dump",
					"each",
					"else",
					"elsif",
					"endgrent",
					"endhostent",
					"endnetent",
					"endprotoent",
					"endpwent",
					"endservent",
					"eof",
					"eval",
					"exec",
					"exists",
					"exit",
					"exp",
					"fcntl",
					"field",
					"fileno",
					"flock",
					"for",
					"foreach",
					"fork",
					"format",
					"formline",
					"getc",
					"getgrent",
					"getgrgid",
					"getgrnam",
					"gethostbyaddr",
					"gethostbyname",
					"gethostent",
					"getlogin",
					"getnetbyaddr",
					"getnetbyname",
					"getnetent",
					"getpeername",
					"getpgrp",
					"getpriority",
					"getprotobyname",
					"getprotobynumber",
					"getprotoent",
					"getpwent",
					"getpwnam",
					"getpwuid",
					"getservbyname",
					"getservbyport",
					"getservent",
					"getsockname",
					"getsockopt",
					"given",
					"glob",
					"gmtime",
					"goto",
					"grep",
					"gt",
					"hex",
					"if",
					"index",
					"int",
					"ioctl",
					"join",
					"keys",
					"kill",
					"last",
					"lc",
					"lcfirst",
					"length",
					"link",
					"listen",
					"local",
					"localtime",
					"log",
					"lstat",
					"lt",
					"ma",
					"map",
					"method",
					"mkdir",
					"msgctl",
					"msgget",
					"msgrcv",
					"msgsnd",
					"my",
					"ne",
					"next",
					"no",
					"not",
					"oct",
					"open",
					"opendir",
					"or",
					"ord",
					"our",
					"pack",
					"package",
					"pipe",
					"pop",
					"pos",
					"print",
					"printf",
					"prototype",
					"push",
					"q|0",
					"qq",
					"quotemeta",
					"qw",
					"qx",
					"rand",
					"read",
					"readdir",
					"readline",
					"readlink",
					"readpipe",
					"recv",
					"redo",
					"ref",
					"rename",
					"require",
					"reset",
					"return",
					"reverse",
					"rewinddir",
					"rindex",
					"rmdir",
					"say",
					"scalar",
					"seek",
					"seekdir",
					"select",
					"semctl",
					"semget",
					"semop",
					"send",
					"setgrent",
					"sethostent",
					"setnetent",
					"setpgrp",
					"setpriority",
					"setprotoent",
					"setpwent",
					"setservent",
					"setsockopt",
					"shift",
					"shmctl",
					"shmget",
					"shmread",
					"shmwrite",
					"shutdown",
					"sin",
					"sleep",
					"socket",
					"socketpair",
					"sort",
					"splice",
					"split",
					"sprintf",
					"sqrt",
					"srand",
					"stat",
					"state",
					"study",
					"sub",
					"substr",
					"symlink",
					"syscall",
					"sysopen",
					"sysread",
					"sysseek",
					"system",
					"syswrite",
					"tell",
					"telldir",
					"tie",
					"tied",
					"time",
					"times",
					"tr",
					"truncate",
					"uc",
					"ucfirst",
					"umask",
					"undef",
					"unless",
					"unlink",
					"unpack",
					"unshift",
					"untie",
					"until",
					"use",
					"utime",
					"values",
					"vec",
					"wait",
					"waitpid",
					"wantarray",
					"warn",
					"when",
					"while",
					"write",
					"x|0",
					"xor",
					"y|0"
				];
				const REGEX_MODIFIERS = /[dualxmsipngr]{0,12}/;
				const PERL_KEYWORDS = {
					$pattern: /[\w.]+/,
					keyword: KEYWORDS.join(" ")
				};
				const SUBST = {
					className: "subst",
					begin: "[$@]\\{",
					end: "\\}",
					keywords: PERL_KEYWORDS
				};
				const METHOD = {
					begin: /->\{/,
					end: /\}/
				};
				const ATTR = {
					scope: "attr",
					match: /\s+:\s*\w+(\s*\(.*?\))?/
				};
				const VAR = {
					scope: "variable",
					variants: [
						{ begin: /\$\d/ },
						{ begin: regex.concat(/[$%@](?!")(\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/, `(?![A-Za-z])(?![@$%])`) },
						{
							begin: /[$%@](?!")[^\s\w{=]|\$=/,
							relevance: 0
						}
					],
					contains: [ATTR]
				};
				const NUMBER = {
					className: "number",
					variants: [
						{ match: /0?\.[0-9][0-9_]+\b/ },
						{ match: /\bv?(0|[1-9][0-9_]*(\.[0-9_]+)?|[1-9][0-9_]*)\b/ },
						{ match: /\b0[0-7][0-7_]*\b/ },
						{ match: /\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/ },
						{ match: /\b0b[0-1][0-1_]*\b/ }
					],
					relevance: 0
				};
				const STRING_CONTAINS = [
					hljs.BACKSLASH_ESCAPE,
					SUBST,
					VAR
				];
				const REGEX_DELIMS = [
					/!/,
					/\//,
					/\|/,
					/\?/,
					/'/,
					/"/,
					/#/
				];
				/**
				* @param {string|RegExp} prefix
				* @param {string|RegExp} open
				* @param {string|RegExp} close
				*/
				const PAIRED_DOUBLE_RE = (prefix, open, close = "\\1") => {
					const middle = close === "\\1" ? close : regex.concat(close, open);
					return regex.concat(regex.concat("(?:", prefix, ")"), open, /(?:\\.|[^\\\/])*?/, middle, /(?:\\.|[^\\\/])*?/, close, REGEX_MODIFIERS);
				};
				/**
				* @param {string|RegExp} prefix
				* @param {string|RegExp} open
				* @param {string|RegExp} close
				*/
				const PAIRED_RE = (prefix, open, close) => {
					return regex.concat(regex.concat("(?:", prefix, ")"), open, /(?:\\.|[^\\\/])*?/, close, REGEX_MODIFIERS);
				};
				const PERL_DEFAULT_CONTAINS = [
					VAR,
					hljs.HASH_COMMENT_MODE,
					hljs.COMMENT(/^=\w/, /=cut/, { endsWithParent: true }),
					METHOD,
					{
						className: "string",
						contains: STRING_CONTAINS,
						variants: [
							{
								begin: "q[qwxr]?\\s*\\(",
								end: "\\)",
								relevance: 5
							},
							{
								begin: "q[qwxr]?\\s*\\[",
								end: "\\]",
								relevance: 5
							},
							{
								begin: "q[qwxr]?\\s*\\{",
								end: "\\}",
								relevance: 5
							},
							{
								begin: "q[qwxr]?\\s*\\|",
								end: "\\|",
								relevance: 5
							},
							{
								begin: "q[qwxr]?\\s*<",
								end: ">",
								relevance: 5
							},
							{
								begin: "qw\\s+q",
								end: "q",
								relevance: 5
							},
							{
								begin: "'",
								end: "'",
								contains: [hljs.BACKSLASH_ESCAPE]
							},
							{
								begin: "\"",
								end: "\""
							},
							{
								begin: "`",
								end: "`",
								contains: [hljs.BACKSLASH_ESCAPE]
							},
							{
								begin: /\{\w+\}/,
								relevance: 0
							},
							{
								begin: "-?\\w+\\s*=>",
								relevance: 0
							}
						]
					},
					NUMBER,
					{
						begin: "(\\/\\/|" + hljs.RE_STARTERS_RE + "|\\b(split|return|print|reverse|grep)\\b)\\s*",
						keywords: "split return print reverse grep",
						relevance: 0,
						contains: [
							hljs.HASH_COMMENT_MODE,
							{
								className: "regexp",
								variants: [
									{ begin: PAIRED_DOUBLE_RE("s|tr|y", regex.either(...REGEX_DELIMS, { capture: true })) },
									{ begin: PAIRED_DOUBLE_RE("s|tr|y", "\\(", "\\)") },
									{ begin: PAIRED_DOUBLE_RE("s|tr|y", "\\[", "\\]") },
									{ begin: PAIRED_DOUBLE_RE("s|tr|y", "\\{", "\\}") }
								],
								relevance: 2
							},
							{
								className: "regexp",
								variants: [
									{
										begin: /(m|qr)\/\//,
										relevance: 0
									},
									{ begin: PAIRED_RE("(?:m|qr)?", /\//, /\//) },
									{ begin: PAIRED_RE("m|qr", regex.either(...REGEX_DELIMS, { capture: true }), /\1/) },
									{ begin: PAIRED_RE("m|qr", /\(/, /\)/) },
									{ begin: PAIRED_RE("m|qr", /\[/, /\]/) },
									{ begin: PAIRED_RE("m|qr", /\{/, /\}/) }
								]
							}
						]
					},
					{
						className: "function",
						beginKeywords: "sub method",
						end: "(\\s*\\(.*?\\))?[;{]",
						excludeEnd: true,
						relevance: 5,
						contains: [hljs.TITLE_MODE, ATTR]
					},
					{
						className: "class",
						beginKeywords: "class",
						end: "[;{]",
						excludeEnd: true,
						relevance: 5,
						contains: [
							hljs.TITLE_MODE,
							ATTR,
							NUMBER
						]
					},
					{
						begin: "-\\w\\b",
						relevance: 0
					},
					{
						begin: "^__DATA__$",
						end: "^__END__$",
						subLanguage: "mojolicious",
						contains: [{
							begin: "^@@.*",
							end: "$",
							className: "comment"
						}]
					}
				];
				SUBST.contains = PERL_DEFAULT_CONTAINS;
				METHOD.contains = PERL_DEFAULT_CONTAINS;
				return {
					name: "Perl",
					aliases: ["pl", "pm"],
					keywords: PERL_KEYWORDS,
					contains: PERL_DEFAULT_CONTAINS
				};
			}
			module.exports = perl;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/objectivec.js
		var require_objectivec = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function objectivec(hljs) {
				const API_CLASS = {
					className: "built_in",
					begin: "\\b(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)\\w+"
				};
				const IDENTIFIER_RE = /[a-zA-Z@][a-zA-Z0-9_]*/;
				const KEYWORDS = {
					"variable.language": ["this", "super"],
					$pattern: IDENTIFIER_RE,
					keyword: [
						"while",
						"export",
						"sizeof",
						"typedef",
						"const",
						"struct",
						"for",
						"union",
						"volatile",
						"static",
						"mutable",
						"if",
						"do",
						"return",
						"goto",
						"enum",
						"else",
						"break",
						"extern",
						"asm",
						"case",
						"default",
						"register",
						"explicit",
						"typename",
						"switch",
						"continue",
						"inline",
						"readonly",
						"assign",
						"readwrite",
						"self",
						"@synchronized",
						"id",
						"typeof",
						"nonatomic",
						"IBOutlet",
						"IBAction",
						"strong",
						"weak",
						"copy",
						"in",
						"out",
						"inout",
						"bycopy",
						"byref",
						"oneway",
						"__strong",
						"__weak",
						"__block",
						"__autoreleasing",
						"@private",
						"@protected",
						"@public",
						"@try",
						"@property",
						"@end",
						"@throw",
						"@catch",
						"@finally",
						"@autoreleasepool",
						"@synthesize",
						"@dynamic",
						"@selector",
						"@optional",
						"@required",
						"@encode",
						"@package",
						"@import",
						"@defs",
						"@compatibility_alias",
						"__bridge",
						"__bridge_transfer",
						"__bridge_retained",
						"__bridge_retain",
						"__covariant",
						"__contravariant",
						"__kindof",
						"_Nonnull",
						"_Nullable",
						"_Null_unspecified",
						"__FUNCTION__",
						"__PRETTY_FUNCTION__",
						"__attribute__",
						"getter",
						"setter",
						"retain",
						"unsafe_unretained",
						"nonnull",
						"nullable",
						"null_unspecified",
						"null_resettable",
						"class",
						"instancetype",
						"NS_DESIGNATED_INITIALIZER",
						"NS_UNAVAILABLE",
						"NS_REQUIRES_SUPER",
						"NS_RETURNS_INNER_POINTER",
						"NS_INLINE",
						"NS_AVAILABLE",
						"NS_DEPRECATED",
						"NS_ENUM",
						"NS_OPTIONS",
						"NS_SWIFT_UNAVAILABLE",
						"NS_ASSUME_NONNULL_BEGIN",
						"NS_ASSUME_NONNULL_END",
						"NS_REFINED_FOR_SWIFT",
						"NS_SWIFT_NAME",
						"NS_SWIFT_NOTHROW",
						"NS_DURING",
						"NS_HANDLER",
						"NS_ENDHANDLER",
						"NS_VALUERETURN",
						"NS_VOIDRETURN"
					],
					literal: [
						"false",
						"true",
						"FALSE",
						"TRUE",
						"nil",
						"YES",
						"NO",
						"NULL"
					],
					built_in: [
						"dispatch_once_t",
						"dispatch_queue_t",
						"dispatch_sync",
						"dispatch_async",
						"dispatch_once"
					],
					type: [
						"int",
						"float",
						"char",
						"unsigned",
						"signed",
						"short",
						"long",
						"double",
						"wchar_t",
						"unichar",
						"void",
						"bool",
						"BOOL",
						"id|0",
						"_Bool"
					]
				};
				const CLASS_KEYWORDS = {
					$pattern: IDENTIFIER_RE,
					keyword: [
						"@interface",
						"@class",
						"@protocol",
						"@implementation"
					]
				};
				return {
					name: "Objective-C",
					aliases: [
						"mm",
						"objc",
						"obj-c",
						"obj-c++",
						"objective-c++"
					],
					keywords: KEYWORDS,
					illegal: "</",
					contains: [
						API_CLASS,
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						hljs.C_NUMBER_MODE,
						hljs.QUOTE_STRING_MODE,
						hljs.APOS_STRING_MODE,
						{
							className: "string",
							variants: [{
								begin: "@\"",
								end: "\"",
								illegal: "\\n",
								contains: [hljs.BACKSLASH_ESCAPE]
							}]
						},
						{
							className: "meta",
							begin: /#\s*[a-z]+\b/,
							end: /$/,
							keywords: { keyword: "if else elif endif define undef warning error line pragma ifdef ifndef include" },
							contains: [
								{
									begin: /\\\n/,
									relevance: 0
								},
								hljs.inherit(hljs.QUOTE_STRING_MODE, { className: "string" }),
								{
									className: "string",
									begin: /<.*?>/,
									end: /$/,
									illegal: "\\n"
								},
								hljs.C_LINE_COMMENT_MODE,
								hljs.C_BLOCK_COMMENT_MODE
							]
						},
						{
							className: "class",
							begin: "(" + CLASS_KEYWORDS.keyword.join("|") + ")\\b",
							end: /(\{|$)/,
							excludeEnd: true,
							keywords: CLASS_KEYWORDS,
							contains: [hljs.UNDERSCORE_TITLE_MODE]
						},
						{
							begin: "\\." + hljs.UNDERSCORE_IDENT_RE,
							relevance: 0
						}
					]
				};
			}
			module.exports = objectivec;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/php.js
		var require_php = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/**
			* @param {HLJSApi} hljs
			* @returns {LanguageDetail}
			* */
			function php(hljs) {
				const regex = hljs.regex;
				const NOT_PERL_ETC = /(?![A-Za-z0-9])(?![$])/;
				const IDENT_RE = regex.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/, NOT_PERL_ETC);
				const PASCAL_CASE_CLASS_NAME_RE = regex.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/, NOT_PERL_ETC);
				const UPCASE_NAME_RE = regex.concat(/[A-Z]+/, NOT_PERL_ETC);
				const VARIABLE = {
					scope: "variable",
					match: "\\$+" + IDENT_RE
				};
				const PREPROCESSOR = {
					scope: "meta",
					variants: [
						{
							begin: /<\?php/,
							relevance: 10
						},
						{ begin: /<\?=/ },
						{
							begin: /<\?/,
							relevance: .1
						},
						{ begin: /\?>/ }
					]
				};
				const SUBST = {
					scope: "subst",
					variants: [{ begin: /\$\w+/ }, {
						begin: /\{\$/,
						end: /\}/
					}]
				};
				const SINGLE_QUOTED = hljs.inherit(hljs.APOS_STRING_MODE, { illegal: null });
				const DOUBLE_QUOTED = hljs.inherit(hljs.QUOTE_STRING_MODE, {
					illegal: null,
					contains: hljs.QUOTE_STRING_MODE.contains.concat(SUBST)
				});
				const HEREDOC = {
					begin: /<<<[ \t]*(?:(\w+)|"(\w+)")\n/,
					end: /[ \t]*(\w+)\b/,
					contains: hljs.QUOTE_STRING_MODE.contains.concat(SUBST),
					"on:begin": (m, resp) => {
						resp.data._beginMatch = m[1] || m[2];
					},
					"on:end": (m, resp) => {
						if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
					}
				};
				const NOWDOC = hljs.END_SAME_AS_BEGIN({
					begin: /<<<[ \t]*'(\w+)'\n/,
					end: /[ \t]*(\w+)\b/
				});
				const WHITESPACE = "[ 	\n]";
				const STRING = {
					scope: "string",
					variants: [
						DOUBLE_QUOTED,
						SINGLE_QUOTED,
						HEREDOC,
						NOWDOC
					]
				};
				const NUMBER = {
					scope: "number",
					variants: [
						{ begin: `\\b0[bB][01]+(?:_[01]+)*\\b` },
						{ begin: `\\b0[oO][0-7]+(?:_[0-7]+)*\\b` },
						{ begin: `\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b` },
						{ begin: `(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?` }
					],
					relevance: 0
				};
				const LITERALS = [
					"false",
					"null",
					"true"
				];
				const KWS = [
					"__CLASS__",
					"__DIR__",
					"__FILE__",
					"__FUNCTION__",
					"__COMPILER_HALT_OFFSET__",
					"__LINE__",
					"__METHOD__",
					"__NAMESPACE__",
					"__TRAIT__",
					"die",
					"echo",
					"exit",
					"include",
					"include_once",
					"print",
					"require",
					"require_once",
					"array",
					"abstract",
					"and",
					"as",
					"binary",
					"bool",
					"boolean",
					"break",
					"callable",
					"case",
					"catch",
					"class",
					"clone",
					"const",
					"continue",
					"declare",
					"default",
					"do",
					"double",
					"else",
					"elseif",
					"empty",
					"enddeclare",
					"endfor",
					"endforeach",
					"endif",
					"endswitch",
					"endwhile",
					"enum",
					"eval",
					"extends",
					"final",
					"finally",
					"float",
					"for",
					"foreach",
					"from",
					"global",
					"goto",
					"if",
					"implements",
					"instanceof",
					"insteadof",
					"int",
					"integer",
					"interface",
					"isset",
					"iterable",
					"list",
					"match|0",
					"mixed",
					"new",
					"never",
					"object",
					"or",
					"private",
					"protected",
					"public",
					"readonly",
					"real",
					"return",
					"string",
					"switch",
					"throw",
					"trait",
					"try",
					"unset",
					"use",
					"var",
					"void",
					"while",
					"xor",
					"yield"
				];
				const BUILT_INS = [
					"Error|0",
					"AppendIterator",
					"ArgumentCountError",
					"ArithmeticError",
					"ArrayIterator",
					"ArrayObject",
					"AssertionError",
					"BadFunctionCallException",
					"BadMethodCallException",
					"CachingIterator",
					"CallbackFilterIterator",
					"CompileError",
					"Countable",
					"DirectoryIterator",
					"DivisionByZeroError",
					"DomainException",
					"EmptyIterator",
					"ErrorException",
					"Exception",
					"FilesystemIterator",
					"FilterIterator",
					"GlobIterator",
					"InfiniteIterator",
					"InvalidArgumentException",
					"IteratorIterator",
					"LengthException",
					"LimitIterator",
					"LogicException",
					"MultipleIterator",
					"NoRewindIterator",
					"OutOfBoundsException",
					"OutOfRangeException",
					"OuterIterator",
					"OverflowException",
					"ParentIterator",
					"ParseError",
					"RangeException",
					"RecursiveArrayIterator",
					"RecursiveCachingIterator",
					"RecursiveCallbackFilterIterator",
					"RecursiveDirectoryIterator",
					"RecursiveFilterIterator",
					"RecursiveIterator",
					"RecursiveIteratorIterator",
					"RecursiveRegexIterator",
					"RecursiveTreeIterator",
					"RegexIterator",
					"RuntimeException",
					"SeekableIterator",
					"SplDoublyLinkedList",
					"SplFileInfo",
					"SplFileObject",
					"SplFixedArray",
					"SplHeap",
					"SplMaxHeap",
					"SplMinHeap",
					"SplObjectStorage",
					"SplObserver",
					"SplPriorityQueue",
					"SplQueue",
					"SplStack",
					"SplSubject",
					"SplTempFileObject",
					"TypeError",
					"UnderflowException",
					"UnexpectedValueException",
					"UnhandledMatchError",
					"ArrayAccess",
					"BackedEnum",
					"Closure",
					"Fiber",
					"Generator",
					"Iterator",
					"IteratorAggregate",
					"Serializable",
					"Stringable",
					"Throwable",
					"Traversable",
					"UnitEnum",
					"WeakReference",
					"WeakMap",
					"Directory",
					"__PHP_Incomplete_Class",
					"parent",
					"php_user_filter",
					"self",
					"static",
					"stdClass"
				];
				/** Dual-case keywords
				*
				* ["then","FILE"] =>
				*     ["then", "THEN", "FILE", "file"]
				*
				* @param {string[]} items */
				const dualCase = (items) => {
					/** @type string[] */
					const result = [];
					items.forEach((item) => {
						result.push(item);
						if (item.toLowerCase() === item) result.push(item.toUpperCase());
						else result.push(item.toLowerCase());
					});
					return result;
				};
				const KEYWORDS = {
					keyword: KWS,
					literal: dualCase(LITERALS),
					built_in: BUILT_INS
				};
				/**
				* @param {string[]} items */
				const normalizeKeywords = (items) => {
					return items.map((item) => {
						return item.replace(/\|\d+$/, "");
					});
				};
				const CONSTRUCTOR_CALL = { variants: [{
					match: [
						/new/,
						regex.concat(WHITESPACE, "+"),
						regex.concat("(?!", normalizeKeywords(BUILT_INS).join("\\b|"), "\\b)"),
						PASCAL_CASE_CLASS_NAME_RE
					],
					scope: {
						1: "keyword",
						4: "title.class"
					}
				}] };
				const CONSTANT_REFERENCE = regex.concat(IDENT_RE, "\\b(?!\\()");
				const LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON = { variants: [
					{
						match: [regex.concat(/::/, regex.lookahead(/(?!class\b)/)), CONSTANT_REFERENCE],
						scope: { 2: "variable.constant" }
					},
					{
						match: [/::/, /class/],
						scope: { 2: "variable.language" }
					},
					{
						match: [
							PASCAL_CASE_CLASS_NAME_RE,
							regex.concat(/::/, regex.lookahead(/(?!class\b)/)),
							CONSTANT_REFERENCE
						],
						scope: {
							1: "title.class",
							3: "variable.constant"
						}
					},
					{
						match: [PASCAL_CASE_CLASS_NAME_RE, regex.concat("::", regex.lookahead(/(?!class\b)/))],
						scope: { 1: "title.class" }
					},
					{
						match: [
							PASCAL_CASE_CLASS_NAME_RE,
							/::/,
							/class/
						],
						scope: {
							1: "title.class",
							3: "variable.language"
						}
					}
				] };
				const NAMED_ARGUMENT = {
					scope: "attr",
					match: regex.concat(IDENT_RE, regex.lookahead(":"), regex.lookahead(/(?!::)/))
				};
				const PARAMS_MODE = {
					relevance: 0,
					begin: /\(/,
					end: /\)/,
					keywords: KEYWORDS,
					contains: [
						NAMED_ARGUMENT,
						VARIABLE,
						LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
						hljs.C_BLOCK_COMMENT_MODE,
						hljs.C_LINE_COMMENT_MODE,
						hljs.HASH_COMMENT_MODE,
						STRING,
						NUMBER,
						CONSTRUCTOR_CALL
					]
				};
				const FUNCTION_INVOKE = {
					relevance: 0,
					match: [
						/\b/,
						regex.concat("(?!fn\\b|function\\b|", normalizeKeywords(KWS).join("\\b|"), "|", normalizeKeywords(BUILT_INS).join("\\b|"), "\\b)"),
						IDENT_RE,
						regex.concat(WHITESPACE, "*"),
						regex.lookahead(/(?=\()/)
					],
					scope: { 3: "title.function.invoke" },
					contains: [PARAMS_MODE]
				};
				PARAMS_MODE.contains.push(FUNCTION_INVOKE);
				const ATTRIBUTE_CONTAINS = [
					NAMED_ARGUMENT,
					LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
					hljs.C_BLOCK_COMMENT_MODE,
					hljs.C_LINE_COMMENT_MODE,
					hljs.HASH_COMMENT_MODE,
					STRING,
					NUMBER,
					CONSTRUCTOR_CALL
				];
				const ATTRIBUTES = {
					begin: regex.concat(/#\[\s*\\?/, regex.either(PASCAL_CASE_CLASS_NAME_RE, UPCASE_NAME_RE)),
					beginScope: "meta",
					end: /]/,
					endScope: "meta",
					keywords: {
						literal: LITERALS,
						keyword: ["new", "array"]
					},
					contains: [
						{
							begin: /\[/,
							end: /]/,
							keywords: {
								literal: LITERALS,
								keyword: ["new", "array"]
							},
							contains: ["self", ...ATTRIBUTE_CONTAINS]
						},
						...ATTRIBUTE_CONTAINS,
						{
							scope: "meta",
							variants: [{ match: PASCAL_CASE_CLASS_NAME_RE }, { match: UPCASE_NAME_RE }]
						}
					]
				};
				return {
					case_insensitive: false,
					keywords: KEYWORDS,
					contains: [
						ATTRIBUTES,
						hljs.HASH_COMMENT_MODE,
						hljs.COMMENT("//", "$"),
						hljs.COMMENT("/\\*", "\\*/", { contains: [{
							scope: "doctag",
							match: "@[A-Za-z]+"
						}] }),
						{
							match: /__halt_compiler\(\);/,
							keywords: "__halt_compiler",
							starts: {
								scope: "comment",
								end: hljs.MATCH_NOTHING_RE,
								contains: [{
									match: /\?>/,
									scope: "meta",
									endsParent: true
								}]
							}
						},
						PREPROCESSOR,
						{
							scope: "variable.language",
							match: /\$this\b/
						},
						VARIABLE,
						FUNCTION_INVOKE,
						LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
						{
							match: [
								/const/,
								/\s/,
								IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "variable.constant"
							}
						},
						CONSTRUCTOR_CALL,
						{
							scope: "function",
							relevance: 0,
							beginKeywords: "fn function",
							end: /[;{]/,
							excludeEnd: true,
							illegal: "[$%\\[]",
							contains: [
								{ beginKeywords: "use" },
								hljs.UNDERSCORE_TITLE_MODE,
								{
									begin: "=>",
									endsParent: true
								},
								{
									scope: "params",
									begin: "\\(",
									end: "\\)",
									excludeBegin: true,
									excludeEnd: true,
									keywords: KEYWORDS,
									contains: [
										"self",
										ATTRIBUTES,
										VARIABLE,
										LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
										hljs.C_BLOCK_COMMENT_MODE,
										hljs.C_LINE_COMMENT_MODE,
										hljs.HASH_COMMENT_MODE,
										STRING,
										NUMBER
									]
								}
							]
						},
						{
							scope: "class",
							variants: [{
								beginKeywords: "enum",
								illegal: /[($"]/
							}, {
								beginKeywords: "class interface trait",
								illegal: /[:($"]/
							}],
							relevance: 0,
							end: /\{/,
							excludeEnd: true,
							contains: [{ beginKeywords: "extends implements" }, hljs.UNDERSCORE_TITLE_MODE]
						},
						{
							beginKeywords: "namespace",
							relevance: 0,
							end: ";",
							illegal: /[.']/,
							contains: [hljs.inherit(hljs.UNDERSCORE_TITLE_MODE, { scope: "title.class" })]
						},
						{
							beginKeywords: "use",
							relevance: 0,
							end: ";",
							contains: [{
								match: /\b(as|const|function)\b/,
								scope: "keyword"
							}, hljs.UNDERSCORE_TITLE_MODE]
						},
						STRING,
						NUMBER
					]
				};
			}
			module.exports = php;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/php-template.js
		var require_php_template = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function phpTemplate(hljs) {
				return {
					name: "PHP template",
					subLanguage: "xml",
					contains: [{
						begin: /<\?(php|=)?/,
						end: /\?>/,
						subLanguage: "php",
						contains: [
							{
								begin: "/\\*",
								end: "\\*/",
								skip: true
							},
							{
								begin: "b\"",
								end: "\"",
								skip: true
							},
							{
								begin: "b'",
								end: "'",
								skip: true
							},
							hljs.inherit(hljs.APOS_STRING_MODE, {
								illegal: null,
								className: null,
								contains: null,
								skip: true
							}),
							hljs.inherit(hljs.QUOTE_STRING_MODE, {
								illegal: null,
								className: null,
								contains: null,
								skip: true
							})
						]
					}]
				};
			}
			module.exports = phpTemplate;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/plaintext.js
		var require_plaintext = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function plaintext(hljs) {
				return {
					name: "Plain text",
					aliases: ["text", "txt"],
					disableAutodetect: true
				};
			}
			module.exports = plaintext;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/python.js
		var require_python = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function python(hljs) {
				const regex = hljs.regex;
				const IDENT_RE = /[\p{XID_Start}_]\p{XID_Continue}*/u;
				const RESERVED_WORDS = [
					"and",
					"as",
					"assert",
					"async",
					"await",
					"break",
					"case",
					"class",
					"continue",
					"def",
					"del",
					"elif",
					"else",
					"except",
					"finally",
					"for",
					"from",
					"global",
					"if",
					"import",
					"in",
					"is",
					"lambda",
					"lazy",
					"match",
					"nonlocal|10",
					"not",
					"or",
					"pass",
					"raise",
					"return",
					"try",
					"while",
					"with",
					"yield"
				];
				const KEYWORDS = {
					$pattern: /[A-Za-z]\w+|__\w+__/,
					keyword: RESERVED_WORDS,
					built_in: [
						"__import__",
						"abs",
						"aiter",
						"all",
						"anext",
						"any",
						"ascii",
						"bin",
						"bool",
						"breakpoint",
						"bytearray",
						"bytes",
						"callable",
						"chr",
						"classmethod",
						"compile",
						"complex",
						"delattr",
						"dict",
						"dir",
						"divmod",
						"enumerate",
						"eval",
						"exec",
						"filter",
						"float",
						"format",
						"frozendict",
						"frozenset",
						"getattr",
						"globals",
						"hasattr",
						"hash",
						"help",
						"hex",
						"id",
						"input",
						"int",
						"isinstance",
						"issubclass",
						"iter",
						"len",
						"list",
						"locals",
						"map",
						"max",
						"memoryview",
						"min",
						"next",
						"object",
						"oct",
						"open",
						"ord",
						"pow",
						"print",
						"property",
						"range",
						"repr",
						"reversed",
						"round",
						"sentinel",
						"set",
						"setattr",
						"slice",
						"sorted",
						"staticmethod",
						"str",
						"sum",
						"super",
						"tuple",
						"type",
						"vars",
						"zip"
					],
					literal: [
						"__debug__",
						"Ellipsis",
						"False",
						"None",
						"NotImplemented",
						"True"
					],
					type: [
						"Any",
						"Callable",
						"Coroutine",
						"Dict",
						"List",
						"Literal",
						"Generic",
						"Optional",
						"Sequence",
						"Set",
						"Tuple",
						"Type",
						"Union"
					]
				};
				const PROMPT = {
					className: "meta",
					begin: /^(>>>|\.\.\.) /
				};
				const SUBST = {
					className: "subst",
					begin: /\{/,
					end: /\}/,
					keywords: KEYWORDS,
					illegal: /#/
				};
				const LITERAL_BRACKET = {
					begin: /\{\{/,
					relevance: 0
				};
				const STRING = {
					className: "string",
					contains: [hljs.BACKSLASH_ESCAPE],
					variants: [
						{
							begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
							end: /'''/,
							contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
							relevance: 10
						},
						{
							begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
							end: /"""/,
							contains: [hljs.BACKSLASH_ESCAPE, PROMPT],
							relevance: 10
						},
						{
							begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])'''/,
							end: /'''/,
							contains: [
								hljs.BACKSLASH_ESCAPE,
								PROMPT,
								LITERAL_BRACKET,
								SUBST
							]
						},
						{
							begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])"""/,
							end: /"""/,
							contains: [
								hljs.BACKSLASH_ESCAPE,
								PROMPT,
								LITERAL_BRACKET,
								SUBST
							]
						},
						{
							begin: /([uU]|[rR])'/,
							end: /'/,
							relevance: 10
						},
						{
							begin: /([uU]|[rR])"/,
							end: /"/,
							relevance: 10
						},
						{
							begin: /([bB]|[bB][rR]|[rR][bB])'/,
							end: /'/
						},
						{
							begin: /([bB]|[bB][rR]|[rR][bB])"/,
							end: /"/
						},
						{
							begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])'/,
							end: /'/,
							contains: [
								hljs.BACKSLASH_ESCAPE,
								LITERAL_BRACKET,
								SUBST
							]
						},
						{
							begin: /([fFtT][rR]|[rR][fFtT]|[fFtT])"/,
							end: /"/,
							contains: [
								hljs.BACKSLASH_ESCAPE,
								LITERAL_BRACKET,
								SUBST
							]
						},
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE
					]
				};
				const digitpart = "[0-9](_?[0-9])*";
				const pointfloat = `(\\b(${digitpart}))?\\.(${digitpart})|\\b(${digitpart})\\.`;
				const lookahead = `\\b|${RESERVED_WORDS.join("|")}`;
				const NUMBER = {
					className: "number",
					relevance: 0,
					variants: [
						{ begin: `(\\b(${digitpart})|(${pointfloat}))[eE][+-]?(${digitpart})[jJ]?(?=${lookahead})` },
						{ begin: `(${pointfloat})[jJ]?` },
						{ begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${lookahead})` },
						{ begin: `\\b0[bB](_?[01])+[lL]?(?=${lookahead})` },
						{ begin: `\\b0[oO](_?[0-7])+[lL]?(?=${lookahead})` },
						{ begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${lookahead})` },
						{ begin: `\\b(${digitpart})[jJ](?=${lookahead})` }
					]
				};
				const COMMENT_TYPE = {
					className: "comment",
					begin: regex.lookahead(/# type:/),
					end: /$/,
					keywords: KEYWORDS,
					contains: [{ begin: /# type:/ }, {
						begin: /#/,
						end: /\b\B/,
						endsWithParent: true
					}]
				};
				const PARAMS = {
					className: "params",
					variants: [{
						className: "",
						begin: /\(\s*\)/,
						skip: true
					}, {
						begin: /\(/,
						end: /\)/,
						excludeBegin: true,
						excludeEnd: true,
						keywords: KEYWORDS,
						contains: [
							"self",
							PROMPT,
							NUMBER,
							STRING,
							hljs.HASH_COMMENT_MODE
						]
					}]
				};
				SUBST.contains = [
					STRING,
					NUMBER,
					PROMPT
				];
				return {
					name: "Python",
					aliases: [
						"py",
						"gyp",
						"ipython"
					],
					unicodeRegex: true,
					keywords: KEYWORDS,
					illegal: /(<\/|\?)|=>/,
					contains: [
						PROMPT,
						NUMBER,
						{
							scope: "variable.language",
							match: /\bself\b/
						},
						{
							beginKeywords: "if",
							relevance: 0
						},
						{
							match: /\bor\b/,
							scope: "keyword"
						},
						STRING,
						COMMENT_TYPE,
						hljs.HASH_COMMENT_MODE,
						{
							match: [
								/\bdef/,
								/\s+/,
								IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "title.function"
							},
							contains: [PARAMS]
						},
						{
							variants: [{ match: [
								/\bclass/,
								/\s+/,
								IDENT_RE,
								/\s*/,
								/\(\s*/,
								IDENT_RE,
								/\s*\)/
							] }, { match: [
								/\bclass/,
								/\s+/,
								IDENT_RE
							] }],
							scope: {
								1: "keyword",
								3: "title.class",
								6: "title.class.inherited"
							}
						},
						{
							className: "meta",
							begin: /^[\t ]*@/,
							end: /(?=#)|$/,
							contains: [
								NUMBER,
								PARAMS,
								STRING
							]
						}
					]
				};
			}
			module.exports = python;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/python-repl.js
		var require_python_repl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function pythonRepl(hljs) {
				return {
					aliases: ["pycon"],
					contains: [{
						className: "meta.prompt",
						starts: {
							end: / |$/,
							starts: {
								end: "$",
								subLanguage: "python"
							}
						},
						variants: [{ begin: /^>>>(?=[ ]|$)/ }, { begin: /^\.\.\.(?=[ ]|$)/ }]
					}]
				};
			}
			module.exports = pythonRepl;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/r.js
		var require_r = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function r(hljs) {
				const regex = hljs.regex;
				const IDENT_RE = /(?:(?:[a-zA-Z]|\.[._a-zA-Z])[._a-zA-Z0-9]*)|\.(?!\d)/;
				const NUMBER_TYPES_RE = regex.either(/0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*[pP][+-]?\d+i?/, /0[xX][0-9a-fA-F]+(?:[pP][+-]?\d+)?[Li]?/, /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[Li]?/);
				const OPERATORS_RE = /[=!<>:]=|\|\||&&|:::?|<-|<<-|->>|->|\|>|[-+*\/?!$&|:<=>@^~]|\*\*/;
				const PUNCTUATION_RE = regex.either(/[()]/, /[{}]/, /\[\[/, /[[\]]/, /\\/, /,/);
				return {
					name: "R",
					keywords: {
						$pattern: IDENT_RE,
						keyword: "function if in break next repeat else for while",
						literal: "NULL NA TRUE FALSE Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 NA_complex_|10",
						built_in: "LETTERS letters month.abb month.name pi T F abs acos acosh all any anyNA Arg as.call as.character as.complex as.double as.environment as.integer as.logical as.null.default as.numeric as.raw asin asinh atan atanh attr attributes baseenv browser c call ceiling class Conj cos cosh cospi cummax cummin cumprod cumsum digamma dim dimnames emptyenv exp expression floor forceAndCall gamma gc.time globalenv Im interactive invisible is.array is.atomic is.call is.character is.complex is.double is.environment is.expression is.finite is.function is.infinite is.integer is.language is.list is.logical is.matrix is.na is.name is.nan is.null is.numeric is.object is.pairlist is.raw is.recursive is.single is.symbol lazyLoadDBfetch length lgamma list log max min missing Mod names nargs nzchar oldClass on.exit pos.to.env proc.time prod quote range Re rep retracemem return round seq_along seq_len seq.int sign signif sin sinh sinpi sqrt standardGeneric substitute sum switch tan tanh tanpi tracemem trigamma trunc unclass untracemem UseMethod xtfrm"
					},
					contains: [
						hljs.COMMENT(/#'/, /$/, { contains: [
							{
								scope: "doctag",
								match: /@examples/,
								starts: {
									end: regex.lookahead(regex.either(/\n^#'\s*(?=@[a-zA-Z]+)/, /\n^(?!#')/)),
									endsParent: true
								}
							},
							{
								scope: "doctag",
								begin: "@param",
								end: /$/,
								contains: [{
									scope: "variable",
									variants: [{ match: IDENT_RE }, { match: /`(?:\\.|[^`\\])+`/ }],
									endsParent: true
								}]
							},
							{
								scope: "doctag",
								match: /@[a-zA-Z]+/
							},
							{
								scope: "keyword",
								match: /\\[a-zA-Z]+/
							}
						] }),
						hljs.HASH_COMMENT_MODE,
						{
							scope: "string",
							contains: [hljs.BACKSLASH_ESCAPE],
							variants: [
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]"(-*)\(/,
									end: /\)(-*)"/
								}),
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]"(-*)\{/,
									end: /\}(-*)"/
								}),
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]"(-*)\[/,
									end: /\](-*)"/
								}),
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]'(-*)\(/,
									end: /\)(-*)'/
								}),
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]'(-*)\{/,
									end: /\}(-*)'/
								}),
								hljs.END_SAME_AS_BEGIN({
									begin: /[rR]'(-*)\[/,
									end: /\](-*)'/
								}),
								{
									begin: "\"",
									end: "\"",
									relevance: 0
								},
								{
									begin: "'",
									end: "'",
									relevance: 0
								}
							]
						},
						{
							relevance: 0,
							variants: [
								{
									scope: {
										1: "operator",
										2: "number"
									},
									match: [OPERATORS_RE, NUMBER_TYPES_RE]
								},
								{
									scope: {
										1: "operator",
										2: "number"
									},
									match: [/%[^%]*%/, NUMBER_TYPES_RE]
								},
								{
									scope: {
										1: "punctuation",
										2: "number"
									},
									match: [PUNCTUATION_RE, NUMBER_TYPES_RE]
								},
								{
									scope: { 2: "number" },
									match: [/[^a-zA-Z0-9._]|^/, NUMBER_TYPES_RE]
								}
							]
						},
						{
							scope: { 3: "operator" },
							match: [
								IDENT_RE,
								/\s+/,
								/<-/,
								/\s+/
							]
						},
						{
							scope: "operator",
							relevance: 0,
							variants: [{ match: OPERATORS_RE }, { match: /%[^%]*%/ }]
						},
						{
							scope: "punctuation",
							relevance: 0,
							match: PUNCTUATION_RE
						},
						{
							begin: "`",
							end: "`",
							contains: [{ begin: /\\./ }]
						}
					]
				};
			}
			module.exports = r;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/rust.js
		var require_rust = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function rust(hljs) {
				const regex = hljs.regex;
				const RAW_IDENTIFIER = /(r#)?/;
				const UNDERSCORE_IDENT_RE = regex.concat(RAW_IDENTIFIER, hljs.UNDERSCORE_IDENT_RE);
				const IDENT_RE = regex.concat(RAW_IDENTIFIER, hljs.IDENT_RE);
				const FUNCTION_INVOKE = {
					scope: "title.function.invoke",
					relevance: 0,
					begin: regex.concat(/\b/, /(?!(?:let|for|while|if|else|match)\b)/, IDENT_RE, regex.lookahead(/\s*\(/))
				};
				const NUMBER_SUFFIX = "([ui](8|16|32|64|128|size)|f(16|32|64|128))?";
				const KEYWORDS = [
					"abstract",
					"as",
					"async",
					"await",
					"become",
					"box",
					"break",
					"const",
					"continue",
					"crate",
					"do",
					"dyn",
					"else",
					"enum",
					"extern",
					"false",
					"final",
					"fn",
					"for",
					"if",
					"impl",
					"in",
					"let",
					"loop",
					"macro",
					"match",
					"mod",
					"move",
					"mut",
					"override",
					"priv",
					"pub",
					"raw",
					"ref",
					"return",
					"self",
					"Self",
					"static",
					"struct",
					"super",
					"trait",
					"true",
					"try",
					"type",
					"typeof",
					"union",
					"unsafe",
					"unsized",
					"use",
					"virtual",
					"where",
					"while",
					"yield"
				];
				const LITERALS = [
					"true",
					"false",
					"Some",
					"None",
					"Ok",
					"Err"
				];
				const BUILTINS = [
					"drop ",
					"Copy",
					"Send",
					"Sized",
					"Sync",
					"Drop",
					"Fn",
					"FnMut",
					"FnOnce",
					"ToOwned",
					"Clone",
					"Debug",
					"PartialEq",
					"PartialOrd",
					"Eq",
					"Ord",
					"AsRef",
					"AsMut",
					"Into",
					"From",
					"Default",
					"Iterator",
					"Extend",
					"IntoIterator",
					"DoubleEndedIterator",
					"ExactSizeIterator",
					"SliceConcatExt",
					"ToString",
					"assert!",
					"assert_eq!",
					"bitflags!",
					"bytes!",
					"cfg!",
					"col!",
					"concat!",
					"concat_idents!",
					"debug_assert!",
					"debug_assert_eq!",
					"env!",
					"eprintln!",
					"panic!",
					"file!",
					"format!",
					"format_args!",
					"include_bytes!",
					"include_str!",
					"line!",
					"local_data_key!",
					"module_path!",
					"option_env!",
					"print!",
					"println!",
					"select!",
					"stringify!",
					"try!",
					"unimplemented!",
					"unreachable!",
					"vec!",
					"write!",
					"writeln!",
					"macro_rules!",
					"assert_ne!",
					"debug_assert_ne!"
				];
				const TYPES = [
					"i8",
					"i16",
					"i32",
					"i64",
					"i128",
					"isize",
					"u8",
					"u16",
					"u32",
					"u64",
					"u128",
					"usize",
					"f16",
					"f32",
					"f64",
					"f128",
					"str",
					"char",
					"bool",
					"Box",
					"Option",
					"Result",
					"String",
					"Vec"
				];
				return {
					name: "Rust",
					aliases: ["rs"],
					keywords: {
						$pattern: hljs.IDENT_RE + "!?",
						type: TYPES,
						keyword: KEYWORDS,
						literal: LITERALS,
						built_in: BUILTINS
					},
					illegal: "</",
					contains: [
						hljs.C_LINE_COMMENT_MODE,
						hljs.COMMENT("/\\*", "\\*/", { contains: ["self"] }),
						hljs.inherit(hljs.QUOTE_STRING_MODE, {
							begin: /b?"/,
							illegal: null
						}),
						{
							scope: "symbol",
							begin: /'[a-zA-Z_][a-zA-Z0-9_]*(?!')/
						},
						{
							scope: "string",
							variants: [{ begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ }, {
								begin: /b?'/,
								end: /'/,
								contains: [{
									scope: "char.escape",
									match: /\\('|"|\\|\w|x\w{2}|u\w{4}|U\w{8})/
								}]
							}]
						},
						{
							scope: "number",
							variants: [
								{ begin: "\\b0b([01_]+)" + NUMBER_SUFFIX },
								{ begin: "\\b0o([0-7_]+)" + NUMBER_SUFFIX },
								{ begin: "\\b0x([A-Fa-f0-9_]+)" + NUMBER_SUFFIX },
								{ begin: "\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)" + NUMBER_SUFFIX }
							],
							relevance: 0
						},
						{
							begin: [
								/\bsafe/,
								/\s+/,
								/extern/
							],
							scope: {
								1: "keyword",
								3: "keyword"
							}
						},
						{
							begin: [
								/fn/,
								/\s+/,
								UNDERSCORE_IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "title.function"
							}
						},
						{
							scope: "meta",
							begin: "#!?\\[",
							end: "\\]",
							contains: [{
								scope: "string",
								begin: /"/,
								end: /"/,
								contains: [hljs.BACKSLASH_ESCAPE]
							}]
						},
						{
							begin: [
								/let/,
								/\s+/,
								/(?:mut\s+)?/,
								UNDERSCORE_IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "keyword",
								4: "variable"
							}
						},
						{
							begin: [
								/for/,
								/\s+/,
								UNDERSCORE_IDENT_RE,
								/\s+/,
								/in/
							],
							scope: {
								1: "keyword",
								3: "variable",
								5: "keyword"
							}
						},
						{
							begin: [
								/type/,
								/\s+/,
								UNDERSCORE_IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "title.class"
							}
						},
						{
							begin: [
								/(?:trait|enum|struct|union|impl|for)/,
								/\s+/,
								UNDERSCORE_IDENT_RE
							],
							scope: {
								1: "keyword",
								3: "title.class"
							}
						},
						{
							begin: hljs.IDENT_RE + "::",
							keywords: {
								keyword: "Self",
								built_in: BUILTINS,
								type: TYPES
							}
						},
						{
							scope: "punctuation",
							begin: "->"
						},
						FUNCTION_INVOKE
					]
				};
			}
			module.exports = rust;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/scss.js
		var require_scss = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const MODES = (hljs) => {
				return {
					IMPORTANT: {
						scope: "meta",
						begin: "!important"
					},
					BLOCK_COMMENT: hljs.C_BLOCK_COMMENT_MODE,
					HEXCOLOR: {
						scope: "number",
						begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
					},
					UNICODE_RANGE: {
						scope: "number",
						begin: /\b[Uu]\+[0-9A-Fa-f][0-9A-Fa-f?]{0,5}(-[0-9A-Fa-f][0-9A-Fa-f]{0,5})?/
					},
					FUNCTION_DISPATCH: {
						className: "built_in",
						begin: /[\w-]+(?=\()/
					},
					ATTRIBUTE_SELECTOR_MODE: {
						scope: "selector-attr",
						begin: /\[/,
						end: /\]/,
						illegal: "$",
						contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
					},
					CSS_NUMBER_MODE: {
						scope: "number",
						begin: hljs.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
						relevance: 0
					},
					CSS_VARIABLE: {
						className: "attr",
						begin: /--[A-Za-z_][A-Za-z0-9_-]*/
					}
				};
			};
			const HTML_TAGS = [
				"a",
				"abbr",
				"address",
				"article",
				"aside",
				"audio",
				"b",
				"blockquote",
				"body",
				"button",
				"canvas",
				"caption",
				"cite",
				"code",
				"dd",
				"del",
				"details",
				"dfn",
				"div",
				"dl",
				"dt",
				"em",
				"fieldset",
				"figcaption",
				"figure",
				"footer",
				"form",
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"header",
				"hgroup",
				"html",
				"i",
				"iframe",
				"img",
				"input",
				"ins",
				"kbd",
				"label",
				"legend",
				"li",
				"main",
				"mark",
				"menu",
				"nav",
				"object",
				"ol",
				"optgroup",
				"option",
				"p",
				"picture",
				"q",
				"quote",
				"samp",
				"section",
				"select",
				"source",
				"span",
				"strong",
				"summary",
				"sup",
				"table",
				"tbody",
				"td",
				"textarea",
				"tfoot",
				"th",
				"thead",
				"time",
				"tr",
				"ul",
				"var",
				"video"
			];
			const SVG_TAGS = [
				"defs",
				"g",
				"marker",
				"mask",
				"pattern",
				"svg",
				"switch",
				"symbol",
				"feBlend",
				"feColorMatrix",
				"feComponentTransfer",
				"feComposite",
				"feConvolveMatrix",
				"feDiffuseLighting",
				"feDisplacementMap",
				"feFlood",
				"feGaussianBlur",
				"feImage",
				"feMerge",
				"feMorphology",
				"feOffset",
				"feSpecularLighting",
				"feTile",
				"feTurbulence",
				"linearGradient",
				"radialGradient",
				"stop",
				"circle",
				"ellipse",
				"image",
				"line",
				"path",
				"polygon",
				"polyline",
				"rect",
				"text",
				"use",
				"textPath",
				"tspan",
				"foreignObject",
				"clipPath"
			];
			const TAGS = [...HTML_TAGS, ...SVG_TAGS];
			const MEDIA_FEATURES = [
				"any-hover",
				"any-pointer",
				"aspect-ratio",
				"color",
				"color-gamut",
				"color-index",
				"device-aspect-ratio",
				"device-height",
				"device-width",
				"display-mode",
				"forced-colors",
				"grid",
				"height",
				"hover",
				"inverted-colors",
				"monochrome",
				"orientation",
				"overflow-block",
				"overflow-inline",
				"pointer",
				"prefers-color-scheme",
				"prefers-contrast",
				"prefers-reduced-motion",
				"prefers-reduced-transparency",
				"resolution",
				"scan",
				"scripting",
				"update",
				"width",
				"min-width",
				"max-width",
				"min-height",
				"max-height"
			].sort().reverse();
			const PSEUDO_CLASSES = [
				"active",
				"any-link",
				"blank",
				"checked",
				"current",
				"default",
				"defined",
				"dir",
				"disabled",
				"drop",
				"empty",
				"enabled",
				"first",
				"first-child",
				"first-of-type",
				"fullscreen",
				"future",
				"focus",
				"focus-visible",
				"focus-within",
				"has",
				"host",
				"host-context",
				"hover",
				"indeterminate",
				"in-range",
				"invalid",
				"is",
				"lang",
				"last-child",
				"last-of-type",
				"left",
				"link",
				"local-link",
				"not",
				"nth-child",
				"nth-col",
				"nth-last-child",
				"nth-last-col",
				"nth-last-of-type",
				"nth-of-type",
				"only-child",
				"only-of-type",
				"optional",
				"out-of-range",
				"past",
				"placeholder-shown",
				"read-only",
				"read-write",
				"required",
				"right",
				"root",
				"scope",
				"target",
				"target-within",
				"user-invalid",
				"valid",
				"visited",
				"where"
			].sort().reverse();
			const PSEUDO_ELEMENTS = [
				"after",
				"backdrop",
				"before",
				"cue",
				"cue-region",
				"first-letter",
				"first-line",
				"grammar-error",
				"marker",
				"part",
				"placeholder",
				"selection",
				"slotted",
				"spelling-error"
			].sort().reverse();
			const ATTRIBUTES = [
				"accent-color",
				"align-content",
				"align-items",
				"align-self",
				"alignment-baseline",
				"all",
				"anchor-name",
				"animation",
				"animation-composition",
				"animation-delay",
				"animation-direction",
				"animation-duration",
				"animation-fill-mode",
				"animation-iteration-count",
				"animation-name",
				"animation-play-state",
				"animation-range",
				"animation-range-end",
				"animation-range-start",
				"animation-timeline",
				"animation-timing-function",
				"appearance",
				"aspect-ratio",
				"backdrop-filter",
				"backface-visibility",
				"background",
				"background-attachment",
				"background-blend-mode",
				"background-clip",
				"background-color",
				"background-image",
				"background-origin",
				"background-position",
				"background-position-x",
				"background-position-y",
				"background-repeat",
				"background-size",
				"baseline-shift",
				"block-size",
				"border",
				"border-block",
				"border-block-color",
				"border-block-end",
				"border-block-end-color",
				"border-block-end-style",
				"border-block-end-width",
				"border-block-start",
				"border-block-start-color",
				"border-block-start-style",
				"border-block-start-width",
				"border-block-style",
				"border-block-width",
				"border-bottom",
				"border-bottom-color",
				"border-bottom-left-radius",
				"border-bottom-right-radius",
				"border-bottom-style",
				"border-bottom-width",
				"border-collapse",
				"border-color",
				"border-end-end-radius",
				"border-end-start-radius",
				"border-image",
				"border-image-outset",
				"border-image-repeat",
				"border-image-slice",
				"border-image-source",
				"border-image-width",
				"border-inline",
				"border-inline-color",
				"border-inline-end",
				"border-inline-end-color",
				"border-inline-end-style",
				"border-inline-end-width",
				"border-inline-start",
				"border-inline-start-color",
				"border-inline-start-style",
				"border-inline-start-width",
				"border-inline-style",
				"border-inline-width",
				"border-left",
				"border-left-color",
				"border-left-style",
				"border-left-width",
				"border-radius",
				"border-right",
				"border-right-color",
				"border-right-style",
				"border-right-width",
				"border-spacing",
				"border-start-end-radius",
				"border-start-start-radius",
				"border-style",
				"border-top",
				"border-top-color",
				"border-top-left-radius",
				"border-top-right-radius",
				"border-top-style",
				"border-top-width",
				"border-width",
				"bottom",
				"box-align",
				"box-decoration-break",
				"box-direction",
				"box-flex",
				"box-flex-group",
				"box-lines",
				"box-ordinal-group",
				"box-orient",
				"box-pack",
				"box-shadow",
				"box-sizing",
				"break-after",
				"break-before",
				"break-inside",
				"caption-side",
				"caret-color",
				"clear",
				"clip",
				"clip-path",
				"clip-rule",
				"color",
				"color-interpolation",
				"color-interpolation-filters",
				"color-profile",
				"color-rendering",
				"color-scheme",
				"column-count",
				"column-fill",
				"column-gap",
				"column-rule",
				"column-rule-color",
				"column-rule-style",
				"column-rule-width",
				"column-span",
				"column-width",
				"columns",
				"contain",
				"contain-intrinsic-block-size",
				"contain-intrinsic-height",
				"contain-intrinsic-inline-size",
				"contain-intrinsic-size",
				"contain-intrinsic-width",
				"container",
				"container-name",
				"container-type",
				"content",
				"content-visibility",
				"corner-bottom-left-shape",
				"corner-bottom-right-shape",
				"corner-shape",
				"corner-top-left-shape",
				"corner-top-right-shape",
				"counter-increment",
				"counter-reset",
				"counter-set",
				"cue",
				"cue-after",
				"cue-before",
				"cursor",
				"cx",
				"cy",
				"direction",
				"display",
				"dominant-baseline",
				"empty-cells",
				"enable-background",
				"field-sizing",
				"fill",
				"fill-opacity",
				"fill-rule",
				"filter",
				"flex",
				"flex-basis",
				"flex-direction",
				"flex-flow",
				"flex-grow",
				"flex-shrink",
				"flex-wrap",
				"float",
				"flood-color",
				"flood-opacity",
				"flow",
				"font",
				"font-display",
				"font-family",
				"font-feature-settings",
				"font-kerning",
				"font-language-override",
				"font-optical-sizing",
				"font-palette",
				"font-size",
				"font-size-adjust",
				"font-smooth",
				"font-smoothing",
				"font-stretch",
				"font-style",
				"font-synthesis",
				"font-synthesis-position",
				"font-synthesis-small-caps",
				"font-synthesis-style",
				"font-synthesis-weight",
				"font-variant",
				"font-variant-alternates",
				"font-variant-caps",
				"font-variant-east-asian",
				"font-variant-emoji",
				"font-variant-ligatures",
				"font-variant-numeric",
				"font-variant-position",
				"font-variation-settings",
				"font-weight",
				"forced-color-adjust",
				"gap",
				"glyph-orientation-horizontal",
				"glyph-orientation-vertical",
				"grid",
				"grid-area",
				"grid-auto-columns",
				"grid-auto-flow",
				"grid-auto-rows",
				"grid-column",
				"grid-column-end",
				"grid-column-start",
				"grid-gap",
				"grid-row",
				"grid-row-end",
				"grid-row-start",
				"grid-template",
				"grid-template-areas",
				"grid-template-columns",
				"grid-template-rows",
				"hanging-punctuation",
				"height",
				"hyphenate-character",
				"hyphenate-limit-chars",
				"hyphens",
				"icon",
				"image-orientation",
				"image-rendering",
				"image-resolution",
				"ime-mode",
				"initial-letter",
				"initial-letter-align",
				"inline-size",
				"inset",
				"inset-area",
				"inset-block",
				"inset-block-end",
				"inset-block-start",
				"inset-inline",
				"inset-inline-end",
				"inset-inline-start",
				"isolation",
				"justify-content",
				"justify-items",
				"justify-self",
				"kerning",
				"left",
				"letter-spacing",
				"lighting-color",
				"line-break",
				"line-height",
				"line-height-step",
				"list-style",
				"list-style-image",
				"list-style-position",
				"list-style-type",
				"margin",
				"margin-block",
				"margin-block-end",
				"margin-block-start",
				"margin-bottom",
				"margin-inline",
				"margin-inline-end",
				"margin-inline-start",
				"margin-left",
				"margin-right",
				"margin-top",
				"margin-trim",
				"marker",
				"marker-end",
				"marker-mid",
				"marker-start",
				"marks",
				"mask",
				"mask-border",
				"mask-border-mode",
				"mask-border-outset",
				"mask-border-repeat",
				"mask-border-slice",
				"mask-border-source",
				"mask-border-width",
				"mask-clip",
				"mask-composite",
				"mask-image",
				"mask-mode",
				"mask-origin",
				"mask-position",
				"mask-repeat",
				"mask-size",
				"mask-type",
				"masonry-auto-flow",
				"math-depth",
				"math-shift",
				"math-style",
				"max-block-size",
				"max-height",
				"max-inline-size",
				"max-width",
				"min-block-size",
				"min-height",
				"min-inline-size",
				"min-width",
				"mix-blend-mode",
				"nav-down",
				"nav-index",
				"nav-left",
				"nav-right",
				"nav-up",
				"none",
				"normal",
				"object-fit",
				"object-position",
				"offset",
				"offset-anchor",
				"offset-distance",
				"offset-path",
				"offset-position",
				"offset-rotate",
				"opacity",
				"order",
				"orphans",
				"outline",
				"outline-color",
				"outline-offset",
				"outline-style",
				"outline-width",
				"overflow",
				"overflow-anchor",
				"overflow-block",
				"overflow-clip-margin",
				"overflow-inline",
				"overflow-wrap",
				"overflow-x",
				"overflow-y",
				"overlay",
				"overscroll-behavior",
				"overscroll-behavior-block",
				"overscroll-behavior-inline",
				"overscroll-behavior-x",
				"overscroll-behavior-y",
				"padding",
				"padding-block",
				"padding-block-end",
				"padding-block-start",
				"padding-bottom",
				"padding-inline",
				"padding-inline-end",
				"padding-inline-start",
				"padding-left",
				"padding-right",
				"padding-top",
				"page",
				"page-break-after",
				"page-break-before",
				"page-break-inside",
				"paint-order",
				"pause",
				"pause-after",
				"pause-before",
				"perspective",
				"perspective-origin",
				"place-content",
				"place-items",
				"place-self",
				"pointer-events",
				"position",
				"position-anchor",
				"position-visibility",
				"print-color-adjust",
				"quotes",
				"r",
				"resize",
				"rest",
				"rest-after",
				"rest-before",
				"right",
				"rotate",
				"row-gap",
				"ruby-align",
				"ruby-position",
				"scale",
				"scroll-behavior",
				"scroll-margin",
				"scroll-margin-block",
				"scroll-margin-block-end",
				"scroll-margin-block-start",
				"scroll-margin-bottom",
				"scroll-margin-inline",
				"scroll-margin-inline-end",
				"scroll-margin-inline-start",
				"scroll-margin-left",
				"scroll-margin-right",
				"scroll-margin-top",
				"scroll-padding",
				"scroll-padding-block",
				"scroll-padding-block-end",
				"scroll-padding-block-start",
				"scroll-padding-bottom",
				"scroll-padding-inline",
				"scroll-padding-inline-end",
				"scroll-padding-inline-start",
				"scroll-padding-left",
				"scroll-padding-right",
				"scroll-padding-top",
				"scroll-snap-align",
				"scroll-snap-stop",
				"scroll-snap-type",
				"scroll-timeline",
				"scroll-timeline-axis",
				"scroll-timeline-name",
				"scrollbar-color",
				"scrollbar-gutter",
				"scrollbar-width",
				"shape-image-threshold",
				"shape-margin",
				"shape-outside",
				"shape-rendering",
				"speak",
				"speak-as",
				"src",
				"stop-color",
				"stop-opacity",
				"stroke",
				"stroke-dasharray",
				"stroke-dashoffset",
				"stroke-linecap",
				"stroke-linejoin",
				"stroke-miterlimit",
				"stroke-opacity",
				"stroke-width",
				"tab-size",
				"table-layout",
				"text-align",
				"text-align-all",
				"text-align-last",
				"text-anchor",
				"text-combine-upright",
				"text-decoration",
				"text-decoration-color",
				"text-decoration-line",
				"text-decoration-skip",
				"text-decoration-skip-ink",
				"text-decoration-style",
				"text-decoration-thickness",
				"text-emphasis",
				"text-emphasis-color",
				"text-emphasis-position",
				"text-emphasis-style",
				"text-indent",
				"text-justify",
				"text-orientation",
				"text-overflow",
				"text-rendering",
				"text-shadow",
				"text-size-adjust",
				"text-transform",
				"text-underline-offset",
				"text-underline-position",
				"text-wrap",
				"text-wrap-mode",
				"text-wrap-style",
				"timeline-scope",
				"top",
				"touch-action",
				"transform",
				"transform-box",
				"transform-origin",
				"transform-style",
				"transition",
				"transition-behavior",
				"transition-delay",
				"transition-duration",
				"transition-property",
				"transition-timing-function",
				"translate",
				"unicode-bidi",
				"unicode-range",
				"user-modify",
				"user-select",
				"vector-effect",
				"vertical-align",
				"view-timeline",
				"view-timeline-axis",
				"view-timeline-inset",
				"view-timeline-name",
				"view-transition-name",
				"visibility",
				"voice-balance",
				"voice-duration",
				"voice-family",
				"voice-pitch",
				"voice-range",
				"voice-rate",
				"voice-stress",
				"voice-volume",
				"white-space",
				"white-space-collapse",
				"widows",
				"width",
				"will-change",
				"word-break",
				"word-spacing",
				"word-wrap",
				"writing-mode",
				"x",
				"y",
				"z-index",
				"zoom"
			].sort().reverse();
			/** @type LanguageFn */
			function scss(hljs) {
				const modes = MODES(hljs);
				const PSEUDO_ELEMENTS$1 = PSEUDO_ELEMENTS;
				const PSEUDO_CLASSES$1 = PSEUDO_CLASSES;
				const AT_IDENTIFIER = "@[a-z-]+";
				const AT_MODIFIERS = "and or not only";
				const VARIABLE = {
					className: "variable",
					begin: "(\\$[a-zA-Z-][a-zA-Z0-9_-]*)\\b",
					relevance: 0
				};
				return {
					name: "SCSS",
					case_insensitive: true,
					illegal: "[=/|']",
					contains: [
						hljs.C_LINE_COMMENT_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						modes.CSS_NUMBER_MODE,
						{
							className: "selector-id",
							begin: "#[A-Za-z0-9_-]+",
							relevance: 0
						},
						{
							className: "selector-class",
							begin: "\\.[A-Za-z0-9_-]+",
							relevance: 0
						},
						modes.ATTRIBUTE_SELECTOR_MODE,
						{
							className: "selector-tag",
							begin: "\\b(" + TAGS.join("|") + ")\\b",
							relevance: 0
						},
						{
							className: "selector-pseudo",
							begin: ":(" + PSEUDO_CLASSES$1.join("|") + ")"
						},
						{
							className: "selector-pseudo",
							begin: ":(:)?(" + PSEUDO_ELEMENTS$1.join("|") + ")"
						},
						VARIABLE,
						{
							begin: /\(/,
							end: /\)/,
							contains: [modes.CSS_NUMBER_MODE]
						},
						modes.CSS_VARIABLE,
						{
							className: "attribute",
							begin: "\\b(" + ATTRIBUTES.join("|") + ")\\b"
						},
						{ begin: "\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b" },
						{
							begin: /:/,
							end: /[;}{]/,
							relevance: 0,
							contains: [
								modes.BLOCK_COMMENT,
								VARIABLE,
								modes.HEXCOLOR,
								modes.CSS_NUMBER_MODE,
								modes.UNICODE_RANGE,
								hljs.QUOTE_STRING_MODE,
								hljs.APOS_STRING_MODE,
								modes.IMPORTANT,
								modes.FUNCTION_DISPATCH
							]
						},
						{
							begin: "@(page|font-face)",
							keywords: {
								$pattern: AT_IDENTIFIER,
								keyword: "@page @font-face"
							}
						},
						{
							begin: "@",
							end: "[{;]",
							returnBegin: true,
							keywords: {
								$pattern: /[a-z-]+/,
								keyword: AT_MODIFIERS,
								attribute: MEDIA_FEATURES.join(" ")
							},
							contains: [
								{
									begin: AT_IDENTIFIER,
									className: "keyword"
								},
								{
									begin: /[a-z-]+(?=:)/,
									className: "attribute"
								},
								VARIABLE,
								hljs.QUOTE_STRING_MODE,
								hljs.APOS_STRING_MODE,
								modes.HEXCOLOR,
								modes.CSS_NUMBER_MODE
							]
						},
						modes.FUNCTION_DISPATCH
					]
				};
			}
			module.exports = scss;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/shell.js
		var require_shell = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function shell(hljs) {
				return {
					name: "Shell Session",
					aliases: ["console", "shellsession"],
					contains: [{
						className: "meta.prompt",
						begin: /^\s{0,3}[./~\w\d[\]()@-]*[>%$#][ ]?/,
						starts: {
							end: /[^\\](?=\s*$)/,
							subLanguage: "bash"
						}
					}]
				};
			}
			module.exports = shell;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/sql.js
		var require_sql = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function sql(hljs) {
				const regex = hljs.regex;
				const COMMENT_MODE = hljs.COMMENT("--", "$");
				const STRING = {
					scope: "string",
					variants: [{
						begin: /'/,
						end: /'/,
						contains: [{ match: /''/ }]
					}]
				};
				const QUOTED_IDENTIFIER = {
					begin: /"/,
					end: /"/,
					contains: [{ match: /""/ }]
				};
				const LITERALS = [
					"true",
					"false",
					"unknown"
				];
				const MULTI_WORD_TYPES = [
					"double precision",
					"large object",
					"with timezone",
					"without timezone"
				];
				const TYPES = [
					"bigint",
					"binary",
					"blob",
					"boolean",
					"char",
					"character",
					"clob",
					"date",
					"dec",
					"decfloat",
					"decimal",
					"float",
					"int",
					"integer",
					"interval",
					"nchar",
					"nclob",
					"national",
					"numeric",
					"real",
					"row",
					"smallint",
					"time",
					"timestamp",
					"varchar",
					"varying",
					"varbinary"
				];
				const NON_RESERVED_WORDS = [
					"add",
					"asc",
					"collation",
					"desc",
					"final",
					"first",
					"last",
					"view"
				];
				const RESERVED_WORDS = [
					"abs",
					"acos",
					"all",
					"allocate",
					"alter",
					"and",
					"any",
					"are",
					"array",
					"array_agg",
					"array_max_cardinality",
					"as",
					"asensitive",
					"asin",
					"asymmetric",
					"at",
					"atan",
					"atomic",
					"authorization",
					"avg",
					"begin",
					"begin_frame",
					"begin_partition",
					"between",
					"bigint",
					"binary",
					"blob",
					"boolean",
					"both",
					"by",
					"call",
					"called",
					"cardinality",
					"cascaded",
					"case",
					"cast",
					"ceil",
					"ceiling",
					"char",
					"char_length",
					"character",
					"character_length",
					"check",
					"classifier",
					"clob",
					"close",
					"coalesce",
					"collate",
					"collect",
					"column",
					"commit",
					"condition",
					"connect",
					"constraint",
					"contains",
					"convert",
					"copy",
					"corr",
					"corresponding",
					"cos",
					"cosh",
					"count",
					"covar_pop",
					"covar_samp",
					"create",
					"cross",
					"cube",
					"cume_dist",
					"current",
					"current_catalog",
					"current_date",
					"current_default_transform_group",
					"current_path",
					"current_role",
					"current_row",
					"current_schema",
					"current_time",
					"current_timestamp",
					"current_path",
					"current_role",
					"current_transform_group_for_type",
					"current_user",
					"cursor",
					"cycle",
					"date",
					"day",
					"deallocate",
					"dec",
					"decimal",
					"decfloat",
					"declare",
					"default",
					"define",
					"delete",
					"dense_rank",
					"deref",
					"describe",
					"deterministic",
					"disconnect",
					"distinct",
					"double",
					"drop",
					"dynamic",
					"each",
					"element",
					"else",
					"empty",
					"end",
					"end_frame",
					"end_partition",
					"end-exec",
					"equals",
					"escape",
					"every",
					"except",
					"exec",
					"execute",
					"exists",
					"exp",
					"external",
					"extract",
					"false",
					"fetch",
					"filter",
					"first_value",
					"float",
					"floor",
					"for",
					"foreign",
					"frame_row",
					"free",
					"from",
					"full",
					"function",
					"fusion",
					"get",
					"global",
					"grant",
					"group",
					"grouping",
					"groups",
					"having",
					"hold",
					"hour",
					"identity",
					"in",
					"indicator",
					"initial",
					"inner",
					"inout",
					"insensitive",
					"insert",
					"int",
					"integer",
					"intersect",
					"intersection",
					"interval",
					"into",
					"is",
					"join",
					"json_array",
					"json_arrayagg",
					"json_exists",
					"json_object",
					"json_objectagg",
					"json_query",
					"json_table",
					"json_table_primitive",
					"json_value",
					"lag",
					"language",
					"large",
					"last_value",
					"lateral",
					"lead",
					"leading",
					"left",
					"like",
					"like_regex",
					"listagg",
					"ln",
					"local",
					"localtime",
					"localtimestamp",
					"log",
					"log10",
					"lower",
					"match",
					"match_number",
					"match_recognize",
					"matches",
					"max",
					"member",
					"merge",
					"method",
					"min",
					"minute",
					"mod",
					"modifies",
					"module",
					"month",
					"multiset",
					"national",
					"natural",
					"nchar",
					"nclob",
					"new",
					"no",
					"none",
					"normalize",
					"not",
					"nth_value",
					"ntile",
					"null",
					"nullif",
					"numeric",
					"octet_length",
					"occurrences_regex",
					"of",
					"offset",
					"old",
					"omit",
					"on",
					"one",
					"only",
					"open",
					"or",
					"order",
					"out",
					"outer",
					"over",
					"overlaps",
					"overlay",
					"parameter",
					"partition",
					"pattern",
					"per",
					"percent",
					"percent_rank",
					"percentile_cont",
					"percentile_disc",
					"period",
					"portion",
					"position",
					"position_regex",
					"power",
					"precedes",
					"precision",
					"prepare",
					"primary",
					"procedure",
					"ptf",
					"range",
					"rank",
					"reads",
					"real",
					"recursive",
					"ref",
					"references",
					"referencing",
					"regr_avgx",
					"regr_avgy",
					"regr_count",
					"regr_intercept",
					"regr_r2",
					"regr_slope",
					"regr_sxx",
					"regr_sxy",
					"regr_syy",
					"release",
					"result",
					"return",
					"returns",
					"revoke",
					"right",
					"rollback",
					"rollup",
					"row",
					"row_number",
					"rows",
					"running",
					"savepoint",
					"scope",
					"scroll",
					"search",
					"second",
					"seek",
					"select",
					"sensitive",
					"session_user",
					"set",
					"show",
					"similar",
					"sin",
					"sinh",
					"skip",
					"smallint",
					"some",
					"specific",
					"specifictype",
					"sql",
					"sqlexception",
					"sqlstate",
					"sqlwarning",
					"sqrt",
					"start",
					"static",
					"stddev_pop",
					"stddev_samp",
					"submultiset",
					"subset",
					"substring",
					"substring_regex",
					"succeeds",
					"sum",
					"symmetric",
					"system",
					"system_time",
					"system_user",
					"table",
					"tablesample",
					"tan",
					"tanh",
					"then",
					"time",
					"timestamp",
					"timezone_hour",
					"timezone_minute",
					"to",
					"trailing",
					"translate",
					"translate_regex",
					"translation",
					"treat",
					"trigger",
					"trim",
					"trim_array",
					"true",
					"truncate",
					"uescape",
					"union",
					"unique",
					"unknown",
					"unnest",
					"update",
					"upper",
					"user",
					"using",
					"value",
					"values",
					"value_of",
					"var_pop",
					"var_samp",
					"varbinary",
					"varchar",
					"varying",
					"versioning",
					"when",
					"whenever",
					"where",
					"width_bucket",
					"window",
					"with",
					"within",
					"without",
					"year"
				];
				const RESERVED_FUNCTIONS = [
					"abs",
					"acos",
					"array_agg",
					"asin",
					"atan",
					"avg",
					"cast",
					"ceil",
					"ceiling",
					"coalesce",
					"corr",
					"cos",
					"cosh",
					"count",
					"covar_pop",
					"covar_samp",
					"cume_dist",
					"dense_rank",
					"deref",
					"element",
					"exp",
					"extract",
					"first_value",
					"floor",
					"json_array",
					"json_arrayagg",
					"json_exists",
					"json_object",
					"json_objectagg",
					"json_query",
					"json_table",
					"json_table_primitive",
					"json_value",
					"lag",
					"last_value",
					"lead",
					"listagg",
					"ln",
					"log",
					"log10",
					"lower",
					"max",
					"min",
					"mod",
					"nth_value",
					"ntile",
					"nullif",
					"percent_rank",
					"percentile_cont",
					"percentile_disc",
					"position",
					"position_regex",
					"power",
					"rank",
					"regr_avgx",
					"regr_avgy",
					"regr_count",
					"regr_intercept",
					"regr_r2",
					"regr_slope",
					"regr_sxx",
					"regr_sxy",
					"regr_syy",
					"row_number",
					"sin",
					"sinh",
					"sqrt",
					"stddev_pop",
					"stddev_samp",
					"substring",
					"substring_regex",
					"sum",
					"tan",
					"tanh",
					"translate",
					"translate_regex",
					"treat",
					"trim",
					"trim_array",
					"unnest",
					"upper",
					"value_of",
					"var_pop",
					"var_samp",
					"width_bucket"
				];
				const POSSIBLE_WITHOUT_PARENS = [
					"current_catalog",
					"current_date",
					"current_default_transform_group",
					"current_path",
					"current_role",
					"current_schema",
					"current_transform_group_for_type",
					"current_user",
					"session_user",
					"system_time",
					"system_user",
					"current_time",
					"localtime",
					"current_timestamp",
					"localtimestamp"
				];
				const COMBOS = [
					"create table",
					"insert into",
					"primary key",
					"foreign key",
					"not null",
					"alter table",
					"add constraint",
					"grouping sets",
					"on overflow",
					"character set",
					"respect nulls",
					"ignore nulls",
					"nulls first",
					"nulls last",
					"depth first",
					"breadth first"
				];
				const FUNCTIONS = RESERVED_FUNCTIONS;
				const KEYWORDS = [...RESERVED_WORDS, ...NON_RESERVED_WORDS].filter((keyword) => {
					return !RESERVED_FUNCTIONS.includes(keyword);
				});
				const VARIABLE = {
					scope: "variable",
					match: /@[a-z0-9][a-z0-9_]*/
				};
				const OPERATOR = {
					scope: "operator",
					match: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
					relevance: 0
				};
				const FUNCTION_CALL = {
					match: regex.concat(/\b/, regex.either(...FUNCTIONS), /\s*\(/),
					relevance: 0,
					keywords: { built_in: FUNCTIONS }
				};
				function kws_to_regex(list) {
					return regex.concat(/\b/, regex.either(...list.map((kw) => {
						return kw.replace(/\s+/, "\\s+");
					})), /\b/);
				}
				const MULTI_WORD_KEYWORDS = {
					scope: "keyword",
					match: kws_to_regex(COMBOS),
					relevance: 0
				};
				function reduceRelevancy(list, { exceptions, when } = {}) {
					const qualifyFn = when;
					exceptions = exceptions || [];
					return list.map((item) => {
						if (item.match(/\|\d+$/) || exceptions.includes(item)) return item;
						else if (qualifyFn(item)) return `${item}|0`;
						else return item;
					});
				}
				return {
					name: "SQL",
					case_insensitive: true,
					illegal: /[{}]|<\//,
					keywords: {
						$pattern: /\b[\w\.]+/,
						keyword: reduceRelevancy(KEYWORDS, { when: (x) => x.length < 3 }),
						literal: LITERALS,
						type: TYPES,
						built_in: POSSIBLE_WITHOUT_PARENS
					},
					contains: [
						{
							scope: "type",
							match: kws_to_regex(MULTI_WORD_TYPES)
						},
						MULTI_WORD_KEYWORDS,
						FUNCTION_CALL,
						VARIABLE,
						STRING,
						QUOTED_IDENTIFIER,
						hljs.C_NUMBER_MODE,
						hljs.C_BLOCK_COMMENT_MODE,
						COMMENT_MODE,
						OPERATOR
					]
				};
			}
			module.exports = sql;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/swift.js
		var require_swift = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/**
			* @param {string} value
			* @returns {RegExp}
			* */
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function source(re) {
				if (!re) return null;
				if (typeof re === "string") return re;
				return re.source;
			}
			/**
			* @param {RegExp | string } re
			* @returns {string}
			*/
			function lookahead(re) {
				return concat("(?=", re, ")");
			}
			/**
			* @param {...(RegExp | string) } args
			* @returns {string}
			*/
			function concat(...args) {
				return args.map((x) => source(x)).join("");
			}
			/**
			* @param { Array<string | RegExp | Object> } args
			* @returns {object}
			*/
			function stripOptionsFromArgs(args) {
				const opts = args[args.length - 1];
				if (typeof opts === "object" && opts.constructor === Object) {
					args.splice(args.length - 1, 1);
					return opts;
				} else return {};
			}
			/** @typedef { {capture?: boolean} } RegexEitherOptions */
			/**
			* Any of the passed expresssions may match
			*
			* Creates a huge this | this | that | that match
			* @param {(RegExp | string)[] | [...(RegExp | string)[], RegexEitherOptions]} args
			* @returns {string}
			*/
			function either(...args) {
				return "(" + (stripOptionsFromArgs(args).capture ? "" : "?:") + args.map((x) => source(x)).join("|") + ")";
			}
			new RegExp(either(/\[(?:[^\\\]]|\\.)*\]/, /\(\?<(?![=!])[^>]+>/, /\(\?'[^']+'/, /\(\??/, /\\([1-9][0-9]*)/, /\\./));
			const keywordWrapper = (keyword) => concat(/\b/, keyword, /\w$/.test(keyword) ? /\b/ : /\B/);
			const dotKeywords = ["Protocol", "Type"].map(keywordWrapper);
			const optionalDotKeywords = ["init", "self"].map(keywordWrapper);
			const keywordTypes = ["Any", "Self"];
			const keywords = [
				"actor",
				"any",
				"associatedtype",
				"async",
				"await",
				/as\?/,
				/as!/,
				"as",
				"borrowing",
				"break",
				"case",
				"catch",
				"class",
				"consume",
				"consuming",
				"continue",
				"convenience",
				"copy",
				"default",
				"defer",
				"deinit",
				"didSet",
				"distributed",
				"do",
				"dynamic",
				"each",
				"else",
				"enum",
				"extension",
				"fallthrough",
				/fileprivate\(set\)/,
				"fileprivate",
				"final",
				"for",
				"func",
				"get",
				"guard",
				"if",
				"import",
				"indirect",
				"infix",
				/init\?/,
				/init!/,
				"inout",
				/internal\(set\)/,
				"internal",
				"in",
				"is",
				"isolated",
				"nonisolated",
				"lazy",
				"let",
				"macro",
				"mutating",
				"nonmutating",
				/open\(set\)/,
				"open",
				"operator",
				"optional",
				"override",
				"package",
				"postfix",
				"precedencegroup",
				"prefix",
				/private\(set\)/,
				"private",
				"protocol",
				/public\(set\)/,
				"public",
				"repeat",
				"required",
				"rethrows",
				"return",
				"set",
				"some",
				"static",
				"struct",
				"subscript",
				"super",
				"switch",
				"throws",
				"throw",
				/try\?/,
				/try!/,
				"try",
				"typealias",
				/unowned\(safe\)/,
				/unowned\(unsafe\)/,
				"unowned",
				"var",
				"weak",
				"where",
				"while",
				"willSet"
			];
			const literals = [
				"false",
				"nil",
				"true"
			];
			const precedencegroupKeywords = [
				"assignment",
				"associativity",
				"higherThan",
				"left",
				"lowerThan",
				"none",
				"right"
			];
			const numberSignKeywords = [
				"#colorLiteral",
				"#column",
				"#dsohandle",
				"#else",
				"#elseif",
				"#endif",
				"#error",
				"#file",
				"#fileID",
				"#fileLiteral",
				"#filePath",
				"#function",
				"#if",
				"#imageLiteral",
				"#keyPath",
				"#line",
				"#selector",
				"#sourceLocation",
				"#warning"
			];
			const builtIns = [
				"abs",
				"all",
				"any",
				"assert",
				"assertionFailure",
				"debugPrint",
				"dump",
				"fatalError",
				"getVaList",
				"isKnownUniquelyReferenced",
				"max",
				"min",
				"numericCast",
				"pointwiseMax",
				"pointwiseMin",
				"precondition",
				"preconditionFailure",
				"print",
				"readLine",
				"repeatElement",
				"sequence",
				"stride",
				"swap",
				"swift_unboxFromSwiftValueWithType",
				"transcode",
				"type",
				"unsafeBitCast",
				"unsafeDowncast",
				"withExtendedLifetime",
				"withUnsafeMutablePointer",
				"withUnsafePointer",
				"withVaList",
				"withoutActuallyEscaping",
				"zip"
			];
			const operatorHead = either(/[/=\-+!*%<>&|^~?]/, /[\u00A1-\u00A7]/, /[\u00A9\u00AB]/, /[\u00AC\u00AE]/, /[\u00B0\u00B1]/, /[\u00B6\u00BB\u00BF\u00D7\u00F7]/, /[\u2016-\u2017]/, /[\u2020-\u2027]/, /[\u2030-\u203E]/, /[\u2041-\u2053]/, /[\u2055-\u205E]/, /[\u2190-\u23FF]/, /[\u2500-\u2775]/, /[\u2794-\u2BFF]/, /[\u2E00-\u2E7F]/, /[\u3001-\u3003]/, /[\u3008-\u3020]/, /[\u3030]/);
			const operatorCharacter = either(operatorHead, /[\u0300-\u036F]/, /[\u1DC0-\u1DFF]/, /[\u20D0-\u20FF]/, /[\uFE00-\uFE0F]/, /[\uFE20-\uFE2F]/);
			const operator = concat(operatorHead, operatorCharacter, "*");
			const identifierHead = either(/[a-zA-Z_]/, /[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/, /[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/, /[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/, /[\u1E00-\u1FFF]/, /[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/, /[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/, /[\u2C00-\u2DFF\u2E80-\u2FFF]/, /[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/, /[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/, /[\uFE47-\uFEFE\uFF00-\uFFFD]/);
			const identifierCharacter = either(identifierHead, /\d/, /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/);
			const identifier = concat(identifierHead, identifierCharacter, "*");
			const typeIdentifier = concat(/[A-Z]/, identifierCharacter, "*");
			const keywordAttributes = [
				"attached",
				"autoclosure",
				concat(/convention\(/, either("swift", "block", "c"), /\)/),
				"discardableResult",
				"dynamicCallable",
				"dynamicMemberLookup",
				"escaping",
				"freestanding",
				"frozen",
				"GKInspectable",
				"IBAction",
				"IBDesignable",
				"IBInspectable",
				"IBOutlet",
				"IBSegueAction",
				"inlinable",
				"main",
				"nonobjc",
				"NSApplicationMain",
				"NSCopying",
				"NSManaged",
				concat(/objc\(/, identifier, /\)/),
				"objc",
				"objcMembers",
				"propertyWrapper",
				"requires_stored_property_inits",
				"resultBuilder",
				"Sendable",
				"testable",
				"UIApplicationMain",
				"unchecked",
				"unknown",
				"usableFromInline",
				"warn_unqualified_access"
			];
			const availabilityKeywords = [
				"iOS",
				"iOSApplicationExtension",
				"macOS",
				"macOSApplicationExtension",
				"macCatalyst",
				"macCatalystApplicationExtension",
				"watchOS",
				"watchOSApplicationExtension",
				"tvOS",
				"tvOSApplicationExtension",
				"swift"
			];
			/** @type LanguageFn */
			function swift(hljs) {
				const WHITESPACE = {
					match: /\s+/,
					relevance: 0
				};
				const BLOCK_COMMENT = hljs.COMMENT("/\\*", "\\*/", { contains: ["self"] });
				const COMMENTS = [hljs.C_LINE_COMMENT_MODE, BLOCK_COMMENT];
				const DOT_KEYWORD = {
					match: [/\./, either(...dotKeywords, ...optionalDotKeywords)],
					className: { 2: "keyword" }
				};
				const KEYWORD_GUARD = {
					match: concat(/\./, either(...keywords)),
					relevance: 0
				};
				const PLAIN_KEYWORDS = keywords.filter((kw) => typeof kw === "string").concat(["_|0"]);
				const KEYWORD = { variants: [{
					className: "keyword",
					match: either(...keywords.filter((kw) => typeof kw !== "string").concat(keywordTypes).map(keywordWrapper), ...optionalDotKeywords)
				}] };
				const KEYWORDS = {
					$pattern: either(/\b\w+/, /#\w+/),
					keyword: PLAIN_KEYWORDS.concat(numberSignKeywords),
					literal: literals
				};
				const KEYWORD_MODES = [
					DOT_KEYWORD,
					KEYWORD_GUARD,
					KEYWORD
				];
				const BUILT_INS = [{
					match: concat(/\./, either(...builtIns)),
					relevance: 0
				}, {
					className: "built_in",
					match: concat(/\b/, either(...builtIns), /(?=\()/)
				}];
				const OPERATOR_GUARD = {
					match: /->/,
					relevance: 0
				};
				const OPERATORS = [OPERATOR_GUARD, {
					className: "operator",
					relevance: 0,
					variants: [{ match: operator }, { match: `\\.(\\.|${operatorCharacter})+` }]
				}];
				const decimalDigits = "([0-9]_*)+";
				const hexDigits = "([0-9a-fA-F]_*)+";
				const NUMBER = {
					className: "number",
					relevance: 0,
					variants: [
						{ match: `\\b(${decimalDigits})(\\.(${decimalDigits}))?([eE][+-]?(${decimalDigits}))?\\b` },
						{ match: `\\b0x(${hexDigits})(\\.(${hexDigits}))?([pP][+-]?(${decimalDigits}))?\\b` },
						{ match: /\b0o([0-7]_*)+\b/ },
						{ match: /\b0b([01]_*)+\b/ }
					]
				};
				const ESCAPED_CHARACTER = (rawDelimiter = "") => ({
					className: "subst",
					variants: [{ match: concat(/\\/, rawDelimiter, /[0\\tnr"']/) }, { match: concat(/\\/, rawDelimiter, /u\{[0-9a-fA-F]{1,8}\}/) }]
				});
				const ESCAPED_NEWLINE = (rawDelimiter = "") => ({
					className: "subst",
					match: concat(/\\/, rawDelimiter, /[\t ]*(?:[\r\n]|\r\n)/)
				});
				const INTERPOLATION = (rawDelimiter = "") => ({
					className: "subst",
					label: "interpol",
					begin: concat(/\\/, rawDelimiter, /\(/),
					end: /\)/
				});
				const MULTILINE_STRING = (rawDelimiter = "") => ({
					begin: concat(rawDelimiter, /"""/),
					end: concat(/"""/, rawDelimiter),
					contains: [
						ESCAPED_CHARACTER(rawDelimiter),
						ESCAPED_NEWLINE(rawDelimiter),
						INTERPOLATION(rawDelimiter)
					]
				});
				const SINGLE_LINE_STRING = (rawDelimiter = "") => ({
					begin: concat(rawDelimiter, /"/),
					end: concat(/"/, rawDelimiter),
					contains: [ESCAPED_CHARACTER(rawDelimiter), INTERPOLATION(rawDelimiter)]
				});
				const STRING = {
					className: "string",
					variants: [
						MULTILINE_STRING(),
						MULTILINE_STRING("#"),
						MULTILINE_STRING("##"),
						MULTILINE_STRING("###"),
						SINGLE_LINE_STRING(),
						SINGLE_LINE_STRING("#"),
						SINGLE_LINE_STRING("##"),
						SINGLE_LINE_STRING("###")
					]
				};
				const REGEXP_CONTENTS = [hljs.BACKSLASH_ESCAPE, {
					begin: /\[/,
					end: /\]/,
					relevance: 0,
					contains: [hljs.BACKSLASH_ESCAPE]
				}];
				const BARE_REGEXP_LITERAL = {
					begin: /\/[^\s](?=[^/\n]*\/)/,
					end: /\//,
					contains: REGEXP_CONTENTS
				};
				const EXTENDED_REGEXP_LITERAL = (rawDelimiter) => {
					const begin = concat(rawDelimiter, /\//);
					const end = concat(/\//, rawDelimiter);
					return {
						begin,
						end,
						contains: [...REGEXP_CONTENTS, {
							scope: "comment",
							begin: `#(?!.*${end})`,
							end: /$/
						}]
					};
				};
				const REGEXP = {
					scope: "regexp",
					variants: [
						EXTENDED_REGEXP_LITERAL("###"),
						EXTENDED_REGEXP_LITERAL("##"),
						EXTENDED_REGEXP_LITERAL("#"),
						BARE_REGEXP_LITERAL
					]
				};
				const QUOTED_IDENTIFIER = { match: concat(/`/, identifier, /`/) };
				const IDENTIFIERS = [
					QUOTED_IDENTIFIER,
					{
						className: "variable",
						match: /\$\d+/
					},
					{
						className: "variable",
						match: `\\$${identifierCharacter}+`
					}
				];
				const ATTRIBUTES = [
					{
						match: /(@|#(un)?)available/,
						scope: "keyword",
						starts: { contains: [{
							begin: /\(/,
							end: /\)/,
							keywords: availabilityKeywords,
							contains: [
								...OPERATORS,
								NUMBER,
								STRING
							]
						}] }
					},
					{
						scope: "keyword",
						match: concat(/@/, either(...keywordAttributes), lookahead(either(/\(/, /\s+/)))
					},
					{
						scope: "meta",
						match: concat(/@/, identifier)
					}
				];
				const TYPE = {
					match: lookahead(/\b[A-Z]/),
					relevance: 0,
					contains: [
						{
							className: "type",
							match: concat(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, identifierCharacter, "+")
						},
						{
							className: "type",
							match: typeIdentifier,
							relevance: 0
						},
						{
							match: /[?!]+/,
							relevance: 0
						},
						{
							match: /\.\.\./,
							relevance: 0
						},
						{
							match: concat(/\s+&\s+/, lookahead(typeIdentifier)),
							relevance: 0
						}
					]
				};
				const GENERIC_ARGUMENTS = {
					begin: /</,
					end: />/,
					keywords: KEYWORDS,
					contains: [
						...COMMENTS,
						...KEYWORD_MODES,
						...ATTRIBUTES,
						OPERATOR_GUARD,
						TYPE
					]
				};
				TYPE.contains.push(GENERIC_ARGUMENTS);
				const TUPLE = {
					begin: /\(/,
					end: /\)/,
					relevance: 0,
					keywords: KEYWORDS,
					contains: [
						"self",
						{
							match: concat(identifier, /\s*:/),
							keywords: "_|0",
							relevance: 0
						},
						...COMMENTS,
						REGEXP,
						...KEYWORD_MODES,
						...BUILT_INS,
						...OPERATORS,
						NUMBER,
						STRING,
						...IDENTIFIERS,
						...ATTRIBUTES,
						TYPE
					]
				};
				const GENERIC_PARAMETERS = {
					begin: /</,
					end: />/,
					keywords: "repeat each",
					contains: [...COMMENTS, TYPE]
				};
				const FUNCTION_PARAMETERS = {
					begin: /\(/,
					end: /\)/,
					keywords: KEYWORDS,
					contains: [
						{
							begin: either(lookahead(concat(identifier, /\s*:/)), lookahead(concat(identifier, /\s+/, identifier, /\s*:/))),
							end: /:/,
							relevance: 0,
							contains: [{
								className: "keyword",
								match: /\b_\b/
							}, {
								className: "params",
								match: identifier
							}]
						},
						...COMMENTS,
						...KEYWORD_MODES,
						...OPERATORS,
						NUMBER,
						STRING,
						...ATTRIBUTES,
						TYPE,
						TUPLE
					],
					endsParent: true,
					illegal: /["']/
				};
				const FUNCTION_OR_MACRO = {
					match: [
						/(func|macro)/,
						/\s+/,
						either(QUOTED_IDENTIFIER.match, identifier, operator)
					],
					className: {
						1: "keyword",
						3: "title.function"
					},
					contains: [
						GENERIC_PARAMETERS,
						FUNCTION_PARAMETERS,
						WHITESPACE
					],
					illegal: [/\[/, /%/]
				};
				const INIT_SUBSCRIPT = {
					match: [/\b(?:subscript|init[?!]?)/, /\s*(?=[<(])/],
					className: { 1: "keyword" },
					contains: [
						GENERIC_PARAMETERS,
						FUNCTION_PARAMETERS,
						WHITESPACE
					],
					illegal: /\[|%/
				};
				const OPERATOR_DECLARATION = {
					match: [
						/operator/,
						/\s+/,
						operator
					],
					className: {
						1: "keyword",
						3: "title"
					}
				};
				const PRECEDENCEGROUP = {
					begin: [
						/precedencegroup/,
						/\s+/,
						typeIdentifier
					],
					className: {
						1: "keyword",
						3: "title"
					},
					contains: [TYPE],
					keywords: [...precedencegroupKeywords, ...literals],
					end: /}/
				};
				const CLASS_FUNC_DECLARATION = {
					match: [
						/class\b/,
						/\s+/,
						/func\b/,
						/\s+/,
						/\b[A-Za-z_][A-Za-z0-9_]*\b/
					],
					scope: {
						1: "keyword",
						3: "keyword",
						5: "title.function"
					}
				};
				const CLASS_VAR_DECLARATION = {
					match: [
						/class\b/,
						/\s+/,
						/var\b/
					],
					scope: {
						1: "keyword",
						3: "keyword"
					}
				};
				const TYPE_DECLARATION = {
					begin: [
						/(struct|protocol|class|extension|enum|actor)/,
						/\s+/,
						identifier,
						/\s*/
					],
					beginScope: {
						1: "keyword",
						3: "title.class"
					},
					keywords: KEYWORDS,
					contains: [
						GENERIC_PARAMETERS,
						...KEYWORD_MODES,
						{
							begin: /:/,
							end: /\{/,
							keywords: KEYWORDS,
							contains: [{
								scope: "title.class.inherited",
								match: typeIdentifier
							}, ...KEYWORD_MODES],
							relevance: 0
						}
					]
				};
				for (const variant of STRING.variants) {
					const interpolation = variant.contains.find((mode) => mode.label === "interpol");
					interpolation.keywords = KEYWORDS;
					const submodes = [
						...KEYWORD_MODES,
						...BUILT_INS,
						...OPERATORS,
						NUMBER,
						STRING,
						...IDENTIFIERS
					];
					interpolation.contains = [...submodes, {
						begin: /\(/,
						end: /\)/,
						contains: ["self", ...submodes]
					}];
				}
				return {
					name: "Swift",
					keywords: KEYWORDS,
					contains: [
						...COMMENTS,
						FUNCTION_OR_MACRO,
						INIT_SUBSCRIPT,
						CLASS_FUNC_DECLARATION,
						CLASS_VAR_DECLARATION,
						TYPE_DECLARATION,
						OPERATOR_DECLARATION,
						PRECEDENCEGROUP,
						{
							beginKeywords: "import",
							end: /$/,
							contains: [...COMMENTS],
							relevance: 0
						},
						REGEXP,
						...KEYWORD_MODES,
						...BUILT_INS,
						...OPERATORS,
						NUMBER,
						STRING,
						...IDENTIFIERS,
						...ATTRIBUTES,
						TYPE,
						TUPLE
					]
				};
			}
			module.exports = swift;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/yaml.js
		var require_yaml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			function yaml(hljs) {
				const LITERALS = "true false yes no null";
				const URI_CHARACTERS = "[\\w#;/?:@&=+$,.~*'()[\\]]+";
				const KEY = {
					className: "attr",
					variants: [
						{ begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
						{ begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/ },
						{ begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/ }
					]
				};
				const TEMPLATE_VARIABLES = {
					className: "template-variable",
					variants: [{
						begin: /\{\{/,
						end: /\}\}/
					}, {
						begin: /%\{/,
						end: /\}/
					}]
				};
				const SINGLE_QUOTE_STRING = {
					className: "string",
					relevance: 0,
					begin: /'/,
					end: /'/,
					contains: [{
						match: /''/,
						scope: "char.escape",
						relevance: 0
					}]
				};
				const STRING = {
					className: "string",
					relevance: 0,
					variants: [{
						begin: /"/,
						end: /"/
					}, { begin: /\S+/ }],
					contains: [hljs.BACKSLASH_ESCAPE, TEMPLATE_VARIABLES]
				};
				const CONTAINER_STRING = hljs.inherit(STRING, { variants: [
					{
						begin: /'/,
						end: /'/,
						contains: [{
							begin: /''/,
							relevance: 0
						}]
					},
					{
						begin: /"/,
						end: /"/
					},
					{ begin: /[^\s,{}[\]]+/ }
				] });
				const TIMESTAMP = {
					className: "number",
					begin: "\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"
				};
				const VALUE_CONTAINER = {
					end: ",",
					endsWithParent: true,
					excludeEnd: true,
					keywords: LITERALS,
					relevance: 0
				};
				const OBJECT = {
					begin: /\{/,
					end: /\}/,
					contains: [VALUE_CONTAINER],
					illegal: "\\n",
					relevance: 0
				};
				const ARRAY = {
					begin: "\\[",
					end: "\\]",
					contains: [VALUE_CONTAINER],
					illegal: "\\n",
					relevance: 0
				};
				const MODES = [
					KEY,
					{
						className: "meta",
						begin: "^---\\s*$",
						relevance: 10
					},
					{
						className: "string",
						begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
					},
					{
						begin: "<%[%=-]?",
						end: "[%-]?%>",
						subLanguage: "ruby",
						excludeBegin: true,
						excludeEnd: true,
						relevance: 0
					},
					{
						className: "type",
						begin: "!\\w+!" + URI_CHARACTERS
					},
					{
						className: "type",
						begin: "!<" + URI_CHARACTERS + ">"
					},
					{
						className: "type",
						begin: "!" + URI_CHARACTERS
					},
					{
						className: "type",
						begin: "!!" + URI_CHARACTERS
					},
					{
						className: "meta",
						begin: "&" + hljs.UNDERSCORE_IDENT_RE + "$"
					},
					{
						className: "meta",
						begin: "\\*" + hljs.UNDERSCORE_IDENT_RE + "$"
					},
					{
						className: "bullet",
						begin: "-(?=[ ]|$)",
						relevance: 0
					},
					hljs.HASH_COMMENT_MODE,
					{
						beginKeywords: LITERALS,
						keywords: { literal: LITERALS }
					},
					TIMESTAMP,
					{
						className: "number",
						begin: hljs.C_NUMBER_RE + "\\b",
						relevance: 0
					},
					OBJECT,
					ARRAY,
					SINGLE_QUOTE_STRING,
					STRING
				];
				const VALUE_MODES = [...MODES];
				VALUE_MODES.pop();
				VALUE_MODES.push(CONTAINER_STRING);
				VALUE_CONTAINER.contains = VALUE_MODES;
				return {
					name: "YAML",
					case_insensitive: true,
					aliases: ["yml"],
					contains: MODES
				};
			}
			module.exports = yaml;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/typescript.js
		var require_typescript = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
			const KEYWORDS = [
				"as",
				"in",
				"of",
				"if",
				"for",
				"while",
				"finally",
				"var",
				"new",
				"function",
				"do",
				"return",
				"void",
				"else",
				"break",
				"catch",
				"instanceof",
				"with",
				"throw",
				"case",
				"default",
				"try",
				"switch",
				"continue",
				"typeof",
				"delete",
				"let",
				"yield",
				"const",
				"class",
				"debugger",
				"async",
				"await",
				"static",
				"import",
				"from",
				"export",
				"extends",
				"using"
			];
			const LITERALS = [
				"true",
				"false",
				"null",
				"undefined",
				"NaN",
				"Infinity"
			];
			const TYPES = [
				"Object",
				"Function",
				"Boolean",
				"Symbol",
				"Math",
				"Date",
				"Number",
				"BigInt",
				"String",
				"RegExp",
				"Array",
				"Float32Array",
				"Float64Array",
				"Int8Array",
				"Uint8Array",
				"Uint8ClampedArray",
				"Int16Array",
				"Int32Array",
				"Uint16Array",
				"Uint32Array",
				"BigInt64Array",
				"BigUint64Array",
				"Set",
				"Map",
				"WeakSet",
				"WeakMap",
				"ArrayBuffer",
				"SharedArrayBuffer",
				"Atomics",
				"DataView",
				"JSON",
				"Promise",
				"Generator",
				"GeneratorFunction",
				"AsyncFunction",
				"Reflect",
				"Proxy",
				"Intl",
				"WebAssembly"
			];
			const ERROR_TYPES = [
				"Error",
				"EvalError",
				"InternalError",
				"RangeError",
				"ReferenceError",
				"SyntaxError",
				"TypeError",
				"URIError"
			];
			const BUILT_IN_GLOBALS = [
				"setInterval",
				"setTimeout",
				"clearInterval",
				"clearTimeout",
				"require",
				"exports",
				"eval",
				"isFinite",
				"isNaN",
				"parseFloat",
				"parseInt",
				"decodeURI",
				"decodeURIComponent",
				"encodeURI",
				"encodeURIComponent",
				"escape",
				"unescape"
			];
			const BUILT_IN_VARIABLES = [
				"arguments",
				"this",
				"super",
				"console",
				"window",
				"document",
				"localStorage",
				"sessionStorage",
				"module",
				"self",
				"global"
			];
			const BUILT_INS = [].concat(BUILT_IN_GLOBALS, TYPES, ERROR_TYPES);
			/** @type LanguageFn */
			function javascript(hljs) {
				const regex = hljs.regex;
				/**
				* Takes a string like "<Booger" and checks to see
				* if we can find a matching "</Booger" later in the
				* content.
				* @param {RegExpMatchArray} match
				* @param {{after:number}} param1
				*/
				const hasClosingTag = (match, { after }) => {
					const tag = "</" + match[0].slice(1);
					return match.input.indexOf(tag, after) !== -1;
				};
				const IDENT_RE$1 = IDENT_RE;
				const FRAGMENT = {
					begin: "<>",
					end: "</>"
				};
				const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
				const XML_TAG = {
					begin: /<[A-Za-z0-9\\._:-]+/,
					end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
					/**
					* @param {RegExpMatchArray} match
					* @param {CallbackResponse} response
					*/
					isTrulyOpeningTag: (match, response) => {
						const afterMatchIndex = match[0].length + match.index;
						const nextChar = match.input[afterMatchIndex];
						if (nextChar === "<" || nextChar === ",") {
							response.ignoreMatch();
							return;
						}
						if (nextChar === ">") {
							if (!hasClosingTag(match, { after: afterMatchIndex })) response.ignoreMatch();
						}
						let m;
						const afterMatch = match.input.substring(afterMatchIndex);
						if (m = afterMatch.match(/^\s*=/)) {
							response.ignoreMatch();
							return;
						}
						if (m = afterMatch.match(/^\s+extends\s+/)) {
							if (m.index === 0) {
								response.ignoreMatch();
								return;
							}
						}
					}
				};
				const KEYWORDS$1 = {
					$pattern: IDENT_RE,
					keyword: KEYWORDS,
					literal: LITERALS,
					built_in: BUILT_INS,
					"variable.language": BUILT_IN_VARIABLES
				};
				const decimalDigits = "[0-9](_?[0-9])*";
				const frac = `\\.(${decimalDigits})`;
				const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
				const NUMBER = {
					className: "number",
					variants: [
						{ begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})\\b` },
						{ begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b` },
						{ begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
						{ begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
						{ begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
						{ begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
						{ begin: "\\b0[0-7]+n?\\b" }
					],
					relevance: 0
				};
				const SUBST = {
					className: "subst",
					begin: "\\$\\{",
					end: "\\}",
					keywords: KEYWORDS$1,
					contains: []
				};
				const HTML_TEMPLATE = {
					begin: ".?html`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "xml"
					}
				};
				const CSS_TEMPLATE = {
					begin: ".?css`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "css"
					}
				};
				const GRAPHQL_TEMPLATE = {
					begin: ".?gql`",
					end: "",
					starts: {
						end: "`",
						returnEnd: false,
						contains: [hljs.BACKSLASH_ESCAPE, SUBST],
						subLanguage: "graphql"
					}
				};
				const TEMPLATE_STRING = {
					className: "string",
					begin: "`",
					end: "`",
					contains: [hljs.BACKSLASH_ESCAPE, SUBST]
				};
				const COMMENT = {
					className: "comment",
					variants: [
						hljs.COMMENT(/\/\*\*(?!\/)/, "\\*/", {
							relevance: 0,
							contains: [{
								begin: "(?=@[A-Za-z]+)",
								relevance: 0,
								contains: [
									{
										className: "doctag",
										begin: "@[A-Za-z]+"
									},
									{
										className: "type",
										begin: "\\{",
										end: "\\}",
										excludeEnd: true,
										excludeBegin: true,
										relevance: 0
									},
									{
										className: "variable",
										begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
										endsParent: true,
										relevance: 0
									},
									{
										begin: /(?=[^\n])\s/,
										relevance: 0
									}
								]
							}]
						}),
						hljs.C_BLOCK_COMMENT_MODE,
						hljs.C_LINE_COMMENT_MODE
					]
				};
				const SUBST_INTERNALS = [
					hljs.APOS_STRING_MODE,
					hljs.QUOTE_STRING_MODE,
					HTML_TEMPLATE,
					CSS_TEMPLATE,
					GRAPHQL_TEMPLATE,
					TEMPLATE_STRING,
					{ match: /\$\d+/ },
					NUMBER
				];
				SUBST.contains = SUBST_INTERNALS.concat({
					begin: /\{/,
					end: /\}/,
					keywords: KEYWORDS$1,
					contains: ["self"].concat(SUBST_INTERNALS)
				});
				const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
				const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([{
					begin: /(\s*)\(/,
					end: /\)/,
					keywords: KEYWORDS$1,
					contains: ["self"].concat(SUBST_AND_COMMENTS)
				}]);
				const PARAMS = {
					className: "params",
					begin: /(\s*)\(/,
					end: /\)/,
					excludeBegin: true,
					excludeEnd: true,
					keywords: KEYWORDS$1,
					contains: PARAMS_CONTAINS
				};
				const CLASS_OR_EXTENDS = { variants: [{
					match: [
						/class/,
						/\s+/,
						IDENT_RE$1,
						/\s+/,
						/extends/,
						/\s+/,
						regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
					],
					scope: {
						1: "keyword",
						3: "title.class",
						5: "keyword",
						7: "title.class.inherited"
					}
				}, {
					match: [
						/class/,
						/\s+/,
						IDENT_RE$1
					],
					scope: {
						1: "keyword",
						3: "title.class"
					}
				}] };
				const CLASS_REFERENCE = {
					relevance: 0,
					match: regex.either(/\bJSON/, /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/, /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/, /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
					className: "title.class",
					keywords: { _: [...TYPES, ...ERROR_TYPES] }
				};
				const USE_STRICT = {
					label: "use_strict",
					className: "meta",
					relevance: 10,
					begin: /^\s*['"]use (strict|asm)['"]/
				};
				const FUNCTION_DEFINITION = {
					variants: [{ match: [
						/function/,
						/\s+/,
						IDENT_RE$1,
						/(?=\s*\()/
					] }, { match: [/function/, /\s*(?=\()/] }],
					className: {
						1: "keyword",
						3: "title.function"
					},
					label: "func.def",
					contains: [PARAMS],
					illegal: /%/
				};
				const UPPER_CASE_CONSTANT = {
					relevance: 0,
					match: /\b[A-Z][A-Z_0-9]+\b/,
					className: "variable.constant"
				};
				function noneOf(list) {
					return regex.concat("(?!", list.join("|"), ")");
				}
				const FUNCTION_CALL = {
					match: regex.concat(/\b/, noneOf([
						...BUILT_IN_GLOBALS,
						"super",
						"import",
						"await"
					].map((x) => `${x}\\s*\\(`)), IDENT_RE$1, regex.lookahead(/\s*\(/)),
					className: "title.function",
					relevance: 0
				};
				const PROPERTY_ACCESS = {
					begin: regex.concat(/\./, regex.lookahead(regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/))),
					end: IDENT_RE$1,
					excludeBegin: true,
					keywords: "prototype",
					className: "property",
					relevance: 0
				};
				const GETTER_OR_SETTER = {
					match: [
						/get|set/,
						/\s+/,
						IDENT_RE$1,
						/(?=\()/
					],
					className: {
						1: "keyword",
						3: "title.function"
					},
					contains: [{ begin: /\(\)/ }, PARAMS]
				};
				const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
				const FUNCTION_VARIABLE = {
					match: [
						/const|var|let/,
						/\s+/,
						IDENT_RE$1,
						/\s*/,
						/=\s*/,
						/(async\s*)?/,
						regex.lookahead(FUNC_LEAD_IN_RE)
					],
					keywords: "async",
					className: {
						1: "keyword",
						3: "title.function"
					},
					contains: [PARAMS]
				};
				return {
					name: "JavaScript",
					aliases: [
						"js",
						"jsx",
						"mjs",
						"cjs"
					],
					keywords: KEYWORDS$1,
					exports: {
						PARAMS_CONTAINS,
						CLASS_REFERENCE
					},
					illegal: /#(?![$_A-Za-z])/,
					contains: [
						hljs.SHEBANG({
							label: "shebang",
							binary: "node",
							relevance: 5
						}),
						USE_STRICT,
						hljs.APOS_STRING_MODE,
						hljs.QUOTE_STRING_MODE,
						HTML_TEMPLATE,
						CSS_TEMPLATE,
						GRAPHQL_TEMPLATE,
						TEMPLATE_STRING,
						COMMENT,
						{ match: /\$\d+/ },
						NUMBER,
						CLASS_REFERENCE,
						{
							scope: "attr",
							match: IDENT_RE$1 + regex.lookahead(":"),
							relevance: 0
						},
						FUNCTION_VARIABLE,
						{
							begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
							keywords: "return throw case",
							relevance: 0,
							contains: [
								COMMENT,
								hljs.REGEXP_MODE,
								{
									className: "function",
									begin: FUNC_LEAD_IN_RE,
									returnBegin: true,
									end: "\\s*=>",
									contains: [{
										className: "params",
										variants: [
											{
												begin: hljs.UNDERSCORE_IDENT_RE,
												relevance: 0
											},
											{
												className: null,
												begin: /\(\s*\)/,
												skip: true
											},
											{
												begin: /(\s*)\(/,
												end: /\)/,
												excludeBegin: true,
												excludeEnd: true,
												keywords: KEYWORDS$1,
												contains: PARAMS_CONTAINS
											}
										]
									}]
								},
								{
									begin: /,/,
									relevance: 0
								},
								{
									match: /\s+/,
									relevance: 0
								},
								{
									variants: [
										{
											begin: FRAGMENT.begin,
											end: FRAGMENT.end
										},
										{ match: XML_SELF_CLOSING },
										{
											begin: XML_TAG.begin,
											"on:begin": XML_TAG.isTrulyOpeningTag,
											end: XML_TAG.end
										}
									],
									subLanguage: "xml",
									contains: [{
										begin: XML_TAG.begin,
										end: XML_TAG.end,
										skip: true,
										contains: ["self"]
									}]
								}
							]
						},
						FUNCTION_DEFINITION,
						{ beginKeywords: "while if switch catch for" },
						{
							begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
							returnBegin: true,
							label: "func.def",
							contains: [PARAMS, hljs.inherit(hljs.TITLE_MODE, {
								begin: IDENT_RE$1,
								className: "title.function"
							})]
						},
						{
							match: /\.\.\./,
							relevance: 0
						},
						PROPERTY_ACCESS,
						{
							match: "\\$" + IDENT_RE$1,
							relevance: 0
						},
						{
							match: [/\bconstructor(?=\s*\()/],
							className: { 1: "title.function" },
							contains: [PARAMS]
						},
						FUNCTION_CALL,
						UPPER_CASE_CONSTANT,
						CLASS_OR_EXTENDS,
						GETTER_OR_SETTER,
						{ match: /\$[(.]/ }
					]
				};
			}
			/** @type LanguageFn */
			function typescript(hljs) {
				const regex = hljs.regex;
				const tsLanguage = javascript(hljs);
				const IDENT_RE$1 = IDENT_RE;
				const TYPES = [
					"any",
					"void",
					"number",
					"boolean",
					"string",
					"object",
					"never",
					"symbol",
					"bigint",
					"unknown"
				];
				const NAMESPACE = {
					begin: [
						/namespace/,
						/\s+/,
						hljs.IDENT_RE
					],
					beginScope: {
						1: "keyword",
						3: "title.class"
					}
				};
				const INTERFACE = {
					beginKeywords: "interface",
					end: /\{/,
					excludeEnd: true,
					keywords: {
						keyword: "interface extends",
						built_in: TYPES
					},
					contains: [tsLanguage.exports.CLASS_REFERENCE]
				};
				const USE_STRICT = {
					className: "meta",
					relevance: 10,
					begin: /^\s*['"]use strict['"]/
				};
				const KEYWORDS$1 = {
					$pattern: IDENT_RE,
					keyword: KEYWORDS.concat([
						"type",
						"interface",
						"public",
						"private",
						"protected",
						"implements",
						"declare",
						"abstract",
						"readonly",
						"enum",
						"override",
						"satisfies"
					]),
					literal: LITERALS,
					built_in: BUILT_INS.concat(TYPES),
					"variable.language": BUILT_IN_VARIABLES
				};
				const DECORATOR = {
					className: "meta",
					begin: "@" + IDENT_RE$1
				};
				const swapMode = (mode, label, replacement) => {
					const indx = mode.contains.findIndex((m) => m.label === label);
					if (indx === -1) throw new Error("can not find mode to replace");
					mode.contains.splice(indx, 1, replacement);
				};
				Object.assign(tsLanguage.keywords, KEYWORDS$1);
				tsLanguage.exports.PARAMS_CONTAINS.push(DECORATOR);
				const ATTRIBUTE_HIGHLIGHT = tsLanguage.contains.find((c) => c.scope === "attr");
				const OPTIONAL_KEY_OR_ARGUMENT = Object.assign({}, ATTRIBUTE_HIGHLIGHT, { match: regex.concat(IDENT_RE$1, regex.lookahead(/\s*\?:/)) });
				tsLanguage.exports.PARAMS_CONTAINS.push([
					tsLanguage.exports.CLASS_REFERENCE,
					ATTRIBUTE_HIGHLIGHT,
					OPTIONAL_KEY_OR_ARGUMENT
				]);
				tsLanguage.contains = tsLanguage.contains.concat([
					DECORATOR,
					NAMESPACE,
					INTERFACE,
					OPTIONAL_KEY_OR_ARGUMENT
				]);
				swapMode(tsLanguage, "shebang", hljs.SHEBANG());
				swapMode(tsLanguage, "use_strict", USE_STRICT);
				const functionDeclaration = tsLanguage.contains.find((m) => m.label === "func.def");
				functionDeclaration.relevance = 0;
				Object.assign(tsLanguage, {
					name: "TypeScript",
					aliases: [
						"ts",
						"tsx",
						"mts",
						"cts"
					]
				});
				return tsLanguage;
			}
			module.exports = typescript;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/vbnet.js
		var require_vbnet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function vbnet(hljs) {
				const regex = hljs.regex;
				/**
				* Character Literal
				* Either a single character ("a"C) or an escaped double quote (""""C).
				*/
				const CHARACTER = {
					className: "string",
					begin: /"(""|[^/n])"C\b/
				};
				const STRING = {
					className: "string",
					begin: /"/,
					end: /"/,
					illegal: /\n/,
					contains: [{ begin: /""/ }]
				};
				/** Date Literals consist of a date, a time, or both separated by whitespace, surrounded by # */
				const MM_DD_YYYY = /\d{1,2}\/\d{1,2}\/\d{4}/;
				const YYYY_MM_DD = /\d{4}-\d{1,2}-\d{1,2}/;
				const TIME_12H = /(\d|1[012])(:\d+){0,2} *(AM|PM)/;
				const TIME_24H = /\d{1,2}(:\d{1,2}){1,2}/;
				const DATE = {
					className: "literal",
					variants: [
						{ begin: regex.concat(/# */, regex.either(YYYY_MM_DD, MM_DD_YYYY), / *#/) },
						{ begin: regex.concat(/# */, TIME_24H, / *#/) },
						{ begin: regex.concat(/# */, TIME_12H, / *#/) },
						{ begin: regex.concat(/# */, regex.either(YYYY_MM_DD, MM_DD_YYYY), / +/, regex.either(TIME_12H, TIME_24H), / *#/) }
					]
				};
				const NUMBER = {
					className: "number",
					relevance: 0,
					variants: [
						{ begin: /\b\d[\d_]*((\.[\d_]+(E[+-]?[\d_]+)?)|(E[+-]?[\d_]+))[RFD@!#]?/ },
						{ begin: /\b\d[\d_]*((U?[SIL])|[%&])?/ },
						{ begin: /&H[\dA-F_]+((U?[SIL])|[%&])?/ },
						{ begin: /&O[0-7_]+((U?[SIL])|[%&])?/ },
						{ begin: /&B[01_]+((U?[SIL])|[%&])?/ }
					]
				};
				const LABEL = {
					className: "label",
					begin: /^\w+:/
				};
				const DOC_COMMENT = hljs.COMMENT(/'''/, /$/, { contains: [{
					className: "doctag",
					begin: /<\/?/,
					end: />/
				}] });
				const COMMENT = hljs.COMMENT(null, /$/, { variants: [{ begin: /'/ }, { begin: /([\t ]|^)REM(?=\s)/ }] });
				return {
					name: "Visual Basic .NET",
					aliases: ["vb"],
					case_insensitive: true,
					classNameAliases: { label: "symbol" },
					keywords: {
						keyword: "addhandler alias aggregate ansi as async assembly auto binary by byref byval call case catch class compare const continue custom declare default delegate dim distinct do each equals else elseif end enum erase error event exit explicit finally for friend from function get global goto group handles if implements imports in inherits interface into iterator join key let lib loop me mid module mustinherit mustoverride mybase myclass namespace narrowing new next notinheritable notoverridable of off on operator option optional order overloads overridable overrides paramarray partial preserve private property protected public raiseevent readonly redim removehandler resume return select set shadows shared skip static step stop structure strict sub synclock take text then throw to try unicode until using when where while widening with withevents writeonly yield",
						built_in: "addressof and andalso await directcast gettype getxmlnamespace is isfalse isnot istrue like mod nameof new not or orelse trycast typeof xor cbool cbyte cchar cdate cdbl cdec cint clng cobj csbyte cshort csng cstr cuint culng cushort",
						type: "boolean byte char date decimal double integer long object sbyte short single string uinteger ulong ushort",
						literal: "true false nothing"
					},
					illegal: "//|\\{|\\}|endif|gosub|variant|wend|^\\$ ",
					contains: [
						CHARACTER,
						STRING,
						DATE,
						NUMBER,
						LABEL,
						DOC_COMMENT,
						COMMENT,
						{
							className: "meta",
							begin: /[\t ]*#(const|disable|else|elseif|enable|end|externalsource|if|region)\b/,
							end: /$/,
							keywords: { keyword: "const disable else elseif enable end externalsource if region then" },
							contains: [COMMENT]
						}
					]
				};
			}
			module.exports = vbnet;
		}));
		//#endregion
		//#region node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/lib/languages/wasm.js
		var require_wasm = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** @type LanguageFn */
			function wasm(hljs) {
				hljs.regex;
				const BLOCK_COMMENT = hljs.COMMENT(/\(;/, /;\)/);
				BLOCK_COMMENT.contains.push("self");
				return {
					name: "WebAssembly",
					keywords: {
						$pattern: /[\w.]+/,
						keyword: [
							"anyfunc",
							"block",
							"br",
							"br_if",
							"br_table",
							"call",
							"call_indirect",
							"data",
							"drop",
							"elem",
							"else",
							"end",
							"export",
							"func",
							"global.get",
							"global.set",
							"local.get",
							"local.set",
							"local.tee",
							"get_global",
							"get_local",
							"global",
							"if",
							"import",
							"local",
							"loop",
							"memory",
							"memory.grow",
							"memory.size",
							"module",
							"mut",
							"nop",
							"offset",
							"param",
							"result",
							"return",
							"select",
							"set_global",
							"set_local",
							"start",
							"table",
							"tee_local",
							"then",
							"type",
							"unreachable"
						]
					},
					contains: [
						hljs.COMMENT(/;;/, /$/),
						BLOCK_COMMENT,
						{
							match: [
								/(?:offset|align)/,
								/\s*/,
								/=/
							],
							className: {
								1: "keyword",
								3: "operator"
							}
						},
						{
							className: "variable",
							begin: /\$[\w_]+/
						},
						{
							match: /(\((?!;)|\))+/,
							className: "punctuation",
							relevance: 0
						},
						{
							begin: [
								/(?:func|call|call_indirect)/,
								/\s+/,
								/\$[^\s)]+/
							],
							className: {
								1: "keyword",
								3: "title.function"
							}
						},
						hljs.QUOTE_STRING_MODE,
						{
							match: /(i32|i64|f32|f64)(?!\.)/,
							className: "type"
						},
						{
							className: "keyword",
							match: /\b(f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))\b/
						},
						{
							className: "number",
							relevance: 0,
							match: /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/
						}
					]
				};
			}
			module.exports = wasm;
		}));
		var common_default = (/* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
			var hljs = require_core();
			hljs.registerLanguage("xml", require_xml());
			hljs.registerLanguage("bash", require_bash());
			hljs.registerLanguage("c", require_c());
			hljs.registerLanguage("cpp", require_cpp());
			hljs.registerLanguage("csharp", require_csharp());
			hljs.registerLanguage("css", require_css());
			hljs.registerLanguage("markdown", require_markdown());
			hljs.registerLanguage("diff", require_diff());
			hljs.registerLanguage("ruby", require_ruby());
			hljs.registerLanguage("go", require_go());
			hljs.registerLanguage("graphql", require_graphql());
			hljs.registerLanguage("ini", require_ini());
			hljs.registerLanguage("java", require_java());
			hljs.registerLanguage("javascript", require_javascript());
			hljs.registerLanguage("json", require_json());
			hljs.registerLanguage("kotlin", require_kotlin());
			hljs.registerLanguage("less", require_less());
			hljs.registerLanguage("lua", require_lua());
			hljs.registerLanguage("makefile", require_makefile());
			hljs.registerLanguage("perl", require_perl());
			hljs.registerLanguage("objectivec", require_objectivec());
			hljs.registerLanguage("php", require_php());
			hljs.registerLanguage("php-template", require_php_template());
			hljs.registerLanguage("plaintext", require_plaintext());
			hljs.registerLanguage("python", require_python());
			hljs.registerLanguage("python-repl", require_python_repl());
			hljs.registerLanguage("r", require_r());
			hljs.registerLanguage("rust", require_rust());
			hljs.registerLanguage("scss", require_scss());
			hljs.registerLanguage("shell", require_shell());
			hljs.registerLanguage("sql", require_sql());
			hljs.registerLanguage("swift", require_swift());
			hljs.registerLanguage("yaml", require_yaml());
			hljs.registerLanguage("typescript", require_typescript());
			hljs.registerLanguage("vbnet", require_vbnet());
			hljs.registerLanguage("wasm", require_wasm());
			hljs.HighlightJS = hljs;
			hljs.default = hljs;
			module.exports = hljs;
		})))())).default;
		//#endregion
		//#region src/client/code-highlight.ts
		/**
		* Syntax highlighting for the remote-file viewer. The sidebar's own editor is
		* CodeMirror with a one-dark / one-light palette; this module reproduces the
		* same visual result from `highlight.js` (bundled, no runtime service), and the
		* stylesheet colors its token classes with those palette values so the two
		* surfaces read the same.
		* @module dsh-remote-development/client/code-highlight
		*/
		/** Extension → highlight.js language id (only ids `common` actually ships). */
		const LANGUAGE_BY_EXTENSION = {
			bash: "bash",
			c: "c",
			cc: "cpp",
			cfg: "ini",
			clj: "clojure",
			cjs: "javascript",
			conf: "ini",
			cpp: "cpp",
			cs: "csharp",
			css: "css",
			cxx: "cpp",
			dart: "dart",
			diff: "diff",
			env: "bash",
			erl: "erlang",
			ex: "elixir",
			go: "go",
			gql: "graphql",
			graphql: "graphql",
			h: "cpp",
			hpp: "cpp",
			hs: "haskell",
			htm: "xml",
			html: "xml",
			ini: "ini",
			java: "java",
			js: "javascript",
			json: "json",
			jsonc: "json",
			jsx: "javascript",
			kt: "kotlin",
			less: "less",
			lua: "lua",
			m: "objectivec",
			md: "markdown",
			mjs: "javascript",
			pl: "perl",
			php: "php",
			properties: "ini",
			ps1: "powershell",
			py: "python",
			rb: "ruby",
			rs: "rust",
			r: "r",
			scss: "scss",
			sh: "bash",
			sql: "sql",
			svelte: "xml",
			swift: "swift",
			tex: "latex",
			toml: "ini",
			ts: "typescript",
			tsx: "typescript",
			txt: "plaintext",
			vue: "xml",
			yaml: "yaml",
			yml: "yaml",
			zsh: "bash"
		};
		/** Whole-filename → language id, for files with no extension. */
		const LANGUAGE_BY_NAME = {
			dockerfile: "bash",
			makefile: "makefile",
			".gitignore": "bash",
			".npmrc": "ini",
			".editorconfig": "ini"
		};
		/** HTML-escape text that gets no highlighting. */
		function escapeHtml$1(text) {
			return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
		/**
		* The highlight.js language for one file name.
		* @param name - the file's basename.
		* @returns a language id, or undefined for plain text.
		*/
		function languageFor(name) {
			const lower = name.toLowerCase();
			const byName = LANGUAGE_BY_NAME[lower];
			if (byName !== void 0) return byName;
			const dot = lower.lastIndexOf(".");
			if (dot < 0) return void 0;
			return LANGUAGE_BY_EXTENSION[lower.slice(dot + 1)];
		}
		/**
		* Highlight one file's source.
		* @param code - the file's text.
		* @param name - the file's basename (decides the language).
		* @returns HTML with `hljs-*` token spans, safe to inject.
		*/
		function highlightCode(code, name) {
			const language = languageFor(name);
			if (language !== void 0 && language !== "plaintext" && common_default.getLanguage(language) !== void 0) try {
				return common_default.highlight(code, {
					language,
					ignoreIllegals: true
				}).value;
			} catch {}
			return escapeHtml$1(code);
		}
		/**
		* The gutter's line numbers, as one string with a newline per line — the
		* gutter and the code share a line grid, so they stay aligned by construction.
		* @param code - the file's text.
		* @returns the numbered text.
		*/
		function lineNumbers(code) {
			const count = Math.max(1, code.length === 0 ? 1 : code.split("\n").length - (code.endsWith("\n") ? 1 : 0));
			let out = "";
			for (let i = 1; i <= count; i += 1) out += (i === 1 ? "" : "\n") + i;
			return out;
		}
		//#endregion
		//#region node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/decode.mjs
		const decodeCache = {};
		function getDecodeCache(exclude) {
			let cache = decodeCache[exclude];
			if (cache) return cache;
			cache = decodeCache[exclude] = [];
			for (let i = 0; i < 128; i++) {
				const ch = String.fromCharCode(i);
				cache.push(ch);
			}
			for (let i = 0; i < exclude.length; i++) {
				const ch = exclude.charCodeAt(i);
				cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
			}
			return cache;
		}
		function decode(string, exclude) {
			if (typeof exclude !== "string") exclude = decode.defaultChars;
			const cache = getDecodeCache(exclude);
			return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
				let result = "";
				for (let i = 0, l = seq.length; i < l; i += 3) {
					const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
					if (b1 < 128) {
						result += cache[b1];
						continue;
					}
					if ((b1 & 224) === 192 && i + 3 < l) {
						const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
						if ((b2 & 192) === 128) {
							const chr = b1 << 6 & 1984 | b2 & 63;
							if (chr < 128) result += "��";
							else result += String.fromCharCode(chr);
							i += 3;
							continue;
						}
					}
					if ((b1 & 240) === 224 && i + 6 < l) {
						const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
						const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
						if ((b2 & 192) === 128 && (b3 & 192) === 128) {
							const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
							if (chr < 2048 || chr >= 55296 && chr <= 57343) result += "���";
							else result += String.fromCharCode(chr);
							i += 6;
							continue;
						}
					}
					if ((b1 & 248) === 240 && i + 9 < l) {
						const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
						const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
						const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
						if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
							let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
							if (chr < 65536 || chr > 1114111) result += "����";
							else {
								chr -= 65536;
								result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
							}
							i += 9;
							continue;
						}
					}
					result += "�";
				}
				return result;
			});
		}
		decode.defaultChars = ";/?:@&=+$,#";
		decode.componentChars = "";
		//#endregion
		//#region node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/encode.mjs
		const encodeCache = {};
		function getEncodeCache(exclude) {
			let cache = encodeCache[exclude];
			if (cache) return cache;
			cache = encodeCache[exclude] = [];
			for (let i = 0; i < 128; i++) {
				const ch = String.fromCharCode(i);
				if (/^[0-9a-z]$/i.test(ch)) cache.push(ch);
				else cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
			}
			for (let i = 0; i < exclude.length; i++) cache[exclude.charCodeAt(i)] = exclude[i];
			return cache;
		}
		function encode(string, exclude, keepEscaped) {
			if (typeof exclude !== "string") {
				keepEscaped = exclude;
				exclude = encode.defaultChars;
			}
			if (typeof keepEscaped === "undefined") keepEscaped = true;
			const cache = getEncodeCache(exclude);
			let result = "";
			for (let i = 0, l = string.length; i < l; i++) {
				const code = string.charCodeAt(i);
				if (keepEscaped && code === 37 && i + 2 < l) {
					if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
						result += string.slice(i, i + 3);
						i += 2;
						continue;
					}
				}
				if (code < 128) {
					result += cache[code];
					continue;
				}
				if (code >= 55296 && code <= 57343) {
					if (code >= 55296 && code <= 56319 && i + 1 < l) {
						const nextCode = string.charCodeAt(i + 1);
						if (nextCode >= 56320 && nextCode <= 57343) {
							result += encodeURIComponent(string[i] + string[i + 1]);
							i++;
							continue;
						}
					}
					result += "%EF%BF%BD";
					continue;
				}
				result += encodeURIComponent(string[i]);
			}
			return result;
		}
		encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
		encode.componentChars = "-_.!~*'()";
		//#endregion
		//#region node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/format.mjs
		function format(url) {
			let result = "";
			result += url.protocol || "";
			result += url.slashes ? "//" : "";
			result += url.auth ? url.auth + "@" : "";
			if (url.hostname && url.hostname.indexOf(":") !== -1) result += "[" + url.hostname + "]";
			else result += url.hostname || "";
			result += url.port ? ":" + url.port : "";
			result += url.pathname || "";
			result += url.search || "";
			result += url.hash || "";
			return result;
		}
		//#endregion
		//#region node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/parse.mjs
		function Url() {
			this.protocol = null;
			this.slashes = null;
			this.auth = null;
			this.port = null;
			this.hostname = null;
			this.hash = null;
			this.search = null;
			this.pathname = null;
		}
		const protocolPattern = /^([a-z0-9.+-]+:)/i;
		const portPattern = /:[0-9]*$/;
		const simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
		const unwise = [
			"{",
			"}",
			"|",
			"\\",
			"^",
			"`"
		].concat([
			"<",
			">",
			"\"",
			"`",
			" ",
			"\r",
			"\n",
			"	"
		]);
		const autoEscape = ["'"].concat(unwise);
		const nonHostChars = [
			"%",
			"/",
			"?",
			";",
			"#"
		].concat(autoEscape);
		const hostEndingChars = [
			"/",
			"?",
			"#"
		];
		const hostnameMaxLen = 255;
		const hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
		const hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
		const hostlessProtocol = {
			javascript: true,
			"javascript:": true
		};
		const slashedProtocol = {
			http: true,
			https: true,
			ftp: true,
			gopher: true,
			file: true,
			"http:": true,
			"https:": true,
			"ftp:": true,
			"gopher:": true,
			"file:": true
		};
		function urlParse(url, slashesDenoteHost) {
			if (url && url instanceof Url) return url;
			const u = new Url();
			u.parse(url, slashesDenoteHost);
			return u;
		}
		Url.prototype.parse = function(url, slashesDenoteHost) {
			let lowerProto, hec, slashes;
			let rest = url;
			rest = rest.trim();
			if (!slashesDenoteHost && url.split("#").length === 1) {
				const simplePath = simplePathPattern.exec(rest);
				if (simplePath) {
					this.pathname = simplePath[1];
					if (simplePath[2]) this.search = simplePath[2];
					return this;
				}
			}
			let proto = protocolPattern.exec(rest);
			if (proto) {
				proto = proto[0];
				lowerProto = proto.toLowerCase();
				this.protocol = proto;
				rest = rest.substr(proto.length);
			}
			if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
				slashes = rest.substr(0, 2) === "//";
				if (slashes && !(proto && hostlessProtocol[proto])) {
					rest = rest.substr(2);
					this.slashes = true;
				}
			}
			if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
				let hostEnd = -1;
				for (let i = 0; i < hostEndingChars.length; i++) {
					hec = rest.indexOf(hostEndingChars[i]);
					if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
				}
				let auth, atSign;
				if (hostEnd === -1) atSign = rest.lastIndexOf("@");
				else atSign = rest.lastIndexOf("@", hostEnd);
				if (atSign !== -1) {
					auth = rest.slice(0, atSign);
					rest = rest.slice(atSign + 1);
					this.auth = auth;
				}
				hostEnd = -1;
				for (let i = 0; i < nonHostChars.length; i++) {
					hec = rest.indexOf(nonHostChars[i]);
					if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
				}
				if (hostEnd === -1) hostEnd = rest.length;
				if (rest[hostEnd - 1] === ":") hostEnd--;
				const host = rest.slice(0, hostEnd);
				rest = rest.slice(hostEnd);
				this.parseHost(host);
				this.hostname = this.hostname || "";
				const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
				if (!ipv6Hostname) {
					const hostparts = this.hostname.split(/\./);
					for (let i = 0, l = hostparts.length; i < l; i++) {
						const part = hostparts[i];
						if (!part) continue;
						if (!part.match(hostnamePartPattern)) {
							let newpart = "";
							for (let j = 0, k = part.length; j < k; j++) if (part.charCodeAt(j) > 127) newpart += "x";
							else newpart += part[j];
							if (!newpart.match(hostnamePartPattern)) {
								const validParts = hostparts.slice(0, i);
								const notHost = hostparts.slice(i + 1);
								const bit = part.match(hostnamePartStart);
								if (bit) {
									validParts.push(bit[1]);
									notHost.unshift(bit[2]);
								}
								if (notHost.length) rest = notHost.join(".") + rest;
								this.hostname = validParts.join(".");
								break;
							}
						}
					}
				}
				if (this.hostname.length > hostnameMaxLen) this.hostname = "";
				if (ipv6Hostname) this.hostname = this.hostname.substr(1, this.hostname.length - 2);
			}
			const hash = rest.indexOf("#");
			if (hash !== -1) {
				this.hash = rest.substr(hash);
				rest = rest.slice(0, hash);
			}
			const qm = rest.indexOf("?");
			if (qm !== -1) {
				this.search = rest.substr(qm);
				rest = rest.slice(0, qm);
			}
			if (rest) this.pathname = rest;
			if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) this.pathname = "";
			return this;
		};
		Url.prototype.parseHost = function(host) {
			let port = portPattern.exec(host);
			if (port) {
				port = port[0];
				if (port !== ":") this.port = port.substr(1);
				host = host.substr(0, host.length - port.length);
			}
			if (host) this.hostname = host;
		};
		//#endregion
		//#region node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/index.mjs
		var mdurl_exports = /* @__PURE__ */ __exportAll$1({
			decode: () => decode,
			encode: () => encode,
			format: () => format,
			parse: () => urlParse
		});
		//#endregion
		//#region node_modules/.pnpm/uc.micro@3.0.0/node_modules/uc.micro/build/index.mjs
		var build_exports = /* @__PURE__ */ __exportAll$1({
			Any: () => Any,
			Cc: () => Cc,
			Cf: () => Cf,
			P: () => P,
			S: () => S,
			Z: () => Z
		});
		const Any = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
		const Cc = /[\0-\x1F\x7F-\x9F]/;
		const Cf = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
		const P = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/;
		const S = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/;
		const Z = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
		//#endregion
		//#region node_modules/.pnpm/entities@8.1.0/node_modules/entities/dist/decode-codepoint.js
		/**
		* C1 Unicode control character reference replacements (code points 128–159).
		* Index i gives the replacement for code point 128+i; 0 means "no replacement".
		*/
		const c1 = [
			8364,
			0,
			8218,
			402,
			8222,
			8230,
			8224,
			8225,
			710,
			8240,
			352,
			8249,
			338,
			0,
			381,
			0,
			0,
			8216,
			8217,
			8220,
			8221,
			8226,
			8211,
			8212,
			732,
			8482,
			353,
			8250,
			339,
			0,
			382,
			376
		];
		/**
		* True for NUL, UTF-16 surrogates, and values past U+10FFFF.
		* @param codePoint Unicode code point to check.
		*/
		function isInvalidCodePoint(codePoint) {
			return codePoint === 0 || codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111;
		}
		/**
		* Replace the given code point with U+FFFD if it is NUL (0), a surrogate, or
		* outside the valid Unicode range. Code points in the C1 controls range
		* (128–159) are remapped to their Windows-1252 equivalents, following the
		* HTML spec. All other code points are returned unchanged.
		* @param codePoint Unicode code point to convert.
		*/
		function replaceCodePoint(codePoint) {
			if (isInvalidCodePoint(codePoint)) return 65533;
			if (codePoint >= 128 && codePoint <= 159) return c1[codePoint - 128] || codePoint;
			return codePoint;
		}
		/**
		* Convert the code point of a decoded numeric entity to a string, replacing
		* invalid values.
		*
		* Fast path for plain BMP code points: [1..0x7F] and [0xA0..0xD7FF] pass
		* `replaceCodePoint` unchanged (no NUL, C1 remap, surrogate, or out-of-range
		* handling) and fit a single charCode. 0xd760 = 0xD800 (the first surrogate)
		* - 0xA0.
		* @param codePoint Unicode code point to convert.
		*/
		function codePointToString(codePoint) {
			return codePoint - 1 >>> 0 < 127 || codePoint - 160 >>> 0 < 55136 ? String.fromCharCode(codePoint) : String.fromCodePoint(replaceCodePoint(codePoint));
		}
		//#endregion
		//#region node_modules/.pnpm/entities@8.1.0/node_modules/entities/dist/internal/decode-shared.js
		const BASE91_INVERSE = /* #__PURE__ */ (() => {
			const table = /* @__PURE__ */ new Uint8Array(127);
			let code = 0;
			for (let char = 33; char <= 126; char++) if (char !== 34 && char !== 36 && char !== 92) table[char] = code++;
			return table;
		})();
		/**
		* Decode a dictionary-encoded trie string back into its Uint16Array.
		*
		* Stream layout (consumed in this order):
		*   1. dict1 atoms — `dict1AtomCount` uint16 values, delta+RLE encoded.
		*   2. dict2 atoms — `atomCount - dict1AtomCount` values, delta+RLE.
		*   3. dict2 ngrams — `ngramCount - (dictSize - dict1AtomCount)` entries,
		*      each a pair of slot codes that resolve to earlier slots.
		*   4. dict1 ngrams — `dictSize - dict1AtomCount` entries, same shape.
		*   5. data — slot codes, each expanding to one or more uint16 values.
		*
		* Codes use a 91-char base (printable ASCII minus `"`, `$`, `\`):
		*   - char1 < dictSize  → 1-char code, slot = char1
		*   - char1 ≥ dictSize  → 2-char code, slot = dictSize + (char1 - dictSize)*91 + char2
		*
		* Slot index → token kind:
		*   [0, A)                  dict1 atoms     (1-char codes)
		*   [A, dictSize)           dict1 ngrams    (1-char codes)
		*   [dictSize, dictSize+D)  dict2 atoms     (2-char codes)
		*   [dictSize+D, end)       dict2 ngrams    (2-char codes)
		*
		* Both atom dicts decode before any ngram, and dict2 ngrams decode before
		* dict1 ngrams. So every ngram entry references slots whose contents are
		* already filled — no forward references to handle.
		*
		* This runs on library import. Flat typed arrays store each slot as either
		* a plain value (`single`, covering every atom) or a range in a shared
		* `pool` (ngrams).
		* @param input Packed trie string.
		* @param resultLength Expected number of uint16 values in the output.
		* @param atomCount Total number of distinct uint16 values in the trie.
		* @param dict1AtomCount Atoms in the 1-char range (`A` above).
		* @param ngramCount Total number of ngram entries (dict1 + dict2).
		* @param dictSize Number of 1-char code slots; the rest of `BASE - dictSize`
		*   first-byte values are 2-char codes.
		*/
		function decodeTrieDict(input, resultLength, atomCount, dict1AtomCount, ngramCount, dictSize) {
			const base = 91;
			const inputLength = input.length;
			const twoCharBias = dictSize * 90;
			let pos = 0;
			/** Read one slot code at `pos` and return its slot index, advancing pos. */
			const readSlotCode = () => {
				const c1 = BASE91_INVERSE[input.charCodeAt(pos++)];
				return c1 < dictSize ? c1 : c1 * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
			};
			const dict2AtomCount = atomCount - dict1AtomCount;
			const slotCount = atomCount + ngramCount;
			const single = new Int32Array(slotCount);
			single.fill(-1, dict1AtomCount, dictSize);
			single.fill(-1, dictSize + dict2AtomCount, slotCount);
			const start = new Int32Array(slotCount);
			const length = new Int32Array(slotCount);
			/**
			* Decode `count` ascending uint16 values from a delta+RLE stream into
			* `single[off..off+count)`.
			*
			*   code < 89   → delta = code
			*   code == 89  → run-length: next char encodes runLength-2; emit `runLength` consecutive +1 values
			*   code == 90, next < 90  → escape: delta = 89 + next * BASE + after-next
			*   code == 90, next == 90 → double-escape: extra char for very large deltas
			* @param count
			* @param off
			*/
			function decodeDelta(count, off) {
				let previous = 0;
				let slot = off;
				const end = off + count;
				while (slot < end) {
					const code = BASE91_INVERSE[input.charCodeAt(pos++)];
					if (code < 89) {
						previous += code;
						single[slot++] = previous;
					} else if (code === 89) {
						let runLength = BASE91_INVERSE[input.charCodeAt(pos++)] + 2;
						while (runLength--) single[slot++] = ++previous;
					} else {
						const next = BASE91_INVERSE[input.charCodeAt(pos++)];
						previous += 89 + (next < 90 ? next * base + BASE91_INVERSE[input.charCodeAt(pos++)] : BASE91_INVERSE[input.charCodeAt(pos++)] * 8281 + BASE91_INVERSE[input.charCodeAt(pos++)] * base + BASE91_INVERSE[input.charCodeAt(pos++)]);
						single[slot++] = previous;
					}
				}
			}
			decodeDelta(dict1AtomCount, 0);
			decodeDelta(dict2AtomCount, dictSize);
			const references = new Int32Array(ngramCount * 2);
			let poolSize = 0;
			let ngramIndex = 0;
			/**
			* Read `count` ngram entries (each = 2 slot-code references) for the slots
			* starting at `startSlot`, recording references and assigning pool ranges.
			* @param count
			* @param startSlot
			*/
			function readNgramReferences(count, startSlot) {
				for (let index = 0; index < count; index++) {
					const slot = startSlot + index;
					const a = readSlotCode();
					const b = readSlotCode();
					references[ngramIndex * 2] = a;
					references[ngramIndex * 2 + 1] = b;
					ngramIndex += 1;
					start[slot] = poolSize;
					const entryLength = (single[a] < 0 ? length[a] : 1) + (single[b] < 0 ? length[b] : 1);
					length[slot] = entryLength;
					poolSize += entryLength;
				}
			}
			readNgramReferences(ngramCount - dictSize + dict1AtomCount, dictSize + dict2AtomCount);
			readNgramReferences(dictSize - dict1AtomCount, dict1AtomCount);
			const pool = new Uint16Array(poolSize);
			let write = 0;
			for (let index = 0; index < ngramIndex; index++) for (let half = 0; half < 2; half++) {
				const source = references[index * 2 + half];
				const value = single[source];
				if (value < 0) {
					let read = start[source];
					const readEnd = read + length[source];
					while (read < readEnd) pool[write++] = pool[read++];
				} else pool[write++] = value;
			}
			const out = new Uint16Array(resultLength);
			let outIndex = 0;
			while (pos < inputLength) {
				let slot = BASE91_INVERSE[input.charCodeAt(pos++)];
				if (slot >= dictSize) slot = slot * base - twoCharBias + BASE91_INVERSE[input.charCodeAt(pos++)];
				const value = single[slot];
				if (value < 0) {
					let read = start[slot];
					const readEnd = read + length[slot];
					while (read < readEnd) out[outIndex++] = pool[read++];
				} else out[outIndex++] = value;
			}
			return out;
		}
		//#endregion
		//#region node_modules/.pnpm/entities@8.1.0/node_modules/entities/dist/generated/decode-data-html.js
		/** Packed HTML decode trie data. */
		const htmlDecodeTree = /* #__PURE__ */ decodeTrieDict("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
		//#endregion
		//#region node_modules/.pnpm/entities@8.1.0/node_modules/entities/dist/internal/bin-trie-flags.js
		/**
		* Bit flags & masks for the binary trie encoding used for entity decoding.
		*
		* The trie is a flat `Uint16Array`. Every node starts with one header word:
		*
		*   15..14 VALUE_LENGTH   Number of words the value occupies, +1.
		*                         0 = no value; 1 = value inline in bits 12..0;
		*                         2/3 = value in the 1/2 words after the header.
		*   13     FLAG13         If VALUE_LENGTH > 0: semicolon required ("strict"
		*                         entity; `;` is never stored as a branch).
		*                         If VALUE_LENGTH == 0: this node is a compact run.
		*   12..7  BRANCH_LENGTH  Number of branches (or run length for runs).
		*   6..0   JUMP_TABLE     Jump-table offset / single-branch char / first
		*                         run char (see below).
		*
		* Branch data follows the header and any value words. Its shape is selected
		* by (JUMP_TABLE, BRANCH_LENGTH) in the header:
		*
		*   Single branch  JUMP_TABLE = the only child's char, BRANCH_LENGTH = 0.
		*                  No branch words; the child node follows immediately.
		*   Jump table     JUMP_TABLE = first covered char (> 0), BRANCH_LENGTH =
		*                  table length. One word per covered char: 0 = no branch,
		*                  otherwise the child's offset from the END of the table,
		*                  +1 (so 0 stays the no-branch sentinel).
		*   Dictionary     JUMP_TABLE = 0, BRANCH_LENGTH = number of branches.
		*                  ceil(n/2) words of sorted keys packed two per word
		*                  (low byte first), then n pointer words storing the
		*                  child's offset from the END of the branch data.
		*   Compact run    VALUE_LENGTH = 0, FLAG13 set. BRANCH_LENGTH = run
		*                  length (3..63), JUMP_TABLE = first char; remaining run
		*                  chars packed two per word after the header. The target
		*                  node follows the packed words immediately.
		*
		* Pointers are end-relative (rather than relative to the pointer's own
		* position) because that makes the common "child encoded right after the
		* branch data" case a small constant, which compresses far better. Offsets
		* to already-encoded (shared) nodes wrap via uint16 modulo arithmetic; the
		* decoder masks navigation results with `& 0xff_ff` to match.
		*/
		var BinTrieFlags;
		(function(BinTrieFlags) {
			BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
			BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
			BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
			BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
			/** Bits 12..0: the inline value of a VALUE_LENGTH = 1 header word. */
			BinTrieFlags[BinTrieFlags["VALUE_MASK"] = 8191] = "VALUE_MASK";
		})(BinTrieFlags || (BinTrieFlags = {}));
		//#endregion
		//#region node_modules/.pnpm/entities@8.1.0/node_modules/entities/dist/decode.js
		var CharCodes;
		(function(CharCodes) {
			CharCodes[CharCodes["AMP"] = 38] = "AMP";
			CharCodes[CharCodes["NUM"] = 35] = "NUM";
			CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
			CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
			CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
			CharCodes[CharCodes["NINE"] = 57] = "NINE";
			CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
			CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
		})(CharCodes || (CharCodes = {}));
		/** Bit that needs to be set to convert an upper case ASCII character to lower case */
		const TO_LOWER_BIT = 32;
		const CONSUMED_SHIFT = 21;
		const CODE_POINT_MASK = 2097151;
		/**
		* Reserved consumed field for counts of at least 2047 characters after `&`.
		* The true count is in `longNumericConsumed`.
		*/
		const CONSUMED_OVERFLOW = 2047;
		/**
		* Side channel for numeric entities of at least 2048 characters including
		* `&`. Set by `parseNumericEntity` when its consumed count reaches the
		* reserved value `CONSUMED_OVERFLOW`; callers read the true count from here.
		* A module-level slot avoids a tuple allocation on the hot path.
		*/
		let longNumericConsumed = 0;
		/**
		* Extract the consumed count from a `parseNumericEntity` packed result,
		* recovering the true length from `longNumericConsumed` when the packed
		* field contains the sentinel. Read it before the next `parseNumericEntity`
		* call, which may overwrite the side channel. This helper owns that protocol.
		* @param packed Packed result of `parseNumericEntity`.
		*/
		function unpackConsumed(packed) {
			const consumed = packed >>> CONSUMED_SHIFT;
			return consumed === CONSUMED_OVERFLOW ? longNumericConsumed : consumed;
		}
		/**
		* Unsigned subtraction trick: (code - lo) >>> 0 wraps negatives to large
		* values, so a single `<=` covers the entire [lo..hi] range check.
		* @param code Code point to check.
		*/
		function isNumber(code) {
			return code - CharCodes.ZERO >>> 0 <= 9;
		}
		function isHexadecimalCharacter(code) {
			return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 5;
		}
		function isAlpha(code) {
			return (code | TO_LOWER_BIT) - CharCodes.LOWER_A >>> 0 <= 25;
		}
		/**
		* Checks if the given character is a valid end character for an entity in an attribute.
		*
		* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
		* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
		* @param code Code point to check.
		*/
		function isEntityInAttributeInvalidEnd(code) {
			return code === CharCodes.EQUALS || isAlpha(code) || isNumber(code);
		}
		var EntityDecoderState;
		(function(EntityDecoderState) {
			EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
			EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
			EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
			EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
			EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
		})(EntityDecoderState || (EntityDecoderState = {}));
		/**
		* Decoding mode for named entities.
		*/
		var DecodingMode;
		(function(DecodingMode) {
			/** Entities in text nodes that can end with any character. */
			DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
			/** Only allow entities terminated with a semicolon. */
			DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
			/** Entities in attributes have limitations on ending characters. */
			DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
		})(DecodingMode || (DecodingMode = {}));
		/**
		* Determines the branch of the current node that is taken given the current
		* character. This function is used to traverse the trie.
		*
		* See `BinTrieFlags` for the branch-data layouts handled here.
		* @param decodeTree The trie.
		* @param current The current node's header word.
		* @param nodeIndex Index of the node's first branch-data word (the header
		*   plus any value words have been skipped by the caller).
		* @param char The current character.
		* @returns The index of the next node, or -1 if no branch is taken.
		*/
		function determineBranch(decodeTree, current, nodeIndex, char) {
			const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
			const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
			if (jumpOffset) {
				if (branchCount === 0) return char === jumpOffset ? nodeIndex : -1;
				const slot = char - jumpOffset;
				if (slot >>> 0 >= branchCount) return -1;
				const stored = decodeTree[nodeIndex + slot];
				return stored === 0 ? -1 : nodeIndex + branchCount + stored - 1 & 65535;
			}
			if (branchCount === 0) return -1;
			const packedKeySlots = branchCount + 1 >> 1;
			const branchEnd = nodeIndex + packedKeySlots + branchCount;
			for (let index = 0; index < branchCount; index++) {
				const key = decodeTree[nodeIndex + (index >> 1)] >> ((index & 1) << 3) & 255;
				if (key === char) return branchEnd + decodeTree[nodeIndex + packedKeySlots + index] & 65535;
				if (key > char) return -1;
			}
			return -1;
		}
		/**
		* Read the decoded value from a trie node.
		* @param decodeTree The trie.
		* @param nodeIndex The index of the node.
		* @param valueLength The length of the value (1, 2, or 3).
		* @returns The decoded string.
		*/
		function readTrieValue(decodeTree, nodeIndex, valueLength) {
			if (valueLength === 1) return String.fromCharCode(decodeTree[nodeIndex] & BinTrieFlags.VALUE_MASK);
			if (valueLength === 2) return String.fromCharCode(decodeTree[nodeIndex + 1]);
			return String.fromCharCode(decodeTree[nodeIndex + 1], decodeTree[nodeIndex + 2]);
		}
		/**
		* Parse a numeric entity (`&#DDD;` or `&#xHHH;`).
		*
		* Encodes the result as `(consumed << CONSUMED_SHIFT) | codepoint` (see
		* the packing comment at the top of the file; overlong entities spill
		* their length into `longNumericConsumed`). Returns 0 when no digits were
		* found.
		*
		* This is the sync counterpart of the streaming
		* `EntityDecoder#stateNumericDecimal` / `#stateNumericHex`. Digit parsing
		* matches those methods; only this packed result needs a value clamp.
		* @param input       The input string.
		* @param numberStart Index of the `#` character.
		* @param inputLength Cached `input.length`.
		*/
		function parseNumericEntity(input, numberStart, inputLength) {
			let offset = numberStart + 1;
			let cp = 0;
			let digitStart = offset;
			if (offset < inputLength && (input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
				offset += 1;
				digitStart = offset;
				while (offset < inputLength) {
					const char = input.charCodeAt(offset);
					if (isNumber(char)) cp = cp * 16 + (char - CharCodes.ZERO);
					else if (isHexadecimalCharacter(char)) cp = cp * 16 + ((char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10);
					else break;
					offset += 1;
				}
			} else while (offset < inputLength) {
				const digit = input.charCodeAt(offset) - CharCodes.ZERO;
				if (digit >>> 0 > 9) break;
				cp = cp * 10 + digit;
				offset += 1;
			}
			if (offset === digitStart) return 0;
			if (offset < inputLength && input.charCodeAt(offset) === CharCodes.SEMI) offset += 1;
			if (cp > 1114111) cp = 1114112;
			let consumed = offset - numberStart;
			if (consumed >= CONSUMED_OVERFLOW) {
				longNumericConsumed = consumed;
				consumed = CONSUMED_OVERFLOW;
			}
			return consumed << CONSUMED_SHIFT | cp;
		}
		/**
		* Decode all entities in `input` using the HTML trie.
		*
		* Hard-wired to `htmlDecodeTree`: the inline root navigation below assumes
		* the HTML root's jump-table shape, so this must not be generalized to
		* other tries (the XML trie's dictionary root would silently match no
		* entities — `decodeXML` has its own hand-coded fast path instead).
		* @param input      The string to decode.
		* @param isStrict Only match semicolon-terminated entities.
		* @param isAttribute Whether to apply attribute-specific parsing rules (disallowing certain non-semicolon terminators).
		* @returns The decoded string.
		*/
		function decodeWithTrie(input, isStrict, isAttribute) {
			const decodeTree = htmlDecodeTree;
			let offset = input.indexOf("&");
			if (offset < 0) return input;
			const inputLength = input.length;
			let chunkStart = 0;
			let result = "";
			const root = decodeTree[0];
			const rootJumpOffset = root & BinTrieFlags.JUMP_TABLE;
			const rootBranchCount = (root & BinTrieFlags.BRANCH_LENGTH) >> 7;
			do {
				const entityStart = offset + 1;
				const firstChar = input.charCodeAt(entityStart);
				let consumed;
				let value;
				if (firstChar === CharCodes.NUM) {
					const packed = parseNumericEntity(input, entityStart, inputLength);
					consumed = unpackConsumed(packed);
					if (isStrict && consumed > 0 && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI) consumed = 0;
					value = consumed === 0 ? "" : codePointToString(packed & CODE_POINT_MASK);
				} else if (isAlpha(firstChar)) {
					consumed = 0;
					value = "";
					const rootSlotIndex = firstChar - rootJumpOffset;
					let nodeIndex;
					if (rootSlotIndex >>> 0 < rootBranchCount) {
						const stored = decodeTree[1 + rootSlotIndex];
						nodeIndex = stored === 0 ? -1 : rootBranchCount + stored & 65535;
					} else nodeIndex = -1;
					let bestNodeIndex = 0;
					let bestValueLength = 0;
					let current = nodeIndex < 0 ? 0 : decodeTree[nodeIndex];
					let index = entityStart + 1;
					trie: while (index < inputLength) {
						while ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === 0 && (current & BinTrieFlags.JUMP_TABLE) !== 0) {
							const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
							const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
							if (branchCount === 0) {
								if (input.charCodeAt(index) !== jumpOffset) break trie;
								nodeIndex += 1;
							} else {
								const slot = input.charCodeAt(index) - jumpOffset;
								if (slot >>> 0 >= branchCount) break trie;
								const stored = decodeTree[nodeIndex + 1 + slot];
								if (stored === 0) break trie;
								nodeIndex = nodeIndex + branchCount + stored & 65535;
							}
							current = decodeTree[nodeIndex];
							index += 1;
							if (index >= inputLength) break trie;
						}
						if ((current & (BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13)) === BinTrieFlags.FLAG13) {
							const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
							if (input.charCodeAt(index) !== (current & BinTrieFlags.JUMP_TABLE)) break;
							index += 1;
							const remaining = runLength - 1;
							let wordIndex = nodeIndex + 1;
							let charIndexInPacked = 0;
							for (; charIndexInPacked + 1 < remaining; charIndexInPacked += 2) {
								const packed = decodeTree[wordIndex];
								if (input.charCodeAt(index) !== (packed & 255)) break trie;
								index += 1;
								if (input.charCodeAt(index) !== (packed >> 8 & 255)) break trie;
								index += 1;
								wordIndex += 1;
							}
							if (charIndexInPacked < remaining) {
								if (input.charCodeAt(index) !== (decodeTree[wordIndex] & 255)) break;
								index += 1;
							}
							nodeIndex += 1 + (runLength >> 1);
							current = decodeTree[nodeIndex];
							continue;
						}
						const valueLength = current >>> 14;
						const char = input.charCodeAt(index);
						if (valueLength !== 0) {
							if (char === CharCodes.SEMI) {
								consumed = index - entityStart + 1;
								value = valueLength === 1 ? String.fromCharCode(current & BinTrieFlags.VALUE_MASK) : readTrieValue(decodeTree, nodeIndex, valueLength);
								break;
							}
							if (!isStrict && (current & BinTrieFlags.FLAG13) === 0) {
								consumed = index - entityStart;
								bestNodeIndex = nodeIndex;
								bestValueLength = valueLength;
							}
							if (valueLength === 1) break;
						}
						const next = determineBranch(decodeTree, current, nodeIndex + (valueLength || 1), char);
						if (next < 0) break;
						nodeIndex = next;
						current = decodeTree[nodeIndex];
						index += 1;
					}
					if (value === "") {
						const finalVL = current >>> 14;
						if (finalVL !== 0 && !isStrict && (current & BinTrieFlags.FLAG13) === 0) {
							consumed = index - entityStart;
							bestNodeIndex = nodeIndex;
							bestValueLength = finalVL;
						}
						if (consumed > 0) value = readTrieValue(decodeTree, bestNodeIndex, bestValueLength);
					}
				} else {
					consumed = 0;
					value = "";
				}
				if (consumed === 0 || isAttribute && firstChar !== CharCodes.NUM && input.charCodeAt(entityStart + consumed - 1) !== CharCodes.SEMI && entityStart + consumed < inputLength && isEntityInAttributeInvalidEnd(input.charCodeAt(entityStart + consumed))) offset = entityStart;
				else {
					if (chunkStart < offset) result += input.slice(chunkStart, offset);
					result += value;
					offset = chunkStart = entityStart + consumed;
				}
				if (input.charCodeAt(offset) !== CharCodes.AMP) offset = input.indexOf("&", offset);
			} while (offset >= 0);
			return result + input.slice(chunkStart);
		}
		/**
		* Decodes an HTML string, requiring all entities to be terminated by a semicolon.
		* @param htmlString The string to decode.
		* @returns The decoded string.
		*/
		function decodeHTMLStrict(htmlString) {
			return decodeWithTrie(htmlString, true, false);
		}
		//#endregion
		//#region node_modules/.pnpm/linkify-it@6.1.0/node_modules/linkify-it/build/index.mjs
		var REBuilder = class {
			src_Any = Any.source;
			src_Cc = Cc.source;
			src_Z = Z.source;
			src_P = P.source;
			src_ZPCc = [
				this.src_Z,
				this.src_P,
				this.src_Cc
			].join("|");
			src_ZCc = [this.src_Z, this.src_Cc].join("|");
			cache = {};
			opts = {
				maxLength: 1e4,
				urlAuth: false,
				schema_names: []
			};
			constructor(opts = {}) {
				this.opts = {
					...this.opts,
					...opts
				};
			}
			set(opts = {}) {
				this.opts = {
					...this.opts,
					...opts
				};
				this.cache = {};
				return this;
			}
			escapeRE(str) {
				return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
			}
			nestedPairRE(open, close, depth = 4) {
				const openRE = this.escapeRE(open);
				const closeRE = this.escapeRE(close);
				const atom = `(?:(?!${this.src_ZCc}|${openRE}|${closeRE}).)`;
				let pair = `${openRE}${atom}{0,1000}${closeRE}`;
				for (let level = 2; level <= depth; level++) pair = `${openRE}(?:${atom}|${pair}){0,1000}${closeRE}`;
				return pair;
			}
			get_text_separators() {
				return this.cache.text_separators ??= /[><\uff5c]/;
			}
			get_pseudo_letter() {
				return this.cache.src_pseudo_letter ??= new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`);
			}
			get_ipv4_addr() {
				return this.cache.src_ip4 ??= /* @__PURE__ */ new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])");
			}
			get_ipv6_addr() {
				const h16 = "[0-9A-Fa-f]{1,4}";
				const ls32 = `(?:(?:${h16}:${h16})|${this.get_ipv4_addr().source})`;
				return this.cache.src_ip6_addr ??= new RegExp(`(?:(?:${h16}:){6}${ls32}|::(?:${h16}:){5}${ls32}|(?:${h16})?::(?:${h16}:){4}${ls32}|(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}|(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}|(?:(?:${h16}:){0,3}${h16})?::${h16}:${ls32}|(?:(?:${h16}:){0,4}${h16})?::${ls32}|(?:(?:${h16}:){0,5}${h16})?::${h16}|(?:(?:${h16}:){0,6}${h16})?::)`);
			}
			get_ipv6_url_host() {
				return this.cache.src_ip6_host ??= new RegExp(`\\[${this.get_ipv6_addr().source}\\]`);
			}
			get_ipv6_mail_host() {
				return this.cache.src_ipv6_mail_host ??= new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`);
			}
			get_auth() {
				return this.cache.src_auth ??= new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`);
			}
			get_port() {
				return this.cache.src_port ??= /* @__PURE__ */ new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?");
			}
			get_host_terminator() {
				return this.cache.src_host_terminator ??= new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`);
			}
			get_path_terminator() {
				return this.cache.src_path_terminator ??= new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`);
			}
			get_path() {
				return this.cache.src_path ??= new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`);
			}
			get_mail_name() {
				return this.cache.src_mail_name ??= /* @__PURE__ */ new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}");
			}
			get_xn() {
				return this.cache.src_xn ??= /* @__PURE__ */ new RegExp("xn--[a-z0-9\\-]{1,59}");
			}
			get_tld() {
				if (this.cache.tld) return this.cache.tld;
				const tlds_src = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
				this.cache.tld = new RegExp(`${tlds_src || "$#none#$"}|${this.get_xn().source}`);
				return this.cache.tld;
			}
			get_domain_root() {
				return this.cache.src_domain_root ??= new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`);
			}
			get_domain() {
				return this.cache.src_domain ??= new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`);
			}
			get_url_host_port() {
				return this.cache.url_host_port ??= new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source);
			}
			get_fuzzy_url_host_port() {
				return this.cache.fuzzy_url_host_port ??= new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source);
			}
			get_mail_host() {
				return this.cache.src_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source);
			}
			get_fuzzy_mail_host() {
				return this.cache.src_fuzzy_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source);
			}
			get_path_extra() {
				return this.cache.src_path_extra ??= /* @__PURE__ */ new RegExp("");
			}
			get_fuzzy_mail_host_search() {
				return this.cache.mail_fuzzy_host_search ??= new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig");
			}
			get_fuzzy_link_search() {
				return this.cache.link_fuzzy_search ??= new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uff5c]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uff5c])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig");
			}
			get_http_validator() {
				return this.cache.http_validator ??= new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy");
			}
			get_relative_proto_validator() {
				return this.cache.relative_proto_validator ??= new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy");
			}
			get_mail_name_validator() {
				return this.cache.mail_name_validator ??= new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`);
			}
			get_mailto_validator() {
				return this.cache.mailto_validator ??= new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy");
			}
			get_schema_names() {
				return this.cache.schema_names ??= new RegExp((this.opts.schema_names || []).map((name) => this.escapeRE(name)).join("|"));
			}
			get_schema_search() {
				return this.cache.schema_search ??= new RegExp(`(^|(?!_)(?:[><\uff5c]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig");
			}
			get_schema_at_start() {
				return this.cache.schema_at_start ??= new RegExp(`^${this.get_schema_search().source}`, "i");
			}
		};
		var web_schema = {
			validate: (text, pos, self) => {
				const re = self.re.get_http_validator();
				re.lastIndex = pos;
				const m = re.exec(text);
				return m ? m[0].length : 0;
			},
			normalize: (match, self) => self.normalize(match)
		};
		var defaultSchemas = {
			"http:": web_schema,
			"https:": web_schema,
			"ftp:": web_schema,
			"//": {
				validate: function(text, pos, self) {
					const re = self.re.get_relative_proto_validator();
					re.lastIndex = pos;
					const m = re.exec(text);
					if (m) {
						if (pos >= 3 && text[pos - 3] === ":") return 0;
						if (pos >= 3 && text[pos - 3] === "/") return 0;
						return m[0].length;
					}
					return 0;
				},
				normalize: (match, self) => self.normalize(match)
			},
			"mailto:": {
				validate: function(text, pos, self) {
					const re = self.re.get_mailto_validator();
					re.lastIndex = pos;
					const m = re.exec(text);
					return m ? m[0].length : 0;
				},
				normalize: (match, self) => self.normalize(match)
			}
		};
		var tlds_2ch = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw";
		var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
		function unpackTlds() {
			const result = tlds_default.split("|");
			tlds_2ch.split("|").forEach((item) => {
				const sep = item.indexOf(":");
				const prefix = item.slice(0, sep);
				for (const suffix of item.slice(sep + 1)) result.push(prefix + suffix);
			});
			return result;
		}
		var defaultOptions = {
			fuzzyLink: false,
			fuzzyEmail: true,
			fuzzyIP: false,
			"---": false,
			tlds: unpackTlds(),
			urlAuth: false,
			maxLength: 1e4
		};
		/**
		* Match result returned by {@link LinkifyIt.match} and
		* {@link LinkifyIt.matchAtStart}.
		*
		* @category types
		*/
		var Match = class {
			/** Prefix (protocol) for matched string. Empty for fuzzy links. */
			schema;
			/** First position of matched string. */
			index;
			/** Next position after matched string. */
			lastIndex;
			/** Matched string. */
			raw;
			/** Normalized text of matched string. */
			text;
			/** Normalized URL of matched string. */
			url;
			constructor(text, schema, index, lastIndex) {
				const raw = text.slice(index, lastIndex);
				this.schema = schema.toLowerCase();
				this.index = index;
				this.lastIndex = lastIndex;
				this.raw = raw;
				this.text = raw;
				this.url = raw;
			}
		};
		/** Linkifier instance. */
		var LinkifyIt = class {
			__opts__;
			__schemas__;
			re;
			/**
			* Creates new linkifier instance.
			*
			* By default understands:
			*
			* - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
			* - "fuzzy" emails (foo@bar.com).
			*
			* See {@link LinkifyConstructorOptions} for available options.
			*
			* @param options Recognition options.
			*
			* @example
			* ```javascript
			* import { LinkifyIt } from 'linkify-it'
			*
			* const linkify = new LinkifyIt({ fuzzyLink: true })
			*
			* linkify
			*   .tlds(require('tlds'))       // Reload with full TLD list
			*   .tlds('onion', true)         // Add unofficial `.onion` domain
			*   .add('ftp:', null)           // Disable `ftp:` protocol
			*   .set({ fuzzyIP: true })      // Enable IPs in fuzzy links
			*
			* console.log(linkify.test('Site github.com!')) // true
			* console.log(linkify.match('Site github.com!'))
			* ```
			*/
			constructor(options = {}) {
				const { rebuilder, ...linkifyOptions } = options;
				this.__opts__ = {
					...defaultOptions,
					...linkifyOptions
				};
				this.__schemas__ = { ...defaultSchemas };
				this.re = rebuilder || new REBuilder();
				this.re.set({
					...this.__opts__,
					schema_names: Object.keys(this.__schemas__)
				});
			}
			/**
			* Add new rule definition.
			*
			* `schema` is a link prefix (usually, protocol name with `:` at the end,
			* `skype:` for example). `linkify-it` makes sure that prefix is not
			* preceded with alphanumeric char and symbols. Only whitespaces and
			* punctuation allowed.
			*
			* `definition` is a rule to check tail after link prefix. To disable an
			* existing rule, pass `null`.
			*
			* @param schema Rule name (fixed pattern prefix).
			* @param definition Schema definition, or `null` to disable the rule.
			*
			* See [twitter mentions example](https://github.com/markdown-it/linkify-it/blob/master/examples/twitter.mjs).
			*/
			add(schema, definition = null) {
				if (!definition) delete this.__schemas__[schema];
				else {
					const def = {
						normalize: (match, self) => self.normalize(match),
						...definition
					};
					this.__schemas__[schema] = def;
				}
				this.re.set({
					...this.__opts__,
					schema_names: Object.keys(this.__schemas__)
				});
				return this;
			}
			/**
			* Set recognition options for links without schema.
			*
			* @param options Recognition options.
			*/
			set(options = {}) {
				this.__opts__ = {
					...this.__opts__,
					...options
				};
				this.re.set({
					...this.__opts__,
					schema_names: Object.keys(this.__schemas__)
				});
				return this;
			}
			/**
			* Searches linkifiable pattern and returns `true` on success or `false` on fail.
			*
			* @param text Text to scan.
			*/
			test(text) {
				if (!text.length) return false;
				let m, re;
				re = this.re.get_schema_search();
				re.lastIndex = 0;
				while ((m = re.exec(text)) !== null) if (this.testSchemaAt(text, m[2], re.lastIndex)) return true;
				if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
					re = this.re.get_fuzzy_link_search();
					re.lastIndex = 0;
					if (re.exec(text) !== null) return true;
				}
				if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
					if (text.indexOf("@") >= 0) {
						const mailHostRe = this.re.get_fuzzy_mail_host_search();
						const mailNameRe = this.re.get_mail_name_validator();
						mailHostRe.lastIndex = 0;
						while ((m = mailHostRe.exec(text)) !== null) {
							const name = text.slice(Math.max(0, m.index - 65), m.index);
							if (mailNameRe.test(name)) return true;
						}
					}
				}
				return false;
			}
			/**
			* Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
			* at given position. Returns length of found pattern (0 on fail).
			*
			* @param text Text to scan.
			* @param schema Rule (schema) name.
			* @param pos Text offset to check from.
			*/
			testSchemaAt(text, schema, pos) {
				if (!this.__schemas__[schema.toLowerCase()]) return 0;
				return this.__schemas__[schema.toLowerCase()].validate(text.slice(0, pos + this.__opts__.maxLength), pos, this);
			}
			/**
			* Returns array of found link descriptions or `null` on fail. We strongly
			* recommend to use {@link LinkifyIt.test} first, for best speed.
			*
			* @param text Text to scan.
			*/
			match(text) {
				const result = [];
				const schemaRe = this.re.get_schema_search();
				let fuzzyLinkRe;
				let mailHostRe;
				let mailNameRe;
				let fuzzyLinkCandidate;
				let fuzzyEmailCandidate;
				let schemaPrefix;
				let schemaDone = false;
				let fuzzyLinkDone = false;
				let fuzzyEmailDone = false;
				let pos = 0;
				if (!text.length) return null;
				schemaRe.lastIndex = 0;
				if (this.__opts__.fuzzyLink && this.__schemas__["http:"]) {
					fuzzyLinkRe = this.re.get_fuzzy_link_search();
					fuzzyLinkRe.lastIndex = 0;
				}
				if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"]) {
					mailHostRe = this.re.get_fuzzy_mail_host_search();
					mailHostRe.lastIndex = 0;
					mailNameRe = this.re.get_mail_name_validator();
				}
				for (;;) {
					const scanFrom = Math.max(pos - 1, 0);
					if (mailHostRe && mailNameRe && !fuzzyEmailDone && (!fuzzyEmailCandidate || fuzzyEmailCandidate.index < pos)) {
						if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
						for (;;) {
							const m = mailHostRe.exec(text);
							if (!m) {
								fuzzyEmailDone = true;
								fuzzyEmailCandidate = void 0;
								break;
							}
							const name = mailNameRe.exec(text.slice(Math.max(0, m.index - 65), m.index));
							if (!name) continue;
							fuzzyEmailCandidate = {
								schema: "mailto:",
								index: m.index - name[1].length,
								lastIndex: m.index + m[0].length
							};
							if (fuzzyEmailCandidate.index >= pos) break;
							if (mailHostRe.lastIndex < scanFrom) mailHostRe.lastIndex = scanFrom;
						}
					}
					if (fuzzyLinkRe && !fuzzyLinkDone && (!fuzzyLinkCandidate || fuzzyLinkCandidate.index < pos)) {
						if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
						for (;;) {
							const m = fuzzyLinkRe.exec(text);
							if (!m) {
								fuzzyLinkDone = true;
								fuzzyLinkCandidate = void 0;
								break;
							}
							fuzzyLinkCandidate = {
								schema: "",
								index: m.index + m[1].length,
								lastIndex: m.index + m[0].length
							};
							if (fuzzyLinkCandidate.index >= pos) break;
							if (fuzzyLinkRe.lastIndex < scanFrom) fuzzyLinkRe.lastIndex = scanFrom;
						}
					}
					let fuzzyCandidate = fuzzyEmailCandidate;
					if (!fuzzyCandidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < fuzzyCandidate.index || fuzzyLinkCandidate.index === fuzzyCandidate.index && fuzzyLinkCandidate.lastIndex > fuzzyCandidate.lastIndex)) fuzzyCandidate = fuzzyLinkCandidate;
					let schemaCandidate;
					if (!schemaDone) for (;;) {
						if (!schemaPrefix) {
							if (schemaRe.lastIndex < scanFrom) schemaRe.lastIndex = scanFrom;
							const m = schemaRe.exec(text);
							if (!m) {
								schemaDone = true;
								break;
							}
							schemaPrefix = {
								schema: m[2],
								index: m.index + m[1].length,
								lastIndex: m.index + m[0].length
							};
						}
						if (schemaPrefix.index < pos) {
							schemaPrefix = void 0;
							continue;
						}
						if (fuzzyCandidate && schemaPrefix.index > fuzzyCandidate.index) break;
						const prefix = schemaPrefix;
						schemaPrefix = void 0;
						const len = this.testSchemaAt(text, prefix.schema, prefix.lastIndex);
						if (len) {
							schemaCandidate = {
								schema: prefix.schema,
								index: prefix.index,
								lastIndex: prefix.lastIndex + len
							};
							break;
						}
					}
					let candidate = schemaCandidate;
					if (!candidate || fuzzyEmailCandidate && (fuzzyEmailCandidate.index < candidate.index || fuzzyEmailCandidate.index === candidate.index && fuzzyEmailCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyEmailCandidate;
					if (!candidate || fuzzyLinkCandidate && (fuzzyLinkCandidate.index < candidate.index || fuzzyLinkCandidate.index === candidate.index && fuzzyLinkCandidate.lastIndex > candidate.lastIndex)) candidate = fuzzyLinkCandidate;
					if (!candidate) break;
					if (candidate === fuzzyEmailCandidate) fuzzyEmailCandidate = void 0;
					else if (candidate === fuzzyLinkCandidate) fuzzyLinkCandidate = void 0;
					const match = new Match(text, candidate.schema, candidate.index, candidate.lastIndex);
					if (match.schema) this.__schemas__[match.schema].normalize(match, this);
					else this.normalize(match);
					result.push(match);
					pos = candidate.lastIndex;
				}
				if (result.length) return result;
				return null;
			}
			/**
			* Returns fully-formed (not fuzzy) link if it starts at the beginning
			* of the string, and null otherwise.
			*
			* @param text Text to scan.
			*/
			matchAtStart(text) {
				if (!text.length) return null;
				const m = this.re.get_schema_at_start().exec(text);
				if (!m) return null;
				const len = this.testSchemaAt(text, m[2], m[0].length);
				if (!len) return null;
				const match = new Match(text, m[2], m.index + m[1].length, m.index + m[0].length + len);
				this.__schemas__[match.schema].normalize(match, this);
				return match;
			}
			/**
			* Load (or merge) new TLDs list. Those are used for fuzzy links (without
			* prefix) to avoid false positives. By default this algorithm is used:
			*
			* - hostname with any 2-letter root zones are ok.
			* - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
			*   are ok.
			* - encoded (`xn--...`) root zones are ok.
			*
			* If list is replaced, then exact match for 2-chars root zones will be checked.
			*
			* @param list List of TLDs.
			* @param keepOld Merge with current list if `true` (`false` by default).
			*/
			tlds(list, keepOld = false) {
				list = Array.isArray(list) ? list : [list];
				if (!keepOld) this.__opts__.tlds = list;
				else this.__opts__.tlds = this.__opts__.tlds.concat(list);
				this.re.set({
					...this.__opts__,
					schema_names: Object.keys(this.__schemas__)
				});
				return this;
			}
			/**
			* Default normalizer (if schema does not define its own).
			*
			* @param match Match to normalize.
			*/
			normalize(match) {
				if (!match.schema) match.url = `http://${match.url}`;
				if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) match.url = `mailto:${match.url}`;
			}
		};
		//#endregion
		//#region node_modules/.pnpm/markdown-it@15.0.3/node_modules/markdown-it/dist/markdown-it.mjs
		/*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT */
		var import_punycode = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
			/** Highest positive signed 32-bit float value */
			const maxInt = 2147483647;
			/** Bootstring parameters */
			const base = 36;
			const tMin = 1;
			const tMax = 26;
			const skew = 38;
			const damp = 700;
			const initialBias = 72;
			const initialN = 128;
			const delimiter = "-";
			/** Regular expressions */
			const regexPunycode = /^xn--/;
			const regexNonASCII = /[^\0-\x7F]/;
			const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
			/** Error messages */
			const errors = {
				"overflow": "Overflow: input needs wider integers to process",
				"not-basic": "Illegal input >= 0x80 (not a basic code point)",
				"invalid-input": "Invalid input"
			};
			/** Convenience shortcuts */
			const baseMinusTMin = 35;
			const floor = Math.floor;
			const stringFromCharCode = String.fromCharCode;
			/**
			* A generic error utility function.
			* @private
			* @param {String} type The error type.
			* @returns {Error} Throws a `RangeError` with the applicable error message.
			*/
			function error(type) {
				throw new RangeError(errors[type]);
			}
			/**
			* A generic `Array#map` utility function.
			* @private
			* @param {Array} array The array to iterate over.
			* @param {Function} callback The function that gets called for every array
			* item.
			* @returns {Array} A new array of values returned by the callback function.
			*/
			function map(array, callback) {
				const result = [];
				let length = array.length;
				while (length--) result[length] = callback(array[length]);
				return result;
			}
			/**
			* A simple `Array#map`-like wrapper to work with domain name strings or email
			* addresses.
			* @private
			* @param {String} domain The domain name or email address.
			* @param {Function} callback The function that gets called for every
			* character.
			* @returns {String} A new string of characters returned by the callback
			* function.
			*/
			function mapDomain(domain, callback) {
				const parts = domain.split("@");
				let result = "";
				if (parts.length > 1) {
					result = parts[0] + "@";
					domain = parts[1];
				}
				domain = domain.replace(regexSeparators, ".");
				const encoded = map(domain.split("."), callback).join(".");
				return result + encoded;
			}
			/**
			* Creates an array containing the numeric code points of each Unicode
			* character in the string. While JavaScript uses UCS-2 internally,
			* this function will convert a pair of surrogate halves (each of which
			* UCS-2 exposes as separate characters) into a single code point,
			* matching UTF-16.
			* @see `punycode.ucs2.encode`
			* @see <https://mathiasbynens.be/notes/javascript-encoding>
			* @memberOf punycode.ucs2
			* @name decode
			* @param {String} string The Unicode input string (UCS-2).
			* @returns {Array} The new array of code points.
			*/
			function ucs2decode(string) {
				const output = [];
				let counter = 0;
				const length = string.length;
				while (counter < length) {
					const value = string.charCodeAt(counter++);
					if (value >= 55296 && value <= 56319 && counter < length) {
						const extra = string.charCodeAt(counter++);
						if ((extra & 64512) == 56320) output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
						else {
							output.push(value);
							counter--;
						}
					} else output.push(value);
				}
				return output;
			}
			/**
			* Creates a string based on an array of numeric code points.
			* @see `punycode.ucs2.decode`
			* @memberOf punycode.ucs2
			* @name encode
			* @param {Array} codePoints The array of numeric code points.
			* @returns {String} The new Unicode string (UCS-2).
			*/
			const ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
			/**
			* Converts a basic code point into a digit/integer.
			* @see `digitToBasic()`
			* @private
			* @param {Number} codePoint The basic numeric code point value.
			* @returns {Number} The numeric value of a basic code point (for use in
			* representing integers) in the range `0` to `base - 1`, or `base` if
			* the code point does not represent a value.
			*/
			const basicToDigit = function(codePoint) {
				if (codePoint >= 48 && codePoint < 58) return 26 + (codePoint - 48);
				if (codePoint >= 65 && codePoint < 91) return codePoint - 65;
				if (codePoint >= 97 && codePoint < 123) return codePoint - 97;
				return base;
			};
			/**
			* Converts a digit/integer into a basic code point.
			* @see `basicToDigit()`
			* @private
			* @param {Number} digit The numeric value of a basic code point.
			* @returns {Number} The basic code point whose value (when used for
			* representing integers) is `digit`, which needs to be in the range
			* `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
			* used; else, the lowercase form is used. The behavior is undefined
			* if `flag` is non-zero and `digit` has no uppercase form.
			*/
			const digitToBasic = function(digit, flag) {
				return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
			};
			/**
			* Bias adaptation function as per section 3.4 of RFC 3492.
			* https://tools.ietf.org/html/rfc3492#section-3.4
			* @private
			*/
			const adapt = function(delta, numPoints, firstTime) {
				let k = 0;
				delta = firstTime ? floor(delta / damp) : delta >> 1;
				delta += floor(delta / numPoints);
				for (; delta > 455; k += base) delta = floor(delta / baseMinusTMin);
				return floor(k + 36 * delta / (delta + skew));
			};
			/**
			* Converts a Punycode string of ASCII-only symbols to a string of Unicode
			* symbols.
			* @memberOf punycode
			* @param {String} input The Punycode string of ASCII-only symbols.
			* @returns {String} The resulting string of Unicode symbols.
			*/
			const decode = function(input) {
				const output = [];
				const inputLength = input.length;
				let i = 0;
				let n = initialN;
				let bias = initialBias;
				let basic = input.lastIndexOf(delimiter);
				if (basic < 0) basic = 0;
				for (let j = 0; j < basic; ++j) {
					if (input.charCodeAt(j) >= 128) error("not-basic");
					output.push(input.charCodeAt(j));
				}
				for (let index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
					const oldi = i;
					for (let w = 1, k = base;; k += base) {
						if (index >= inputLength) error("invalid-input");
						const digit = basicToDigit(input.charCodeAt(index++));
						if (digit >= base) error("invalid-input");
						if (digit > floor((maxInt - i) / w)) error("overflow");
						i += digit * w;
						const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
						if (digit < t) break;
						const baseMinusT = base - t;
						if (w > floor(maxInt / baseMinusT)) error("overflow");
						w *= baseMinusT;
					}
					const out = output.length + 1;
					bias = adapt(i - oldi, out, oldi == 0);
					if (floor(i / out) > maxInt - n) error("overflow");
					n += floor(i / out);
					i %= out;
					output.splice(i++, 0, n);
				}
				return String.fromCodePoint(...output);
			};
			/**
			* Converts a string of Unicode symbols (e.g. a domain name label) to a
			* Punycode string of ASCII-only symbols.
			* @memberOf punycode
			* @param {String} input The string of Unicode symbols.
			* @returns {String} The resulting Punycode string of ASCII-only symbols.
			*/
			const encode = function(input) {
				const output = [];
				input = ucs2decode(input);
				const inputLength = input.length;
				let n = initialN;
				let delta = 0;
				let bias = initialBias;
				for (const currentValue of input) if (currentValue < 128) output.push(stringFromCharCode(currentValue));
				const basicLength = output.length;
				let handledCPCount = basicLength;
				if (basicLength) output.push(delimiter);
				while (handledCPCount < inputLength) {
					let m = maxInt;
					for (const currentValue of input) if (currentValue >= n && currentValue < m) m = currentValue;
					const handledCPCountPlusOne = handledCPCount + 1;
					if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) error("overflow");
					delta += (m - n) * handledCPCountPlusOne;
					n = m;
					for (const currentValue of input) {
						if (currentValue < n && ++delta > maxInt) error("overflow");
						if (currentValue === n) {
							let q = delta;
							for (let k = base;; k += base) {
								const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
								if (q < t) break;
								const qMinusT = q - t;
								const baseMinusT = base - t;
								output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
								q = floor(qMinusT / baseMinusT);
							}
							output.push(stringFromCharCode(digitToBasic(q, 0)));
							bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
							delta = 0;
							++handledCPCount;
						}
					}
					++delta;
					++n;
				}
				return output.join("");
			};
			/**
			* Converts a Punycode string representing a domain name or an email address
			* to Unicode. Only the Punycoded parts of the input will be converted, i.e.
			* it doesn't matter if you call it on a string that has already been
			* converted to Unicode.
			* @memberOf punycode
			* @param {String} input The Punycoded domain name or email address to
			* convert to Unicode.
			* @returns {String} The Unicode representation of the given Punycode
			* string.
			*/
			const toUnicode = function(input) {
				return mapDomain(input, function(string) {
					return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
				});
			};
			/**
			* Converts a Unicode string representing a domain name or an email address to
			* Punycode. Only the non-ASCII parts of the domain name will be converted,
			* i.e. it doesn't matter if you call it with a domain that's already in
			* ASCII.
			* @memberOf punycode
			* @param {String} input The domain name or email address to convert, as a
			* Unicode string.
			* @returns {String} The Punycode representation of the given domain name or
			* email address.
			*/
			const toASCII = function(input) {
				return mapDomain(input, function(string) {
					return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
				});
			};
			module.exports = {
				/**
				* A string representing the current Punycode.js version number.
				* @memberOf punycode
				* @type String
				*/
				"version": "2.3.1",
				/**
				* An object of methods to convert from JavaScript's internal character
				* representation (UCS-2) to Unicode code points, and back.
				* @see <https://mathiasbynens.be/notes/javascript-encoding>
				* @memberOf punycode
				* @type Object
				*/
				"ucs2": {
					"decode": ucs2decode,
					"encode": ucs2encode
				},
				"decode": decode,
				"encode": encode,
				"toASCII": toASCII,
				"toUnicode": toUnicode
			};
		})))(), 1);
		var __defProp = Object.defineProperty;
		var __exportAll = (all, no_symbols) => {
			let target = {};
			for (var name in all) __defProp(target, name, {
				get: all[name],
				enumerable: true
			});
			if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
			return target;
		};
		/**
		* Common utility functions exposed through `md.utils` for use by plugins.
		*
		* @module md.utils
		*/
		var utils_exports = /* @__PURE__ */ __exportAll({
			arrayReplaceAt: () => arrayReplaceAt,
			asciiTrim: () => asciiTrim,
			callable: () => callable,
			escapeHtml: () => escapeHtml,
			escapeRE: () => escapeRE,
			fromCodePoint: () => fromCodePoint,
			isMdAsciiPunct: () => isMdAsciiPunct,
			isPunctChar: () => isPunctChar,
			isPunctCharCode: () => isPunctCharCode,
			isSpace: () => isSpace,
			isValidEntityCode: () => isValidEntityCode,
			isWhiteSpace: () => isWhiteSpace,
			lib: () => lib,
			normalizeReference: () => normalizeReference,
			unescapeAll: () => unescapeAll,
			unescapeMd: () => unescapeMd
		});
		function callable(cls) {
			const wrapper = function(...args) {
				return Reflect.construct(cls, args, new.target && new.target !== wrapper ? new.target : cls);
			};
			Object.defineProperty(wrapper, "name", { value: cls.name });
			Object.setPrototypeOf(wrapper, cls);
			wrapper.prototype = cls.prototype;
			return wrapper;
		}
		/**
		* Returns a copy of a token array with the token at `pos` replaced by
		* `newElements`. Used to transform token streams without modifying the
		* original array.
		*/
		function arrayReplaceAt(src, pos, newElements) {
			return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
		}
		/** Checks whether a code point can be decoded from a numeric HTML entity. */
		function isValidEntityCode(c) {
			if (c >= 55296 && c <= 57343) return false;
			if (c >= 64976 && c <= 65007) return false;
			if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
			if (c >= 0 && c <= 8) return false;
			if (c === 11) return false;
			if (c >= 14 && c <= 31) return false;
			if (c >= 127 && c <= 159) return false;
			if (c > 1114111) return false;
			return true;
		}
		/**
		* Converts a Unicode code point to a string, like `String.fromCodePoint()`,
		* but does not throw for invalid input.
		*/
		function fromCodePoint(c) {
			if (c > 65535) {
				c -= 65536;
				const surrogate1 = 55296 + (c >> 10);
				const surrogate2 = 56320 + (c & 1023);
				return String.fromCharCode(surrogate1, surrogate2);
			}
			return String.fromCharCode(c);
		}
		var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
		var UNESCAPE_ALL_RE = new RegExp(`${UNESCAPE_MD_RE.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
		var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
		function replaceEntityPattern(match, name) {
			if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
				const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
				if (isValidEntityCode(code)) return fromCodePoint(code);
				return match;
			}
			const decoded = decodeHTMLStrict(match);
			if (decoded !== match) return decoded;
			return match;
		}
		/** Decodes Markdown backslash escapes. */
		function unescapeMd(str) {
			if (str.indexOf("\\") < 0) return str;
			return str.replace(UNESCAPE_MD_RE, "$1");
		}
		/**
		* Decodes Markdown backslash escapes and HTML character references in link
		* destinations, link titles, and fenced code info strings.
		*/
		function unescapeAll(str) {
			if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
			return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity) {
				if (escaped) return escaped;
				return replaceEntityPattern(match, entity);
			});
		}
		var HTML_ESCAPE_TEST_RE = /[&<>"]/;
		var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
		var HTML_REPLACEMENTS = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;"
		};
		function replaceUnsafeChar(ch) {
			return HTML_REPLACEMENTS[ch];
		}
		/** Escapes HTML special characters in a string. */
		function escapeHtml(str) {
			if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
			return str;
		}
		var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
		/** Escapes regular expression metacharacters in a string. */
		function escapeRE(str) {
			return str.replace(REGEXP_ESCAPE_RE, "\\$&");
		}
		/** Checks whether a character code is an ASCII space or tab. */
		function isSpace(code) {
			switch (code) {
				case 9:
				case 32: return true;
			}
			return false;
		}
		/**
		* Checks whether a character code is whitespace recognized by Markdown.
		*
		* Matches the Unicode `Zs` category or `\t`, `\f`, `\v`, `\r`, `\n`.
		*/
		function isWhiteSpace(code) {
			if (code >= 8192 && code <= 8202) return true;
			switch (code) {
				case 9:
				case 10:
				case 11:
				case 12:
				case 13:
				case 32:
				case 160:
				case 5760:
				case 8239:
				case 8287:
				case 12288: return true;
			}
			return false;
		}
		/**
		* Checks whether a character is Unicode punctuation or a symbol.
		*
		* Does not support astral characters.
		*/
		function isPunctChar(ch) {
			return P.test(ch) || S.test(ch);
		}
		/** Checks whether a Unicode code point is punctuation or a symbol. */
		function isPunctCharCode(code) {
			return isPunctChar(fromCodePoint(code));
		}
		/**
		* Markdown ASCII punctuation characters.
		*
		*     !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @,
		*     [, \, ], ^, _, `, {, |, }, or ~
		*
		* http://spec.commonmark.org/0.15/#ascii-punctuation-character
		*
		* Don't confuse with Unicode punctuation. It lacks some characters in the
		* ASCII range.
		*/
		function isMdAsciiPunct(ch) {
			switch (ch) {
				case 33:
				case 34:
				case 35:
				case 36:
				case 37:
				case 38:
				case 39:
				case 40:
				case 41:
				case 42:
				case 43:
				case 44:
				case 45:
				case 46:
				case 47:
				case 58:
				case 59:
				case 60:
				case 61:
				case 62:
				case 63:
				case 64:
				case 91:
				case 92:
				case 93:
				case 94:
				case 95:
				case 96:
				case 123:
				case 124:
				case 125:
				case 126: return true;
				default: return false;
			}
		}
		/** Normalizes `[reference labels]` for case-insensitive lookup. */
		function normalizeReference(str) {
			str = str.trim().replace(/\s+/g, " ");
			return str.toLowerCase().toUpperCase();
		}
		function isAsciiTrimmable(c) {
			return c === 32 || c === 9 || c === 10 || c === 13;
		}
		/**
		* "Light" `.trim()` for blocks (headings, paragraphs), where Unicode spaces
		* should be preserved.
		*/
		function asciiTrim(str) {
			let start = 0;
			for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
			let end = str.length - 1;
			for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
			return str.slice(start, end + 1);
		}
		/**
		* Libraries commonly used by markdown-it and its plugins, re-exported to
		* reduce duplicate dependencies in browser bundles.
		*/
		var lib = {
			mdurl: mdurl_exports,
			ucmicro: build_exports
		};
		/** Finds the end of a link or image label (`[label]`). */
		function parseLinkLabel(state, start, disableNested) {
			let level, found, marker, prevPos;
			const max = state.posMax;
			const oldPos = state.pos;
			state.pos = start + 1;
			level = 1;
			while (state.pos < max) {
				marker = state.src.charCodeAt(state.pos);
				if (marker === 93) {
					level--;
					if (level === 0) {
						found = true;
						break;
					}
				}
				prevPos = state.pos;
				state.md.inline.skipToken(state);
				if (marker === 91) {
					if (prevPos === state.pos - 1) level++;
					else if (disableNested) {
						state.pos = oldPos;
						return -1;
					}
				}
			}
			let labelEnd = -1;
			if (found) labelEnd = state.pos;
			state.pos = oldPos;
			return labelEnd;
		}
		/** Parses the destination in `[label](destination "title")`. */
		function parseLinkDestination(str, start, max) {
			let code;
			let pos = start;
			const result = {
				ok: false,
				pos: 0,
				str: ""
			};
			if (str.charCodeAt(pos) === 60) {
				pos++;
				while (pos < max) {
					code = str.charCodeAt(pos);
					if (code === 10) return result;
					if (code === 60) return result;
					if (code === 62) {
						result.pos = pos + 1;
						result.str = unescapeAll(str.slice(start + 1, pos));
						result.ok = true;
						return result;
					}
					if (code === 92 && pos + 1 < max) {
						pos += 2;
						continue;
					}
					pos++;
				}
				return result;
			}
			let level = 0;
			while (pos < max) {
				code = str.charCodeAt(pos);
				if (code === 32) break;
				if (code < 32 || code === 127) break;
				if (code === 92 && pos + 1 < max) {
					if (str.charCodeAt(pos + 1) === 32) {
						pos++;
						continue;
					}
					pos += 2;
					continue;
				}
				if (code === 40) {
					level++;
					if (level > 32) return result;
				}
				if (code === 41) {
					if (level === 0) break;
					level--;
				}
				pos++;
			}
			if (start === pos) return result;
			if (level !== 0) return result;
			result.str = unescapeAll(str.slice(start, pos));
			result.pos = pos;
			result.ok = true;
			return result;
		}
		/**
		* Parses the optional title in `[label](destination "title")` or
		* `[label]: destination "title"`.
		*
		* `prev_state` continues a reference title on the next source line.
		*/
		function parseLinkTitle(str, start, max, prev_state) {
			let code;
			let pos = start;
			const state = {
				ok: false,
				can_continue: false,
				pos: 0,
				str: "",
				marker: 0
			};
			if (prev_state) {
				state.str = prev_state.str;
				state.marker = prev_state.marker;
			} else {
				if (pos >= max) return state;
				let marker = str.charCodeAt(pos);
				if (marker !== 34 && marker !== 39 && marker !== 40) return state;
				start++;
				pos++;
				if (marker === 40) marker = 41;
				state.marker = marker;
			}
			while (pos < max) {
				code = str.charCodeAt(pos);
				if (code === state.marker) {
					state.pos = pos + 1;
					state.str += unescapeAll(str.slice(start, pos));
					state.ok = true;
					return state;
				} else if (code === 40 && state.marker === 41) return state;
				else if (code === 92 && pos + 1 < max) pos++;
				pos++;
			}
			state.can_continue = true;
			state.str += unescapeAll(str.slice(start, pos));
			return state;
		}
		/**
		* Functions used to parse links and images, split out of parser rules because
		* of their size.
		*
		* @module md.helpers
		*/
		var helpers_exports = /* @__PURE__ */ __exportAll({
			parseLinkDestination: () => parseLinkDestination,
			parseLinkLabel: () => parseLinkLabel,
			parseLinkTitle: () => parseLinkTitle
		});
		function _typeof(o) {
			"@babel/helpers - typeof";
			return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
				return typeof o;
			} : function(o) {
				return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
			}, _typeof(o);
		}
		function toPrimitive(t, r) {
			if ("object" != _typeof(t) || !t) return t;
			var e = t[Symbol.toPrimitive];
			if (void 0 !== e) {
				var i = e.call(t, r || "default");
				if ("object" != _typeof(i)) return i;
				throw new TypeError("@@toPrimitive must return a primitive value.");
			}
			return ("string" === r ? String : Number)(t);
		}
		function toPropertyKey(t) {
			var i = toPrimitive(t, "string");
			return "symbol" == _typeof(i) ? i : i + "";
		}
		function _defineProperty(e, r, t) {
			return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
				value: t,
				enumerable: !0,
				configurable: !0,
				writable: !0
			}) : e[r] = t, e;
		}
		/**
		* Represents one item in the parsed token stream, storing parsed data and
		* providing helpers for managing HTML attributes.
		*/
		var Token = class {
			constructor(type, tag, nesting) {
				_defineProperty(
					this,
					/**
					* Source map info. Format: `[ line_begin, line_end ]`
					*/
					"map",
					null
				);
				_defineProperty(
					this,
					/**
					* nesting level, the same as `state.level`
					*/
					"level",
					0
				);
				_defineProperty(
					this,
					/**
					* An array of child nodes (inline and img tokens)
					*/
					"children",
					null
				);
				_defineProperty(
					this,
					/**
					* In a case of self-closing tag (code, html, fence, etc.),
					* it has contents of this tag.
					*/
					"content",
					""
				);
				_defineProperty(
					this,
					/**
					* '*' or '_' for emphasis, fence string for fence, etc.
					*/
					"markup",
					""
				);
				_defineProperty(
					this,
					/**
					* Additional information:
					*
					* - Info string for "fence" tokens
					* - The value "auto" for autolink "link_open" and "link_close" tokens
					* - The string value of the item marker for ordered-list "list_item_open" tokens
					*/
					"info",
					""
				);
				_defineProperty(
					this,
					/**
					* True for block-level tokens, false for inline tokens.
					* Used in renderer to calculate line breaks
					*/
					"block",
					false
				);
				_defineProperty(
					this,
					/**
					* If it's true, ignore this element when rendering. Used for tight lists
					* to hide paragraphs.
					*/
					"hidden",
					false
				);
				this.type = type;
				this.tag = tag;
				this.attrs = null;
				this.nesting = nesting;
				this.meta = null;
			}
			/**
			* Search attribute index by name.
			*/
			attrIndex(name) {
				if (!this.attrs) return -1;
				const attrs = this.attrs;
				for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
				return -1;
			}
			/**
			* Add `[ name, value ]` attribute to list. Init attrs if necessary
			*/
			attrPush(attrData) {
				if (this.attrs) this.attrs.push(attrData);
				else this.attrs = [attrData];
			}
			/**
			* Set `name` attribute to `value`. Override old value if exists.
			*/
			attrSet(name, value) {
				const idx = this.attrIndex(name);
				const attrData = [name, value];
				if (idx < 0) this.attrPush(attrData);
				else this.attrs[idx] = attrData;
			}
			/**
			* Get the value of attribute `name`, or null if it does not exist.
			*/
			attrGet(name) {
				const idx = this.attrIndex(name);
				let value = null;
				if (idx >= 0) value = this.attrs[idx][1];
				return value;
			}
			/**
			* Join value to existing attribute via space. Or create new attribute if not
			* exists. Useful to operate with token classes.
			*/
			attrJoin(name, value) {
				const idx = this.attrIndex(name);
				if (idx < 0) this.attrPush([name, value]);
				else this.attrs[idx][1] = `${this.attrs[idx][1]} ${value}`;
			}
		};
		/**
		* Helper class, used by {@link MarkdownIt.core}, {@link MarkdownIt.block} and
		* {@link MarkdownIt.inline} to manage sequences of functions (rules):
		*
		* - keep rules in defined order
		* - assign the name to each rule
		* - enable/disable rules
		* - add/replace rules
		* - allow assign rules to additional named chains (in the same)
		* - cacheing lists of active rules
		*
		* You will not need use this class directly until write plugins. For simple
		* rules control use {@link MarkdownIt.disable}, {@link MarkdownIt.enable} and
		* {@link MarkdownIt.use}.
		*/
		var Ruler = class {
			constructor() {
				_defineProperty(
					this,
					/** @internal */
					"__rules__",
					[]
				);
				_defineProperty(
					this,
					/** @internal */
					"__cache__",
					null
				);
			}
			/** @internal */
			__find__(name) {
				for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
				return -1;
			}
			/** @internal */
			__compile__() {
				const chains = /* @__PURE__ */ new Set();
				this.__rules__.forEach((rule) => {
					if (!rule.enabled) return;
					rule.alt.forEach((altName) => {
						if (altName) chains.add(altName);
					});
				});
				this.__cache__ = Object.create(null);
				this.__cache__[""] = [];
				this.__rules__.forEach((rule) => {
					if (rule.enabled) this.__cache__[""].push(rule.fn);
				});
				chains.forEach((chain) => {
					this.__cache__[chain] = [];
					this.__rules__.forEach((rule) => {
						if (rule.enabled && rule.alt.indexOf(chain) >= 0) this.__cache__[chain].push(rule.fn);
					});
				});
			}
			/**
			* Replace rule by name with new function & options. Throws error if name not
			* found.
			*
			* @example Replace existing typographer replacement rule with new one
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.core.ruler.at('replacements', function replace(state) {
			*   //...
			* });
			* ```
			*/
			at(name, fn, options = {}) {
				const index = this.__find__(name);
				if (index === -1) throw new Error(`Parser rule not found: ${name}`);
				this.__rules__[index].fn = fn;
				this.__rules__[index].alt = options.alt || [];
				this.__cache__ = null;
			}
			/**
			* Add new rule to chain before one with given name. See also
			* {@link Ruler.after}, {@link Ruler.push}.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
			*   //...
			* });
			* ```
			*/
			before(beforeName, ruleName, fn, options = {}) {
				const index = this.__find__(beforeName);
				if (index === -1) throw new Error(`Parser rule not found: ${beforeName}`);
				this.__rules__.splice(index, 0, {
					name: ruleName,
					enabled: true,
					fn,
					alt: options.alt || []
				});
				this.__cache__ = null;
			}
			/**
			* Add new rule to chain after one with given name. See also
			* {@link Ruler.before}, {@link Ruler.push}.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.inline.ruler.after('text', 'my_rule', function replace(state) {
			*   //...
			* });
			* ```
			*/
			after(afterName, ruleName, fn, options = {}) {
				const index = this.__find__(afterName);
				if (index === -1) throw new Error(`Parser rule not found: ${afterName}`);
				this.__rules__.splice(index + 1, 0, {
					name: ruleName,
					enabled: true,
					fn,
					alt: options.alt || []
				});
				this.__cache__ = null;
			}
			/**
			* Push new rule to the end of chain. See also
			* {@link Ruler.before}, {@link Ruler.after}.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* md.core.ruler.push('my_rule', function replace(state) {
			*   //...
			* });
			* ```
			*/
			push(ruleName, fn, options = {}) {
				this.__rules__.push({
					name: ruleName,
					enabled: true,
					fn,
					alt: options.alt || []
				});
				this.__cache__ = null;
			}
			/**
			* Enable rules with given names. If any rule name not found - throw Error.
			* Errors can be disabled by second param.
			*
			* See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
			*
			* Returns list of found rule names (if no exception happened).
			*/
			enable(list, ignoreInvalid = false) {
				if (!Array.isArray(list)) list = [list];
				const result = [];
				list.forEach((name) => {
					const idx = this.__find__(name);
					if (idx < 0) {
						if (ignoreInvalid) return;
						throw new Error(`Rules manager: invalid rule name ${name}`);
					}
					this.__rules__[idx].enabled = true;
					result.push(name);
				});
				this.__cache__ = null;
				return result;
			}
			/**
			* Enable rules with given names, and disable everything else. If any rule name
			* not found - throw Error. Errors can be disabled by second param.
			*
			* See also {@link Ruler.disable}, {@link Ruler.enable}.
			*/
			enableOnly(list, ignoreInvalid = false) {
				if (!Array.isArray(list)) list = [list];
				this.__rules__.forEach((rule) => {
					rule.enabled = false;
				});
				this.enable(list, ignoreInvalid);
			}
			/**
			* Disable rules with given names. If any rule name not found - throw Error.
			* Errors can be disabled by second param.
			*
			* See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
			*
			* Returns list of found rule names (if no exception happened).
			*/
			disable(list, ignoreInvalid = false) {
				if (!Array.isArray(list)) list = [list];
				const result = [];
				list.forEach((name) => {
					const idx = this.__find__(name);
					if (idx < 0) {
						if (ignoreInvalid) return;
						throw new Error(`Rules manager: invalid rule name ${name}`);
					}
					this.__rules__[idx].enabled = false;
					result.push(name);
				});
				this.__cache__ = null;
				return result;
			}
			/**
			* Return array of active functions (rules) for given chain name. It analyzes
			* rules configuration, compiles caches if not exists and returns result.
			*
			* Default chain name is `''` (empty string). It can't be skipped. That's
			* done intentionally, to keep signature monomorphic for high speed.
			*/
			getRules(chainName) {
				if (!this.__cache__) this.__compile__();
				return this.__cache__[chainName] || [];
			}
		};
		var default_rules = {};
		default_rules.code_inline = function(tokens, idx, options, env, slf) {
			const token = tokens[idx];
			return `<code${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
		};
		default_rules.code_block = function(tokens, idx, options, env, slf) {
			const token = tokens[idx];
			return `<pre${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>\n`;
		};
		default_rules.fence = function(tokens, idx, options, env, slf) {
			const token = tokens[idx];
			const info = token.info ? unescapeAll(token.info).trim() : "";
			let langName = "";
			let langAttrs = "";
			if (info) {
				const arr = info.split(/(\s+)/g);
				langName = arr[0];
				langAttrs = arr.slice(2).join("");
			}
			let highlighted;
			if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
			else highlighted = escapeHtml(token.content);
			if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
			if (info) {
				const i = token.attrIndex("class");
				const tmpAttrs = token.attrs ? token.attrs.slice() : [];
				if (i < 0) tmpAttrs.push(["class", `${options.langPrefix}${langName}`]);
				else {
					tmpAttrs[i] = [tmpAttrs[i][0], tmpAttrs[i][1]];
					tmpAttrs[i][1] += ` ${options.langPrefix}${langName}`;
				}
				const tmpToken = { attrs: tmpAttrs };
				return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>\n`;
			}
			return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>\n`;
		};
		default_rules.image = function(tokens, idx, options, env, slf) {
			const token = tokens[idx];
			token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
			return slf.renderToken(tokens, idx, options);
		};
		default_rules.hardbreak = function(tokens, idx, options) {
			return options.xhtmlOut ? "<br />\n" : "<br>\n";
		};
		default_rules.softbreak = function(tokens, idx, options) {
			return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
		};
		default_rules.text = function(tokens, idx) {
			return escapeHtml(tokens[idx].content);
		};
		default_rules.html_block = function(tokens, idx) {
			return tokens[idx].content;
		};
		default_rules.html_inline = function(tokens, idx) {
			return tokens[idx].content;
		};
		/**
		* Generates HTML from parsed token stream. Each instance has independent
		* copy of rules. Those can be rewritten with ease. Also, you can add new
		* rules if you create plugin and adds new token types.
		*
		* Creates new renderer instance and fills {@link Renderer.rules} with defaults.
		*/
		var Renderer = class {
			constructor() {
				_defineProperty(
					this,
					/**
					* Contains render rules for tokens. Can be updated and extended.
					*
					* See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
					* for more details and examples.
					*
					* @example Custom render rules
					* ```javascript
					* import MarkdownIt from 'markdown-it'
					* const md = new MarkdownIt()
					*
					* md.renderer.rules.strong_open  = function () { return '<b>'; };
					* md.renderer.rules.strong_close = function () { return '</b>'; };
					*
					* const result = md.renderInline(...);
					* ```
					*
					* @example Each rule is called as independent static function with fixed signature
					* ```javascript
					* function my_token_render(tokens, idx, options, env, renderer) {
					*   // ...
					*   return renderedHTML;
					* }
					* ```
					*/
					"rules",
					Object.assign({}, default_rules)
				);
			}
			/**
			* Render token attributes to string.
			*/
			renderAttrs(token) {
				let i, l, result;
				if (!token.attrs) return "";
				result = "";
				for (i = 0, l = token.attrs.length; i < l; i++) result += ` ${escapeHtml(token.attrs[i][0])}="${escapeHtml(String(token.attrs[i][1]))}"`;
				return result;
			}
			/**
			* Default token renderer. Can be overriden by custom function
			* in {@link Renderer.rules}.
			*/
			renderToken(tokens, idx, options) {
				const token = tokens[idx];
				let result = "";
				if (token.hidden) return "";
				let prev = idx - 1;
				while (prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === 0) prev--;
				if (token.block && token.nesting !== -1 && prev >= 0 && tokens[prev].hidden && tokens[prev].nesting === -1) result += "\n";
				result += (token.nesting === -1 ? "</" : "<") + token.tag;
				result += this.renderAttrs(token);
				if (token.nesting === 0 && options.xhtmlOut) result += " /";
				let needLf = false;
				if (token.block) {
					needLf = true;
					if (token.nesting === 1) {
						let next = idx + 1;
						while (next < tokens.length && tokens[next].hidden && tokens[next].nesting === 0) next++;
						if (next < tokens.length) {
							const nextToken = tokens[next];
							if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
							else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
						}
					}
				}
				result += needLf ? ">\n" : ">";
				return result;
			}
			/**
			* The same as {@link Renderer.render}, but for single token of `inline` type.
			*/
			renderInline(tokens, options, env) {
				let result = "";
				const rules = this.rules;
				for (let i = 0, len = tokens.length; i < len; i++) {
					const type = tokens[i].type;
					if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
					else result += this.renderToken(tokens, i, options);
				}
				return result;
			}
			/**
			* Special kludge for image `alt` attributes to conform CommonMark spec.
			* Don't try to use it! Spec requires to show `alt` content with stripped markup,
			* instead of simple escaping.
			*/
			renderInlineAsText(tokens, options, env) {
				let result = "";
				for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
					case "text":
					case "code_inline":
						result += tokens[i].content;
						break;
					case "image":
						result += this.renderInlineAsText(tokens[i].children, options, env);
						break;
					case "html_inline":
					case "html_block":
						result += tokens[i].content;
						break;
					case "softbreak":
					case "hardbreak": result += "\n";
				}
				return result;
			}
			/**
			* Takes token stream and generates HTML. Probably, you will never need to call
			* this method directly.
			*/
			render(tokens, options, env) {
				let result = "";
				const rules = this.rules;
				for (let i = 0, len = tokens.length; i < len; i++) {
					const type = tokens[i].type;
					if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
					else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
					else result += this.renderToken(tokens, i, options);
				}
				return result;
			}
		};
		/** Mutable state passed through the core rules chain. */
		var StateCore = class {
			constructor(src, md, env) {
				_defineProperty(this, "tokens", []);
				_defineProperty(this, "inlineMode", false);
				_defineProperty(this, "Token", Token);
				this.src = src;
				this.env = env;
				this.md = md;
			}
		};
		var UNNORMALIZED_NEWLINE_RE = /\r\n?/g;
		var NULL_RE = /\0/g;
		function normalize(state) {
			let str;
			str = state.src.replace(UNNORMALIZED_NEWLINE_RE, "\n");
			str = str.replace(NULL_RE, "�");
			state.src = str;
		}
		function block(state) {
			let token;
			if (state.inlineMode) {
				token = new state.Token("inline", "", 0);
				token.content = state.src;
				token.map = [0, 1];
				token.children = [];
				state.tokens.push(token);
			} else state.md.block.parse(state.src, state.md, state.env, state.tokens);
		}
		function strip_references(state) {
			const tokens = state.tokens;
			let last = 0;
			for (let curr = 0; curr < tokens.length; curr++) {
				if (tokens[curr].type === "reference_definition") continue;
				if (curr !== last) tokens[last] = tokens[curr];
				last++;
			}
			if (tokens.length !== last) tokens.length = last;
		}
		function inline(state) {
			const tokens = state.tokens;
			for (let i = 0, l = tokens.length; i < l; i++) {
				const tok = tokens[i];
				if (tok.type === "inline") state.md.inline.parse(tok.content, state.md, state.env, tok.children);
			}
		}
		function isLinkOpen$1(str) {
			return /^<a[>\s]/i.test(str);
		}
		function isLinkClose$1(str) {
			return /^<\/a\s*>/i.test(str);
		}
		function linkify$1(state) {
			const blockTokens = state.tokens;
			if (!state.md.options.linkify) return;
			for (let j = 0, l = blockTokens.length; j < l; j++) {
				if (blockTokens[j].type !== "inline" || !state.md.linkify.test(blockTokens[j].content)) continue;
				const tokens = blockTokens[j].children;
				const replacements = [];
				let htmlLinkLevel = 0;
				for (let i = tokens.length - 1; i >= 0; i--) {
					const currentToken = tokens[i];
					if (currentToken.type === "link_close") {
						i--;
						while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
						continue;
					}
					if (currentToken.type === "html_inline") {
						if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
						if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
					}
					if (htmlLinkLevel > 0) continue;
					if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
						const text = currentToken.content;
						let links = state.md.linkify.match(text);
						const nodes = [];
						let level = currentToken.level;
						let lastPos = 0;
						if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
						for (let ln = 0; ln < links.length; ln++) {
							const url = links[ln].url;
							const fullUrl = state.md.normalizeLink(url);
							if (!state.md.validateLink(fullUrl)) continue;
							let urlText = links[ln].text;
							if (!links[ln].schema) urlText = state.md.normalizeLinkText(`http://${urlText}`).replace(/^http:\/\//, "");
							else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state.md.normalizeLinkText(`mailto:${urlText}`).replace(/^mailto:/, "");
							else urlText = state.md.normalizeLinkText(urlText);
							const pos = links[ln].index;
							if (pos > lastPos) {
								const token = new state.Token("text", "", 0);
								token.content = text.slice(lastPos, pos);
								token.level = level;
								nodes.push(token);
							}
							const token_o = new state.Token("link_open", "a", 1);
							token_o.attrs = [["href", fullUrl]];
							token_o.level = level++;
							token_o.markup = "linkify";
							token_o.info = "auto";
							nodes.push(token_o);
							const token_t = new state.Token("text", "", 0);
							token_t.content = urlText;
							token_t.level = level;
							nodes.push(token_t);
							const token_c = new state.Token("link_close", "a", -1);
							token_c.level = --level;
							token_c.markup = "linkify";
							token_c.info = "auto";
							nodes.push(token_c);
							lastPos = links[ln].lastIndex;
						}
						if (lastPos < text.length) {
							const token = new state.Token("text", "", 0);
							token.content = text.slice(lastPos);
							token.level = level;
							nodes.push(token);
						}
						replacements.push({
							index: i,
							nodes
						});
					}
				}
				if (replacements.length > 0) {
					let newTokensLength = tokens.length;
					for (const replacement of replacements) newTokensLength += replacement.nodes.length - 1;
					const newTokens = new Array(newTokensLength);
					let replacementIndex = 0;
					let newTokenIndex = 0;
					replacements.reverse();
					for (let i = 0; i < tokens.length; i++) {
						const replacement = replacements[replacementIndex];
						if ((replacement === null || replacement === void 0 ? void 0 : replacement.index) === i) {
							for (const node of replacement.nodes) newTokens[newTokenIndex++] = node;
							replacementIndex++;
						} else newTokens[newTokenIndex++] = tokens[i];
					}
					blockTokens[j].children = newTokens;
				}
			}
		}
		var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
		var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
		var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
		var SCOPED_ABBR = {
			c: "©",
			r: "®",
			tm: "™"
		};
		function replaceFn(match, name) {
			return SCOPED_ABBR[name.toLowerCase()];
		}
		function replace_scoped(inlineTokens) {
			let inside_autolink = 0;
			for (let i = inlineTokens.length - 1; i >= 0; i--) {
				const token = inlineTokens[i];
				if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
				if (token.type === "link_open" && token.info === "auto") inside_autolink--;
				if (token.type === "link_close" && token.info === "auto") inside_autolink++;
			}
		}
		function replace_rare(inlineTokens) {
			let inside_autolink = 0;
			for (let i = inlineTokens.length - 1; i >= 0; i--) {
				const token = inlineTokens[i];
				if (token.type === "text" && !inside_autolink) {
					if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–");
				}
				if (token.type === "link_open" && token.info === "auto") inside_autolink--;
				if (token.type === "link_close" && token.info === "auto") inside_autolink++;
			}
		}
		function replace(state) {
			let blkIdx;
			if (!state.md.options.typographer) return;
			for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
				if (state.tokens[blkIdx].type !== "inline") continue;
				if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) replace_scoped(state.tokens[blkIdx].children);
				if (RARE_RE.test(state.tokens[blkIdx].content)) replace_rare(state.tokens[blkIdx].children);
			}
		}
		var QUOTE_TEST_RE = /['"]/;
		var QUOTE_RE = /['"]/g;
		var APOSTROPHE = "’";
		var MAX_OPENERS = 1e3;
		function truncateStack(stack, heads, length) {
			while (stack.length > length) {
				const item = stack.pop();
				if (item.isSingleQuote) heads.single = item.prevSameQuoteIdx;
				else heads.double = item.prevSameQuoteIdx;
			}
		}
		function addReplacement(replacements, tokenIdx, pos, ch) {
			if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
			replacements[tokenIdx].push({
				pos,
				ch
			});
		}
		function applyReplacements(str, replacements) {
			let result = "";
			let lastPos = 0;
			replacements.sort((a, b) => a.pos - b.pos);
			for (let i = 0; i < replacements.length; i++) {
				const replacement = replacements[i];
				result += str.slice(lastPos, replacement.pos) + replacement.ch;
				lastPos = replacement.pos + 1;
			}
			return result + str.slice(lastPos);
		}
		function process_inlines(tokens, state) {
			let j;
			const stack = [];
			const heads = {
				single: -1,
				double: -1
			};
			const replacements = {};
			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i];
				const thisLevel = tokens[i].level;
				for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
				truncateStack(stack, heads, j + 1);
				if (token.type !== "text") continue;
				const text = token.content;
				let pos = 0;
				const max = text.length;
				OUTER: while (pos < max) {
					QUOTE_RE.lastIndex = pos;
					const t = QUOTE_RE.exec(text);
					if (!t) break;
					let canOpen = true;
					let canClose = true;
					pos = t.index + 1;
					const isSingle = t[0] === "'";
					let lastChar = 32;
					if (t.index - 1 >= 0) lastChar = text.charCodeAt(t.index - 1);
					else for (j = i - 1; j >= 0; j--) {
						if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
						if (!tokens[j].content) continue;
						lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
						break;
					}
					let nextChar = 32;
					if (pos < max) nextChar = text.charCodeAt(pos);
					else for (j = i + 1; j < tokens.length; j++) {
						if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
						if (!tokens[j].content) continue;
						nextChar = tokens[j].content.charCodeAt(0);
						break;
					}
					const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
					const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
					const isLastWhiteSpace = isWhiteSpace(lastChar);
					const isNextWhiteSpace = isWhiteSpace(nextChar);
					if (isNextWhiteSpace) canOpen = false;
					else if (isNextPunctChar) {
						if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
					}
					if (isLastWhiteSpace) canClose = false;
					else if (isLastPunctChar) {
						if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
					}
					if (nextChar === 34 && t[0] === "\"") {
						if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
					}
					if (canOpen && canClose) {
						canOpen = isLastPunctChar;
						canClose = isNextPunctChar;
					}
					if (!canOpen && !canClose) {
						if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
						continue;
					}
					if (canClose) {
						j = isSingle ? heads.single : heads.double;
						if (j >= 0 && stack[j].level === thisLevel) {
							const item = stack[j];
							let openQuote;
							let closeQuote;
							if (isSingle) {
								openQuote = state.md.options.quotes[2];
								closeQuote = state.md.options.quotes[3];
							} else {
								openQuote = state.md.options.quotes[0];
								closeQuote = state.md.options.quotes[1];
							}
							addReplacement(replacements, i, t.index, closeQuote);
							addReplacement(replacements, item.tokenIdx, item.contentPos, openQuote);
							truncateStack(stack, heads, j);
							continue OUTER;
						}
					}
					if (canOpen) {
						if (stack.length >= MAX_OPENERS) return;
						stack.push({
							tokenIdx: i,
							contentPos: t.index,
							isSingleQuote: isSingle,
							level: thisLevel,
							prevSameQuoteIdx: isSingle ? heads.single : heads.double
						});
						if (isSingle) heads.single = stack.length - 1;
						else heads.double = stack.length - 1;
					} else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
				}
			}
			Object.keys(replacements).forEach(function(tokenIdx) {
				const idx = Number(tokenIdx);
				tokens[idx].content = applyReplacements(tokens[idx].content, replacements[tokenIdx]);
			});
		}
		function smartquotes(state) {
			if (!state.md.options.typographer) return;
			for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
				if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) continue;
				process_inlines(state.tokens[blkIdx].children, state);
			}
		}
		function join_alt(tokens) {
			let curr, last;
			const max = tokens.length;
			for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
			for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
			else {
				if (curr !== last) tokens[last] = tokens[curr];
				last++;
			}
			if (curr !== last) tokens.length = last;
		}
		function text_join(state) {
			let curr, last;
			const blockTokens = state.tokens;
			const l = blockTokens.length;
			for (let j = 0; j < l; j++) {
				if (blockTokens[j].type !== "inline") continue;
				const tokens = blockTokens[j].children;
				const max = tokens.length;
				for (curr = 0; curr < max; curr++) {
					if (tokens[curr].type === "text_special") tokens[curr].type = "text";
					if (tokens[curr].children) join_alt(tokens[curr].children);
				}
				for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
				else {
					if (curr !== last) tokens[last] = tokens[curr];
					last++;
				}
				if (curr !== last) tokens.length = last;
			}
		}
		var _rules$2 = [
			["normalize", normalize],
			["block", block],
			["strip_references", strip_references],
			["inline", inline],
			["linkify", linkify$1],
			["replacements", replace],
			["smartquotes", smartquotes],
			["text_join", text_join]
		];
		/**
		* Top-level rules executor. Glues block/inline parsers and does intermediate
		* transformations.
		*/
		var ParserCore = class {
			constructor() {
				_defineProperty(
					this,
					/**
					* {@link Ruler} instance. Keep configuration of core rules.
					*/
					"ruler",
					new Ruler()
				);
				_defineProperty(this, "State", StateCore);
				for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
			}
			/**
			* Executes core chain rules.
			*/
			process(state) {
				const rules = this.ruler.getRules("");
				for (let i = 0, l = rules.length; i < l; i++) rules[i](state);
			}
		};
		/** Mutable state passed to block rules while tokenizing a source document. */
		var StateBlock = class {
			constructor(src, md, env, tokens) {
				_defineProperty(this, "bMarks", []);
				_defineProperty(this, "eMarks", []);
				_defineProperty(this, "tShift", []);
				_defineProperty(this, "sCount", []);
				_defineProperty(this, "bsCount", []);
				_defineProperty(this, "blkIndent", 0);
				_defineProperty(this, "line", 0);
				_defineProperty(this, "lineMax", 0);
				_defineProperty(this, "tight", false);
				_defineProperty(this, "listIndent", -1);
				_defineProperty(this, "parentType", "root");
				_defineProperty(this, "level", 0);
				_defineProperty(this, "Token", Token);
				this.src = src;
				this.md = md;
				this.env = env;
				this.tokens = tokens;
				const s = this.src;
				for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
					const ch = s.charCodeAt(pos);
					if (!indent_found) {
						if (isSpace(ch)) {
							indent++;
							if (ch === 9) offset += 4 - offset % 4;
							else offset++;
							continue;
						} else indent_found = true;
					}
					if (ch === 10 || pos === len - 1) {
						if (ch !== 10) pos++;
						this.bMarks.push(start);
						this.eMarks.push(pos);
						this.tShift.push(indent);
						this.sCount.push(offset);
						this.bsCount.push(0);
						indent_found = false;
						indent = 0;
						offset = 0;
						start = pos + 1;
					}
				}
				this.bMarks.push(s.length);
				this.eMarks.push(s.length);
				this.tShift.push(0);
				this.sCount.push(0);
				this.bsCount.push(0);
				this.lineMax = this.bMarks.length - 1;
			}
			push(type, tag, nesting) {
				const token = new Token(type, tag, nesting);
				token.block = true;
				if (nesting < 0) this.level--;
				token.level = this.level;
				if (nesting > 0) this.level++;
				this.tokens.push(token);
				return token;
			}
			isEmpty(line) {
				return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
			}
			skipEmptyLines(from) {
				for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
				return from;
			}
			skipSpaces(pos) {
				for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
				return pos;
			}
			skipSpacesBack(pos, min) {
				if (pos <= min) return pos;
				while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
				return pos;
			}
			skipChars(pos, code) {
				for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code) break;
				return pos;
			}
			skipCharsBack(pos, code, min) {
				if (pos <= min) return pos;
				while (pos > min) if (code !== this.src.charCodeAt(--pos)) return pos + 1;
				return pos;
			}
			getLines(begin, end, indent, keepLastLF) {
				if (begin >= end) return "";
				const queue = new Array(end - begin);
				for (let i = 0, line = begin; line < end; line++, i++) {
					let lineIndent = 0;
					const lineStart = this.bMarks[line];
					let first = lineStart;
					let last;
					if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
					else last = this.eMarks[line];
					while (first < last && lineIndent < indent) {
						const ch = this.src.charCodeAt(first);
						if (isSpace(ch)) {
							if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
							else lineIndent++;
						} else if (first - lineStart < this.tShift[line]) lineIndent++;
						else break;
						first++;
					}
					if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
					else queue[i] = this.src.slice(first, last);
				}
				return queue.join("");
			}
		};
		var MAX_AUTOCOMPLETED_CELLS = 65536;
		function getLine(state, line) {
			const pos = state.bMarks[line] + state.tShift[line];
			const max = state.eMarks[line];
			return state.src.slice(pos, max);
		}
		function escapedSplit(str) {
			const result = [];
			const max = str.length;
			let pos = 0;
			let ch = str.charCodeAt(pos);
			let isEscaped = false;
			let lastPos = 0;
			let current = "";
			while (pos < max) {
				if (ch === 124) {
					if (!isEscaped) {
						result.push(current + str.substring(lastPos, pos));
						current = "";
						lastPos = pos + 1;
					} else {
						current += str.substring(lastPos, pos - 1);
						lastPos = pos;
					}
				}
				isEscaped = ch === 92;
				pos++;
				ch = str.charCodeAt(pos);
			}
			result.push(current + str.substring(lastPos));
			return result;
		}
		function table(state, startLine, endLine, silent) {
			if (startLine + 2 > endLine) return false;
			let nextLine = startLine + 1;
			if (state.sCount[nextLine] < state.blkIndent) return false;
			if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
			let pos = state.bMarks[nextLine] + state.tShift[nextLine];
			if (pos >= state.eMarks[nextLine]) return false;
			const firstCh = state.src.charCodeAt(pos++);
			if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
			if (pos >= state.eMarks[nextLine]) return false;
			const secondCh = state.src.charCodeAt(pos++);
			if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
			if (firstCh === 45 && isSpace(secondCh)) return false;
			while (pos < state.eMarks[nextLine]) {
				const ch = state.src.charCodeAt(pos);
				if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
				pos++;
			}
			let lineText = getLine(state, startLine + 1);
			let columns = lineText.split("|");
			const aligns = [];
			for (let i = 0; i < columns.length; i++) {
				const t = columns[i].trim();
				if (!t) {
					if (i === 0 || i === columns.length - 1) continue;
					else return false;
				}
				if (!/^:?-+:?$/.test(t)) return false;
				if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
				else if (t.charCodeAt(0) === 58) aligns.push("left");
				else aligns.push("");
			}
			lineText = getLine(state, startLine).trim();
			if (lineText.indexOf("|") === -1) return false;
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			columns = escapedSplit(lineText);
			if (columns.length && columns[0] === "") columns.shift();
			if (columns.length && columns[columns.length - 1] === "") columns.pop();
			const columnCount = columns.length;
			if (columnCount === 0 || columnCount !== aligns.length) return false;
			if (silent) return true;
			const oldParentType = state.parentType;
			state.parentType = "table";
			const terminatorRules = state.md.block.ruler.getRules("blockquote");
			const token_to = state.push("table_open", "table", 1);
			const tableLines = [startLine, 0];
			token_to.map = tableLines;
			const token_tho = state.push("thead_open", "thead", 1);
			token_tho.map = [startLine, startLine + 1];
			const token_htro = state.push("tr_open", "tr", 1);
			token_htro.map = [startLine, startLine + 1];
			for (let i = 0; i < columns.length; i++) {
				const token_ho = state.push("th_open", "th", 1);
				if (aligns[i]) token_ho.attrs = [["style", `text-align:${aligns[i]}`]];
				const token_il = state.push("inline", "", 0);
				token_il.content = columns[i].trim();
				token_il.children = [];
				state.push("th_close", "th", -1);
			}
			state.push("tr_close", "tr", -1);
			state.push("thead_close", "thead", -1);
			let tbodyLines;
			let autocompletedCells = 0;
			for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
				if (state.sCount[nextLine] < state.blkIndent) break;
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				if (terminate) break;
				lineText = getLine(state, nextLine).trim();
				if (!lineText) break;
				if (state.sCount[nextLine] - state.blkIndent >= 4) break;
				columns = escapedSplit(lineText);
				if (columns.length && columns[0] === "") columns.shift();
				if (columns.length && columns[columns.length - 1] === "") columns.pop();
				autocompletedCells += columnCount - columns.length;
				if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
				if (nextLine === startLine + 2) {
					const token_tbo = state.push("tbody_open", "tbody", 1);
					token_tbo.map = tbodyLines = [startLine + 2, 0];
				}
				const token_tro = state.push("tr_open", "tr", 1);
				token_tro.map = [nextLine, nextLine + 1];
				for (let i = 0; i < columnCount; i++) {
					const token_tdo = state.push("td_open", "td", 1);
					if (aligns[i]) token_tdo.attrs = [["style", `text-align:${aligns[i]}`]];
					const token_il = state.push("inline", "", 0);
					token_il.content = columns[i] ? columns[i].trim() : "";
					token_il.children = [];
					state.push("td_close", "td", -1);
				}
				state.push("tr_close", "tr", -1);
			}
			if (tbodyLines) {
				state.push("tbody_close", "tbody", -1);
				tbodyLines[1] = nextLine;
			}
			state.push("table_close", "table", -1);
			tableLines[1] = nextLine;
			state.parentType = oldParentType;
			state.line = nextLine;
			return true;
		}
		function code(state, startLine, endLine) {
			if (state.sCount[startLine] - state.blkIndent < 4) return false;
			let nextLine = startLine + 1;
			let last = nextLine;
			while (nextLine < endLine) {
				if (state.isEmpty(nextLine)) {
					nextLine++;
					continue;
				}
				if (state.sCount[nextLine] - state.blkIndent >= 4) {
					nextLine++;
					last = nextLine;
					continue;
				}
				break;
			}
			state.line = last;
			const token = state.push("code_block", "code", 0);
			token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
			token.map = [startLine, state.line];
			return true;
		}
		function fence(state, startLine, endLine, silent) {
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			let max = state.eMarks[startLine];
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			if (pos + 3 > max) return false;
			const marker = state.src.charCodeAt(pos);
			if (marker !== 126 && marker !== 96) return false;
			let mem = pos;
			pos = state.skipChars(pos, marker);
			let len = pos - mem;
			if (len < 3) return false;
			const markup = state.src.slice(mem, pos);
			const params = state.src.slice(pos, max);
			if (marker === 96) {
				if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
			}
			if (silent) return true;
			let nextLine = startLine;
			let haveEndMarker = false;
			for (;;) {
				nextLine++;
				if (nextLine >= endLine) break;
				pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
				max = state.eMarks[nextLine];
				if (pos < max && state.sCount[nextLine] < state.blkIndent) break;
				if (state.src.charCodeAt(pos) !== marker) continue;
				if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
				pos = state.skipChars(pos, marker);
				if (pos - mem < len) continue;
				pos = state.skipSpaces(pos);
				if (pos < max) continue;
				haveEndMarker = true;
				break;
			}
			len = state.sCount[startLine];
			state.line = nextLine + (haveEndMarker ? 1 : 0);
			const token = state.push("fence", "code", 0);
			token.info = params;
			token.content = state.getLines(startLine + 1, nextLine, len, true);
			token.markup = markup;
			token.map = [startLine, state.line];
			return true;
		}
		function blockquote(state, startLine, endLine, silent) {
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			let max = state.eMarks[startLine];
			const oldLineMax = state.lineMax;
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			if (state.src.charCodeAt(pos) !== 62) return false;
			if (silent) return true;
			const oldBMarks = [];
			const oldBSCount = [];
			const oldSCount = [];
			const oldTShift = [];
			const terminatorRules = state.md.block.ruler.getRules("blockquote");
			const oldParentType = state.parentType;
			state.parentType = "blockquote";
			let lastLineEmpty = false;
			let nextLine;
			for (nextLine = startLine; nextLine < endLine; nextLine++) {
				const isOutdented = state.sCount[nextLine] < state.blkIndent;
				pos = state.bMarks[nextLine] + state.tShift[nextLine];
				max = state.eMarks[nextLine];
				if (pos >= max) break;
				if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
					let initial = state.sCount[nextLine] + 1;
					let spaceAfterMarker;
					let adjustTab;
					if (state.src.charCodeAt(pos) === 32) {
						pos++;
						initial++;
						adjustTab = false;
						spaceAfterMarker = true;
					} else if (state.src.charCodeAt(pos) === 9) {
						spaceAfterMarker = true;
						if ((state.bsCount[nextLine] + initial) % 4 === 3) {
							pos++;
							initial++;
							adjustTab = false;
						} else adjustTab = true;
					} else spaceAfterMarker = false;
					let offset = initial;
					oldBMarks.push(state.bMarks[nextLine]);
					state.bMarks[nextLine] = pos;
					while (pos < max) {
						const ch = state.src.charCodeAt(pos);
						if (isSpace(ch)) {
							if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
							else offset++;
						} else break;
						pos++;
					}
					lastLineEmpty = pos >= max;
					oldBSCount.push(state.bsCount[nextLine]);
					state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
					oldSCount.push(state.sCount[nextLine]);
					state.sCount[nextLine] = offset - initial;
					oldTShift.push(state.tShift[nextLine]);
					state.tShift[nextLine] = pos - state.bMarks[nextLine];
					continue;
				}
				if (lastLineEmpty) break;
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				if (terminate) {
					state.lineMax = nextLine;
					if (state.blkIndent !== 0) {
						oldBMarks.push(state.bMarks[nextLine]);
						oldBSCount.push(state.bsCount[nextLine]);
						oldTShift.push(state.tShift[nextLine]);
						oldSCount.push(state.sCount[nextLine]);
						state.sCount[nextLine] -= state.blkIndent;
					}
					break;
				}
				oldBMarks.push(state.bMarks[nextLine]);
				oldBSCount.push(state.bsCount[nextLine]);
				oldTShift.push(state.tShift[nextLine]);
				oldSCount.push(state.sCount[nextLine]);
				state.sCount[nextLine] = -1;
			}
			const oldIndent = state.blkIndent;
			state.blkIndent = 0;
			const token_o = state.push("blockquote_open", "blockquote", 1);
			token_o.markup = ">";
			const lines = [startLine, 0];
			token_o.map = lines;
			state.md.block.tokenize(state, startLine, nextLine);
			const token_c = state.push("blockquote_close", "blockquote", -1);
			token_c.markup = ">";
			state.lineMax = oldLineMax;
			state.parentType = oldParentType;
			lines[1] = state.line;
			for (let i = 0; i < oldTShift.length; i++) {
				state.bMarks[i + startLine] = oldBMarks[i];
				state.tShift[i + startLine] = oldTShift[i];
				state.sCount[i + startLine] = oldSCount[i];
				state.bsCount[i + startLine] = oldBSCount[i];
			}
			state.blkIndent = oldIndent;
			return true;
		}
		function hr(state, startLine, endLine, silent) {
			const max = state.eMarks[startLine];
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			const marker = state.src.charCodeAt(pos++);
			if (marker !== 42 && marker !== 45 && marker !== 95) return false;
			let cnt = 1;
			while (pos < max) {
				const ch = state.src.charCodeAt(pos++);
				if (ch !== marker && !isSpace(ch)) return false;
				if (ch === marker) cnt++;
			}
			if (cnt < 3) return false;
			if (silent) return true;
			state.line = startLine + 1;
			const token = state.push("hr", "hr", 0);
			token.map = [startLine, state.line];
			token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
			return true;
		}
		function skipBulletListMarker(state, startLine) {
			const max = state.eMarks[startLine];
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			const marker = state.src.charCodeAt(pos++);
			if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
			if (pos < max) {
				if (!isSpace(state.src.charCodeAt(pos))) return -1;
			}
			return pos;
		}
		function skipOrderedListMarker(state, startLine) {
			const start = state.bMarks[startLine] + state.tShift[startLine];
			const max = state.eMarks[startLine];
			let pos = start;
			if (pos + 1 >= max) return -1;
			let ch = state.src.charCodeAt(pos++);
			if (ch < 48 || ch > 57) return -1;
			for (;;) {
				if (pos >= max) return -1;
				ch = state.src.charCodeAt(pos++);
				if (ch >= 48 && ch <= 57) {
					if (pos - start >= 10) return -1;
					continue;
				}
				if (ch === 41 || ch === 46) break;
				return -1;
			}
			if (pos < max) {
				ch = state.src.charCodeAt(pos);
				if (!isSpace(ch)) return -1;
			}
			return pos;
		}
		function markTightParagraphs(state, idx) {
			const level = state.level + 2;
			for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
				state.tokens[i + 2].hidden = true;
				state.tokens[i].hidden = true;
				i += 2;
			}
		}
		function list(state, startLine, endLine, silent) {
			let max, pos, start, token;
			let nextLine = startLine;
			let tight = true;
			if (state.sCount[nextLine] - state.blkIndent >= 4) return false;
			if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) return false;
			let isTerminatingParagraph = false;
			if (silent && state.parentType === "paragraph") {
				if (state.sCount[nextLine] >= state.blkIndent) isTerminatingParagraph = true;
			}
			let isOrdered;
			let markerValue;
			let posAfterMarker;
			if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
				isOrdered = true;
				start = state.bMarks[nextLine] + state.tShift[nextLine];
				markerValue = Number(state.src.slice(start, posAfterMarker - 1));
				if (isTerminatingParagraph && markerValue !== 1) return false;
			} else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) isOrdered = false;
			else return false;
			if (isTerminatingParagraph) {
				if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
			}
			if (silent) return true;
			const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
			const listTokIdx = state.tokens.length;
			if (isOrdered) {
				token = state.push("ordered_list_open", "ol", 1);
				if (markerValue !== 1) token.attrs = [["start", markerValue]];
			} else token = state.push("bullet_list_open", "ul", 1);
			const listLines = [nextLine, 0];
			token.map = listLines;
			token.markup = String.fromCharCode(markerCharCode);
			let prevEmptyEnd = false;
			const terminatorRules = state.md.block.ruler.getRules("list");
			const oldParentType = state.parentType;
			state.parentType = "list";
			while (nextLine < endLine) {
				pos = posAfterMarker;
				max = state.eMarks[nextLine];
				const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
				let offset = initial;
				while (pos < max) {
					const ch = state.src.charCodeAt(pos);
					if (ch === 9) offset += 4 - (offset + state.bsCount[nextLine]) % 4;
					else if (ch === 32) offset++;
					else break;
					pos++;
				}
				const contentStart = pos;
				let indentAfterMarker;
				if (contentStart >= max) indentAfterMarker = 1;
				else indentAfterMarker = offset - initial;
				if (indentAfterMarker > 4) indentAfterMarker = 1;
				const indent = initial + indentAfterMarker;
				token = state.push("list_item_open", "li", 1);
				token.markup = String.fromCharCode(markerCharCode);
				const itemLines = [nextLine, 0];
				token.map = itemLines;
				if (isOrdered) token.info = state.src.slice(start, posAfterMarker - 1);
				const oldTight = state.tight;
				const oldTShift = state.tShift[nextLine];
				const oldSCount = state.sCount[nextLine];
				const oldListIndent = state.listIndent;
				state.listIndent = state.blkIndent;
				state.blkIndent = indent;
				state.tight = true;
				state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
				state.sCount[nextLine] = offset;
				if (contentStart >= max && state.isEmpty(nextLine + 1)) state.line = Math.min(state.line + 2, endLine);
				else state.md.block.tokenize(state, nextLine, endLine);
				if (!state.tight || prevEmptyEnd) tight = false;
				prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
				state.blkIndent = state.listIndent;
				state.listIndent = oldListIndent;
				state.tShift[nextLine] = oldTShift;
				state.sCount[nextLine] = oldSCount;
				state.tight = oldTight;
				token = state.push("list_item_close", "li", -1);
				token.markup = String.fromCharCode(markerCharCode);
				nextLine = state.line;
				itemLines[1] = nextLine;
				if (nextLine >= endLine) break;
				if (state.sCount[nextLine] < state.blkIndent) break;
				if (state.sCount[nextLine] - state.blkIndent >= 4) break;
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				if (terminate) break;
				if (isOrdered) {
					posAfterMarker = skipOrderedListMarker(state, nextLine);
					if (posAfterMarker < 0) break;
					start = state.bMarks[nextLine] + state.tShift[nextLine];
				} else {
					posAfterMarker = skipBulletListMarker(state, nextLine);
					if (posAfterMarker < 0) break;
				}
				if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) break;
			}
			if (isOrdered) token = state.push("ordered_list_close", "ol", -1);
			else token = state.push("bullet_list_close", "ul", -1);
			token.markup = String.fromCharCode(markerCharCode);
			listLines[1] = nextLine;
			state.line = nextLine;
			state.parentType = oldParentType;
			if (tight) markTightParagraphs(state, listTokIdx);
			return true;
		}
		var MAX_LABEL_LENGTH = 999;
		function countCodePoints(str) {
			let length = str.length;
			for (let i = 0; i < str.length - 1; i++) {
				const high = str.charCodeAt(i);
				if (high < 55296 || high > 56319) continue;
				const low = str.charCodeAt(i + 1);
				if (low >= 56320 && low <= 57343) {
					length--;
					i++;
				}
			}
			return length;
		}
		function lineEnd(state, line) {
			return Math.min(state.eMarks[line] + 1, state.src.length);
		}
		function getNextLinePos(state, nextLine) {
			const endLine = state.lineMax;
			if (nextLine >= endLine || state.isEmpty(nextLine)) return -1;
			let isContinuation = false;
			if (state.sCount[nextLine] - state.blkIndent > 3) isContinuation = true;
			if (state.sCount[nextLine] < 0) isContinuation = true;
			if (!isContinuation) {
				const terminatorRules = state.md.block.ruler.getRules("reference");
				const oldParentType = state.parentType;
				state.parentType = "reference";
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				state.parentType = oldParentType;
				if (terminate) return -1;
			}
			return state.bMarks[nextLine] + state.tShift[nextLine];
		}
		function reference(state, startLine, _endLine, silent) {
			const src = state.src;
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			let nextLine = startLine + 1;
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			if (src.charCodeAt(pos) !== 91) return false;
			let max = lineEnd(state, startLine);
			let rawLabel = "";
			let labelEnd = -1;
			let segmentStart = ++pos;
			while (pos < max) {
				if (rawLabel.length + pos - segmentStart > MAX_LABEL_LENGTH * 2) return false;
				let ch = src.charCodeAt(pos);
				if (ch === 91) return false;
				if (ch === 93) {
					labelEnd = pos;
					break;
				}
				if (ch === 92) ch = src.charCodeAt(++pos);
				if (ch === 10 && pos < max) {
					const nextPos = getNextLinePos(state, nextLine);
					if (nextPos < 0) return false;
					rawLabel += src.slice(segmentStart, max);
					pos = segmentStart = nextPos;
					max = lineEnd(state, nextLine++);
					continue;
				}
				pos++;
			}
			if (labelEnd < 0 || src.charCodeAt(labelEnd + 1) !== 58) return false;
			rawLabel += src.slice(segmentStart, labelEnd);
			if (rawLabel.length > MAX_LABEL_LENGTH && countCodePoints(rawLabel) > MAX_LABEL_LENGTH) return false;
			pos = labelEnd + 2;
			while (pos < max) {
				const ch = src.charCodeAt(pos);
				if (ch === 10) {
					const nextPos = getNextLinePos(state, nextLine);
					if (nextPos < 0) break;
					pos = nextPos;
					max = lineEnd(state, nextLine++);
				} else if (isSpace(ch)) pos++;
				else break;
			}
			const destRes = state.md.helpers.parseLinkDestination(src, pos, max);
			if (!destRes.ok) return false;
			const href = state.md.normalizeLink(destRes.str);
			if (!state.md.validateLink(href)) return false;
			pos = destRes.pos;
			const destEndPos = pos;
			const destEndMax = max;
			const destEndLineNo = nextLine;
			while (pos < max) {
				const ch = src.charCodeAt(pos);
				if (ch === 10) {
					const nextPos = getNextLinePos(state, nextLine);
					if (nextPos < 0) break;
					pos = nextPos;
					max = lineEnd(state, nextLine++);
				} else if (isSpace(ch)) pos++;
				else break;
			}
			const titleStart = pos;
			let titleRes = state.md.helpers.parseLinkTitle(src, pos, max);
			while (titleRes.can_continue) {
				const nextPos = getNextLinePos(state, nextLine);
				if (nextPos < 0) break;
				pos = nextPos;
				max = lineEnd(state, nextLine++);
				titleRes = state.md.helpers.parseLinkTitle(src, pos, max, titleRes);
			}
			let title;
			if (titleStart !== destEndPos && titleRes.ok) {
				title = titleRes.str;
				pos = titleRes.pos;
			} else {
				title = "";
				pos = destEndPos;
				max = destEndMax;
				nextLine = destEndLineNo;
			}
			while (pos < max) {
				if (!isSpace(src.charCodeAt(pos))) break;
				pos++;
			}
			if (pos < max && src.charCodeAt(pos) !== 10) {
				if (title) {
					title = "";
					pos = destEndPos;
					max = destEndMax;
					nextLine = destEndLineNo;
					while (pos < max) {
						if (!isSpace(src.charCodeAt(pos))) break;
						pos++;
					}
				}
			}
			if (pos < max && src.charCodeAt(pos) !== 10) return false;
			const label = normalizeReference(rawLabel);
			if (!label) return false;
			/* istanbul ignore if */
			if (silent) return true;
			if (typeof state.env.references === "undefined") state.env.references = {};
			if (typeof state.env.references[label] === "undefined") state.env.references[label] = {
				title,
				href
			};
			const token = state.push("reference_definition", "", 0);
			token.map = [startLine, nextLine];
			token.hidden = true;
			const meta = Object.create(null);
			meta.label = label;
			token.meta = meta;
			state.line = nextLine;
			return true;
		}
		var html_blocks_default = [
			"address",
			"article",
			"aside",
			"base",
			"basefont",
			"blockquote",
			"body",
			"caption",
			"center",
			"col",
			"colgroup",
			"dd",
			"details",
			"dialog",
			"dir",
			"div",
			"dl",
			"dt",
			"fieldset",
			"figcaption",
			"figure",
			"footer",
			"form",
			"frame",
			"frameset",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"head",
			"header",
			"hr",
			"html",
			"iframe",
			"legend",
			"li",
			"link",
			"main",
			"menu",
			"menuitem",
			"nav",
			"noframes",
			"ol",
			"optgroup",
			"option",
			"p",
			"param",
			"search",
			"section",
			"summary",
			"table",
			"tbody",
			"td",
			"tfoot",
			"th",
			"thead",
			"title",
			"tr",
			"track",
			"ul"
		];
		var open_tag = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
		var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
		new RegExp(`^(?:${open_tag}|${close_tag}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
		var HTML_OPEN_CLOSE_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag})`);
		var HTML_SEQUENCES = [
			[
				/^<(script|pre|style|textarea)(?=(\s|>|$))/i,
				/<\/(script|pre|style|textarea)>/i,
				true
			],
			[
				/^<!--/,
				/-->/,
				true
			],
			[
				/^<\?/,
				/\?>/,
				true
			],
			[
				/^<![A-Za-z]/,
				/>/,
				true
			],
			[
				/^<!\[CDATA\[/,
				/\]\]>/,
				true
			],
			[
				new RegExp(`^</?(${html_blocks_default.join("|")})(?=(\\s|/?>|$))`, "i"),
				/^$/,
				true
			],
			[
				new RegExp(`${HTML_OPEN_CLOSE_TAG_RE.source}\\s*$`),
				/^$/,
				false
			]
		];
		function html_block(state, startLine, endLine, silent) {
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			let max = state.eMarks[startLine];
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			if (!state.md.options.html) return false;
			if (state.src.charCodeAt(pos) !== 60) return false;
			let lineText = state.src.slice(pos, max);
			let i = 0;
			for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
			if (i === HTML_SEQUENCES.length) return false;
			if (silent) return HTML_SEQUENCES[i][2];
			let nextLine = startLine + 1;
			const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
			if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
				if (state.sCount[nextLine] < state.blkIndent) {
					if (endsOnBlankLine || !state.isEmpty(nextLine)) break;
				}
				pos = state.bMarks[nextLine] + state.tShift[nextLine];
				max = state.eMarks[nextLine];
				lineText = state.src.slice(pos, max);
				if (HTML_SEQUENCES[i][1].test(lineText)) {
					if (lineText.length !== 0) nextLine++;
					break;
				}
			}
			state.line = nextLine;
			const token = state.push("html_block", "", 0);
			token.map = [startLine, nextLine];
			token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
			return true;
		}
		function heading(state, startLine, endLine, silent) {
			let pos = state.bMarks[startLine] + state.tShift[startLine];
			let max = state.eMarks[startLine];
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			let ch = state.src.charCodeAt(pos);
			if (ch !== 35 || pos >= max) return false;
			let level = 1;
			ch = state.src.charCodeAt(++pos);
			while (ch === 35 && pos < max && level <= 6) {
				level++;
				ch = state.src.charCodeAt(++pos);
			}
			if (level > 6 || pos < max && !isSpace(ch)) return false;
			if (silent) return true;
			max = state.skipSpacesBack(max, pos);
			const tmp = state.skipCharsBack(max, 35, pos);
			if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) max = tmp;
			state.line = startLine + 1;
			const token_o = state.push("heading_open", `h${level}`, 1);
			token_o.markup = "########".slice(0, level);
			token_o.map = [startLine, state.line];
			const token_i = state.push("inline", "", 0);
			token_i.content = asciiTrim(state.src.slice(pos, max));
			token_i.map = [startLine, state.line];
			token_i.children = [];
			const token_c = state.push("heading_close", `h${level}`, -1);
			token_c.markup = "########".slice(0, level);
			return true;
		}
		function lheading(state, startLine, endLine) {
			const terminatorRules = state.md.block.ruler.getRules("paragraph");
			if (state.sCount[startLine] - state.blkIndent >= 4) return false;
			const oldParentType = state.parentType;
			state.parentType = "paragraph";
			let level = 0;
			let marker;
			let nextLine = startLine + 1;
			for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
				if (state.sCount[nextLine] - state.blkIndent > 3) continue;
				if (state.sCount[nextLine] >= state.blkIndent) {
					let pos = state.bMarks[nextLine] + state.tShift[nextLine];
					const max = state.eMarks[nextLine];
					if (pos < max) {
						marker = state.src.charCodeAt(pos);
						if (marker === 45 || marker === 61) {
							pos = state.skipChars(pos, marker);
							pos = state.skipSpaces(pos);
							if (pos >= max) {
								level = marker === 61 ? 1 : 2;
								break;
							}
						}
					}
				}
				if (state.sCount[nextLine] < 0) continue;
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				if (terminate) break;
			}
			if (!level) {
				state.parentType = oldParentType;
				return false;
			}
			const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
			state.line = nextLine + 1;
			const token_o = state.push("heading_open", `h${level}`, 1);
			token_o.markup = String.fromCharCode(marker);
			token_o.map = [startLine, state.line];
			const token_i = state.push("inline", "", 0);
			token_i.content = content;
			token_i.map = [startLine, state.line - 1];
			token_i.children = [];
			const token_c = state.push("heading_close", `h${level}`, -1);
			token_c.markup = String.fromCharCode(marker);
			state.parentType = oldParentType;
			return true;
		}
		function paragraph(state, startLine, endLine) {
			const terminatorRules = state.md.block.ruler.getRules("paragraph");
			const oldParentType = state.parentType;
			let nextLine = startLine + 1;
			state.parentType = "paragraph";
			for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
				if (state.sCount[nextLine] - state.blkIndent > 3) continue;
				if (state.sCount[nextLine] < 0) continue;
				let terminate = false;
				for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state, nextLine, endLine, true)) {
					terminate = true;
					break;
				}
				if (terminate) break;
			}
			const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
			state.line = nextLine;
			const token_o = state.push("paragraph_open", "p", 1);
			token_o.map = [startLine, state.line];
			const token_i = state.push("inline", "", 0);
			token_i.content = content;
			token_i.map = [startLine, state.line];
			token_i.children = [];
			state.push("paragraph_close", "p", -1);
			state.parentType = oldParentType;
			return true;
		}
		var _rules$1 = [
			[
				"table",
				table,
				["paragraph", "reference"]
			],
			["code", code],
			[
				"fence",
				fence,
				[
					"paragraph",
					"reference",
					"blockquote",
					"list"
				]
			],
			[
				"blockquote",
				blockquote,
				[
					"paragraph",
					"reference",
					"blockquote",
					"list"
				]
			],
			[
				"hr",
				hr,
				[
					"paragraph",
					"reference",
					"blockquote",
					"list"
				]
			],
			[
				"list",
				list,
				[
					"paragraph",
					"reference",
					"blockquote"
				]
			],
			["reference", reference],
			[
				"html_block",
				html_block,
				[
					"paragraph",
					"reference",
					"blockquote"
				]
			],
			[
				"heading",
				heading,
				[
					"paragraph",
					"reference",
					"blockquote"
				]
			],
			["lheading", lheading],
			["paragraph", paragraph]
		];
		/**
		* Block-level tokenizer.
		*/
		var ParserBlock = class {
			constructor() {
				_defineProperty(
					this,
					/**
					* {@link Ruler} instance. Keep configuration of block rules.
					*/
					"ruler",
					new Ruler()
				);
				_defineProperty(this, "State", StateBlock);
				for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
			}
			tokenize(state, startLine, endLine) {
				const rules = this.ruler.getRules("");
				const len = rules.length;
				const maxNesting = state.md.options.maxNesting;
				let line = startLine;
				let hasEmptyLines = false;
				while (line < endLine) {
					state.line = line = state.skipEmptyLines(line);
					if (line >= endLine) break;
					if (state.sCount[line] < state.blkIndent) break;
					if (state.level >= maxNesting) {
						state.line = endLine;
						break;
					}
					const prevLine = state.line;
					let ok = false;
					for (let i = 0; i < len; i++) {
						ok = rules[i](state, line, endLine, false);
						if (ok) {
							if (prevLine >= state.line) throw new Error("block rule didn't increment state.line");
							break;
						}
					}
					if (!ok) throw new Error("none of the block rules matched");
					state.tight = !hasEmptyLines;
					if (state.isEmpty(state.line - 1)) hasEmptyLines = true;
					line = state.line;
					if (line < endLine && state.isEmpty(line)) {
						hasEmptyLines = true;
						line++;
						state.line = line;
					}
				}
			}
			/**
			* Process input string and push block tokens into `outTokens`
			*/
			parse(src, md, env, outTokens) {
				if (!src) return;
				const state = new this.State(src, md, env, outTokens);
				this.tokenize(state, state.line, state.lineMax);
			}
		};
		/** Mutable state passed to inline rules while tokenizing inline content. */
		var StateInline = class {
			constructor(src, md, env, outTokens) {
				_defineProperty(this, "pos", 0);
				_defineProperty(this, "level", 0);
				_defineProperty(this, "pending", "");
				_defineProperty(this, "pendingLevel", 0);
				_defineProperty(this, "cache", {});
				_defineProperty(this, "backticks", {});
				_defineProperty(this, "backticksScanned", false);
				_defineProperty(this, "skipHtmlSpecial", false);
				_defineProperty(this, "linkLevel", 0);
				_defineProperty(this, "delimiters", []);
				_defineProperty(this, "_prev_delimiters", []);
				_defineProperty(this, "Token", Token);
				this.src = src;
				this.env = env;
				this.md = md;
				this.tokens = outTokens;
				this.tokens_meta = Array(outTokens.length);
				this.posMax = this.src.length;
			}
			pushPending() {
				const token = new Token("text", "", 0);
				token.content = this.pending;
				token.level = this.pendingLevel;
				this.tokens.push(token);
				this.pending = "";
				return token;
			}
			push(type, tag, nesting) {
				if (this.pending) this.pushPending();
				const token = new Token(type, tag, nesting);
				let token_meta = void 0;
				if (nesting < 0) {
					this.level--;
					this.delimiters = this._prev_delimiters.pop();
				}
				token.level = this.level;
				if (nesting > 0) {
					this.level++;
					this._prev_delimiters.push(this.delimiters);
					this.delimiters = [];
					token_meta = { delimiters: this.delimiters };
				}
				this.pendingLevel = this.level;
				this.tokens.push(token);
				this.tokens_meta.push(token_meta);
				return token;
			}
			scanDelims(start, canSplitWord) {
				const max = this.posMax;
				const marker = this.src.charCodeAt(start);
				let lastChar;
				if (start === 0) lastChar = 32;
				else if (start === 1) {
					lastChar = this.src.charCodeAt(0);
					if ((lastChar & 63488) === 55296) lastChar = 65533;
				} else {
					lastChar = this.src.charCodeAt(start - 1);
					if ((lastChar & 64512) === 56320) {
						const highSurr = this.src.charCodeAt(start - 2);
						lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
					} else if ((lastChar & 64512) === 55296) lastChar = 65533;
				}
				let pos = start;
				while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
				const count = pos - start;
				let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
				if ((nextChar & 64512) === 55296) {
					const lowSurr = this.src.charCodeAt(pos + 1);
					nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
				} else if ((nextChar & 64512) === 56320) nextChar = 65533;
				const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
				const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
				const isLastWhiteSpace = isWhiteSpace(lastChar);
				const isNextWhiteSpace = isWhiteSpace(nextChar);
				const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
				const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
				return {
					can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
					can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
					length: count
				};
			}
		};
		function isTerminatorChar(ch) {
			switch (ch) {
				case 10:
				case 33:
				case 35:
				case 36:
				case 37:
				case 38:
				case 42:
				case 43:
				case 45:
				case 58:
				case 60:
				case 61:
				case 62:
				case 64:
				case 91:
				case 92:
				case 93:
				case 94:
				case 95:
				case 96:
				case 123:
				case 125:
				case 126: return true;
				default: return false;
			}
		}
		function text(state, silent) {
			let pos = state.pos;
			while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) pos++;
			if (pos === state.pos) return false;
			if (!silent) state.pending += state.src.slice(state.pos, pos);
			state.pos = pos;
			return true;
		}
		function isAsciiAlpha(code) {
			return code >= 65 && code <= 90 || code >= 97 && code <= 122;
		}
		function isSchemeChar(code) {
			return code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 43 || code === 45 || code === 46;
		}
		function linkify(state, silent) {
			if (!state.md.options.linkify) return false;
			if (state.linkLevel > 0) return false;
			const pos = state.pos;
			const max = state.posMax;
			if (pos + 3 > max) return false;
			if (state.src.charCodeAt(pos) !== 58) return false;
			if (state.src.charCodeAt(pos + 1) !== 47) return false;
			if (state.src.charCodeAt(pos + 2) !== 47) return false;
			const protoMin = pos - Math.min(10, state.pending.length, pos);
			let protoStart = pos;
			while (protoStart > protoMin && isSchemeChar(state.src.charCodeAt(protoStart - 1))) protoStart--;
			if (protoStart === pos || !isAsciiAlpha(state.src.charCodeAt(protoStart))) return false;
			const protoLength = pos - protoStart;
			const link = state.md.linkify.matchAtStart(state.src.slice(protoStart));
			if (!link) return false;
			let url = link.url;
			if (url.length <= protoLength) return false;
			let urlEnd = url.length;
			while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
			if (urlEnd !== url.length) url = url.slice(0, urlEnd);
			const fullUrl = state.md.normalizeLink(url);
			if (!state.md.validateLink(fullUrl)) return false;
			if (!silent) {
				state.pending = state.pending.slice(0, -protoLength);
				const token_o = state.push("link_open", "a", 1);
				token_o.attrs = [["href", fullUrl]];
				token_o.markup = "linkify";
				token_o.info = "auto";
				const token_t = state.push("text", "", 0);
				token_t.content = state.md.normalizeLinkText(url);
				const token_c = state.push("link_close", "a", -1);
				token_c.markup = "linkify";
				token_c.info = "auto";
			}
			state.pos += url.length - protoLength;
			return true;
		}
		function newline(state, silent) {
			let pos = state.pos;
			if (state.src.charCodeAt(pos) !== 10) return false;
			const pmax = state.pending.length - 1;
			const max = state.posMax;
			if (!silent) {
				if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
					if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
						let ws = pmax - 1;
						while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
						state.pending = state.pending.slice(0, ws);
						state.push("hardbreak", "br", 0);
					} else {
						state.pending = state.pending.slice(0, -1);
						state.push("softbreak", "br", 0);
					}
				} else state.push("softbreak", "br", 0);
			}
			pos++;
			while (pos < max && isSpace(state.src.charCodeAt(pos))) pos++;
			state.pos = pos;
			return true;
		}
		var ESCAPED = [];
		for (let i = 0; i < 256; i++) ESCAPED.push(0);
		"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
			ESCAPED[ch.charCodeAt(0)] = 1;
		});
		function escape(state, silent) {
			let pos = state.pos;
			const max = state.posMax;
			if (state.src.charCodeAt(pos) !== 92) return false;
			pos++;
			if (pos >= max) return false;
			let ch1 = state.src.charCodeAt(pos);
			if (ch1 === 10) {
				if (!silent) state.push("hardbreak", "br", 0);
				pos++;
				while (pos < max) {
					ch1 = state.src.charCodeAt(pos);
					if (!isSpace(ch1)) break;
					pos++;
				}
				state.pos = pos;
				return true;
			}
			if (ch1 === 32) {
				if (!silent) {
					const token = state.push("text_special", "", 0);
					token.content = "\\";
					token.markup = "\\";
					token.info = "escape";
				}
				state.pos = pos;
				return true;
			}
			let escapedStr = state.src[pos];
			if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
				const ch2 = state.src.charCodeAt(pos + 1);
				if (ch2 >= 56320 && ch2 <= 57343) {
					escapedStr += state.src[pos + 1];
					pos++;
				}
			}
			const origStr = "\\" + escapedStr;
			if (!silent) {
				const token = state.push("text_special", "", 0);
				if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
				else token.content = origStr;
				token.markup = origStr;
				token.info = "escape";
			}
			state.pos = pos + 1;
			return true;
		}
		function buildLastRuns(src) {
			const lastRuns = {};
			let pos = 0;
			while ((pos = src.indexOf("`", pos)) !== -1) {
				const start = pos;
				while (src.charCodeAt(++pos) === 96);
				lastRuns[pos - start] = start;
			}
			return lastRuns;
		}
		function backtick(state, silent) {
			var _state$backticks$open;
			const start = state.pos;
			if (state.src.charCodeAt(start) !== 96) return false;
			const max = state.posMax;
			let pos = start + 1;
			while (pos < max && state.src.charCodeAt(pos) === 96) pos++;
			const marker = state.src.slice(start, pos);
			const openerLength = marker.length;
			if (!state.backticksScanned) {
				state.backticks = buildLastRuns(state.src);
				state.backticksScanned = true;
			}
			if (((_state$backticks$open = state.backticks[openerLength]) !== null && _state$backticks$open !== void 0 ? _state$backticks$open : -1) >= pos) {
				let matchEnd = pos;
				let matchStart;
				while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1 && matchStart < max) {
					matchEnd = matchStart + 1;
					while (state.src.charCodeAt(matchEnd) === 96) matchEnd++;
					if (matchEnd > max) break;
					if (matchEnd - matchStart === openerLength) {
						if (!silent) {
							const token = state.push("code_inline", "code", 0);
							token.markup = marker;
							let content = state.src.slice(pos, matchStart).replace(/\n/g, " ");
							if (content.startsWith(" ") && content.endsWith(" ") && /[^ ]/.test(content)) content = content.slice(1, -1);
							token.content = content;
						}
						state.pos = matchEnd;
						return true;
					}
				}
			}
			if (!silent) state.pending += marker;
			state.pos = pos;
			return true;
		}
		function strikethrough_tokenize(state, silent) {
			const start = state.pos;
			const marker = state.src.charCodeAt(start);
			if (silent) return false;
			if (marker !== 126) return false;
			const scanned = state.scanDelims(state.pos, true);
			let len = scanned.length;
			const ch = String.fromCharCode(marker);
			if (len < 2) return false;
			let token;
			if (len % 2) {
				token = state.push("text", "", 0);
				token.content = ch;
				len--;
			}
			for (let i = 0; i < len; i += 2) {
				token = state.push("text", "", 0);
				token.content = ch + ch;
				state.delimiters.push({
					marker,
					length: 0,
					token: state.tokens.length - 1,
					end: -1,
					open: scanned.can_open,
					close: scanned.can_close
				});
			}
			state.pos += scanned.length;
			return true;
		}
		function postProcess$1(state, delimiters) {
			let token;
			const loneMarkers = [];
			const max = delimiters.length;
			for (let i = 0; i < max; i++) {
				const startDelim = delimiters[i];
				if (startDelim.marker !== 126) continue;
				if (startDelim.end === -1) continue;
				const endDelim = delimiters[startDelim.end];
				token = state.tokens[startDelim.token];
				token.type = "s_open";
				token.tag = "s";
				token.nesting = 1;
				token.markup = "~~";
				token.content = "";
				token = state.tokens[endDelim.token];
				token.type = "s_close";
				token.tag = "s";
				token.nesting = -1;
				token.markup = "~~";
				token.content = "";
				if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
			}
			while (loneMarkers.length) {
				const i = loneMarkers.pop();
				let j = i + 1;
				while (j < state.tokens.length && state.tokens[j].type === "s_close") j++;
				j--;
				if (i !== j) {
					token = state.tokens[j];
					state.tokens[j] = state.tokens[i];
					state.tokens[i] = token;
				}
			}
		}
		function strikethrough_postProcess(state) {
			const tokens_meta = state.tokens_meta;
			const max = state.tokens_meta.length;
			postProcess$1(state, state.delimiters);
			for (let curr = 0; curr < max; curr++) {
				var _tokens_meta$curr;
				const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
				if (delimiters) postProcess$1(state, delimiters);
			}
		}
		var strikethrough_default = {
			tokenize: strikethrough_tokenize,
			postProcess: strikethrough_postProcess
		};
		function emphasis_tokenize(state, silent) {
			const start = state.pos;
			const marker = state.src.charCodeAt(start);
			if (silent) return false;
			if (marker !== 95 && marker !== 42) return false;
			const scanned = state.scanDelims(state.pos, marker === 42);
			for (let i = 0; i < scanned.length; i++) {
				const token = state.push("text", "", 0);
				token.content = String.fromCharCode(marker);
				state.delimiters.push({
					marker,
					length: scanned.length,
					token: state.tokens.length - 1,
					end: -1,
					open: scanned.can_open,
					close: scanned.can_close
				});
			}
			state.pos += scanned.length;
			return true;
		}
		function postProcess(state, delimiters) {
			const max = delimiters.length;
			for (let i = max - 1; i >= 0; i--) {
				const startDelim = delimiters[i];
				if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
				if (startDelim.end === -1) continue;
				const endDelim = delimiters[startDelim.end];
				const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
				const ch = String.fromCharCode(startDelim.marker);
				const token_o = state.tokens[startDelim.token];
				token_o.type = isStrong ? "strong_open" : "em_open";
				token_o.tag = isStrong ? "strong" : "em";
				token_o.nesting = 1;
				token_o.markup = isStrong ? ch + ch : ch;
				token_o.content = "";
				const token_c = state.tokens[endDelim.token];
				token_c.type = isStrong ? "strong_close" : "em_close";
				token_c.tag = isStrong ? "strong" : "em";
				token_c.nesting = -1;
				token_c.markup = isStrong ? ch + ch : ch;
				token_c.content = "";
				if (isStrong) {
					state.tokens[delimiters[i - 1].token].content = "";
					state.tokens[delimiters[startDelim.end + 1].token].content = "";
					i--;
				}
			}
		}
		function emphasis_post_process(state) {
			const tokens_meta = state.tokens_meta;
			const max = state.tokens_meta.length;
			postProcess(state, state.delimiters);
			for (let curr = 0; curr < max; curr++) {
				var _tokens_meta$curr;
				const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
				if (delimiters) postProcess(state, delimiters);
			}
		}
		var emphasis_default = {
			tokenize: emphasis_tokenize,
			postProcess: emphasis_post_process
		};
		function link(state, silent) {
			let code, label, res, ref;
			let href = "";
			let title = "";
			let start = state.pos;
			let parseReference = true;
			if (state.src.charCodeAt(state.pos) !== 91) return false;
			const oldPos = state.pos;
			const max = state.posMax;
			const labelStart = state.pos + 1;
			const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
			if (labelEnd < 0) return false;
			let pos = labelEnd + 1;
			if (pos < max && state.src.charCodeAt(pos) === 40) {
				parseReference = false;
				pos++;
				for (; pos < max; pos++) {
					code = state.src.charCodeAt(pos);
					if (!isSpace(code) && code !== 10) break;
				}
				if (pos >= max) return false;
				start = pos;
				res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
				if (res.ok) {
					href = state.md.normalizeLink(res.str);
					if (state.md.validateLink(href)) pos = res.pos;
					else href = "";
					start = pos;
					for (; pos < max; pos++) {
						code = state.src.charCodeAt(pos);
						if (!isSpace(code) && code !== 10) break;
					}
					res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
					if (pos < max && start !== pos && res.ok) {
						title = res.str;
						pos = res.pos;
						for (; pos < max; pos++) {
							code = state.src.charCodeAt(pos);
							if (!isSpace(code) && code !== 10) break;
						}
					}
				}
				if (pos >= max || state.src.charCodeAt(pos) !== 41) parseReference = true;
				pos++;
			}
			if (parseReference) {
				if (typeof state.env.references === "undefined") return false;
				if (pos < max && state.src.charCodeAt(pos) === 91) {
					start = pos + 1;
					pos = state.md.helpers.parseLinkLabel(state, pos);
					if (pos >= 0) label = state.src.slice(start, pos++);
					else pos = labelEnd + 1;
				} else pos = labelEnd + 1;
				if (!label) label = state.src.slice(labelStart, labelEnd);
				label = normalizeReference(label);
				ref = state.env.references[label];
				if (!ref) {
					state.pos = oldPos;
					return false;
				}
				href = ref.href;
				title = ref.title;
			}
			if (!silent) {
				state.pos = labelStart;
				state.posMax = labelEnd;
				const token_o = state.push("link_open", "a", 1);
				const attrs = [["href", href]];
				token_o.attrs = attrs;
				if (title) attrs.push(["title", title]);
				if (label) {
					const meta = Object.create(null);
					meta.label = label;
					token_o.meta = meta;
				}
				state.linkLevel++;
				state.md.inline.tokenize(state);
				state.linkLevel--;
				state.push("link_close", "a", -1);
			}
			state.pos = pos;
			state.posMax = max;
			return true;
		}
		function image(state, silent) {
			let code, content, label, pos, ref, res, title, start;
			let href = "";
			const oldPos = state.pos;
			const max = state.posMax;
			if (state.src.charCodeAt(state.pos) !== 33) return false;
			if (state.src.charCodeAt(state.pos + 1) !== 91) return false;
			const labelStart = state.pos + 2;
			const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
			if (labelEnd < 0) return false;
			pos = labelEnd + 1;
			if (pos < max && state.src.charCodeAt(pos) === 40) {
				pos++;
				for (; pos < max; pos++) {
					code = state.src.charCodeAt(pos);
					if (!isSpace(code) && code !== 10) break;
				}
				if (pos >= max) return false;
				start = pos;
				res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
				if (res.ok) {
					href = state.md.normalizeLink(res.str);
					if (state.md.validateLink(href)) pos = res.pos;
					else href = "";
				}
				start = pos;
				for (; pos < max; pos++) {
					code = state.src.charCodeAt(pos);
					if (!isSpace(code) && code !== 10) break;
				}
				res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
				if (pos < max && start !== pos && res.ok) {
					title = res.str;
					pos = res.pos;
					for (; pos < max; pos++) {
						code = state.src.charCodeAt(pos);
						if (!isSpace(code) && code !== 10) break;
					}
				} else title = "";
				if (pos >= max || state.src.charCodeAt(pos) !== 41) {
					state.pos = oldPos;
					return false;
				}
				pos++;
			} else {
				if (typeof state.env.references === "undefined") return false;
				if (pos < max && state.src.charCodeAt(pos) === 91) {
					start = pos + 1;
					pos = state.md.helpers.parseLinkLabel(state, pos);
					if (pos >= 0) label = state.src.slice(start, pos++);
					else pos = labelEnd + 1;
				} else pos = labelEnd + 1;
				if (!label) label = state.src.slice(labelStart, labelEnd);
				label = normalizeReference(label);
				ref = state.env.references[label];
				if (!ref) {
					state.pos = oldPos;
					return false;
				}
				href = ref.href;
				title = ref.title;
			}
			if (!silent) {
				content = state.src.slice(labelStart, labelEnd);
				const tokens = [];
				state.md.inline.parse(content, state.md, state.env, tokens);
				const token = state.push("image", "img", 0);
				const attrs = [["src", href], ["alt", ""]];
				token.attrs = attrs;
				token.children = tokens;
				token.content = content;
				if (title) attrs.push(["title", title]);
				if (label) {
					const meta = Object.create(null);
					meta.label = label;
					token.meta = meta;
				}
			}
			state.pos = pos;
			state.posMax = max;
			return true;
		}
		var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
		var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
		function autolink(state, silent) {
			let pos = state.pos;
			if (state.src.charCodeAt(pos) !== 60) return false;
			const start = state.pos;
			const max = state.posMax;
			for (;;) {
				if (++pos >= max) return false;
				const ch = state.src.charCodeAt(pos);
				if (ch === 60) return false;
				if (ch === 62) break;
			}
			const url = state.src.slice(start + 1, pos);
			if (AUTOLINK_RE.test(url)) {
				const fullUrl = state.md.normalizeLink(url);
				if (!state.md.validateLink(fullUrl)) return false;
				if (!silent) {
					const token_o = state.push("link_open", "a", 1);
					token_o.attrs = [["href", fullUrl]];
					token_o.markup = "autolink";
					token_o.info = "auto";
					const token_t = state.push("text", "", 0);
					token_t.content = state.md.normalizeLinkText(url);
					const token_c = state.push("link_close", "a", -1);
					token_c.markup = "autolink";
					token_c.info = "auto";
				}
				state.pos += url.length + 2;
				return true;
			}
			if (EMAIL_RE.test(url)) {
				const fullUrl = state.md.normalizeLink(`mailto:${url}`);
				if (!state.md.validateLink(fullUrl)) return false;
				if (!silent) {
					const token_o = state.push("link_open", "a", 1);
					token_o.attrs = [["href", fullUrl]];
					token_o.markup = "autolink";
					token_o.info = "auto";
					const token_t = state.push("text", "", 0);
					token_t.content = state.md.normalizeLinkText(url);
					const token_c = state.push("link_close", "a", -1);
					token_c.markup = "autolink";
					token_c.info = "auto";
				}
				state.pos += url.length + 2;
				return true;
			}
			return false;
		}
		function isLinkOpen(str) {
			return /^<a[>\s]/i.test(str);
		}
		function isLinkClose(str) {
			return /^<\/a\s*>/i.test(str);
		}
		function isLetter(ch) {
			const lc = ch | 32;
			return lc >= 97 && lc <= 122;
		}
		function scanSpecial(state, pos) {
			const src = state.src;
			let start;
			let terminator;
			if (src.startsWith("<!--", pos)) {
				if (src.startsWith(">", pos + 4)) return pos + 5;
				if (src.startsWith("->", pos + 4)) return pos + 6;
				start = pos + 4;
				terminator = "-->";
			} else if (src.startsWith("<![CDATA[", pos)) {
				start = pos + 9;
				terminator = "]]>";
			} else if (src.charCodeAt(pos + 1) === 63) {
				start = pos + 2;
				terminator = "?>";
			} else if (isLetter(src.charCodeAt(pos + 2))) {
				start = pos + 3;
				terminator = ">";
			} else return -1;
			if (state.skipHtmlSpecial) return -1;
			const end = src.indexOf(terminator, start);
			if (end < 0) {
				state.skipHtmlSpecial = true;
				return -1;
			}
			return end + terminator.length;
		}
		function html_inline(state, silent) {
			if (!state.md.options.html) return false;
			const max = state.posMax;
			const pos = state.pos;
			if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
			let end;
			const ch = state.src.charCodeAt(pos + 1);
			if (ch === 33 || ch === 63) end = scanSpecial(state, pos);
			else if (ch === 47 || isLetter(ch)) {
				const match = state.src.slice(pos).match(HTML_OPEN_CLOSE_TAG_RE);
				end = match ? pos + match[0].length : -1;
			} else return false;
			if (end < 0) return false;
			if (!silent) {
				const token = state.push("html_inline", "", 0);
				token.content = state.src.slice(pos, end);
				if (isLinkOpen(token.content)) state.linkLevel++;
				if (isLinkClose(token.content)) state.linkLevel--;
			}
			state.pos = end;
			return true;
		}
		var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
		var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
		function entity(state, silent) {
			const pos = state.pos;
			const max = state.posMax;
			if (state.src.charCodeAt(pos) !== 38) return false;
			if (pos + 1 >= max) return false;
			if (state.src.charCodeAt(pos + 1) === 35) {
				const match = state.src.slice(pos).match(DIGITAL_RE);
				if (match) {
					if (!silent) {
						const code = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
						const token = state.push("text_special", "", 0);
						token.content = isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(65533);
						token.markup = match[0];
						token.info = "entity";
					}
					state.pos += match[0].length;
					return true;
				}
			} else {
				const match = state.src.slice(pos).match(NAMED_RE);
				if (match) {
					const decoded = decodeHTMLStrict(match[0]);
					if (decoded !== match[0]) {
						if (!silent) {
							const token = state.push("text_special", "", 0);
							token.content = decoded;
							token.markup = match[0];
							token.info = "entity";
						}
						state.pos += match[0].length;
						return true;
					}
				}
			}
			return false;
		}
		function processDelimiters(delimiters) {
			const openersBottom = {};
			const max = delimiters.length;
			if (!max) return;
			let headerIdx = 0;
			let lastTokenIdx = -2;
			const jumps = [];
			for (let closerIdx = 0; closerIdx < max; closerIdx++) {
				const closer = delimiters[closerIdx];
				jumps.push(0);
				if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
				lastTokenIdx = closer.token;
				closer.length = closer.length || 0;
				if (!closer.close) continue;
				if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
					-1,
					-1,
					-1,
					-1,
					-1,
					-1
				];
				const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
				let openerIdx = headerIdx - jumps[headerIdx] - 1;
				let newMinOpenerIdx = openerIdx;
				for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
					const opener = delimiters[openerIdx];
					if (opener.marker !== closer.marker) continue;
					if (opener.open && opener.end < 0) {
						let isOddMatch = false;
						if (opener.close || closer.open) {
							if ((opener.length + closer.length) % 3 === 0) {
								if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
							}
						}
						if (!isOddMatch) {
							const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
							jumps[closerIdx] = closerIdx - openerIdx + lastJump;
							jumps[openerIdx] = lastJump;
							closer.open = false;
							opener.end = closerIdx;
							opener.close = false;
							newMinOpenerIdx = -1;
							lastTokenIdx = -2;
							break;
						}
					}
				}
				if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
			}
		}
		function link_pairs(state) {
			const tokens_meta = state.tokens_meta;
			const max = state.tokens_meta.length;
			processDelimiters(state.delimiters);
			for (let curr = 0; curr < max; curr++) {
				var _tokens_meta$curr;
				const delimiters = (_tokens_meta$curr = tokens_meta[curr]) === null || _tokens_meta$curr === void 0 ? void 0 : _tokens_meta$curr.delimiters;
				if (delimiters) processDelimiters(delimiters);
			}
		}
		function fragments_join(state) {
			let curr, last;
			let level = 0;
			const tokens = state.tokens;
			const max = state.tokens.length;
			for (curr = last = 0; curr < max; curr++) {
				if (tokens[curr].nesting < 0) level--;
				tokens[curr].level = level;
				if (tokens[curr].nesting > 0) level++;
				if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
				else {
					if (curr !== last) tokens[last] = tokens[curr];
					last++;
				}
			}
			if (curr !== last) tokens.length = last;
		}
		var _rules = [
			["text", text],
			["linkify", linkify],
			["newline", newline],
			["escape", escape],
			["backticks", backtick],
			["strikethrough", strikethrough_default.tokenize],
			["emphasis", emphasis_default.tokenize],
			["link", link],
			["image", image],
			["autolink", autolink],
			["html_inline", html_inline],
			["entity", entity]
		];
		var _rules2 = [
			["balance_pairs", link_pairs],
			["strikethrough", strikethrough_default.postProcess],
			["emphasis", emphasis_default.postProcess],
			["fragments_join", fragments_join]
		];
		/**
		* Tokenizes paragraph content.
		*/
		var ParserInline = class {
			constructor() {
				_defineProperty(
					this,
					/**
					* {@link Ruler} instance. Keep configuration of inline rules.
					*/
					"ruler",
					new Ruler()
				);
				_defineProperty(
					this,
					/**
					* {@link Ruler} instance. Second ruler used for post-processing
					* (e.g. in emphasis-like rules).
					*/
					"ruler2",
					new Ruler()
				);
				_defineProperty(this, "State", StateInline);
				for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
				for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
			}
			skipToken(state) {
				const pos = state.pos;
				const rules = this.ruler.getRules("");
				const len = rules.length;
				const maxNesting = state.md.options.maxNesting;
				const cache = state.cache;
				if (typeof cache[pos] !== "undefined") {
					state.pos = cache[pos];
					return;
				}
				let ok = false;
				if (state.level < maxNesting) for (let i = 0; i < len; i++) {
					state.level++;
					ok = rules[i](state, true);
					state.level--;
					if (ok) {
						if (pos >= state.pos) throw new Error("inline rule didn't increment state.pos");
						break;
					}
				}
				else state.pos = state.posMax;
				if (!ok) state.pos++;
				cache[pos] = state.pos;
			}
			tokenize(state) {
				const rules = this.ruler.getRules("");
				const len = rules.length;
				const end = state.posMax;
				const maxNesting = state.md.options.maxNesting;
				while (state.pos < end) {
					const prevPos = state.pos;
					let ok = false;
					if (state.level < maxNesting) for (let i = 0; i < len; i++) {
						ok = rules[i](state, false);
						if (ok) {
							if (prevPos >= state.pos) throw new Error("inline rule didn't increment state.pos");
							break;
						}
					}
					if (ok) {
						if (state.pos >= end) break;
						continue;
					}
					state.pending += state.src[state.pos++];
				}
				if (state.pending) state.pushPending();
			}
			/**
			* Process input string and push inline tokens into `outTokens`
			*/
			parse(str, md, env, outTokens) {
				const state = new this.State(str, md, env, outTokens);
				this.tokenize(state);
				const rules = this.ruler2.getRules("");
				const len = rules.length;
				for (let i = 0; i < len; i++) rules[i](state);
			}
		};
		var config = {
			default: {
				options: {
					html: false,
					xhtmlOut: false,
					breaks: false,
					langPrefix: "language-",
					linkify: false,
					typographer: false,
					quotes: "“”‘’",
					highlight: null,
					maxNesting: 100
				},
				components: {
					core: {},
					block: {},
					inline: {}
				}
			},
			zero: {
				options: {
					html: false,
					xhtmlOut: false,
					breaks: false,
					langPrefix: "language-",
					linkify: false,
					typographer: false,
					quotes: "“”‘’",
					highlight: null,
					maxNesting: 20
				},
				components: {
					core: { rules: [
						"normalize",
						"block",
						"strip_references",
						"inline",
						"text_join"
					] },
					block: { rules: ["paragraph"] },
					inline: {
						rules: ["text"],
						rules2: ["balance_pairs", "fragments_join"]
					}
				}
			},
			commonmark: {
				options: {
					html: true,
					xhtmlOut: true,
					breaks: false,
					langPrefix: "language-",
					linkify: false,
					typographer: false,
					quotes: "“”‘’",
					highlight: null,
					maxNesting: 20
				},
				components: {
					core: { rules: [
						"normalize",
						"block",
						"strip_references",
						"inline",
						"text_join"
					] },
					block: { rules: [
						"blockquote",
						"code",
						"fence",
						"heading",
						"hr",
						"html_block",
						"lheading",
						"list",
						"reference",
						"paragraph"
					] },
					inline: {
						rules: [
							"autolink",
							"backticks",
							"emphasis",
							"entity",
							"escape",
							"html_inline",
							"image",
							"link",
							"newline",
							"text"
						],
						rules2: [
							"balance_pairs",
							"emphasis",
							"fragments_join"
						]
					}
				}
			}
		};
		var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
		var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
		var RECODE_HOSTNAME_FOR = [
			"http:",
			"https:",
			"mailto:"
		];
		/**
		* Parses Markdown into tokens and renders them to HTML.
		*
		* @category Main
		*/
		var MarkdownIt = class {
			/**
			* Link validation function. CommonMark allows too much in links. By default
			* we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
			* except some embedded image types.
			*
			* You can change this behaviour:
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* const md = new MarkdownIt()
			*
			* // enable everything
			* md.validateLink = function () { return true; }
			* ```
			*/
			validateLink(url) {
				const str = url.trim().toLowerCase();
				return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
			}
			/**
			* Function used to encode link url to a machine-readable format,
			* which includes url-encoding, punycode, etc.
			*/
			normalizeLink(url) {
				const parsed = urlParse(url, true);
				if (parsed.hostname) {
					if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
						parsed.hostname = import_punycode.default.toASCII(parsed.hostname);
					} catch (er) {}
				}
				if (parsed.auth) parsed.auth = encode(parsed.auth);
				if (parsed.hostname) parsed.hostname = encode(parsed.hostname);
				if (parsed.pathname) parsed.pathname = encode(parsed.pathname);
				if (parsed.search) parsed.search = encode(parsed.search);
				if (parsed.hash) parsed.hash = encode(parsed.hash);
				return format(parsed);
			}
			/**
			* Function used to decode link url to a human-readable format`
			*/
			normalizeLinkText(url) {
				const parsed = urlParse(url, true);
				if (parsed.hostname) {
					if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
						parsed.hostname = import_punycode.default.toUnicode(parsed.hostname);
					} catch (er) {}
				}
				return decode(format(parsed), decode.defaultChars + "%");
			}
			constructor(...args) {
				_defineProperty(
					this,
					/**
					* Instance of {@link ParserInline}. You may need it to add new rules when
					* writing plugins. For simple rules control use {@link MarkdownIt.disable}
					* and {@link MarkdownIt.enable}.
					*/
					"inline",
					new ParserInline()
				);
				_defineProperty(
					this,
					/**
					* Instance of {@link ParserBlock}. You may need it to add new rules when
					* writing plugins. For simple rules control use {@link MarkdownIt.disable}
					* and {@link MarkdownIt.enable}.
					*/
					"block",
					new ParserBlock()
				);
				_defineProperty(
					this,
					/**
					* Instance of {@link ParserCore} chain executor. You may need it to add new
					* rules when writing plugins. For simple rules control use
					* {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
					*/
					"core",
					new ParserCore()
				);
				_defineProperty(
					this,
					/**
					* Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
					* rules for new token types, generated by plugins.
					*
					* See {@link Renderer} docs and
					* [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
					*
					* @example
					* ```javascript
					* import MarkdownIt from 'markdown-it'
					* const md = new MarkdownIt()
					*
					* function myToken(tokens, idx, options, env, self) {
					*   //...
					*   return result;
					* };
					*
					* md.renderer.rules['my_token'] = myToken
					* ```
					*/
					"renderer",
					new Renderer()
				);
				_defineProperty(
					this,
					/**
					* [linkify-it](https://github.com/markdown-it/linkify-it) instance.
					* Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
					* rule.
					*/
					"linkify",
					new LinkifyIt()
				);
				_defineProperty(
					this,
					/**
					* Assorted utility functions, useful to write plugins. See details
					* [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
					*/
					"utils",
					utils_exports
				);
				_defineProperty(
					this,
					/**
					* Link components parser functions, useful to write plugins. See details
					* [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
					*/
					"helpers",
					Object.assign({}, helpers_exports)
				);
				const [presetNameOrOptions, options] = args;
				if (typeof presetNameOrOptions === "string") {
					this.configure(presetNameOrOptions);
					if (options) this.set(options);
				} else {
					this.configure("default");
					this.set(presetNameOrOptions || {});
				}
			}
			/**
			* Set parser options (in the same format as in constructor). Probably, you
			* will never need it, but you can change options after constructor call.
			*
			* __Note:__ To achieve the best possible performance, don't modify a
			* `markdown-it` instance options on the fly. If you need multiple configurations
			* it's best to create multiple instances and initialize each with separate
			* config.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			*
			* const md = new MarkdownIt()
			*   .set({ html: true, breaks: true })
			*   .set({ typographer: true })
			* ```
			*/
			set(options) {
				Object.assign(this.options, options);
				return this;
			}
			/**
			* Batch load of all options and compenent settings. This is internal method,
			* and you probably will not need it. But if you will - see available presets
			* and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
			*
			* We strongly recommend to use presets instead of direct config loads. That
			* will give better compatibility with next versions.
			*/
			configure(presets) {
				let p;
				if (typeof presets === "string") {
					const presetName = presets;
					p = config[presetName];
					if (!p) throw new Error(`Wrong 'markdown-it' preset "${presetName}", check name`);
				} else p = presets;
				if (!p) throw new Error("Wrong `markdown-it` preset, can't be empty");
				if (p.options) this.options = { ...p.options };
				const components = p.components;
				if (components) {
					var _components$inline;
					[
						"core",
						"block",
						"inline"
					].forEach((name) => {
						var _components$name;
						const rules = (_components$name = components[name]) === null || _components$name === void 0 ? void 0 : _components$name.rules;
						if (rules) this[name].ruler.enableOnly(rules);
					});
					const rules2 = (_components$inline = components.inline) === null || _components$inline === void 0 ? void 0 : _components$inline.rules2;
					if (rules2) this.inline.ruler2.enableOnly(rules2);
				}
				return this;
			}
			/**
			* Enable list or rules. It will automatically find appropriate components,
			* containing rules with given names. If rule not found, and `ignoreInvalid`
			* not set - throws exception.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			*
			* const md = new MarkdownIt()
			*   .enable(['sub', 'sup'])
			*   .disable('smartquotes')
			* ```
			*/
			enable(list, ignoreInvalid = false) {
				let result = [];
				if (!Array.isArray(list)) list = [list];
				[
					"core",
					"block",
					"inline"
				].forEach((chain) => {
					result = result.concat(this[chain].ruler.enable(list, true));
				});
				result = result.concat(this.inline.ruler2.enable(list, true));
				const missed = list.filter((name) => result.indexOf(name) < 0);
				if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${missed}`);
				return this;
			}
			/**
			* The same as {@link MarkdownIt.enable}, but turn specified rules off.
			*/
			disable(list, ignoreInvalid = false) {
				let result = [];
				if (!Array.isArray(list)) list = [list];
				[
					"core",
					"block",
					"inline"
				].forEach((chain) => {
					result = result.concat(this[chain].ruler.disable(list, true));
				});
				result = result.concat(this.inline.ruler2.disable(list, true));
				const missed = list.filter((name) => result.indexOf(name) < 0);
				if (missed.length && !ignoreInvalid) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${missed}`);
				return this;
			}
			/**
			* Load specified plugin with given params into current parser instance.
			* It's just a sugar to call `plugin(md, params)` with curring.
			*
			* @example
			* ```javascript
			* import MarkdownIt from 'markdown-it'
			* import iterator from 'markdown-it-for-inline'
			*
			* const md = new MarkdownIt()
			*   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
			*     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
			*   })
			* ```
			*/
			use(plugin, ...params) {
				plugin.apply(plugin, [this, ...params]);
				return this;
			}
			/**
			* Parse input string and return list of block tokens (special token type
			* "inline" will contain list of inline tokens). You should not call this
			* method directly, until you write custom renderer (for example, to produce
			* AST).
			*
			* `env` is used to pass data between "distributed" rules and return additional
			* metadata like reference info, needed for the renderer. It also can be used to
			* inject data in specific cases. Usually, you will be ok to pass `{}`,
			* and then pass updated object to renderer.
			*/
			parse(src, env) {
				if (typeof src !== "string") throw new Error("Input data should be a String");
				const state = new this.core.State(src, this, env);
				this.core.process(state);
				return state.tokens;
			}
			/**
			* Render markdown string into html. It does all magic for you :).
			*
			* `env` can be used to inject additional metadata (`{}` by default).
			* But you will not need it with high probability. See also comment
			* in {@link MarkdownIt.parse}.
			*/
			render(src, env = {}) {
				return this.renderer.render(this.parse(src, env), this.options, env);
			}
			/**
			* The same as {@link MarkdownIt.parse} but skip all block rules. It returns
			* the block tokens list with the single `inline` element, containing parsed
			* inline tokens in `children` property. Also updates `env` object.
			*/
			parseInline(src, env) {
				const state = new this.core.State(src, this, env);
				state.inlineMode = true;
				this.core.process(state);
				return state.tokens;
			}
			/**
			* Similar to {@link MarkdownIt.render} but for single paragraph content.
			* Result will NOT be wrapped into `<p>` tags.
			*/
			renderInline(src, env = {}) {
				return this.renderer.render(this.parseInline(src, env), this.options, env);
			}
		};
		_defineProperty(MarkdownIt, "Token", Token);
		_defineProperty(MarkdownIt, "Ruler", Ruler);
		_defineProperty(MarkdownIt, "Renderer", Renderer);
		_defineProperty(MarkdownIt, "ParserCore", ParserCore);
		_defineProperty(MarkdownIt, "StateCore", StateCore);
		_defineProperty(MarkdownIt, "ParserBlock", ParserBlock);
		_defineProperty(MarkdownIt, "StateBlock", StateBlock);
		_defineProperty(MarkdownIt, "ParserInline", ParserInline);
		_defineProperty(MarkdownIt, "StateInline", StateInline);
		/**
		* Default package export.
		*
		* For backward compatibility, the {@link MarkdownIt} class is wrapped so
		* legacy code can call it without `new`. New code should instantiate it as a
		* regular class with `new`. The compatibility wrapper may be removed in a
		* future release.
		*
		* @category Main
		*/
		var MarkdownItCallable = callable(MarkdownIt);
		//#endregion
		//#region src/client/markdown.ts
		/**
		* Markdown rendering for the remote-file viewer. The sidebar's own preview
		* renders local files only — its `openFile`/viewer pipeline reads through the
		* sidebar's local fs service and exposes no "here is the content" entry — so a
		* remote file cannot be handed to it. This module renders the remote text with
		* the same Markdown feature set through the panel's own typography.
		*
		* Raw HTML in the source is NOT passed through (`html: false`): a remote file
		* is untrusted input, and echoing its `<script>`/`<iframe>` into the page would
		* be an injection channel.
		* @module dsh-remote-development/client/markdown
		*/
		/** Extensions the viewer renders as Markdown. */
		const MARKDOWN_EXTENSIONS = /\.(?:md|markdown|mdown|mkdn|mkd|mdx)$/i;
		/**
		* Whether a file name is a Markdown document.
		* @param name - base name of the file.
		* @returns true when the preview may render it.
		*/
		function isMarkdownName(name) {
			return MARKDOWN_EXTENSIONS.test(name);
		}
		/** CommonMark plus tables/strikethrough/linkify, with no raw HTML. */
		const engine = new MarkdownItCallable({
			html: false,
			linkify: true,
			breaks: false,
			typographer: false
		});
		const renderImage = engine.renderer.rules.image ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
		engine.renderer.rules.image = (tokens, idx, options, env, self) => {
			const token = tokens[idx];
			if (token === void 0) return "";
			const raw = token.attrGet("src");
			const source = typeof raw === "string" ? raw : "";
			const next = env?.image?.(source) ?? null;
			if (next !== null) token.attrSet("src", next);
			return renderImage(tokens, idx, options, env, self);
		};
		const renderLinkOpen = engine.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
		engine.renderer.rules.link_open = (tokens, idx, options, env, self) => {
			const token = tokens[idx];
			if (token !== void 0) {
				token.attrSet("target", "_blank");
				token.attrSet("rel", "noreferrer noopener");
			}
			return renderLinkOpen(tokens, idx, options, env, self);
		};
		/**
		* Render one Markdown document to HTML that is safe to inject.
		* @param text - the file's text.
		* @param hooks - optional image source mapping (remote images are not
		*   reachable from the page, so relative ones become download URLs).
		* @returns HTML with every raw HTML character escaped.
		*/
		function renderMarkdown(text, hooks = {}) {
			return engine.render(typeof text === "string" ? text : String(text ?? ""), hooks);
		}
		//#endregion
		//#region src/client/session-scope.ts
		/**
		* Shared "which machine serves this tab's session" resolution for the
		* sidebar's remote tabs. A tab restored at startup can mount before the host
		* has loaded its session, and the host answers that window with
		* `pending: true`; settling on "not a remote workspace" there left the tab
		* empty until it was reopened. Every tab that asks the same question uses this
		* hook, so the retry rule exists once.
		* @module dsh-remote-development/client/session-scope
		*/
		/** Retry delays while the host has not loaded the tab's session. */
		const SESSION_RETRY_DELAYS = [
			200,
			400,
			800,
			1200,
			2e3,
			3e3,
			5e3,
			5e3
		];
		/**
		* Resolve the machine a tab's session belongs to, retrying while the host has
		* not loaded the session, and re-asking once when the tab becomes visible or
		* the window regains focus after settling on a non-remote answer.
		* @param sessionId - the session the tab belongs to ('' before the shell knows it).
		* @param sessionRemote - the host call.
		* @param visible - the sidebar's visibility fact, when it provides one.
		* @returns the resolved scope.
		*/
		function useRemoteSession(sessionId, sessionRemote, visible) {
			const [state, setState] = (0, react.useState)({
				resolved: false,
				machineId: "",
				machineName: "",
				remotePath: "",
				error: ""
			});
			/** Bumped to re-ask after a non-remote settle. */
			const [probeRound, setProbeRound] = (0, react.useState)(0);
			const shown = visible !== false;
			const wasVisible = (0, react.useRef)(shown);
			(0, react.useEffect)(() => {
				if (sessionId === "") return;
				let cancelled = false;
				let timer;
				setState({
					resolved: false,
					machineId: "",
					machineName: "",
					remotePath: "",
					error: ""
				});
				/**
				* Ask once and keep asking while the host reports the session as not yet
				* loaded. Only a definitive answer settles the tab.
				* @param round - retry index, bounded by the delay table.
				*/
				const attempt = (round) => {
					sessionRemote(sessionId).then((info) => {
						if (cancelled) return;
						if (info.remote && info.machineId) {
							setState({
								resolved: true,
								machineId: info.machineId,
								machineName: info.machineName ?? "",
								remotePath: info.remotePath ?? "",
								error: ""
							});
							return;
						}
						if (info.pending === true && round < SESSION_RETRY_DELAYS.length) {
							timer = setTimeout(() => attempt(round + 1), SESSION_RETRY_DELAYS[round]);
							return;
						}
						setState({
							resolved: true,
							machineId: "",
							machineName: "",
							remotePath: "",
							error: ""
						});
					}).catch((err) => {
						if (cancelled) return;
						setState({
							resolved: true,
							machineId: "",
							machineName: "",
							remotePath: "",
							error: err.message
						});
					});
				};
				attempt(0);
				return () => {
					cancelled = true;
					if (timer !== void 0) clearTimeout(timer);
				};
			}, [
				sessionId,
				sessionRemote,
				probeRound
			]);
			(0, react.useEffect)(() => {
				const became = shown && !wasVisible.current;
				wasVisible.current = shown;
				if (!became || sessionId === "" || !state.resolved || state.machineId !== "") return;
				setProbeRound((round) => round + 1);
			}, [
				shown,
				sessionId,
				state.resolved,
				state.machineId
			]);
			(0, react.useEffect)(() => {
				if (state.machineId !== "" || !state.resolved || sessionId === "") return;
				const recheck = () => setProbeRound((round) => round + 1);
				window.addEventListener("focus", recheck);
				return () => window.removeEventListener("focus", recheck);
			}, [
				state.machineId,
				state.resolved,
				sessionId
			]);
			return state;
		}
		//#endregion
		//#region src/client/remote-files.tsx
		/**
		* The sidebar's remote-file tab. It browses the SESSION's remote workspace over
		* the plugin's own SSH/SFTP routes — the third-party sidebar's built-in files
		* tab reads the host filesystem, which is not where a remote session's files
		* live. Clicking a file opens it in this tab (text files are editable, images
		* preview, everything else downloads); upload and download go through the same
		* routes, so the browser showing the tab is the machine the bytes move to or
		* from.
		*
		* The tab receives no sidebar internals beyond the session id: everything it
		* renders comes from this plugin's host routes.
		* @module dsh-remote-development/client/remote-files
		*/
		const FOLDER_ICON = (0, react.createElement)("span", {
			className: "rdv-filesIcon",
			"aria-hidden": true
		}, (0, react.createElement)("svg", {
			width: 13,
			height: 13,
			viewBox: "0 0 16 16",
			fill: "none"
		}, (0, react.createElement)("path", {
			d: "M1.75 3.5h4l1.2 1.5h7.3v7.5a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1V3.5Z",
			stroke: "currentColor",
			strokeWidth: 1.2,
			strokeLinejoin: "round"
		})));
		const FILE_ICON = (0, react.createElement)("span", {
			className: "rdv-filesIcon",
			"aria-hidden": true
		}, (0, react.createElement)("svg", {
			width: 13,
			height: 13,
			viewBox: "0 0 16 16",
			fill: "none"
		}, (0, react.createElement)("path", {
			d: "M4 1.75h5L12.25 5v9.25H4V1.75Z",
			stroke: "currentColor",
			strokeWidth: 1.2,
			strokeLinejoin: "round"
		})));
		/** Extensions the viewer renders as an image instead of text. */
		const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|bmp|ico)$/i;
		/** A name the remote filesystem may accept as one path segment. */
		function isUsableName(name) {
			return name !== "" && name !== "." && name !== ".." && !name.includes("/") && !name.includes("\\");
		}
		/** Human byte size; the list is dense, so one short token per file. */
		function sizeText(bytes) {
			if (bytes === void 0) return "";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} K`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} M`;
			return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} G`;
		}
		/**
		* The tab body: resolve the session's remote root, then browse it. A clicked
		* file replaces the listing with a viewer inside the same tab — the sidebar's
		* own editor reads the local filesystem, so a remote file cannot be handed to
		* it.
		* @param props - session identity plus the injected host calls.
		* @returns the tab element.
		*/
		function RemoteFiles(props) {
			const { sessionId, injected } = props;
			const { t } = injected;
			const session = useRemoteSession(sessionId, injected.sessionRemote, props.visible);
			const machineId = session.machineId;
			const machineName = session.machineName;
			const [path, setPath] = (0, react.useState)("");
			const [parent, setParent] = (0, react.useState)(null);
			const [entries, setEntries] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [uploading, setUploading] = (0, react.useState)(0);
			const [notice, setNotice] = (0, react.useState)("");
			/** Where the menu opened, and the row it targets (null = empty space). */
			const [menu, setMenu] = (0, react.useState)(null);
			const [renameTarget, setRenameTarget] = (0, react.useState)(null);
			const [renameValue, setRenameValue] = (0, react.useState)("");
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
			const [folderDialog, setFolderDialog] = (0, react.useState)(false);
			const [folderName, setFolderName] = (0, react.useState)("");
			const [dialogBusy, setDialogBusy] = (0, react.useState)(false);
			const [dialogError, setDialogError] = (0, react.useState)("");
			const [opened, setOpened] = (0, react.useState)(null);
			const [fileState, setFileState] = (0, react.useState)("loading");
			const [fileError, setFileError] = (0, react.useState)("");
			const [savedText, setSavedText] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)("");
			const [fileSize, setFileSize] = (0, react.useState)(void 0);
			const [saving, setSaving] = (0, react.useState)(false);
			const [saveNote, setSaveNote] = (0, react.useState)("");
			/** Text files open as a highlighted read view; editing is an explicit step. */
			const [editing, setEditing] = (0, react.useState)(false);
			/** Markdown opens as a rendered preview; this switches to the source text. */
			const [markdownSource, setMarkdownSource] = (0, react.useState)(false);
			const token = (0, react.useRef)(0);
			const fileToken = (0, react.useRef)(0);
			const fileInput = (0, react.useRef)(null);
			/** Directory the next picked upload goes to ('' = the current listing). */
			const uploadDir = (0, react.useRef)("");
			const load = (0, react.useCallback)((machine, dir) => {
				if (machine === "") return;
				const mine = ++token.current;
				setLoading(true);
				setError("");
				injected.listRemoteFiles(machine, dir).then((level) => {
					if (mine !== token.current) return;
					setLoading(false);
					if (!level.ok) {
						setError(level.error ?? t("files.loadFailed"));
						return;
					}
					setPath(level.path);
					setParent(level.parent);
					setEntries(level.entries);
				}).catch((err) => {
					if (mine !== token.current) return;
					setLoading(false);
					setError(err.message);
				});
			}, [injected, t]);
			(0, react.useEffect)(() => {
				if (session.machineId === "") return;
				load(session.machineId, session.remotePath !== "" ? session.remotePath : "~");
			}, [
				session.machineId,
				session.remotePath,
				load
			]);
			/** Open one file in the tab's viewer. */
			const openFile = (0, react.useCallback)((entry) => {
				const mine = ++fileToken.current;
				setOpened({
					path: entry.path,
					name: entry.name
				});
				setFileState("loading");
				setEditing(false);
				setMarkdownSource(false);
				setFileError("");
				setSaveNote("");
				setSavedText("");
				setDraft("");
				setFileSize(entry.size);
				injected.readRemoteFile(machineId, entry.path).then((r) => {
					if (mine !== fileToken.current) return;
					if (!r.ok) {
						setFileState("error");
						setFileError(r.error ?? t("files.loadFailed"));
						return;
					}
					setFileSize(r.size ?? entry.size);
					if (r.binary === true) {
						setFileState("binary");
						return;
					}
					if (r.tooLarge === true) {
						setFileState("tooLarge");
						return;
					}
					const text = r.text ?? "";
					setSavedText(text);
					setDraft(text);
					setFileState("ready");
				}).catch((err) => {
					if (mine !== fileToken.current) return;
					setFileState("error");
					setFileError(err.message);
				});
			}, [
				injected,
				machineId,
				t
			]);
			const saveFile = (0, react.useCallback)(() => {
				if (opened === null || fileState !== "ready" || saving) return;
				if (draft === savedText) return;
				setSaving(true);
				setSaveNote("");
				injected.writeRemoteFile(machineId, opened.path, draft).then((r) => {
					setSaving(false);
					setSavedText(draft);
					setFileSize(r.size);
					setSaveNote(t("files.saved"));
				}).catch((err) => {
					setSaving(false);
					setSaveNote(t("files.saveFailed") + ": " + err.message);
				});
			}, [
				draft,
				fileState,
				injected,
				machineId,
				opened,
				savedText,
				saving,
				t
			]);
			const upload = (0, react.useCallback)((files) => {
				const dir = uploadDir.current !== "" ? uploadDir.current : path;
				uploadDir.current = "";
				if (files === null || files.length === 0 || machineId === "" || dir === "") return;
				const list = Array.from(files);
				setUploading(list.length);
				setError("");
				(async () => {
					for (const file of list) {
						try {
							await injected.uploadRemoteFile(machineId, dir, file);
						} catch (err) {
							setError(`${file.name}: ${err.message}`);
						}
						setUploading((n) => Math.max(0, n - 1));
					}
					load(machineId, path);
				})();
			}, [
				injected,
				machineId,
				path,
				load
			]);
			/** Open the row menu at the pointer, clamped into the viewport. */
			const openMenu = (e, entry) => {
				e.preventDefault();
				e.stopPropagation();
				setNotice("");
				setDialogError("");
				setMenu({
					x: Math.max(4, Math.min(e.clientX, window.innerWidth - 210 - 8)),
					y: Math.max(4, Math.min(e.clientY, window.innerHeight - 240 - 8)),
					entry
				});
			};
			/** Copy one path (or the current directory) to the clipboard. */
			const copyPath = (entry) => {
				const text = entry?.path ?? path;
				setMenu(null);
				if (typeof navigator === "undefined" || navigator.clipboard === void 0) return;
				navigator.clipboard.writeText(text).then(() => setNotice(t("files.pathCopied"))).catch(() => {});
			};
			const startRename = (entry) => {
				setMenu(null);
				setDialogError("");
				setRenameValue(entry.name);
				setRenameTarget(entry);
			};
			const submitRename = () => {
				if (renameTarget === null || dialogBusy) return;
				const name = renameValue.trim();
				if (!isUsableName(name)) {
					setDialogError(t("files.invalidName"));
					return;
				}
				setDialogBusy(true);
				setDialogError("");
				injected.renameRemoteEntry(machineId, renameTarget.path, name).then((r) => {
					setDialogBusy(false);
					if (!r.ok) {
						setDialogError(r.error ?? t("files.actionFailed"));
						return;
					}
					setRenameTarget(null);
					setNotice(t("files.renamed"));
					load(machineId, path);
				}).catch((err) => {
					setDialogBusy(false);
					setDialogError(err.message);
				});
			};
			const startDelete = (entry) => {
				setMenu(null);
				setDialogError("");
				setDeleteTarget(entry);
			};
			const submitDelete = () => {
				if (deleteTarget === null || dialogBusy) return;
				setDialogBusy(true);
				setDialogError("");
				injected.deleteRemoteEntry(machineId, deleteTarget.path).then((r) => {
					setDialogBusy(false);
					if (!r.ok) {
						setDialogError(r.error ?? t("files.actionFailed"));
						return;
					}
					setDeleteTarget(null);
					setNotice(t("files.deleted"));
					load(machineId, path);
				}).catch((err) => {
					setDialogBusy(false);
					setDialogError(err.message);
				});
			};
			const submitFolder = () => {
				const name = folderName.trim();
				if (!isUsableName(name)) {
					setDialogError(t("files.invalidName"));
					return;
				}
				setDialogBusy(true);
				setDialogError("");
				injected.createRemoteDir(machineId, path, name).then((r) => {
					setDialogBusy(false);
					if (!r.ok) {
						setDialogError(r.error ?? t("files.actionFailed"));
						return;
					}
					setFolderDialog(false);
					setNotice(t("files.created"));
					load(machineId, path);
				}).catch((err) => {
					setDialogBusy(false);
					setDialogError(err.message);
				});
			};
			/** Stage an upload into one directory and open the picker. */
			const uploadHere = (dir) => {
				setMenu(null);
				uploadDir.current = dir;
				fileInput.current?.click();
			};
			const highlighted = (0, react.useMemo)(() => opened !== null && fileState === "ready" && !editing ? highlightCode(draft, opened.name) : "", [
				draft,
				editing,
				fileState,
				opened
			]);
			const gutter = (0, react.useMemo)(() => opened !== null && fileState === "ready" && !editing ? lineNumbers(draft) : "", [
				draft,
				editing,
				fileState,
				opened
			]);
			if (!session.resolved) return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-empty" }, t("files.loading")));
			if (machineId === "") return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-empty" }, (0, react.createElement)("div", null, t("files.notRemote")), (0, react.createElement)("div", { className: "rdv-hint" }, t("files.notRemoteHint"))));
			const dirty = fileState === "ready" && draft !== savedText;
			const download = (target) => {
				const anchor = document.createElement("a");
				anchor.href = injected.remoteDownloadUrl(machineId, target);
				anchor.download = "";
				document.body.appendChild(anchor);
				anchor.click();
				anchor.remove();
			};
			if (opened !== null) {
				const body = (() => {
					if (fileState === "loading") return (0, react.createElement)("div", { className: "rdv-empty" }, t("files.loading"));
					if (fileState === "error") return (0, react.createElement)("div", { className: "rdv-filesError" }, fileError);
					if (fileState === "binary" || fileState === "tooLarge") return (0, react.createElement)("div", { className: "rdv-empty" }, (0, react.createElement)("div", null, fileState === "binary" ? t("files.binary") : t("files.tooLarge")), (0, react.createElement)("div", { className: "rdv-hint" }, sizeText(fileSize)));
					if (IMAGE_EXTENSIONS.test(opened.name)) return (0, react.createElement)("div", { className: "rdv-filesImage" }, (0, react.createElement)("img", {
						src: injected.remoteDownloadUrl(machineId, opened.path),
						alt: opened.name
					}));
					if (editing) return (0, react.createElement)("textarea", {
						className: "rdv-filesEditor",
						value: draft,
						spellCheck: false,
						onChange: (e) => {
							setDraft(e.target.value);
							setSaveNote("");
						},
						onKeyDown: (e) => {
							if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
								e.preventDefault();
								saveFile();
							}
						}
					});
					if (isMarkdownName(opened.name) && !markdownSource) return (0, react.createElement)("div", {
						className: "rdv-markdown",
						dangerouslySetInnerHTML: { __html: renderMarkdown(draft, { image: (src) => {
							if (/^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("data:")) return null;
							const dir = opened.path.slice(0, opened.path.lastIndexOf("/"));
							const rest = src.replace(/^\.\//, "");
							const parts = [];
							for (const part of `${dir}/${rest}`.split("/")) {
								if (part === "" || part === ".") continue;
								if (part === "..") {
									parts.pop();
									continue;
								}
								parts.push(part);
							}
							return injected.remoteDownloadUrl(machineId, "/" + parts.join("/"));
						} }) }
					});
					return (0, react.createElement)("div", { className: "rdv-codeWrap" }, (0, react.createElement)("div", {
						className: "rdv-codeGutter",
						"aria-hidden": true
					}, gutter), (0, react.createElement)("pre", { className: "rdv-code" }, (0, react.createElement)("code", { dangerouslySetInnerHTML: { __html: highlighted } })));
				})();
				return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-filesHead" }, (0, react.createElement)("div", { className: "rdv-filesViewerBar" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					onClick: () => setOpened(null)
				}, t("files.back")), (0, react.createElement)("span", {
					className: "rdv-filesViewerName",
					title: opened.path
				}, opened.name), (0, react.createElement)("span", { className: "rdv-filesSize" }, sizeText(fileSize)), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					onClick: () => download(opened.path)
				}, t("files.download")), fileState === "ready" && isMarkdownName(opened.name) && !editing && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					variant: "outline",
					onClick: () => setMarkdownSource((source) => !source)
				}, markdownSource ? t("files.markdownPreview") : t("files.markdownSource")), fileState === "ready" && !IMAGE_EXTENSIONS.test(opened.name) && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					variant: "outline",
					onClick: () => {
						setEditing(!editing);
						setSaveNote("");
					}
				}, editing ? t("files.preview") : t("files.edit")), fileState === "ready" && editing && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					size: "sm",
					variant: "primary",
					disabled: !dirty || saving,
					onClick: saveFile
				}, saving ? t("files.saving") : t("files.save")))), body, saveNote !== "" && (0, react.createElement)("div", { className: "rdv-filesNote" }, saveNote));
			}
			const canGoUp = parent !== null && path !== "";
			/**
			* The row icon: the sidebar's own artwork when the service answers, the
			* plugin's plain glyph otherwise. The lookup is per row, so an icon-theme
			* plugin installed in the sidebar restyles this tab too.
			*/
			const iconFor = (entry) => {
				try {
					const custom = entry.dir ? injected.folderIcon?.(entry.path, false, 14) : injected.fileIcon?.(entry.path, 14);
					if (custom !== void 0 && custom !== null) return (0, react.createElement)("span", { className: "rdv-filesIcon" }, custom);
				} catch {}
				return entry.dir ? FOLDER_ICON : FILE_ICON;
			};
			/** One row's context menu entry. */
			const menuItem = (label, onClick, options = {}) => (0, react.createElement)("button", {
				type: "button",
				role: "menuitem",
				className: "rdv-ctxItem" + (options.danger === true ? " rdv-ctxDanger" : ""),
				onClick
			}, label);
			const row = (entry) => {
				if (entry.dir) return (0, react.createElement)("button", {
					key: entry.path,
					type: "button",
					className: "rdv-filesRow",
					title: entry.path,
					onClick: () => load(machineId, entry.path),
					onContextMenu: (e) => openMenu(e, entry)
				}, iconFor(entry), (0, react.createElement)("span", { className: "rdv-filesName" }, entry.name), (0, react.createElement)("span", {
					className: "rdv-filesGlyph",
					"aria-hidden": true
				}, "›"));
				return (0, react.createElement)("button", {
					key: entry.path,
					type: "button",
					className: "rdv-filesRow",
					title: entry.path,
					onClick: () => openFile(entry),
					onContextMenu: (e) => openMenu(e, entry)
				}, iconFor(entry), (0, react.createElement)("span", { className: "rdv-filesName" }, entry.name), (0, react.createElement)("span", { className: "rdv-filesSize" }, sizeText(entry.size)));
			};
			return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-filesHead" }, (0, react.createElement)("div", {
				className: "rdv-filesPath",
				title: path
			}, path || "…"), (0, react.createElement)("div", { className: "rdv-filesTools" }, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				disabled: !canGoUp || loading,
				onClick: () => {
					if (parent !== null) load(machineId, parent);
				}
			}, t("files.up")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				disabled: loading || uploading > 0,
				onClick: () => load(machineId, path)
			}, t("files.refresh")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				size: "sm",
				variant: "outline",
				disabled: uploading > 0 || loading,
				onClick: () => fileInput.current?.click()
			}, uploading > 0 ? t("files.uploading").replace("{count}", String(uploading)) : t("files.upload")))), (0, react.createElement)("input", {
				ref: fileInput,
				type: "file",
				multiple: true,
				style: { display: "none" },
				onChange: (e) => {
					upload(e.target.files);
					e.target.value = "";
				}
			}), error !== "" && (0, react.createElement)("div", { className: "rdv-filesError" }, error), notice !== "" && (0, react.createElement)("div", { className: "rdv-ok rdv-filesNote" }, notice), (0, react.createElement)("div", {
				className: "rdv-filesList",
				onContextMenu: (e) => openMenu(e, null)
			}, loading && entries.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("files.loading")) : entries.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("files.empty")) : entries.map(row)), (0, react.createElement)("div", { className: "rdv-filesFoot" }, (0, react.createElement)("span", {
				className: "rdv-filesMachine",
				title: machineId
			}, machineName || machineId)), menu !== null && (0, react.createElement)(react.Fragment, null, (0, react.createElement)("button", {
				type: "button",
				className: "rdv-ctxBackdrop",
				"aria-label": t("files.cancel"),
				onClick: () => setMenu(null),
				onContextMenu: (e) => {
					e.preventDefault();
					setMenu(null);
				}
			}), (0, react.createElement)("div", {
				className: "rdv-ctxMenu",
				role: "menu",
				style: {
					left: menu.x,
					top: menu.y
				}
			}, menu.entry === null ? [
				menuItem(t("files.newFolder"), () => {
					setMenu(null);
					setFolderName("");
					setDialogError("");
					setFolderDialog(true);
				}),
				menuItem(t("files.uploadHere"), () => uploadHere(path)),
				(0, react.createElement)("div", {
					key: "sep",
					className: "rdv-ctxSep"
				}),
				menuItem(t("files.refresh"), () => {
					setMenu(null);
					load(machineId, path);
				})
			] : [
				menuItem(menu.entry.dir ? t("files.openFolder") : t("files.openFile"), () => {
					const entry = menu.entry;
					setMenu(null);
					if (entry === null) return;
					if (entry.dir) load(machineId, entry.path);
					else openFile(entry);
				}),
				menu.entry.dir ? menuItem(t("files.uploadIn"), () => {
					const entry = menu.entry;
					setMenu(null);
					if (entry !== null) uploadHere(entry.path);
				}) : menuItem(t("files.download"), () => {
					const entry = menu.entry;
					setMenu(null);
					if (entry !== null) download(entry.path);
				}),
				menuItem(t("files.copyPath"), () => copyPath(menu.entry)),
				(0, react.createElement)("div", {
					key: "sep",
					className: "rdv-ctxSep"
				}),
				menuItem(t("files.rename"), () => {
					const entry = menu.entry;
					setMenu(null);
					if (entry !== null) startRename(entry);
				}),
				menuItem(t("files.delete"), () => {
					const entry = menu.entry;
					setMenu(null);
					if (entry !== null) startDelete(entry);
				}, { danger: true })
			])), renameTarget !== null && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => {
					if (!dialogBusy) {
						setRenameTarget(null);
						setDialogError("");
					}
				},
				title: t("files.renameTitle"),
				closeLabel: t("files.cancel"),
				footer: (0, react.createElement)(react.Fragment, null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: dialogBusy,
					onClick: () => setRenameTarget(null)
				}, t("files.cancel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: dialogBusy,
					onClick: submitRename
				}, t("files.confirm")))
			}, (0, react.createElement)("div", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("files.renameLabel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				value: renameValue,
				autoFocus: true,
				onChange: (e) => setRenameValue(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") submitRename();
				}
			}), dialogError !== "" && (0, react.createElement)("div", { className: "rdv-error" }, dialogError))), deleteTarget !== null && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => {
					if (!dialogBusy) {
						setDeleteTarget(null);
						setDialogError("");
					}
				},
				title: t("files.deleteTitle"),
				closeLabel: t("files.cancel"),
				description: t("files.deleteConfirm").replace("{name}", deleteTarget.name) + (deleteTarget.dir ? " " + t("files.deleteDirWarning") : ""),
				footer: (0, react.createElement)(react.Fragment, null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: dialogBusy,
					onClick: () => setDeleteTarget(null)
				}, t("files.cancel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: dialogBusy,
					onClick: submitDelete
				}, t("files.confirm")))
			}, dialogError === "" ? null : (0, react.createElement)("p", {
				className: "rdv-error",
				style: { margin: 0 }
			}, dialogError)), folderDialog && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => {
					if (!dialogBusy) {
						setFolderDialog(false);
						setDialogError("");
					}
				},
				title: t("files.newFolderTitle"),
				closeLabel: t("files.cancel"),
				footer: (0, react.createElement)(react.Fragment, null, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: dialogBusy,
					onClick: () => setFolderDialog(false)
				}, t("files.cancel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: dialogBusy,
					onClick: submitFolder
				}, t("files.confirm")))
			}, (0, react.createElement)("div", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("files.newFolderLabel")), (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				value: folderName,
				autoFocus: true,
				onChange: (e) => setFolderName(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") submitFolder();
				}
			}), dialogError !== "" && (0, react.createElement)("div", { className: "rdv-error" }, dialogError))));
		}
		/** Left offset of the first lane centre. */
		const LANE_ORIGIN = 10;
		/** Horizontal distance between lane centres. */
		const LANE_GAP = 12;
		/** Lanes past this width are clamped (a pathological history must stay legible). */
		const MAX_LANES = 10;
		/**
		* Centre x of one lane.
		* @param lane - 0-based lane index.
		* @returns the x coordinate in pixels.
		*/
		function laneX(lane) {
			return LANE_ORIGIN + lane * LANE_GAP;
		}
		/**
		* Total drawing width for a row set.
		* @param rows - laid-out rows.
		* @returns the SVG width in pixels.
		*/
		function graphWidth(rows) {
			let max = 1;
			for (const row of rows) {
				max = Math.max(max, row.lane + 2);
				for (const edge of row.edges) max = Math.max(max, edge.toLane + 2);
			}
			return laneX(Math.min(max, MAX_LANES));
		}
		/**
		* Lay out a log page. Rows arrive newest first; each commit keeps the lane it
		* was first assigned (its branch line), first parents continue that lane, and
		* extra parents open a lane of their own. A lane is released when the commit it
		* waited for has been drawn.
		* @param commits - commits newest first.
		* @returns the drawable rows.
		*/
		function layoutGraph(commits) {
			/** Hash each lane is waiting for, or undefined when the lane is free. */
			const lanes = [];
			const rows = [];
			for (const commit of commits) {
				let lane = lanes.indexOf(commit.hash);
				if (lane === -1) {
					lane = lanes.indexOf(void 0);
					if (lane === -1) lane = lanes.length;
				}
				const before = lanes.slice();
				lanes[lane] = void 0;
				const parents = commit.parents;
				const edges = [];
				parents.forEach((parent, index) => {
					const existing = lanes.indexOf(parent);
					let targetLane;
					if (existing !== -1 && existing !== lane) {
						targetLane = existing;
						if (index === 0) lanes[lane] = void 0;
					} else if (index === 0) {
						targetLane = lane;
						lanes[lane] = parent;
					} else {
						targetLane = lanes.indexOf(void 0);
						if (targetLane === -1) targetLane = lanes.length;
						lanes[targetLane] = parent;
					}
					if (targetLane >= MAX_LANES) targetLane = 9;
					edges.push({
						fromLane: lane,
						toLane: targetLane,
						fromY: .5,
						toY: 1,
						color: lane % 5
					});
				});
				const through = [];
				const after = lanes.slice();
				for (let index = 0; index < before.length; index += 1) {
					if (before[index] === void 0) continue;
					if (index === lane) continue;
					if (index >= MAX_LANES) continue;
					if (after[index] !== void 0) through.push(index);
				}
				rows.push({
					lane,
					through,
					edges
				});
				while (lanes.length > 0 && lanes[lanes.length - 1] === void 0) lanes.pop();
			}
			return rows;
		}
		/**
		* The SVG path of one edge: straight when the lanes are equal, otherwise a
		* rectangular line with one rounded elbow near the destination lane.
		* @param segment - the edge.
		* @param height - row height in pixels.
		* @returns the path data.
		*/
		function edgePath(segment, height = 28) {
			const x1 = laneX(segment.fromLane);
			const x2 = laneX(segment.toLane);
			const y1 = segment.fromY * height;
			const y2 = segment.toY * height;
			if (x1 === x2 || y1 === y2) return `M ${x1} ${y1} L ${x2} ${y2}`;
			const dx = Math.sign(x2 - x1);
			const dy = Math.sign(y2 - y1);
			const r = Math.min(4, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
			if (segment.fromY === .5) return `M ${x1} ${y1} L ${x2 - dx * r} ${y1} Q ${x2} ${y1} ${x2} ${y1 + dy * r} L ${x2} ${y2}`;
			return `M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2 - r} Q ${x1} ${(y1 + y2) / 2} ${x1 + dx * r} ${(y1 + y2) / 2} L ${x2 - dx * r} ${(y1 + y2) / 2} Q ${x2} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2 + r} L ${x2} ${y2}`;
		}
		//#endregion
		//#region src/client/remote-git.tsx
		/**
		* The sidebar's remote Git tab, laid out like the sidebar's own Git lens: a
		* repository strip, one collapsible 更改 section whose commit box sits on top
		* of the staged/unstaged groups, one collapsible 提交图 section with the branch
		* selector and the lane graph, and a footer carrying the branch and the
		* tracking counts. Everything is answered by the plugin's routes, executed on
		* the remote machine over SSH.
		* @module dsh-remote-development/client/remote-git
		*/
		/** Relative time for a row's tooltip. */
		function ago(time, t) {
			if (time <= 0) return "";
			const seconds = Math.max(1, Math.floor(Date.now() / 1e3 - time));
			if (seconds < 60) return t("git.justNow");
			const minutes = Math.floor(seconds / 60);
			if (minutes < 60) return t("git.minutesAgo", { n: minutes });
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return t("git.hoursAgo", { n: hours });
			const days = Math.floor(hours / 24);
			if (days < 30) return t("git.daysAgo", { n: days });
			return (/* @__PURE__ */ new Date(time * 1e3)).toLocaleDateString();
		}
		/** Last path segment of a remote path. */
		function baseName(p) {
			const trimmed = p.replace(/\/+$/, "");
			const cut = trimmed.lastIndexOf("/");
			return cut === -1 ? trimmed : trimmed.slice(cut + 1);
		}
		/** A change row's staged side (index) and unstaged side (worktree). */
		function isStagedEntry(entry) {
			return entry.xy !== "??" && entry.xy[0] !== " " && entry.xy[0] !== "?";
		}
		/** Whether the worktree side still holds a change (an untracked file always does). */
		function isUnstagedEntry(entry) {
			return entry.xy === "??" || entry.xy[1] !== " ";
		}
		/**
		* The tab body: resolve the session's machine, then read and edit its
		* repository. The two sections mirror the host's own Git lens; every mutation
		* re-reads the status, and the graph re-reads after a commit.
		* @param props - session identity plus the injected host calls.
		* @returns the tab element.
		*/
		function RemoteGit(props) {
			const { sessionId, injected } = props;
			const { t } = injected;
			const session = useRemoteSession(sessionId, injected.sessionRemote, props.visible);
			const machineId = session.machineId;
			const remotePath = session.remotePath;
			const [status, setStatus] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [changesOpen, setChangesOpen] = (0, react.useState)(true);
			const [graphOpen, setGraphOpen] = (0, react.useState)(true);
			const [collapsedGroups, setCollapsedGroups] = (0, react.useState)({});
			const [message, setMessage] = (0, react.useState)("");
			/** The graph's scope: every branch (the host panel's default) or this one. */
			const [allBranches, setAllBranches] = (0, react.useState)(true);
			const [commits, setCommits] = (0, react.useState)([]);
			const [historyLoading, setHistoryLoading] = (0, react.useState)(false);
			const [historyError, setHistoryError] = (0, react.useState)("");
			const [open, setOpen] = (0, react.useState)(null);
			const load = (0, react.useCallback)(() => {
				if (machineId === "" || remotePath === "") return;
				setLoading(true);
				setError("");
				injected.gitStatus(machineId, remotePath).then((result) => {
					setLoading(false);
					if (!result.ok || result.status === void 0) {
						setError(result.error ?? t("git.failed"));
						return;
					}
					setStatus(result.status);
				}).catch((err) => {
					setLoading(false);
					setError(err.message);
				});
			}, [
				injected,
				machineId,
				remotePath,
				t
			]);
			const loadGraph = (0, react.useCallback)(() => {
				if (machineId === "" || remotePath === "") return;
				setHistoryLoading(true);
				setHistoryError("");
				injected.gitLog(machineId, remotePath, 200, allBranches).then((result) => {
					setHistoryLoading(false);
					if (!result.ok) {
						setHistoryError(result.error ?? t("git.failed"));
						return;
					}
					setCommits(result.commits ?? []);
				}).catch((err) => {
					setHistoryLoading(false);
					setHistoryError(err.message);
				});
			}, [
				injected,
				machineId,
				remotePath,
				allBranches,
				t
			]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			(0, react.useEffect)(() => {
				if (graphOpen) loadGraph();
			}, [graphOpen, loadGraph]);
			/** Run one mutation, then re-read what it changed. */
			const mutate = (0, react.useCallback)((run, done) => {
				setBusy(true);
				setError("");
				setNotice("");
				run().then((result) => {
					setBusy(false);
					if (!result.ok) {
						setError(result.error ?? t("git.failed"));
						return;
					}
					setNotice(done);
					load();
				}).catch((err) => {
					setBusy(false);
					setError(err.message);
				});
			}, [load, t]);
			const staged = (status?.entries ?? []).filter(isStagedEntry);
			const unstaged = (status?.entries ?? []).filter((entry) => !isStagedEntry(entry) && isUnstagedEntry(entry));
			const clean = status !== null && status.isRepo === true && (status.entries ?? []).length === 0;
			/**
			* Show one file's diff on the side that changes it: the worktree when the
			* worktree differs (an untracked file diffs against /dev/null), otherwise
			* the staged side.
			*/
			const showDiff = (entry, stagedSide) => {
				const untracked = entry.xy === "??";
				setOpen({
					path: entry.path,
					text: "",
					loading: true,
					error: ""
				});
				injected.gitDiff(machineId, remotePath, entry.path, stagedSide, untracked).then((result) => {
					setOpen({
						path: entry.path,
						text: result.diff ?? "",
						loading: false,
						error: result.ok ? "" : result.error ?? t("git.failed")
					});
				}).catch((err) => {
					setOpen({
						path: entry.path,
						text: "",
						loading: false,
						error: err.message
					});
				});
			};
			/** Show one commit's patch in the pane. */
			const showCommit = (commit) => {
				setOpen({
					path: commit.short,
					text: "",
					loading: true,
					error: ""
				});
				injected.gitShow(machineId, remotePath, commit.hash).then((result) => {
					setOpen({
						path: commit.short,
						text: result.diff ?? "",
						loading: false,
						error: result.ok ? "" : result.error ?? t("git.failed")
					});
				}).catch((err) => {
					setOpen({
						path: commit.short,
						text: "",
						loading: false,
						error: err.message
					});
				});
			};
			const commit = () => {
				if (message.trim() === "" || staged.length === 0) return;
				setBusy(true);
				setError("");
				setNotice("");
				injected.gitCommit(machineId, remotePath, message).then((result) => {
					setBusy(false);
					if (!result.ok) {
						setError(result.error ?? t("git.failed"));
						return;
					}
					setMessage("");
					setNotice(t("git.committed"));
					setOpen(null);
					load();
					if (graphOpen) loadGraph();
				}).catch((err) => {
					setBusy(false);
					setError(err.message);
				});
			};
			const rows = (0, react.useMemo)(() => layoutGraph(commits), [commits]);
			const width = (0, react.useMemo)(() => graphWidth(rows), [rows]);
			const lines = (0, react.useMemo)(() => rows.map((row, index) => ({
				commit: commits[index],
				lane: row.lane
			})), [rows, commits]);
			const toggleGroup = (group) => {
				setCollapsedGroups((current) => ({
					...current,
					[group]: current[group] !== true
				}));
			};
			/** One disclosure section header (chevron + label + trailing actions). */
			const sectionHead = (label, openState, toggle, trailing) => (0, react.createElement)("div", { className: "rdv-gitHead" }, (0, react.createElement)("button", {
				type: "button",
				className: "rdv-gitDisclosure",
				"aria-expanded": openState,
				onClick: toggle
			}, (0, react.createElement)("span", {
				className: "rdv-gitChevron",
				"data-open": openState ? "true" : void 0,
				"aria-hidden": true
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineRegular, { size: 12 })), (0, react.createElement)("span", null, label)), (0, react.createElement)("div", { className: "rdv-gitHeadActions" }, trailing));
			/** One change row: staged side, path, hover action. */
			const changeRow = (entry, stagedSide) => (0, react.createElement)("div", {
				key: `${stagedSide ? "s" : "u"}:${entry.path}`,
				className: "rdv-gitChangeRow",
				title: entry.path
			}, (0, react.createElement)("span", {
				className: "rdv-gitChangeIcon",
				"aria-hidden": true
			}, (() => {
				try {
					const custom = injected.fileIcon?.(entry.path, 14);
					return custom !== void 0 && custom !== null ? custom : (0, react.createElement)("span", null, "·");
				} catch {
					return (0, react.createElement)("span", null, "·");
				}
			})()), (0, react.createElement)("span", { className: "rdv-gitChangeName" }, baseName(entry.path)), (0, react.createElement)("span", { className: "rdv-gitChangePath" }, entry.path.slice(0, -baseName(entry.path).length).replace(/\/+$/, "") || "/"), (0, react.createElement)("span", {
				className: "rdv-gitChangeCode",
				title: entry.xy
			}, entry.xy.trim() === "" ? "·" : entry.xy.trim()), (0, react.createElement)("button", {
				type: "button",
				className: "rdv-gitChangeAction",
				title: stagedSide ? t("git.unstage") : t("git.stage"),
				disabled: busy,
				onClick: () => mutate(() => stagedSide ? injected.gitUnstage(machineId, remotePath, [entry.path]) : injected.gitStage(machineId, remotePath, [entry.path]), stagedSide ? t("git.unstaged") : t("git.staged"))
			}, stagedSide ? "−" : "+"));
			/** One collapsible group of change rows. */
			const changeGroup = (group, label, entries, stagedSide) => {
				if (entries.length === 0) return null;
				const folded = collapsedGroups[group] === true;
				return (0, react.createElement)("div", { className: "rdv-gitGroup" }, (0, react.createElement)("div", { className: "rdv-gitGroupHead" }, (0, react.createElement)("button", {
					type: "button",
					className: "rdv-gitDisclosure",
					"aria-expanded": !folded,
					onClick: () => toggleGroup(group)
				}, (0, react.createElement)("span", {
					className: "rdv-gitChevron",
					"data-open": folded ? void 0 : "true",
					"aria-hidden": true
				}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineRegular, { size: 12 })), (0, react.createElement)("span", null, `${label} ${entries.length}`)), (0, react.createElement)("button", {
					type: "button",
					className: "rdv-gitGroupAction",
					title: stagedSide ? t("git.unstageAll") : t("git.stageAll"),
					disabled: busy,
					onClick: () => mutate(() => stagedSide ? injected.gitUnstage(machineId, remotePath, entries.map((entry) => entry.path)) : injected.gitStage(machineId, remotePath, entries.map((entry) => entry.path)), stagedSide ? t("git.unstaged") : t("git.staged"))
				}, stagedSide ? "−" : "+")), !folded && (0, react.createElement)("div", { className: "rdv-gitGroupBody" }, entries.map((entry) => (0, react.createElement)(FragmentlessRow, {
					key: entry.path,
					run: () => showDiff(entry, stagedSide),
					row: changeRow(entry, stagedSide)
				}))));
			};
			function FragmentlessRow(props) {
				return (0, react.createElement)("div", {
					onClick: props.run,
					style: { display: "contents" }
				}, props.row);
			}
			if (!session.resolved) return (0, react.createElement)("div", { className: "rdv-gitRoot" }, (0, react.createElement)("div", { className: "rdv-empty" }, t("git.loading")));
			if (machineId === "" || remotePath === "") return (0, react.createElement)("div", { className: "rdv-gitRoot" }, (0, react.createElement)("div", { className: "rdv-empty" }, (0, react.createElement)("div", null, t("git.notRemote")), (0, react.createElement)("div", { className: "rdv-hint" }, t("git.notRemoteHint"))));
			if (status !== null && !status.isRepo) return (0, react.createElement)("div", { className: "rdv-gitRoot" }, (0, react.createElement)("div", { className: "rdv-empty" }, t("git.notRepo")));
			const branch = status?.branch ?? "";
			const markers = `${unstaged.length > 0 ? "*" : ""}${staged.length > 0 ? "+" : ""}`;
			const tracking = (() => {
				if (status === null || status.isRepo !== true) return "";
				const parts = [];
				if (status.behind !== void 0 && status.behind > 0) parts.push(`${status.behind}↓`);
				if (status.ahead !== void 0 && status.ahead > 0) parts.push(`${status.ahead}↑`);
				return parts.join(" ");
			})();
			return (0, react.createElement)("div", { className: "rdv-gitRoot" }, (0, react.createElement)("div", { className: "rdv-gitRepoBar" }, (0, react.createElement)("span", {
				className: "rdv-gitRepoTab",
				title: status?.root ?? remotePath
			}, `${session.machineName || machineId} · ${baseName(status?.root ?? remotePath)}`)), (0, react.createElement)("div", { className: "rdv-gitScroll" }, error !== "" && (0, react.createElement)("div", { className: "rdv-filesError" }, error), notice !== "" && (0, react.createElement)("div", { className: "rdv-ok rdv-gitNotice" }, notice), (0, react.createElement)("section", { className: "rdv-gitSection" }, sectionHead(t("git.viewChanges"), changesOpen, () => setChangesOpen((open) => !open), [(0, react.createElement)("button", {
				key: "commit",
				type: "button",
				className: "rdv-gitIconAction",
				title: t("git.commit"),
				"aria-label": t("git.commit"),
				disabled: busy || message.trim() === "" || staged.length === 0,
				onClick: commit
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutlineRegular, { size: 14 })), (0, react.createElement)("button", {
				key: "refresh",
				type: "button",
				className: "rdv-gitIconAction",
				title: t("git.refresh"),
				"aria-label": t("git.refresh"),
				disabled: loading || busy,
				onClick: load
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 14 }))]), changesOpen && (0, react.createElement)("div", { className: "rdv-gitSectionBody" }, (0, react.createElement)("div", { className: "rdv-gitMessageBox" }, (0, react.createElement)("textarea", {
				className: "rdv-gitMessageInput",
				rows: 1,
				value: message,
				placeholder: t("git.commitPlaceholderOn", {
					branch: branch || "HEAD",
					shortcut: "Ctrl+Enter"
				}),
				"aria-label": t("git.commitPlaceholder"),
				onChange: (e) => setMessage(e.target.value),
				onKeyDown: (e) => {
					if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
						e.preventDefault();
						commit();
					}
				}
			})), clean && (0, react.createElement)("div", { className: "rdv-empty rdv-gitClean" }, t("git.clean")), changeGroup("staged", t("git.stagedSection"), staged, true), changeGroup("unstaged", t("git.changesSection"), unstaged, false))), (0, react.createElement)("section", { className: graphOpen ? "rdv-gitSection rdv-gitSectionGrow" : "rdv-gitSection" }, sectionHead(t("git.graph"), graphOpen, () => setGraphOpen((open) => !open), []), graphOpen && (0, react.createElement)("div", { className: "rdv-gitGraphBody" }, (0, react.createElement)("div", { className: "rdv-gitGraphToolbar" }, (0, react.createElement)("select", {
				className: "rdv-gitSelect",
				"aria-label": t("git.graphScope"),
				value: allBranches ? "all" : "current",
				onChange: (e) => setAllBranches(e.target.value === "all")
			}, (0, react.createElement)("option", { value: "all" }, t("git.allBranches")), (0, react.createElement)("option", { value: "current" }, t("git.currentBranch")))), historyError !== "" && (0, react.createElement)("div", { className: "rdv-filesError" }, historyError), historyLoading && commits.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("git.loading")) : commits.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("git.noCommits")) : (0, react.createElement)("div", {
				className: "rdv-gitGraphList",
				style: { flex: 1 }
			}, lines.map((line, index) => {
				const row = rows[index];
				return (0, react.createElement)("button", {
					key: line.commit.hash,
					type: "button",
					className: "rdv-gitGraphRow" + (open?.path === line.commit.short ? " rdv-gitGraphRowOpen" : ""),
					title: `${line.commit.author} · ${ago(line.commit.time, t)} · ${line.commit.hash}`,
					onClick: () => showCommit(line.commit)
				}, (0, react.createElement)("svg", {
					className: "rdv-gitRail",
					width,
					height: 28,
					viewBox: `0 0 ${width} 28`,
					"aria-hidden": true
				}, row.through.map((lane) => (0, react.createElement)("line", {
					key: `t${lane}`,
					x1: laneX(lane),
					x2: laneX(lane),
					y1: 0,
					y2: 28,
					className: `rdv-gitLane c${lane % 5}`
				})), row.edges.map((edge, edgeIndex) => (0, react.createElement)("path", {
					key: `e${edgeIndex}`,
					d: edgePath(edge),
					className: `rdv-gitLane c${edge.color % 5}`
				})), (0, react.createElement)("circle", {
					cx: laneX(row.lane),
					cy: 14,
					r: 3.2,
					className: `rdv-gitNode c${row.lane % 5}`
				})), (0, react.createElement)("span", { className: "rdv-gitPills" }, line.commit.refs.slice(0, 3).map((ref) => (0, react.createElement)("span", {
					key: ref,
					className: "rdv-gitPill" + (ref.startsWith("tag: ") ? " rdv-gitPillTag" : ref.startsWith("HEAD") ? " rdv-gitPillHead" : ""),
					title: ref
				}, ref.startsWith("tag: ") ? ref.slice(5) : ref.replace("HEAD -> ", "")))), (0, react.createElement)("span", { className: "rdv-gitSubject" }, line.commit.subject), (0, react.createElement)("span", { className: "rdv-gitSha" }, line.commit.short));
			})))), open !== null && (0, react.createElement)("div", { className: "rdv-gitDiffPane" }, (0, react.createElement)("div", { className: "rdv-gitDiffHead" }, (0, react.createElement)("span", {
				className: "rdv-gitDiffPath",
				title: open.path
			}, open.path), (0, react.createElement)("button", {
				type: "button",
				className: "rdv-gitIconAction",
				title: t("git.closeDiff"),
				onClick: () => setOpen(null)
			}, "×")), open.loading ? (0, react.createElement)("div", { className: "rdv-empty" }, t("git.loading")) : (0, react.createElement)("pre", { className: "rdv-gitDiff" }, open.error !== "" ? open.error : open.text !== "" ? open.text : t("git.diffEmpty")))), status !== null && status.isRepo === true && (0, react.createElement)("div", { className: "rdv-gitFooter" }, (0, react.createElement)("span", {
				className: "rdv-gitBranchChip",
				title: t("git.branch")
			}, (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutlineRegular, { size: 14 }), (0, react.createElement)("span", null, `${branch || "HEAD"}${markers}`)), tracking !== "" && (0, react.createElement)("span", { className: "rdv-gitSync" }, tracking), (0, react.createElement)("span", { className: "rdv-spacer" }), (0, react.createElement)("span", {
				className: "rdv-filesMachine",
				title: machineId
			}, session.machineName || machineId)));
		}
		//#endregion
		//#region src/client/sidebar.ts
		/**
		* Optional integration with the third-party `dsh-better-sidebar` plugin. That
		* plugin publishes `ctx.betterSidebar.registerTab()`, so this module registers
		* one extra tab through the public seam and nothing else: no source edits, no
		* DOM injection, and no dependency (the package stays out of this plugin's
		* graph, so a profile without it simply never provides the service).
		*
		* The tab is named "远程文件" precisely because the sidebar's built-in files tab
		* reads the HOST filesystem — in a remote session that is not the project.
		* @module dsh-remote-development/client/sidebar
		*/
		/**
		* Register the remote-file tab whenever the sidebar plugin is present. The
		* injection waits for `betterSidebar`, so installation order does not matter
		* and an absent sidebar is not an error.
		* @param ctx - client root context.
		* @param t - the plugin's bound translator.
		*/
		function registerRemoteFilesTab(ctx, t) {
			const injected = {
				sessionRemote,
				listRemoteFiles,
				readRemoteFile,
				writeRemoteFile,
				uploadRemoteFile,
				remoteDownloadUrl,
				createRemoteDir,
				renameRemoteEntry,
				deleteRemoteEntry,
				t
			};
			const gitInjected = {
				sessionRemote,
				gitStatus,
				gitDiff,
				gitStage,
				gitUnstage,
				gitCommit,
				gitLog,
				gitShow,
				t
			};
			ctx.inject(["betterSidebar"], (scope) => {
				const sidebar = scope.betterSidebar;
				const icons = {
					...typeof sidebar.fileIcon === "function" ? { fileIcon: (path, size) => sidebar.fileIcon?.(path, size) } : {},
					...typeof sidebar.folderIcon === "function" ? { folderIcon: (path, open, size) => sidebar.folderIcon?.(path, open, size) } : {}
				};
				const dispose = scope.betterSidebar.registerTab({
					id: "dsh-remote:files",
					title: () => t("files.tabTitle"),
					description: () => t("files.tabDescription"),
					order: 12,
					single: true,
					component: ({ scope: sessionScope }) => (0, react.createElement)(RemoteFiles, {
						sessionId: sessionScope.sessionId,
						injected: {
							...injected,
							...icons
						}
					})
				});
				scope.effect(() => dispose, "dsh-remote-development: sidebar tab");
				const disposeGit = scope.betterSidebar.registerTab({
					id: "dsh-remote:git",
					title: () => t("git.tabTitle"),
					description: () => t("git.tabDescription"),
					order: 13,
					single: true,
					component: ({ scope: sessionScope }) => (0, react.createElement)(RemoteGit, {
						sessionId: sessionScope.sessionId,
						injected: gitInjected
					})
				});
				scope.effect(() => disposeGit, "dsh-remote-development: sidebar git tab");
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"uiWorkspace",
			"locale",
			"inputTriggers"
		];
		/**
		* Client plugin body.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => injectStyles(), "dsh-remote-development: stylesheet");
			ctx.effect(() => startTreeMark(ctx), "dsh-remote-development: tree marker");
			ctx.effect(() => {
				const disposers = DICTIONARIES.map(([locale, dict]) => ctx.locale.register(NS, locale, dict));
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "dsh-remote-development: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "@jackguo0310/dsh-remote",
				order: 45,
				label: () => t("settings.title"),
				inject: () => ({
					listMachines,
					saveMachine,
					deleteMachine,
					testConnection,
					getPreferences,
					setPreferences,
					refreshTreeMark: () => refreshTreeMark(),
					listForwards,
					openForward,
					closeForward,
					checkEnvironment,
					t
				})
			}, MachinesSection));
			const flowInjected = () => ({
				pickLocal: () => ctx.uiWorkspace.pickDirectory(),
				listLocalDir,
				createLocalDir,
				pickerKind: pickerCapability,
				listMachines,
				listRemoteDir,
				createRemoteDir,
				createAnchor,
				refreshTreeMark: () => refreshTreeMark(),
				t
			});
			ctx.slots.inject("conversation.hero.workspace.directoryFlow", () => ctx.slots.inject("sidebar.workspaces.directoryFlow", function* () {
				yield ctx.slots.register({
					name: "conversation.hero.workspace.directoryFlow",
					inject: flowInjected,
					priority: -1
				}, RemoteFlow);
				yield ctx.slots.register({
					name: "sidebar.workspaces.directoryFlow",
					inject: flowInjected,
					priority: -1
				}, RemoteFlow);
			}));
			registerReferenceSource(ctx, sessionRemote, t);
			registerRemoteFilesTab(ctx, t);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map