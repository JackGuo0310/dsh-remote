window.__ModuleLoader__.load({
	id: "@jackguo0310/dsh-remote",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
		/** Whether one session's workspace is remote (and its remote root). */
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
			"forwards.localOnly": "预览地址只适用于运行 DSH 的那台电脑。"
		}], ["en", {
			"settings.title": "Remote Development",
			"settings.intro": "Connect to remote machines over SSH and use a remote directory as a workspace. The agent works with the exact same tools as a local workspace; the plugin translates execution to the remote host.",
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
			"forwards.localOnly": "The preview URL works only on the machine running DSH."
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
.rdv-filesRow { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 26px; padding: 3px 10px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; text-decoration: none; }
.rdv-filesRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.rdv-filesRow:focus-visible { outline: 1px solid var(--dsw-alias-border-l2); outline-offset: -1px; }
.rdv-filesIcon { display: inline-flex; color: var(--dsw-alias-label-tertiary); flex: none; }
.rdv-filesName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesGlyph { color: var(--dsw-alias-label-tertiary); flex: none; font-size: 14px; line-height: 14px; }
.rdv-filesSize { color: var(--dsw-alias-label-tertiary); font-size: 11px; flex: none; font-variant-numeric: tabular-nums; }
.rdv-filesError { padding: 6px 10px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; word-break: break-word; }
.rdv-filesFoot { flex: none; padding: 5px 10px; border-top: 1px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rdv-filesMachine { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
/* Port forwards in the settings page: a compact add row plus live records. */
.rdv-forwardRow { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.rdv-forwardUrl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--dsw-alias-label-primary); }
.rdv-forwardTarget { color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; }
.rdv-sectionTitle { margin: 8px 0 0; color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 510; line-height: 20px; }
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
			const [forwards, setForwards] = (0, react.useState)([]);
			const [forwardMachine, setForwardMachine] = (0, react.useState)("");
			const [forwardPort, setForwardPort] = (0, react.useState)("");
			const [forwardHost, setForwardHost] = (0, react.useState)("");
			const [forwardBusy, setForwardBusy] = (0, react.useState)(false);
			const [forwardError, setForwardError] = (0, react.useState)("");
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
				props.getPreferences().then((p) => setLocalPicker(p.localPicker)).catch((err) => setError(err.message));
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
			return (0, react.createElement)("div", { className: "rdv-page" }, (0, react.createElement)("p", { className: "rdv-intro" }, t("settings.intro")), (0, react.createElement)("div", { className: "rdv-form" }, (0, react.createElement)("div", { className: "rdv-field" }, (0, react.createElement)("span", { className: "rdv-label" }, t("settings.localPicker")), (0, react.createElement)("select", {
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
				return (0, react.createElement)("div", {
					key: m.id,
					className: "rdv-card"
				}, (0, react.createElement)("div", { className: "rdv-cardMain" }, (0, react.createElement)("div", { className: "rdv-cardName" }, m.color !== "" && (0, react.createElement)("span", {
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
				}, t("settings.delete"))));
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
		//#region src/client/remote-files.tsx
		/**
		* The sidebar's remote-file tab. It browses the SESSION's remote workspace over
		* the plugin's own SSH/SFTP routes — the third-party sidebar's built-in files
		* tab reads the host filesystem, which is not where a remote session's files
		* live. Upload and download go through the same routes, so the browser that
		* shows the tab is the machine the bytes move to or from.
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
		/** Human byte size; the list is dense, so one short token per file. */
		function sizeText(bytes) {
			if (bytes === void 0) return "";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} K`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} M`;
			return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} G`;
		}
		/**
		* The tab body: resolve the session's remote root, then browse it.
		* @param props - session identity plus the injected host calls.
		* @returns the tab element.
		*/
		function RemoteFiles(props) {
			const { sessionId, injected } = props;
			const { t } = injected;
			const [machineId, setMachineId] = (0, react.useState)("");
			const [machineName, setMachineName] = (0, react.useState)("");
			const [path, setPath] = (0, react.useState)("");
			const [parent, setParent] = (0, react.useState)(null);
			const [entries, setEntries] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [uploading, setUploading] = (0, react.useState)(0);
			/** Distinguishes "still resolving the session" from "resolved, not remote". */
			const [resolved, setResolved] = (0, react.useState)(false);
			const token = (0, react.useRef)(0);
			const fileInput = (0, react.useRef)(null);
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
				let cancelled = false;
				token.current += 1;
				setResolved(false);
				setError("");
				setEntries([]);
				setPath("");
				setParent(null);
				injected.sessionRemote(sessionId).then((info) => {
					if (cancelled) return;
					setResolved(true);
					if (!info.remote || !info.machineId) {
						setMachineId("");
						return;
					}
					setMachineId(info.machineId);
					setMachineName(info.machineName ?? "");
					load(info.machineId, info.remotePath ?? "~");
				}).catch((err) => {
					if (cancelled) return;
					setResolved(true);
					setError(err.message);
				});
				return () => {
					cancelled = true;
				};
			}, [
				sessionId,
				injected,
				load
			]);
			const upload = (0, react.useCallback)((files) => {
				if (files === null || files.length === 0 || machineId === "" || path === "") return;
				const list = Array.from(files);
				setUploading(list.length);
				setError("");
				(async () => {
					for (const file of list) {
						try {
							await injected.uploadRemoteFile(machineId, path, file);
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
			if (!resolved) return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-empty" }, t("files.loading")));
			if (machineId === "") return (0, react.createElement)("div", { className: "rdv-files" }, (0, react.createElement)("div", { className: "rdv-empty" }, (0, react.createElement)("div", null, t("files.notRemote")), (0, react.createElement)("div", { className: "rdv-hint" }, t("files.notRemoteHint"))));
			const canGoUp = parent !== null && path !== "";
			const row = (entry) => {
				if (entry.dir) return (0, react.createElement)("button", {
					key: entry.path,
					type: "button",
					className: "rdv-filesRow",
					title: entry.path,
					onClick: () => load(machineId, entry.path)
				}, FOLDER_ICON, (0, react.createElement)("span", { className: "rdv-filesName" }, entry.name), (0, react.createElement)("span", {
					className: "rdv-filesGlyph",
					"aria-hidden": true
				}, "›"));
				return (0, react.createElement)("a", {
					key: entry.path,
					className: "rdv-filesRow",
					href: injected.remoteDownloadUrl(machineId, entry.path),
					download: entry.name,
					title: t("files.downloadHint").replace("{path}", entry.path)
				}, FILE_ICON, (0, react.createElement)("span", { className: "rdv-filesName" }, entry.name), (0, react.createElement)("span", { className: "rdv-filesSize" }, sizeText(entry.size)));
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
			}), error !== "" && (0, react.createElement)("div", { className: "rdv-filesError" }, error), (0, react.createElement)("div", { className: "rdv-filesList" }, loading && entries.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("files.loading")) : entries.length === 0 ? (0, react.createElement)("div", { className: "rdv-empty" }, t("files.empty")) : entries.map(row)), (0, react.createElement)("div", { className: "rdv-filesFoot" }, (0, react.createElement)("span", {
				className: "rdv-filesMachine",
				title: machineId
			}, machineName || machineId)));
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
				uploadRemoteFile,
				remoteDownloadUrl,
				t
			};
			ctx.inject(["betterSidebar"], (scope) => {
				const dispose = scope.betterSidebar.registerTab({
					id: "dsh-remote:files",
					title: () => t("files.tabTitle"),
					description: () => t("files.tabDescription"),
					order: 12,
					single: true,
					component: ({ scope: sessionScope }) => (0, react.createElement)(RemoteFiles, {
						sessionId: sessionScope.sessionId,
						injected
					})
				});
				scope.effect(() => dispose, "dsh-remote-development: sidebar tab");
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