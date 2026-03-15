import "./paths-DPETYfXn.js";
import { p as defaultRuntime } from "./subsystem-Cg_UWVEG.js";
import { x as shortenHomePath, z as theme } from "./utils-CfiuWRBq.js";
import "./boolean-YY6K2DFz.js";
import { R as writeConfigFile, j as createConfigIO } from "./auth-profiles-BghqkBM8.js";
import { E as ensureAgentWorkspace, _ as DEFAULT_AGENT_WORKSPACE_DIR } from "./agent-scope-CIzpI5xh.js";
import "./openclaw-root-3Za7U6qY.js";
import "./exec-BAZSkTa2.js";
import "./github-copilot-token-BBzjUbRV.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-Bed7ywW_.js";
import "./env-vars-UJroIeWA.js";
import "./manifest-registry-CzxIZ7xJ.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-BZtcEEWo.js";
import "./message-channel-B603rVd0.js";
import "./sessions-DVvS5iwr.js";
import "./plugins-Bxiq3d8j.js";
import "./accounts-B-V4Uo9S.js";
import "./accounts-Da2rrQfS.js";
import "./logging-Dt6YWeiQ.js";
import "./accounts-CHqcVGvy.js";
import "./bindings-DcmrAriy.js";
import { s as resolveSessionTranscriptsDir } from "./paths-CVD1Nvmu.js";
import "./chat-envelope-BzTdl9Cm.js";
import "./client-3f8mxJEH.js";
import "./call-BMs9hz0g.js";
import "./pairing-token-DvOER2xR.js";
import "./net-D_wo0Sl1.js";
import "./tailnet-67wWyYBV.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import { t as formatDocsLink } from "./links-DYpENcXv.js";
import { n as runCommandWithRuntime } from "./cli-utils-CzLjS-VZ.js";
import "./progress-Be7vAY6t.js";
import "./onboard-helpers-IFNeulFC.js";
import "./prompt-style-D01Z207U.js";
import { t as hasExplicitOptions } from "./command-options-WgwfsgBg.js";
import "./note-CztWsdZ6.js";
import "./clack-prompter-Cfiyq5fc.js";
import "./runtime-guard-DzsNMb_E.js";
import "./onboarding-D4MZUjVz.js";
import { n as logConfigUpdated, t as formatConfigPath } from "./logging-DS0Tn5Cy.js";
import { t as onboardCommand } from "./onboard-CugNdJpw.js";
import JSON5 from "json5";
import fsPromises from "node:fs/promises";

//#region src/commands/setup.ts
async function readConfigFileRaw(configPath) {
	try {
		const raw = await fsPromises.readFile(configPath, "utf-8");
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
	await fsPromises.mkdir(sessionsDir, { recursive: true });
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