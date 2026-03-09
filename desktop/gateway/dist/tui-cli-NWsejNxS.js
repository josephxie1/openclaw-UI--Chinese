import "./paths-DPETYfXn.js";
import { p as defaultRuntime } from "./subsystem-Cg_UWVEG.js";
import { z as theme } from "./utils-CfiuWRBq.js";
import "./boolean-YY6K2DFz.js";
import "./auth-profiles-pmKds52w.js";
import "./agent-scope-CLHs7Zj4.js";
import "./openclaw-root-D6WnGhDc.js";
import "./exec-BAZSkTa2.js";
import "./github-copilot-token-BBzjUbRV.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-Bed7ywW_.js";
import "./env-vars-UJroIeWA.js";
import "./manifest-registry-NoROo1B_.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-CMVWLgFK.js";
import "./frontmatter-CmZFrduY.js";
import "./skills-BfREX8cQ.js";
import "./path-alias-guards-D4-gdKtk.js";
import "./message-channel-B603rVd0.js";
import "./sessions-BDU_-DdW.js";
import "./plugins-CD0OuhLK.js";
import "./accounts-jWHn2aXU.js";
import "./accounts-COlYPAPI.js";
import "./logging-Dt6YWeiQ.js";
import "./accounts-D28RTYc8.js";
import "./bindings-xjhAFrzX.js";
import "./paths-CVD1Nvmu.js";
import "./chat-envelope-BzTdl9Cm.js";
import "./client-DOO0IIji.js";
import "./call-B9HMBIgs.js";
import "./pairing-token-CMsOsUWQ.js";
import "./net-CWnLPYEi.js";
import "./tailnet-Zdwgqy-5.js";
import "./image-ops-BhGvujH7.js";
import "./pi-embedded-helpers-DyAiANRA.js";
import "./sandbox-Bq11A_Rx.js";
import "./tool-catalog-4hvNhN9N.js";
import "./chrome-Cz5DGKpO.js";
import "./tailscale-DYJAYqJb.js";
import "./auth-BFLoV1Uy.js";
import "./server-context-wSt48nR2.js";
import "./paths-Cn3pynMs.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import "./fs-safe-DxaL6wf1.js";
import "./ssrf-_ebiGWnk.js";
import "./store-lOowqS8F.js";
import "./ports-qZUat5CZ.js";
import "./trash-Byfl_5o-.js";
import "./server-middleware-21d6lloq.js";
import "./tool-images-Dkf1nM4u.js";
import "./thinking-BCY5R30D.js";
import "./commands-luj13TjG.js";
import "./commands-registry-JMbSyz6m.js";
import "./tool-display-B6pQohiH.js";
import { t as parseTimeoutMs } from "./parse-timeout-UOA56UND.js";
import { t as formatDocsLink } from "./links-DYpENcXv.js";
import { t as runTui } from "./tui-DH1g7M0F.js";

//#region src/cli/tui-cli.ts
function registerTuiCli(program) {
	program.command("tui").description("Open a terminal UI connected to the Gateway").option("--url <url>", "Gateway WebSocket URL (defaults to gateway.remote.url when configured)").option("--token <token>", "Gateway token (if required)").option("--password <password>", "Gateway password (if required)").option("--session <key>", "Session key (default: \"main\", or \"global\" when scope is global)").option("--deliver", "Deliver assistant replies", false).option("--thinking <level>", "Thinking level override").option("--message <text>", "Send an initial message after connecting").option("--timeout-ms <ms>", "Agent timeout in ms (defaults to agents.defaults.timeoutSeconds)").option("--history-limit <n>", "History entries to load", "200").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/tui", "docs.openclaw.ai/cli/tui")}\n`).action(async (opts) => {
		try {
			const timeoutMs = parseTimeoutMs(opts.timeoutMs);
			if (opts.timeoutMs !== void 0 && timeoutMs === void 0) defaultRuntime.error(`warning: invalid --timeout-ms "${String(opts.timeoutMs)}"; ignoring`);
			const historyLimit = Number.parseInt(String(opts.historyLimit ?? "200"), 10);
			await runTui({
				url: opts.url,
				token: opts.token,
				password: opts.password,
				session: opts.session,
				deliver: Boolean(opts.deliver),
				thinking: opts.thinking,
				message: opts.message,
				timeoutMs,
				historyLimit: Number.isNaN(historyLimit) ? void 0 : historyLimit
			});
		} catch (err) {
			defaultRuntime.error(String(err));
			defaultRuntime.exit(1);
		}
	});
}

//#endregion
export { registerTuiCli };