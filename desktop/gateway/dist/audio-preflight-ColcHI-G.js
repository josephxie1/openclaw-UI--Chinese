import "./agent-scope-2WLEGCGu.js";
import "./paths-DpzIdlnz.js";
import { $ as shouldLogVerbose, X as logVerbose } from "./subsystem-BOPdQ1OK.js";
import "./model-selection-ByiezZu1.js";
import "./github-copilot-token-DqKkG5Fl.js";
import "./env-Dd9-xtX7.js";
import "./dock-D_0gMPsB.js";
import "./plugins-DDUisxu9.js";
import "./accounts-Dnvd8nR9.js";
import "./bindings-Bv3-tJv1.js";
import "./accounts-C1oPU59h.js";
import "./image-ops-7JhsTcRW.js";
import "./pi-model-discovery-BfFKqMVS.js";
import "./message-channel-k1bg4144.js";
import "./pi-embedded-helpers-tHbdTXfZ.js";
import "./chrome-DTG4vlhY.js";
import "./skills-B1Z-7WdS.js";
import "./path-alias-guards-CDRPo8iT.js";
import "./redact-BbTfxkPJ.js";
import "./errors-gzROynDW.js";
import "./fs-safe-BWMsSlDu.js";
import "./ssrf-w8ZK882q.js";
import "./store-DAgoVYrk.js";
import "./sessions-CRE_KdLn.js";
import "./accounts-BY7Wu4Ef.js";
import "./paths-DERLovkd.js";
import "./tool-images-nqGHGLO8.js";
import "./thinking-BoOZzGqx.js";
import "./image-TZgLmQp0.js";
import "./gemini-auth-C2Cjw6eP.js";
import "./fetch-guard-WQNbx9gl.js";
import "./local-roots-DTGVRPWb.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, t as buildProviderRegistry, u as isAudioAttachment } from "./runner-D57_u2El.js";

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