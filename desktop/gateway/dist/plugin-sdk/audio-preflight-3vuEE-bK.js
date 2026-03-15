import "./accounts-Dw118nCx.js";
import "./paths-DCNrSyZW.js";
import "./github-copilot-token-Df-R0zCM.js";
import "./config-Zs384y2C.js";
import { $ as logVerbose, nt as shouldLogVerbose } from "./subsystem-D7KkLxSJ.js";
import "./command-format-D4smYdZ1.js";
import "./agent-scope-DmMs4gD_.js";
import "./dock-CSEHLApO.js";
import "./message-channel-BhZc-dSE.js";
import "./sessions-Hs8-QPv2.js";
import "./plugins-BixDCxgQ.js";
import "./accounts-CWu4D7zt.js";
import "./accounts-DQd1QCaM.js";
import "./bindings-DW9zROq_.js";
import "./paths-DG84V_EA.js";
import "./redact-BYwaiynP.js";
import "./errors-BMOVwRE7.js";
import "./path-alias-guards-mdyCpWU6.js";
import "./fs-safe-DFT7bdmo.js";
import "./image-ops-CCi2A8ff.js";
import "./ssrf-D-Eyl7pQ.js";
import "./fetch-guard-DQ97jgpC.js";
import "./local-roots-DQLUb94t.js";
import "./tool-images-BcBgoCop.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, t as buildProviderRegistry, u as isAudioAttachment } from "./runner-Bf0eEl8t.js";
import "./skills-B6Tk93F8.js";
import "./chrome-CsOXUZkg.js";
import "./store--pUWkusa.js";
import "./pi-embedded-helpers-x0FbLQ6B.js";
import "./thinking-BgIZOmA_.js";
import "./image-BdZ6T0Nh.js";
import "./pi-model-discovery-sRX5oQRX.js";
import "./api-key-rotation-Dv8uKFZs.js";

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