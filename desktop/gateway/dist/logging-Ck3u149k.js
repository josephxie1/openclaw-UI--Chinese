import { t as CONFIG_PATH } from "./paths-DPETYfXn.js";
import { a as displayPath } from "./utils-CfiuWRBq.js";
import { t as __exportAll } from "./gateway-cli-Ci3pDF9D.js";

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