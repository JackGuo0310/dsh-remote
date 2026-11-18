window.__ModuleLoader__.load({
	id: "@jackguo0310/dsh-remote",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
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
		function escapeHtml(text) {
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
			return escapeHtml(code);
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
			const token = (0, react.useRef)(0);
			const fileToken = (0, react.useRef)(0);
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
				setOpened(null);
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
			/** Open one file in the tab's viewer. */
			const openFile = (0, react.useCallback)((entry) => {
				const mine = ++fileToken.current;
				setOpened({
					path: entry.path,
					name: entry.name
				});
				setFileState("loading");
				setEditing(false);
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
			const dirty = fileState === "ready" && draft !== savedText;
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
				}, t("files.download")), fileState === "ready" && !IMAGE_EXTENSIONS.test(opened.name) && (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Button, {
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
			const row = (entry) => {
				if (entry.dir) return (0, react.createElement)("button", {
					key: entry.path,
					type: "button",
					className: "rdv-filesRow",
					title: entry.path,
					onClick: () => load(machineId, entry.path)
				}, iconFor(entry), (0, react.createElement)("span", { className: "rdv-filesName" }, entry.name), (0, react.createElement)("span", {
					className: "rdv-filesGlyph",
					"aria-hidden": true
				}, "›"));
				return (0, react.createElement)("button", {
					key: entry.path,
					type: "button",
					className: "rdv-filesRow",
					title: entry.path,
					onClick: () => openFile(entry)
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
				readRemoteFile,
				writeRemoteFile,
				uploadRemoteFile,
				remoteDownloadUrl,
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