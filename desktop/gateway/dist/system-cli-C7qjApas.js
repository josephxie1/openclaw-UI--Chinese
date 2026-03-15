import "./paths-DPETYfXn.js";
import { p as defaultRuntime } from "./subsystem-Cg_UWVEG.js";
import { D as danger, z as theme } from "./utils-CfiuWRBq.js";
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
import "./message-channel-B603rVd0.js";
import "./client-3f8mxJEH.js";
import "./call-BMs9hz0g.js";
import "./pairing-token-DvOER2xR.js";
import "./net-D_wo0Sl1.js";
import "./tailnet-67wWyYBV.js";
import { t as formatDocsLink } from "./links-DYpENcXv.js";
import "./progress-Be7vAY6t.js";
import { n as callGatewayFromCli, t as addGatewayClientOptions } from "./gateway-rpc-C8ikPGfx.js";

//#region src/cli/system-cli.ts
const normalizeWakeMode = (raw) => {
	const mode = typeof raw === "string" ? raw.trim() : "";
	if (!mode) return "next-heartbeat";
	if (mode === "now" || mode === "next-heartbeat") return mode;
	throw new Error("--mode must be now or next-heartbeat");
};
async function runSystemGatewayCommand(opts, action, successText) {
	try {
		const result = await action();
		if (opts.json || successText === void 0) defaultRuntime.log(JSON.stringify(result, null, 2));
		else defaultRuntime.log(successText);
	} catch (err) {
		defaultRuntime.error(danger(String(err)));
		defaultRuntime.exit(1);
	}
}
function registerSystemCli(program) {
	const system = program.command("system").description("System tools (events, heartbeat, presence)").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/system", "docs.openclaw.ai/cli/system")}\n`);
	addGatewayClientOptions(system.command("event").description("Enqueue a system event and optionally trigger a heartbeat").requiredOption("--text <text>", "System event text").option("--mode <mode>", "Wake mode (now|next-heartbeat)", "next-heartbeat").option("--json", "Output JSON", false)).action(async (opts) => {
		await runSystemGatewayCommand(opts, async () => {
			const text = typeof opts.text === "string" ? opts.text.trim() : "";
			if (!text) throw new Error("--text is required");
			return await callGatewayFromCli("wake", opts, {
				mode: normalizeWakeMode(opts.mode),
				text
			}, { expectFinal: false });
		}, "ok");
	});
	const heartbeat = system.command("heartbeat").description("Heartbeat controls");
	addGatewayClientOptions(heartbeat.command("last").description("Show the last heartbeat event").option("--json", "Output JSON", false)).action(async (opts) => {
		await runSystemGatewayCommand(opts, async () => {
			return await callGatewayFromCli("last-heartbeat", opts, void 0, { expectFinal: false });
		});
	});
	addGatewayClientOptions(heartbeat.command("enable").description("Enable heartbeats").option("--json", "Output JSON", false)).action(async (opts) => {
		await runSystemGatewayCommand(opts, async () => {
			return await callGatewayFromCli("set-heartbeats", opts, { enabled: true }, { expectFinal: false });
		});
	});
	addGatewayClientOptions(heartbeat.command("disable").description("Disable heartbeats").option("--json", "Output JSON", false)).action(async (opts) => {
		await runSystemGatewayCommand(opts, async () => {
			return await callGatewayFromCli("set-heartbeats", opts, { enabled: false }, { expectFinal: false });
		});
	});
	addGatewayClientOptions(system.command("presence").description("List system presence entries").option("--json", "Output JSON", false)).action(async (opts) => {
		await runSystemGatewayCommand(opts, async () => {
			return await callGatewayFromCli("system-presence", opts, void 0, { expectFinal: false });
		});
	});
}

//#endregion
export { registerSystemCli };