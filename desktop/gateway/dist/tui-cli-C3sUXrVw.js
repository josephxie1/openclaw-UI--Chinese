import "./paths-B9jPXz5d.js";
import { p as defaultRuntime } from "./subsystem-D2eqGDrA.js";
import { z as theme } from "./utils-XeuG5BG2.js";
import "./boolean-DtWR5bt3.js";
import "./auth-profiles-CZvcgpJo.js";
import "./agent-scope-a8AT_RWh.js";
import "./openclaw-root-PXe5cw0N.js";
import "./exec-CSag7MO2.js";
import "./github-copilot-token-CHThtPpe.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-DR9Qjj6f.js";
import "./env-vars-tQ4AIdQq.js";
import "./manifest-registry-yJ4VbgqY.js";
import "./zod-schema.sensitive-DWhkVThK.js";
import "./dock-CCwltZZY.js";
import "./frontmatter-CyFnddo-.js";
import "./skills-HX9fGcwF.js";
import "./path-alias-guards-Bqfz8RAo.js";
import "./message-channel-yd0kgwA7.js";
import "./sessions-Bi0azzm9.js";
import "./plugins-BzP494ZB.js";
import "./accounts-DPFlmjrY.js";
import "./accounts-CR81YEDz.js";
import "./logging-D-Jq2wIo.js";
import "./accounts-BsTMZ8Rl.js";
import "./bindings-Bdjgy182.js";
import "./paths-BUjNRwj7.js";
import "./chat-envelope-n7RmUTHV.js";
import "./client-CkwAK9X6.js";
import "./call-sYT50rpM.js";
import "./pairing-token-BksY3ZD6.js";
import "./net-BmOGX3t_.js";
import "./tailnet-BEMQ0WkF.js";
import "./image-ops-C1wqTSdk.js";
import "./pi-embedded-helpers-1PZ4aCg-.js";
import "./sandbox-DTBpCi6a.js";
import "./tool-catalog-DfXt8uIy.js";
import "./chrome-CLydEGCA.js";
import "./tailscale-BVHEqtVC.js";
import "./auth-B4wlyb-l.js";
import "./server-context-CgtJLU5F.js";
import "./paths-BeiNGh4n.js";
import "./redact-BGmCI-cn.js";
import "./errors-BFjy26zi.js";
import "./fs-safe-BEKG0MwK.js";
import "./ssrf-gi8Pc2Fy.js";
import "./store-Do_Iey7m.js";
import "./ports-BwOg8fHr.js";
import "./trash-Cv3xOBdi.js";
import "./server-middleware-dIszEUpi.js";
import "./tool-images-CRkRwEVE.js";
import "./thinking-DuXsFbTV.js";
import "./commands-KKgWclzv.js";
import "./commands-registry-Dg8Rixk-.js";
import "./tool-display-TYTccNWv.js";
import { t as parseTimeoutMs } from "./parse-timeout-BS3EWcf6.js";
import { t as formatDocsLink } from "./links-CWyy563z.js";
import { t as runTui } from "./tui-qSQLY1EC.js";

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