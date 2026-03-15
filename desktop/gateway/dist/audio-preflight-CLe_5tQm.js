import "./agent-scope-CyL4p3WM.js";
import "./paths-B9lBY6-m.js";
import { $ as shouldLogVerbose, X as logVerbose } from "./subsystem-mPRezpll.js";
import "./workspace-xqVw9elw.js";
import "./model-selection-C2qYg1Hy.js";
import "./github-copilot-token-BgKF-7S1.js";
import "./env-DijpAkAH.js";
import "./boolean-M-esQJt6.js";
import "./dock-4m-mtCpe.js";
import "./plugins-6swg8Eal.js";
import "./accounts-CaRtAz_2.js";
import "./bindings-CIp11eBf.js";
import "./accounts-8ZWbw0Zq.js";
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
import "./image-COHy_VYw.js";
import "./gemini-auth-DIhtAV3I.js";
import "./fetch-guard-DRSihvoC.js";
import "./local-roots-CXS7K9v_.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, t as buildProviderRegistry, u as isAudioAttachment } from "./runner-DD70y4zY.js";

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