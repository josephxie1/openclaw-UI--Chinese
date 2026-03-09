import "./paths-BafI8hAX.js";
import { B as theme, R as colorize, S as shortenHomePath, z as isRich } from "./utils-C2rp27T1.js";
import "./agent-scope-hUtx0Gmw.js";
import "./subsystem-DoASNpMz.js";
import "./openclaw-root-CMyEcfUW.js";
import "./exec-Cga3tCb5.js";
import { Wt as readConfigFileSnapshot } from "./model-selection-Byqz32hU.js";
import "./github-copilot-token-JNDxie17.js";
import { t as formatCliCommand } from "./command-format-DELazozB.js";
import "./boolean-CE7i9tBR.js";
import "./env-DT45e_cy.js";
import "./host-env-security-CJMD0__Z.js";
import "./env-vars-gp4sxqr7.js";
import "./manifest-registry-ZL7mwhHa.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-ePhV6VyM.js";
import "./message-channel-CmxjO7-N.js";
import "./sessions-VdaDAoct.js";
import "./plugins-f8FOOJGM.js";
import "./accounts-D2SkYuI-.js";
import "./accounts-Djpd2FR1.js";
import "./logging-CeI8pPxx.js";
import "./accounts-BFxaTyOB.js";
import "./bindings-BtftZq3M.js";
import "./paths-BU7I2tq5.js";
import "./chat-envelope-BBXhi7A0.js";
import "./pairing-store-CvBGUb6r.js";
import "./exec-approvals-allowlist-CO-7p4nJ.js";
import "./exec-safe-bin-runtime-policy-C8f2BxZQ.js";
import "./plugin-auto-enable-DOpKMKzh.js";
import "./prompt-style-qOhNaOt0.js";
import { c as shouldMigrateStateFromPath } from "./argv-Bt72XfcP.js";
import "./note-Dq7QDG8L.js";
import { t as loadAndMaybeMigrateDoctorConfig } from "./doctor-config-flow-Cnn4p_Ah.js";

//#region src/cli/program/config-guard.ts
const ALLOWED_INVALID_COMMANDS = new Set([
	"doctor",
	"logs",
	"health",
	"help",
	"status"
]);
const ALLOWED_INVALID_GATEWAY_SUBCOMMANDS = new Set([
	"status",
	"probe",
	"health",
	"discover",
	"call",
	"install",
	"uninstall",
	"start",
	"stop",
	"restart"
]);
let didRunDoctorConfigFlow = false;
let configSnapshotPromise = null;
function formatConfigIssues(issues) {
	return issues.map((issue) => `- ${issue.path || "<root>"}: ${issue.message}`);
}
async function getConfigSnapshot() {
	if (process.env.VITEST === "true") return readConfigFileSnapshot();
	configSnapshotPromise ??= readConfigFileSnapshot();
	return configSnapshotPromise;
}
async function ensureConfigReady(params) {
	const commandPath = params.commandPath ?? [];
	if (!didRunDoctorConfigFlow && shouldMigrateStateFromPath(commandPath)) {
		didRunDoctorConfigFlow = true;
		const runDoctorConfigFlow = async () => loadAndMaybeMigrateDoctorConfig({
			options: { nonInteractive: true },
			confirm: async () => false
		});
		if (!params.suppressDoctorStdout) await runDoctorConfigFlow();
		else {
			const originalStdoutWrite = process.stdout.write.bind(process.stdout);
			const originalSuppressNotes = process.env.OPENCLAW_SUPPRESS_NOTES;
			process.stdout.write = (() => true);
			process.env.OPENCLAW_SUPPRESS_NOTES = "1";
			try {
				await runDoctorConfigFlow();
			} finally {
				process.stdout.write = originalStdoutWrite;
				if (originalSuppressNotes === void 0) delete process.env.OPENCLAW_SUPPRESS_NOTES;
				else process.env.OPENCLAW_SUPPRESS_NOTES = originalSuppressNotes;
			}
		}
	}
	const snapshot = await getConfigSnapshot();
	const commandName = commandPath[0];
	const subcommandName = commandPath[1];
	const allowInvalid = commandName ? ALLOWED_INVALID_COMMANDS.has(commandName) || commandName === "gateway" && subcommandName && ALLOWED_INVALID_GATEWAY_SUBCOMMANDS.has(subcommandName) : false;
	const issues = snapshot.exists && !snapshot.valid ? formatConfigIssues(snapshot.issues) : [];
	const legacyIssues = snapshot.legacyIssues.length > 0 ? snapshot.legacyIssues.map((issue) => `- ${issue.path}: ${issue.message}`) : [];
	if (!(snapshot.exists && !snapshot.valid)) return;
	const rich = isRich();
	const muted = (value) => colorize(rich, theme.muted, value);
	const error = (value) => colorize(rich, theme.error, value);
	const heading = (value) => colorize(rich, theme.heading, value);
	const commandText = (value) => colorize(rich, theme.command, value);
	params.runtime.error(heading("Config invalid"));
	params.runtime.error(`${muted("File:")} ${muted(shortenHomePath(snapshot.path))}`);
	if (issues.length > 0) {
		params.runtime.error(muted("Problem:"));
		params.runtime.error(issues.map((issue) => `  ${error(issue)}`).join("\n"));
	}
	if (legacyIssues.length > 0) {
		params.runtime.error(muted("Legacy config keys detected:"));
		params.runtime.error(legacyIssues.map((issue) => `  ${error(issue)}`).join("\n"));
	}
	params.runtime.error("");
	params.runtime.error(`${muted("Run:")} ${commandText(formatCliCommand("openclaw doctor --fix"))}`);
	if (!allowInvalid) params.runtime.exit(1);
}

//#endregion
export { ensureConfigReady };