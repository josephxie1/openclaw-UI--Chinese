import { t as CONFIG_PATH } from "./paths-BafI8hAX.js";
import { o as displayPath } from "./utils-C2rp27T1.js";
import { t as __exportAll } from "./gateway-cli-CceGh-jr.js";

//#region src/config/logging.ts
var logging_exports = /* @__PURE__ */ __exportAll({
	formatConfigPath: () => formatConfigPath,
	logConfigUpdated: () => logConfigUpdated
});
function formatConfigPath(path = CONFIG_PATH) {
	return displayPath(path);
}
function logConfigUpdated(runtime, opts = {}) {
	const path = formatConfigPath(opts.path ?? CONFIG_PATH);
	const suffix = opts.suffix ? ` ${opts.suffix}` : "";
	runtime.log(`Updated ${path}${suffix}`);
}

//#endregion
export { logConfigUpdated as n, logging_exports as r, formatConfigPath as t };