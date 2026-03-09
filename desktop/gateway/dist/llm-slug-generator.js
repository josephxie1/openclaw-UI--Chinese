import { a as resolveAgentEffectiveModelPrimary, c as resolveDefaultAgentId, i as resolveAgentDir, s as resolveAgentWorkspaceDir } from "./agent-scope-CyL4p3WM.js";
import "./paths-B9lBY6-m.js";
import { t as createSubsystemLogger } from "./subsystem-mPRezpll.js";
import "./workspace-xqVw9elw.js";
import { Fn as DEFAULT_MODEL, In as DEFAULT_PROVIDER, l as parseModelRef } from "./model-selection-C2qYg1Hy.js";
import "./github-copilot-token-BgKF-7S1.js";
import "./env-DijpAkAH.js";
import "./boolean-M-esQJt6.js";
import "./dock-4m-mtCpe.js";
import "./tokens-DhiG-E4H.js";
import { t as runEmbeddedPiAgent } from "./pi-embedded-CCthhB7G.js";
import "./plugins-6swg8Eal.js";
import "./accounts-CaRtAz_2.js";
import "./bindings-CIp11eBf.js";
import "./send-B1hABJK5.js";
import "./send-BW4GFQe3.js";
import "./deliver-BcpLFSKs.js";
import "./diagnostic-CeMVFbeF.js";
import "./diagnostic-session-state-C0Sxjfox.js";
import "./accounts-8ZWbw0Zq.js";
import "./send-O1Kf0X30.js";
import "./image-ops-B-vhnrbA.js";
import "./pi-model-discovery-DA6plQNR.js";
import "./message-channel-DKXv9Xa_.js";
import "./pi-embedded-helpers-IaWApo7A.js";
import "./chrome-C2P7Tftn.js";
import "./frontmatter-eHCuq81z.js";
import "./skills-C0diN5NC.js";
import "./path-alias-guards-CQeDgBD-.js";
import "./redact-B5RjPWCN.js";
import "./errors-BB1m5Yna.js";
import "./fs-safe-B3SyJrUG.js";
import "./ssrf-DoofAz6G.js";
import "./store-XJhJrgMC.js";
import "./sessions-Quk2QWH_.js";
import "./accounts-BKkVzHhg.js";
import "./paths-C8TW5zqh.js";
import "./tool-images-7-rN09qB.js";
import "./thinking-DEPKewmZ.js";
import "./image-Xs1FuPzG.js";
import "./reply-prefix-vlQQmLzt.js";
import "./manager-BBIus3yd.js";
import "./gemini-auth-DIhtAV3I.js";
import "./fetch-guard-DRSihvoC.js";
import "./query-expansion-C-tgLuSk.js";
import "./retry-jbRR-O4V.js";
import "./target-errors-DBLPoy22.js";
import "./local-roots-CXS7K9v_.js";
import "./chunk-CUWJkNYS.js";
import "./markdown-tables-DwnqHi8d.js";
import "./ir-CpdW7ulc.js";
import "./render-B1VqYyvo.js";
import "./commands-registry-BQKPA1m4.js";
import "./skill-commands-DUzTiNl4.js";
import "./retry-policy-CfyF02Fr.js";
import "./runner-CMfr6Ejn.js";
import "./fetch-seh5wWer.js";
import "./tables-YPSmlIl8.js";
import "./send-iHAZFt_m.js";
import "./outbound-attachment-ClDCxaCa.js";
import "./send-xs7u4MVM.js";
import "./resolve-route-DY7TO1JI.js";
import "./proxy-XyLLh-Ux.js";
import "./replies-BKx4rMqI.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

//#region src/hooks/llm-slug-generator.ts
/**
* LLM-based slug generator for session memory filenames
*/
const log = createSubsystemLogger("llm-slug-generator");
/**
* Generate a short 1-2 word filename slug from session content using LLM
*/
async function generateSlugViaLLM(params) {
	let tempSessionFile = null;
	try {
		const agentId = resolveDefaultAgentId(params.cfg);
		const workspaceDir = resolveAgentWorkspaceDir(params.cfg, agentId);
		const agentDir = resolveAgentDir(params.cfg, agentId);
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-slug-"));
		tempSessionFile = path.join(tempDir, "session.jsonl");
		const prompt = `Based on this conversation, generate a short 1-2 word filename slug (lowercase, hyphen-separated, no file extension).

Conversation summary:
${params.sessionContent.slice(0, 2e3)}

Reply with ONLY the slug, nothing else. Examples: "vendor-pitch", "api-design", "bug-fix"`;
		const modelRef = resolveAgentEffectiveModelPrimary(params.cfg, agentId);
		const parsed = modelRef ? parseModelRef(modelRef, DEFAULT_PROVIDER) : null;
		const provider = parsed?.provider ?? DEFAULT_PROVIDER;
		const model = parsed?.model ?? DEFAULT_MODEL;
		const result = await runEmbeddedPiAgent({
			sessionId: `slug-generator-${Date.now()}`,
			sessionKey: "temp:slug-generator",
			agentId,
			sessionFile: tempSessionFile,
			workspaceDir,
			agentDir,
			config: params.cfg,
			prompt,
			provider,
			model,
			timeoutMs: 15e3,
			runId: `slug-gen-${Date.now()}`
		});
		if (result.payloads && result.payloads.length > 0) {
			const text = result.payloads[0]?.text;
			if (text) return text.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || null;
		}
		return null;
	} catch (err) {
		const message = err instanceof Error ? err.stack ?? err.message : String(err);
		log.error(`Failed to generate slug: ${message}`);
		return null;
	} finally {
		if (tempSessionFile) try {
			await fs.rm(path.dirname(tempSessionFile), {
				recursive: true,
				force: true
			});
		} catch {}
	}
}

//#endregion
export { generateSlugViaLLM };