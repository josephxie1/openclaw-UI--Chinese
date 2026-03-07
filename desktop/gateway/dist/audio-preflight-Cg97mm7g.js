import "./paths-B9jPXz5d.js";
import "./subsystem-D2eqGDrA.js";
import { P as shouldLogVerbose, j as logVerbose } from "./utils-XeuG5BG2.js";
import "./boolean-DtWR5bt3.js";
import "./auth-profiles-CZvcgpJo.js";
import "./agent-scope-a8AT_RWh.js";
import "./openclaw-root-PXe5cw0N.js";
import "./exec-CSag7MO2.js";
import "./github-copilot-token-CHThtPpe.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-DR9Qjj6f.js";
import "./env-vars-tQ4AIdQq.js";
import "./manifest-registry-yJ4VbgqY.js";
import "./zod-schema.sensitive-DWhkVThK.js";
import "./dock-CCwltZZY.js";
import "./pi-model-discovery-DECvU61g.js";
import "./frontmatter-CyFnddo-.js";
import "./skills-HX9fGcwF.js";
import "./path-alias-guards-Bqfz8RAo.js";
import "./message-channel-yd0kgwA7.js";
import "./sessions-Bi0azzm9.js";
import "./plugins-BzP494ZB.js";
import "./accounts-DPFlmjrY.js";
import "./accounts-CR81YEDz.js";
import "./logging-D-Jq2wIo.js";
import "./accounts-BsTMZ8Rl.js";
import "./bindings-Bdjgy182.js";
import "./paths-BUjNRwj7.js";
import "./chat-envelope-n7RmUTHV.js";
import "./net-BmOGX3t_.js";
import "./tailnet-BEMQ0WkF.js";
import "./image-ops-C1wqTSdk.js";
import "./pi-embedded-helpers-1PZ4aCg-.js";
import "./sandbox-DTBpCi6a.js";
import "./tool-catalog-DfXt8uIy.js";
import "./chrome-CLydEGCA.js";
import "./tailscale-BVHEqtVC.js";
import "./auth-B4wlyb-l.js";
import "./server-context-CgtJLU5F.js";
import "./paths-BeiNGh4n.js";
import "./redact-BGmCI-cn.js";
import "./errors-BFjy26zi.js";
import "./fs-safe-BEKG0MwK.js";
import "./ssrf-gi8Pc2Fy.js";
import "./store-Do_Iey7m.js";
import "./ports-BwOg8fHr.js";
import "./trash-Cv3xOBdi.js";
import "./server-middleware-dIszEUpi.js";
import "./tool-images-CRkRwEVE.js";
import "./thinking-DuXsFbTV.js";
import "./models-config-pDwBB9Bk.js";
import "./gemini-auth-BwpwqMEH.js";
import "./fetch-guard-DdlITp72.js";
import "./local-roots-DC5tcBeV.js";
import "./image-UdZytPX6.js";
import "./tool-display-TYTccNWv.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, s as isAudioAttachment, t as buildProviderRegistry } from "./runner-QvrPoSIs.js";
import "./model-catalog-B2D_BloA.js";

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