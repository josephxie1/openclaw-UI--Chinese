import "./paths-BafI8hAX.js";
import { B as theme } from "./utils-C2rp27T1.js";
import "./thinking-CJzCCbYy.js";
import "./agent-scope-hUtx0Gmw.js";
import { p as defaultRuntime } from "./subsystem-DoASNpMz.js";
import "./openclaw-root-CMyEcfUW.js";
import "./exec-Cga3tCb5.js";
import "./model-selection-Byqz32hU.js";
import "./github-copilot-token-JNDxie17.js";
import "./boolean-CE7i9tBR.js";
import "./env-DT45e_cy.js";
import "./host-env-security-CJMD0__Z.js";
import "./env-vars-gp4sxqr7.js";
import "./manifest-registry-ZL7mwhHa.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-ePhV6VyM.js";
import "./message-channel-CmxjO7-N.js";
import "./pi-embedded-helpers-DSW5OBBO.js";
import "./sandbox-A8hfyKgi.js";
import "./tool-catalog-CrsxKKLj.js";
import "./chrome-C2yG3uod.js";
import "./tailscale-CmXeiJOn.js";
import "./tailnet-q4skT7lo.js";
import "./ws-Cf71ITZP.js";
import "./auth-BdcNQZjr.js";
import "./server-context-0Qn8DVy0.js";
import "./frontmatter-DQ4Janwj.js";
import "./skills-DtK0BEAU.js";
import "./path-alias-guards-BTugjn_E.js";
import "./paths-Dby1iZZc.js";
import "./redact-DkGdi7vy.js";
import "./errors-BRgSJZKa.js";
import "./fs-safe-CYuhfJiB.js";
import "./ssrf-CHMDHJCD.js";
import "./image-ops-BwGmDpam.js";
import "./store-Dzj98Jf6.js";
import "./ports-B2fbXoub.js";
import "./trash-BBM26iKd.js";
import "./server-middleware-x1gE0tXy.js";
import "./sessions-VdaDAoct.js";
import "./plugins-f8FOOJGM.js";
import "./accounts-D2SkYuI-.js";
import "./accounts-Djpd2FR1.js";
import "./logging-CeI8pPxx.js";
import "./accounts-BFxaTyOB.js";
import "./bindings-BtftZq3M.js";
import "./paths-BU7I2tq5.js";
import "./chat-envelope-BBXhi7A0.js";
import "./tool-images-BURNGLH1.js";
import "./tool-display-BsDqyAKJ.js";
import "./commands-C25v8qFZ.js";
import "./commands-registry-BQfujkdE.js";
import "./client-Bdxi_Lgo.js";
import "./call-CKmCm4sY.js";
import "./pairing-token-BoiaEYMG.js";
import { t as formatDocsLink } from "./links-CzqoXPP7.js";
import { t as parseTimeoutMs } from "./parse-timeout-DT8wPERl.js";
import { t as runTui } from "./tui-C-OhHGx8.js";

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