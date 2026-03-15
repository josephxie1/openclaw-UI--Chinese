import "./paths-BafI8hAX.js";
import { F as shouldLogVerbose, M as logVerbose } from "./utils-C2rp27T1.js";
import "./thinking-CJzCCbYy.js";
import "./agent-scope-hUtx0Gmw.js";
import "./subsystem-DoASNpMz.js";
import "./openclaw-root-CMyEcfUW.js";
import "./exec-Cga3tCb5.js";
import "./model-selection-Byqz32hU.js";
import "./github-copilot-token-JNDxie17.js";
import "./boolean-CE7i9tBR.js";
import "./env-DT45e_cy.js";
import "./host-env-security-CJMD0__Z.js";
import "./env-vars-gp4sxqr7.js";
import "./manifest-registry-ZL7mwhHa.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-ePhV6VyM.js";
import "./message-channel-CmxjO7-N.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, s as isAudioAttachment, t as buildProviderRegistry } from "./runner-DwiQndkF.js";
import "./image-DR9mKD98.js";
import "./models-config-DGZ6ZxGo.js";
import "./pi-model-discovery-Bu2Z71iE.js";
import "./pi-embedded-helpers-DSW5OBBO.js";
import "./sandbox-A8hfyKgi.js";
import "./tool-catalog-CrsxKKLj.js";
import "./chrome-C2yG3uod.js";
import "./tailscale-CmXeiJOn.js";
import "./tailnet-q4skT7lo.js";
import "./ws-Cf71ITZP.js";
import "./auth-BdcNQZjr.js";
import "./server-context-0Qn8DVy0.js";
import "./frontmatter-DQ4Janwj.js";
import "./skills-DtK0BEAU.js";
import "./path-alias-guards-BTugjn_E.js";
import "./paths-Dby1iZZc.js";
import "./redact-DkGdi7vy.js";
import "./errors-BRgSJZKa.js";
import "./fs-safe-CYuhfJiB.js";
import "./ssrf-CHMDHJCD.js";
import "./image-ops-BwGmDpam.js";
import "./store-Dzj98Jf6.js";
import "./ports-B2fbXoub.js";
import "./trash-BBM26iKd.js";
import "./server-middleware-x1gE0tXy.js";
import "./sessions-VdaDAoct.js";
import "./plugins-f8FOOJGM.js";
import "./accounts-D2SkYuI-.js";
import "./accounts-Djpd2FR1.js";
import "./logging-CeI8pPxx.js";
import "./accounts-BFxaTyOB.js";
import "./bindings-BtftZq3M.js";
import "./paths-BU7I2tq5.js";
import "./chat-envelope-BBXhi7A0.js";
import "./tool-images-BURNGLH1.js";
import "./tool-display-BsDqyAKJ.js";
import "./fetch-guard-B0hiUXhn.js";
import "./api-key-rotation-DLpVUZwR.js";
import "./local-roots-CmBllYW5.js";
import "./model-catalog-oUS4w7nM.js";

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