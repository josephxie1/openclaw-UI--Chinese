import "./paths-DPETYfXn.js";
import { t as createSubsystemLogger } from "./subsystem-Cg_UWVEG.js";
import "./utils-CfiuWRBq.js";
import "./boolean-YY6K2DFz.js";
import { M as loadConfig } from "./auth-profiles-BghqkBM8.js";
import "./agent-scope-CIzpI5xh.js";
import "./openclaw-root-3Za7U6qY.js";
import "./exec-BAZSkTa2.js";
import "./github-copilot-token-BBzjUbRV.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-Bed7ywW_.js";
import "./env-vars-UJroIeWA.js";
import "./manifest-registry-CzxIZ7xJ.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./path-alias-guards-CQioIZOJ.js";
import "./net-D_wo0Sl1.js";
import "./tailnet-67wWyYBV.js";
import { t as isPwAiLoaded } from "./diagnostic-session-state-An6nqjMW.js";
import "./image-ops-2_ZDkf3K.js";
import "./chrome-vkPv6Hbo.js";
import "./tailscale-DYJAYqJb.js";
import "./auth-DhIxsXk7.js";
import { c as resolveBrowserControlAuth, i as resolveBrowserConfig, r as registerBrowserRoutes, s as ensureBrowserControlAuth, t as createBrowserRouteContext } from "./server-context-CTOIotCF.js";
import "./paths-CjKUISLf.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import "./fs-safe-BuWUIX7Q.js";
import "./ssrf-CWEIH4LI.js";
import "./store-BBLlgREE.js";
import "./ports-B6VfKv4T.js";
import "./trash-Byfl_5o-.js";
import { n as installBrowserCommonMiddleware, t as installBrowserAuthMiddleware } from "./server-middleware-CO3jp0WE.js";
import { n as stopKnownBrowserProfiles, t as ensureExtensionRelayForProfiles } from "./server-lifecycle-CpMS9ycF.js";
import express from "express";

//#region src/browser/server.ts
let state = null;
const logServer = createSubsystemLogger("browser").child("server");
async function startBrowserControlServerFromConfig() {
	if (state) return state;
	const cfg = loadConfig();
	const resolved = resolveBrowserConfig(cfg.browser, cfg);
	if (!resolved.enabled) return null;
	let browserAuth = resolveBrowserControlAuth(cfg);
	let browserAuthBootstrapFailed = false;
	try {
		const ensured = await ensureBrowserControlAuth({ cfg });
		browserAuth = ensured.auth;
		if (ensured.generatedToken) logServer.info("No browser auth configured; generated gateway.auth.token automatically.");
	} catch (err) {
		logServer.warn(`failed to auto-configure browser auth: ${String(err)}`);
		browserAuthBootstrapFailed = true;
	}
	if (browserAuthBootstrapFailed && !browserAuth.token && !browserAuth.password) {
		logServer.error("browser control startup aborted: authentication bootstrap failed and no fallback auth is configured.");
		return null;
	}
	const app = express();
	installBrowserCommonMiddleware(app);
	installBrowserAuthMiddleware(app, browserAuth);
	registerBrowserRoutes(app, createBrowserRouteContext({
		getState: () => state,
		refreshConfigFromDisk: true
	}));
	const port = resolved.controlPort;
	const server = await new Promise((resolve, reject) => {
		const s = app.listen(port, "127.0.0.1", () => resolve(s));
		s.once("error", reject);
	}).catch((err) => {
		logServer.error(`openclaw browser server failed to bind 127.0.0.1:${port}: ${String(err)}`);
		return null;
	});
	if (!server) return null;
	state = {
		server,
		port,
		resolved,
		profiles: /* @__PURE__ */ new Map()
	};
	await ensureExtensionRelayForProfiles({
		resolved,
		onWarn: (message) => logServer.warn(message)
	});
	const authMode = browserAuth.token ? "token" : browserAuth.password ? "password" : "off";
	logServer.info(`Browser control listening on http://127.0.0.1:${port}/ (auth=${authMode})`);
	return state;
}
async function stopBrowserControlServer() {
	const current = state;
	if (!current) return;
	await stopKnownBrowserProfiles({
		getState: () => state,
		onWarn: (message) => logServer.warn(message)
	});
	if (current.server) await new Promise((resolve) => {
		current.server?.close(() => resolve());
	});
	state = null;
	if (isPwAiLoaded()) try {
		await (await import("./pw-ai-Bp8svC3f.js")).closePlaywrightBrowserConnection();
	} catch {}
}

//#endregion
export { startBrowserControlServerFromConfig, stopBrowserControlServer };