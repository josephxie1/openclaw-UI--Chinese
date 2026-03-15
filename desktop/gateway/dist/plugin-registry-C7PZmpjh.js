import { lt as loadOpenClawPlugins } from "./reply-CoPc6XC4.js";
import { d as resolveDefaultAgentId, u as resolveAgentWorkspaceDir } from "./agent-scope-hUtx0Gmw.js";
import { D as getActivePluginRegistry, t as createSubsystemLogger } from "./subsystem-DoASNpMz.js";
import { Ht as loadConfig } from "./model-selection-Byqz32hU.js";
import { t as __exportAll } from "./gateway-cli-D5qYDxzq.js";

//#region src/cli/plugin-registry.ts
var plugin_registry_exports = /* @__PURE__ */ __exportAll({ ensurePluginRegistryLoaded: () => ensurePluginRegistryLoaded });
const log = createSubsystemLogger("plugins");
let pluginRegistryLoaded = false;
function ensurePluginRegistryLoaded() {
	if (pluginRegistryLoaded) return;
	const active = getActivePluginRegistry();
	if (active && (active.plugins.length > 0 || active.channels.length > 0 || active.tools.length > 0)) {
		pluginRegistryLoaded = true;
		return;
	}
	const config = loadConfig();
	loadOpenClawPlugins({
		config,
		workspaceDir: resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config)),
		logger: {
			info: (msg) => log.info(msg),
			warn: (msg) => log.warn(msg),
			error: (msg) => log.error(msg),
			debug: (msg) => log.debug(msg)
		}
	});
	pluginRegistryLoaded = true;
}

//#endregion
export { plugin_registry_exports as n, ensurePluginRegistryLoaded as t };