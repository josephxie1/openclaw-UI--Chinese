import "./paths-DPETYfXn.js";
import "./subsystem-Cg_UWVEG.js";
import "./utils-CfiuWRBq.js";
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
import "./path-alias-guards-CQioIZOJ.js";
import "./message-channel-B603rVd0.js";
import { _ as normalizeWhatsAppTarget, g as isWhatsAppGroupJid } from "./plugins-Bxiq3d8j.js";
import { i as resolveWhatsAppAccount } from "./accounts-B-V4Uo9S.js";
import "./logging-Dt6YWeiQ.js";
import "./bindings-DcmrAriy.js";
import "./image-ops-2_ZDkf3K.js";
import "./fs-safe-BuWUIX7Q.js";
import "./ssrf-CWEIH4LI.js";
import "./tool-images-DW9VWMTP.js";
import "./fetch-guard-BKF2fXF6.js";
import { f as readReactionParams, h as readStringParam, i as ToolAuthorizationError, l as jsonResult, n as missingTargetError, o as createActionGate } from "./target-errors-DSKF3qi3.js";
import "./local-roots-D_3vae0Z.js";
import "./chunk-DdNA0zO-.js";
import "./markdown-tables-CKTVMTel.js";
import "./ir-5QN00K2-.js";
import "./render-B1CcGZNQ.js";
import "./tables-Dqs_W3wZ.js";
import { r as sendReactionWhatsApp } from "./outbound-BB9EhNAW.js";

//#region src/whatsapp/resolve-outbound-target.ts
function resolveWhatsAppOutboundTarget(params) {
	const trimmed = params.to?.trim() ?? "";
	const allowListRaw = (params.allowFrom ?? []).map((entry) => String(entry).trim()).filter(Boolean);
	const hasWildcard = allowListRaw.includes("*");
	const allowList = allowListRaw.filter((entry) => entry !== "*").map((entry) => normalizeWhatsAppTarget(entry)).filter((entry) => Boolean(entry));
	if (trimmed) {
		const normalizedTo = normalizeWhatsAppTarget(trimmed);
		if (!normalizedTo) return {
			ok: false,
			error: missingTargetError("WhatsApp", "<E.164|group JID>")
		};
		if (isWhatsAppGroupJid(normalizedTo)) return {
			ok: true,
			to: normalizedTo
		};
		if (hasWildcard || allowList.length === 0) return {
			ok: true,
			to: normalizedTo
		};
		if (allowList.includes(normalizedTo)) return {
			ok: true,
			to: normalizedTo
		};
		return {
			ok: false,
			error: missingTargetError("WhatsApp", "<E.164|group JID>")
		};
	}
	return {
		ok: false,
		error: missingTargetError("WhatsApp", "<E.164|group JID>")
	};
}

//#endregion
//#region src/agents/tools/whatsapp-target-auth.ts
function resolveAuthorizedWhatsAppOutboundTarget(params) {
	const account = resolveWhatsAppAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	const resolution = resolveWhatsAppOutboundTarget({
		to: params.chatJid,
		allowFrom: account.allowFrom ?? [],
		mode: "implicit"
	});
	if (!resolution.ok) throw new ToolAuthorizationError(`WhatsApp ${params.actionLabel} blocked: chatJid "${params.chatJid}" is not in the configured allowFrom list for account "${account.accountId}".`);
	return {
		to: resolution.to,
		accountId: account.accountId
	};
}

//#endregion
//#region src/agents/tools/whatsapp-actions.ts
async function handleWhatsAppAction(params, cfg) {
	const action = readStringParam(params, "action", { required: true });
	const isActionEnabled = createActionGate(cfg.channels?.whatsapp?.actions);
	if (action === "react") {
		if (!isActionEnabled("reactions")) throw new Error("WhatsApp reactions are disabled.");
		const chatJid = readStringParam(params, "chatJid", { required: true });
		const messageId = readStringParam(params, "messageId", { required: true });
		const { emoji, remove, isEmpty } = readReactionParams(params, { removeErrorMessage: "Emoji is required to remove a WhatsApp reaction." });
		const participant = readStringParam(params, "participant");
		const accountId = readStringParam(params, "accountId");
		const fromMeRaw = params.fromMe;
		const fromMe = typeof fromMeRaw === "boolean" ? fromMeRaw : void 0;
		const resolved = resolveAuthorizedWhatsAppOutboundTarget({
			cfg,
			chatJid,
			accountId,
			actionLabel: "reaction"
		});
		const resolvedEmoji = remove ? "" : emoji;
		await sendReactionWhatsApp(resolved.to, messageId, resolvedEmoji, {
			verbose: false,
			fromMe,
			participant: participant ?? void 0,
			accountId: resolved.accountId
		});
		if (!remove && !isEmpty) return jsonResult({
			ok: true,
			added: emoji
		});
		return jsonResult({
			ok: true,
			removed: true
		});
	}
	throw new Error(`Unsupported WhatsApp action: ${action}`);
}

//#endregion
export { handleWhatsAppAction };