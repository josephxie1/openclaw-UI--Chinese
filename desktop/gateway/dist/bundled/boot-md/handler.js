import { n as listAgentIds, s as resolveAgentWorkspaceDir } from "../../agent-scope-CyL4p3WM.js";
import "../../paths-B9lBY6-m.js";
import { pt as isGatewayStartupEvent, r as defaultRuntime, t as createSubsystemLogger } from "../../subsystem-mPRezpll.js";
import { l as resolveAgentIdFromSessionKey } from "../../session-key-CPPWn8gW.js";
import "../../workspace-xqVw9elw.js";
import "../../model-selection-C2qYg1Hy.js";
import "../../github-copilot-token-BgKF-7S1.js";
import "../../env-DijpAkAH.js";
import "../../boolean-M-esQJt6.js";
import "../../dock-4m-mtCpe.js";
import { n as SILENT_REPLY_TOKEN } from "../../tokens-DhiG-E4H.js";
import { a as createDefaultDeps, i as agentCommand } from "../../pi-embedded-_vAv-ULl.js";
import "../../plugins-6swg8Eal.js";
import "../../accounts-CaRtAz_2.js";
import "../../bindings-CIp11eBf.js";
import "../../send-B1hABJK5.js";
import "../../send-BW4GFQe3.js";
import "../../deliver-BcpLFSKs.js";
import "../../diagnostic-CeMVFbeF.js";
import "../../diagnostic-session-state-C0Sxjfox.js";
import "../../accounts-8ZWbw0Zq.js";
import "../../send-O1Kf0X30.js";
import "../../image-ops-B-vhnrbA.js";
import "../../pi-model-discovery-DA6plQNR.js";
import "../../message-channel-DKXv9Xa_.js";
import "../../pi-embedded-helpers-IaWApo7A.js";
import "../../chrome-C2P7Tftn.js";
import "../../frontmatter-eHCuq81z.js";
import "../../skills-C0diN5NC.js";
import "../../path-alias-guards-CQeDgBD-.js";
import "../../redact-B5RjPWCN.js";
import "../../errors-BB1m5Yna.js";
import "../../fs-safe-B3SyJrUG.js";
import "../../ssrf-DoofAz6G.js";
import "../../store-XJhJrgMC.js";
import { H as resolveAgentMainSessionKey, W as resolveMainSessionKey, d as updateSessionStore, s as loadSessionStore } from "../../sessions-Quk2QWH_.js";
import "../../accounts-BKkVzHhg.js";
import { l as resolveStorePath } from "../../paths-C8TW5zqh.js";
import "../../tool-images-7-rN09qB.js";
import "../../thinking-DEPKewmZ.js";
import "../../image-COHy_VYw.js";
import "../../reply-prefix-vlQQmLzt.js";
import "../../manager-BBIus3yd.js";
import "../../gemini-auth-DIhtAV3I.js";
import "../../fetch-guard-DRSihvoC.js";
import "../../query-expansion-C-tgLuSk.js";
import "../../retry-jbRR-O4V.js";
import "../../target-errors-DBLPoy22.js";
import "../../local-roots-CXS7K9v_.js";
import "../../chunk-CUWJkNYS.js";
import "../../markdown-tables-DwnqHi8d.js";
import "../../ir-CpdW7ulc.js";
import "../../render-B1VqYyvo.js";
import "../../commands-registry-BQKPA1m4.js";
import "../../skill-commands-DUzTiNl4.js";
import "../../retry-policy-CfyF02Fr.js";
import "../../runner-DD70y4zY.js";
import "../../fetch-seh5wWer.js";
import "../../tables-YPSmlIl8.js";
import "../../send-iHAZFt_m.js";
import "../../outbound-attachment-ClDCxaCa.js";
import "../../send-xs7u4MVM.js";
import "../../resolve-route-DY7TO1JI.js";
import "../../proxy-XyLLh-Ux.js";
import "../../replies-BKx4rMqI.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

//#region src/gateway/boot.ts
function generateBootSessionId() {
	return `boot-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").replace("Z", "")}-${crypto.randomUUID().slice(0, 8)}`;
}
const log$1 = createSubsystemLogger("gateway/boot");
const BOOT_FILENAME = "BOOT.md";
function buildBootPrompt(content) {
	return [
		"You are running a boot check. Follow BOOT.md instructions exactly.",
		"",
		"BOOT.md:",
		content,
		"",
		"If BOOT.md asks you to send a message, use the message tool (action=send with channel + target).",
		"Use the `target` field (not `to`) for message tool destinations.",
		`After sending with the message tool, reply with ONLY: ${SILENT_REPLY_TOKEN}.`,
		`If nothing needs attention, reply with ONLY: ${SILENT_REPLY_TOKEN}.`
	].join("\n");
}
async function loadBootFile(workspaceDir) {
	const bootPath = path.join(workspaceDir, BOOT_FILENAME);
	try {
		const trimmed = (await fs.readFile(bootPath, "utf-8")).trim();
		if (!trimmed) return { status: "empty" };
		return {
			status: "ok",
			content: trimmed
		};
	} catch (err) {
		if (err.code === "ENOENT") return { status: "missing" };
		throw err;
	}
}
function snapshotMainSessionMapping(params) {
	const agentId = resolveAgentIdFromSessionKey(params.sessionKey);
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId });
	try {
		const entry = loadSessionStore(storePath, { skipCache: true })[params.sessionKey];
		if (!entry) return {
			storePath,
			sessionKey: params.sessionKey,
			canRestore: true,
			hadEntry: false
		};
		return {
			storePath,
			sessionKey: params.sessionKey,
			canRestore: true,
			hadEntry: true,
			entry: structuredClone(entry)
		};
	} catch (err) {
		log$1.debug("boot: could not snapshot main session mapping", {
			sessionKey: params.sessionKey,
			error: String(err)
		});
		return {
			storePath,
			sessionKey: params.sessionKey,
			canRestore: false,
			hadEntry: false
		};
	}
}
async function restoreMainSessionMapping(snapshot) {
	if (!snapshot.canRestore) return;
	try {
		await updateSessionStore(snapshot.storePath, (store) => {
			if (snapshot.hadEntry && snapshot.entry) {
				store[snapshot.sessionKey] = snapshot.entry;
				return;
			}
			delete store[snapshot.sessionKey];
		}, { activeSessionKey: snapshot.sessionKey });
		return;
	} catch (err) {
		return err instanceof Error ? err.message : String(err);
	}
}
async function runBootOnce(params) {
	const bootRuntime = {
		log: () => {},
		error: (message) => log$1.error(String(message)),
		exit: defaultRuntime.exit
	};
	let result;
	try {
		result = await loadBootFile(params.workspaceDir);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		log$1.error(`boot: failed to read ${BOOT_FILENAME}: ${message}`);
		return {
			status: "failed",
			reason: message
		};
	}
	if (result.status === "missing" || result.status === "empty") return {
		status: "skipped",
		reason: result.status
	};
	const sessionKey = params.agentId ? resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	}) : resolveMainSessionKey(params.cfg);
	const message = buildBootPrompt(result.content ?? "");
	const sessionId = generateBootSessionId();
	const mappingSnapshot = snapshotMainSessionMapping({
		cfg: params.cfg,
		sessionKey
	});
	let agentFailure;
	try {
		await agentCommand({
			message,
			sessionKey,
			sessionId,
			deliver: false,
			senderIsOwner: true
		}, bootRuntime, params.deps);
	} catch (err) {
		agentFailure = err instanceof Error ? err.message : String(err);
		log$1.error(`boot: agent run failed: ${agentFailure}`);
	}
	const mappingRestoreFailure = await restoreMainSessionMapping(mappingSnapshot);
	if (mappingRestoreFailure) log$1.error(`boot: failed to restore main session mapping: ${mappingRestoreFailure}`);
	if (!agentFailure && !mappingRestoreFailure) return { status: "ran" };
	return {
		status: "failed",
		reason: [agentFailure ? `agent run failed: ${agentFailure}` : void 0, mappingRestoreFailure ? `mapping restore failed: ${mappingRestoreFailure}` : void 0].filter((part) => Boolean(part)).join("; ")
	};
}

//#endregion
//#region src/hooks/bundled/boot-md/handler.ts
const log = createSubsystemLogger("hooks/boot-md");
const runBootChecklist = async (event) => {
	if (!isGatewayStartupEvent(event)) return;
	if (!event.context.cfg) return;
	const cfg = event.context.cfg;
	const deps = event.context.deps ?? createDefaultDeps();
	const agentIds = listAgentIds(cfg);
	for (const agentId of agentIds) {
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		const result = await runBootOnce({
			cfg,
			deps,
			workspaceDir,
			agentId
		});
		if (result.status === "failed") {
			log.warn("boot-md failed for agent startup run", {
				agentId,
				workspaceDir,
				reason: result.reason
			});
			continue;
		}
		if (result.status === "skipped") log.debug("boot-md skipped for agent startup run", {
			agentId,
			workspaceDir,
			reason: result.reason
		});
	}
};

//#endregion
export { runBootChecklist as default };