import "./paths-DPETYfXn.js";
import { p as defaultRuntime } from "./subsystem-Cg_UWVEG.js";
import { z as theme } from "./utils-CfiuWRBq.js";
import "./boolean-YY6K2DFz.js";
import "./auth-profiles-BghqkBM8.js";
import "./agent-scope-CIzpI5xh.js";
import "./openclaw-root-3Za7U6qY.js";
import "./exec-BAZSkTa2.js";
import "./github-copilot-token-BBzjUbRV.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-Bed7ywW_.js";
import "./env-vars-UJroIeWA.js";
import "./manifest-registry-CzxIZ7xJ.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-BZtcEEWo.js";
import "./frontmatter-CmZFrduY.js";
import "./skills-Cc0j4M1-.js";
import "./path-alias-guards-CQioIZOJ.js";
import "./message-channel-B603rVd0.js";
import "./sessions-DVvS5iwr.js";
import "./plugins-Bxiq3d8j.js";
import "./accounts-B-V4Uo9S.js";
import "./accounts-Da2rrQfS.js";
import "./logging-Dt6YWeiQ.js";
import "./accounts-CHqcVGvy.js";
import "./bindings-DcmrAriy.js";
import "./paths-CVD1Nvmu.js";
import "./chat-envelope-BzTdl9Cm.js";
import "./client-3f8mxJEH.js";
import "./call-BMs9hz0g.js";
import "./pairing-token-DvOER2xR.js";
import "./net-D_wo0Sl1.js";
import "./tailnet-67wWyYBV.js";
import "./image-ops-2_ZDkf3K.js";
import "./pi-embedded-helpers-Of3qHWQl.js";
import "./sandbox-DTxaN4ta.js";
import "./tool-catalog-4hvNhN9N.js";
import "./chrome-vkPv6Hbo.js";
import "./tailscale-DYJAYqJb.js";
import "./auth-DhIxsXk7.js";
import "./server-context-CTOIotCF.js";
import "./paths-CjKUISLf.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import "./fs-safe-BuWUIX7Q.js";
import "./ssrf-CWEIH4LI.js";
import "./store-BBLlgREE.js";
import "./ports-B6VfKv4T.js";
import "./trash-Byfl_5o-.js";
import "./server-middleware-CO3jp0WE.js";
import "./tool-images-DW9VWMTP.js";
import "./thinking-BCY5R30D.js";
import "./commands-Caw9RrEA.js";
import "./commands-registry-BD9m-_KG.js";
import "./tool-display-BQX7EkN8.js";
import { t as parseTimeoutMs } from "./parse-timeout-UOA56UND.js";
import { t as formatDocsLink } from "./links-DYpENcXv.js";
import { t as runTui } from "./tui-CQu8LvCW.js";

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