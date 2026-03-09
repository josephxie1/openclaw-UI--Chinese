import "./paths-DPETYfXn.js";
import "./subsystem-Cg_UWVEG.js";
import { P as shouldLogVerbose, j as logVerbose } from "./utils-CfiuWRBq.js";
import "./boolean-YY6K2DFz.js";
import "./auth-profiles-pmKds52w.js";
import "./agent-scope-CLHs7Zj4.js";
import "./openclaw-root-D6WnGhDc.js";
import "./exec-BAZSkTa2.js";
import "./github-copilot-token-BBzjUbRV.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-Bed7ywW_.js";
import "./env-vars-UJroIeWA.js";
import "./manifest-registry-NoROo1B_.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-CMVWLgFK.js";
import "./pi-model-discovery-IPcPNruH.js";
import "./frontmatter-CmZFrduY.js";
import "./skills-BfREX8cQ.js";
import "./path-alias-guards-D4-gdKtk.js";
import "./message-channel-B603rVd0.js";
import "./sessions-BDU_-DdW.js";
import "./plugins-CD0OuhLK.js";
import "./accounts-jWHn2aXU.js";
import "./accounts-COlYPAPI.js";
import "./logging-Dt6YWeiQ.js";
import "./accounts-D28RTYc8.js";
import "./bindings-xjhAFrzX.js";
import "./paths-CVD1Nvmu.js";
import "./chat-envelope-BzTdl9Cm.js";
import "./net-CWnLPYEi.js";
import "./tailnet-Zdwgqy-5.js";
import "./image-ops-BhGvujH7.js";
import "./pi-embedded-helpers-DyAiANRA.js";
import "./sandbox-Bq11A_Rx.js";
import "./tool-catalog-4hvNhN9N.js";
import "./chrome-Cz5DGKpO.js";
import "./tailscale-DYJAYqJb.js";
import "./auth-BFLoV1Uy.js";
import "./server-context-wSt48nR2.js";
import "./paths-Cn3pynMs.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import "./fs-safe-DxaL6wf1.js";
import "./ssrf-_ebiGWnk.js";
import "./store-lOowqS8F.js";
import "./ports-qZUat5CZ.js";
import "./trash-Byfl_5o-.js";
import "./server-middleware-21d6lloq.js";
import "./tool-images-Dkf1nM4u.js";
import "./thinking-BCY5R30D.js";
import "./models-config-VvbMbqSV.js";
import "./gemini-auth-BothXWpE.js";
import "./fetch-guard-BQp70b11.js";
import "./local-roots-DoJIp_zd.js";
import "./image-BzaCU7Pj.js";
import "./tool-display-B6pQohiH.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, s as isAudioAttachment, t as buildProviderRegistry } from "./runner-BpCaIgIy.js";
import "./model-catalog-DyJVUu-R.js";

//#region src/media-understanding/audio-preflight.ts
/**
* Transcribes the first audio attachment BEFORE mention checking.
* This allows voice notes to be processed in group chats with requireMention: true.
* Returns the transcript or undefined if transcription fails or no audio is found.
*/
async function transcribeFirstAudio(params) {
	const { ctx, cfg } = params;
	const audioConfig = cfg.tools?.media?.audio;
	if (!audioConfig || audioConfig.enabled === false) return;
	const attachments = normalizeMediaAttachments(ctx);
	if (!attachments || attachments.length === 0) return;
	const firstAudio = attachments.find((att) => att && isAudioAttachment(att) && !att.alreadyTranscribed);
	if (!firstAudio) return;
	if (shouldLogVerbose()) logVerbose(`audio-preflight: transcribing attachment ${firstAudio.index} for mention check`);
	const providerRegistry = buildProviderRegistry(params.providers);
	const cache = createMediaAttachmentCache(attachments, { localPathRoots: resolveMediaAttachmentLocalRoots({
		cfg,
		ctx
	}) });
	try {
		const result = await runCapability({
			capability: "audio",
			cfg,
			ctx,
			attachments: cache,
			media: attachments,
			agentDir: params.agentDir,
			providerRegistry,
			config: audioConfig,
			activeModel: params.activeModel
		});
		if (!result || result.outputs.length === 0) return;
		const audioOutput = result.outputs.find((output) => output.kind === "audio.transcription");
		if (!audioOutput || !audioOutput.text) return;
		firstAudio.alreadyTranscribed = true;
		if (shouldLogVerbose()) logVerbose(`audio-preflight: transcribed ${audioOutput.text.length} chars from attachment ${firstAudio.index}`);
		return audioOutput.text;
	} catch (err) {
		if (shouldLogVerbose()) logVerbose(`audio-preflight: transcription failed: ${String(err)}`);
		return;
	} finally {
		await cache.cleanup();
	}
}

//#endregion
export { transcribeFirstAudio };