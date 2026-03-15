import "./paths-DPETYfXn.js";
import "./subsystem-Cg_UWVEG.js";
import { P as shouldLogVerbose, j as logVerbose } from "./utils-CfiuWRBq.js";
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
import "./dock-BZtcEEWo.js";
import "./pi-model-discovery-BGDavJtN.js";
import "./frontmatter-CmZFrduY.js";
import "./skills-Cc0j4M1-.js";
import "./path-alias-guards-CQioIZOJ.js";
import "./message-channel-B603rVd0.js";
import "./sessions-DVvS5iwr.js";
import "./plugins-Bxiq3d8j.js";
import "./accounts-B-V4Uo9S.js";
import "./accounts-Da2rrQfS.js";
import "./logging-Dt6YWeiQ.js";
import "./accounts-CHqcVGvy.js";
import "./bindings-DcmrAriy.js";
import "./paths-CVD1Nvmu.js";
import "./chat-envelope-BzTdl9Cm.js";
import "./net-D_wo0Sl1.js";
import "./tailnet-67wWyYBV.js";
import "./image-ops-2_ZDkf3K.js";
import "./pi-embedded-helpers-Of3qHWQl.js";
import "./sandbox-DTxaN4ta.js";
import "./tool-catalog-4hvNhN9N.js";
import "./chrome-vkPv6Hbo.js";
import "./tailscale-DYJAYqJb.js";
import "./auth-DhIxsXk7.js";
import "./server-context-CTOIotCF.js";
import "./paths-CjKUISLf.js";
import "./redact-CcVV4RYD.js";
import "./errors-PLZQFUCD.js";
import "./fs-safe-BuWUIX7Q.js";
import "./ssrf-CWEIH4LI.js";
import "./store-BBLlgREE.js";
import "./ports-B6VfKv4T.js";
import "./trash-Byfl_5o-.js";
import "./server-middleware-CO3jp0WE.js";
import "./tool-images-DW9VWMTP.js";
import "./thinking-BCY5R30D.js";
import "./models-config-BEtR6mBz.js";
import "./gemini-auth-CcQR8bbq.js";
import "./fetch-guard-BKF2fXF6.js";
import "./local-roots-D_3vae0Z.js";
import "./image-DVKsEJXY.js";
import "./tool-display-BQX7EkN8.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, s as isAudioAttachment, t as buildProviderRegistry } from "./runner-D3x4dI-S.js";
import "./model-catalog-CW4skMS-.js";

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