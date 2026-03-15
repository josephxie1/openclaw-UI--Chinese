import "./paths-BafI8hAX.js";
import { B as theme, S as shortenHomePath } from "./utils-C2rp27T1.js";
import { E as ensureAgentWorkspace, _ as DEFAULT_AGENT_WORKSPACE_DIR } from "./agent-scope-hUtx0Gmw.js";
import { p as defaultRuntime } from "./subsystem-DoASNpMz.js";
import "./openclaw-root-CMyEcfUW.js";
import "./exec-Cga3tCb5.js";
import { Jt as writeConfigFile, Vt as createConfigIO } from "./model-selection-Byqz32hU.js";
import "./github-copilot-token-JNDxie17.js";
import "./boolean-CE7i9tBR.js";
import "./env-DT45e_cy.js";
import "./host-env-security-CJMD0__Z.js";
import "./env-vars-gp4sxqr7.js";
import "./manifest-registry-ZL7mwhHa.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-ePhV6VyM.js";
import "./message-channel-CmxjO7-N.js";
import "./tailnet-q4skT7lo.js";
import "./ws-Cf71ITZP.js";
import "./redact-DkGdi7vy.js";
import "./errors-BRgSJZKa.js";
import "./sessions-VdaDAoct.js";
import "./plugins-f8FOOJGM.js";
import "./accounts-D2SkYuI-.js";
import "./accounts-Djpd2FR1.js";
import "./logging-CeI8pPxx.js";
import "./accounts-BFxaTyOB.js";
import "./bindings-BtftZq3M.js";
import { s as resolveSessionTranscriptsDir } from "./paths-BU7I2tq5.js";
import "./chat-envelope-BBXhi7A0.js";
import "./client-Bdxi_Lgo.js";
import "./call-CKmCm4sY.js";
import "./pairing-token-BoiaEYMG.js";
import { t as formatDocsLink } from "./links-CzqoXPP7.js";
import { n as runCommandWithRuntime } from "./cli-utils-nir8nXdI.js";
import "./progress-BFhULz_W.js";
import "./onboard-helpers-Cc-pFaG2.js";
import "./prompt-style-qOhNaOt0.js";
import "./runtime-guard-BDLjqquN.js";
import { t as hasExplicitOptions } from "./command-options-nr4d_vst.js";
import "./note-Dq7QDG8L.js";
import "./clack-prompter-BdIUpYvT.js";
import "./onboarding-CTXuyU9i.js";
import { n as logConfigUpdated, t as formatConfigPath } from "./logging-CeAcNtzX.js";
import { t as onboardCommand } from "./onboard-Ct5F32AN.js";
import JSON5 from "json5";
import fs from "node:fs/promises";

//#region src/commands/setup.ts
async function readConfigFileRaw(configPath) {
	try {
		const raw = await fs.readFile(configPath, "utf-8");
		const parsed = JSON5.parse(raw);
		if (parsed && typeof parsed === "object") return {
			exists: true,
			parsed
		};
		return {
			exists: true,
			parsed: {}
		};
	} catch {
		return {
			exists: false,
			parsed: {}
		};
	}
}
async function setupCommand(opts, runtime = defaultRuntime) {
	const desiredWorkspace = typeof opts?.workspace === "string" && opts.workspace.trim() ? opts.workspace.trim() : void 0;
	const configPath = createConfigIO().configPath;
	const existingRaw = await readConfigFileRaw(configPath);
	const cfg = existingRaw.parsed;
	const defaults = cfg.agents?.defaults ?? {};
	const workspace = desiredWorkspace ?? defaults.workspace ?? DEFAULT_AGENT_WORKSPACE_DIR;
	const next = {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...defaults,
				workspace
			}
		}
	};
	if (!existingRaw.exists || defaults.workspace !== workspace) {
		await writeConfigFile(next);
		if (!existingRaw.exists) runtime.log(`Wrote ${formatConfigPath(configPath)}`);
		else logConfigUpdated(runtime, {
			path: configPath,
			suffix: "(set agents.defaults.workspace)"
		});
	} else runtime.log(`Config OK: ${formatConfigPath(configPath)}`);
	const ws = await ensureAgentWorkspace({
		dir: workspace,
		ensureBootstrapFiles: !next.agents?.defaults?.skipBootstrap
	});
	runtime.log(`Workspace OK: ${shortenHomePath(ws.dir)}`);
	const sessionsDir = resolveSessionTranscriptsDir();
	await fs.mkdir(sessionsDir, { recursive: true });
	runtime.log(`Sessions OK: ${shortenHomePath(sessionsDir)}`);
}

//#endregion
//#region src/cli/program/register.setup.ts
function registerSetupCommand(program) {
	program.command("setup").description("Initialize ~/.openclaw/openclaw.json and the agent workspace").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/setup", "docs.openclaw.ai/cli/setup")}\n`).option("--workspace <dir>", "Agent workspace directory (default: ~/.openclaw/workspace; stored as agents.defaults.workspace)").option("--wizard", "Run the interactive onboarding wizard", false).option("--non-interactive", "Run the wizard without prompts", false).option("--mode <mode>", "Wizard mode: local|remote").option("--remote-url <url>", "Remote Gateway WebSocket URL").option("--remote-token <token>", "Remote Gateway token (optional)").action(async (opts, command) => {
		await runCommandWithRuntime(defaultRuntime, async () => {
			const hasWizardFlags = hasExplicitOptions(command, [
				"wizard",
				"nonInteractive",
				"mode",
				"remoteUrl",
				"remoteToken"
			]);
			if (opts.wizard || hasWizardFlags) {
				await onboardCommand({
					workspace: opts.workspace,
					nonInteractive: Boolean(opts.nonInteractive),
					mode: opts.mode,
					remoteUrl: opts.remoteUrl,
					remoteToken: opts.remoteToken
				}, defaultRuntime);
				return;
			}
			await setupCommand({ workspace: opts.workspace }, defaultRuntime);
		});
	});
}

//#endregion
export { registerSetupCommand };