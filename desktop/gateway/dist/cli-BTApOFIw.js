import "./paths-B9jPXz5d.js";
import { t as createSubsystemLogger } from "./subsystem-D2eqGDrA.js";
import "./utils-XeuG5BG2.js";
import "./boolean-DtWR5bt3.js";
import { j as loadConfig } from "./auth-profiles-CZvcgpJo.js";
import { d as resolveDefaultAgentId, u as resolveAgentWorkspaceDir } from "./agent-scope-a8AT_RWh.js";
import "./openclaw-root-PXe5cw0N.js";
import "./exec-CSag7MO2.js";
import "./github-copilot-token-CHThtPpe.js";
import "./host-env-security-DWcSD4kP.js";
import "./version-DR9Qjj6f.js";
import "./env-vars-tQ4AIdQq.js";
import "./manifest-registry-yJ4VbgqY.js";
import "./zod-schema.sensitive-DWhkVThK.js";
import "./dock-CCwltZZY.js";
import "./model-CJQJEjak.js";
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
import "./send-DtWen-Cr.js";
import "./send-D5ADpplM.js";
import { _ as loadOpenClawPlugins } from "./subagent-registry-BEhIECVo.js";
import "./paths-BUjNRwj7.js";
import "./chat-envelope-n7RmUTHV.js";
import "./client-CkwAK9X6.js";
import "./call-sYT50rpM.js";
import "./pairing-token-BksY3ZD6.js";
import "./net-BmOGX3t_.js";
import "./tailnet-BEMQ0WkF.js";
import "./tokens-TehTRAdt.js";
import "./with-timeout-Dzh9Mm9M.js";
import "./deliver-BGjVHnsp.js";
import "./diagnostic-CYZgmzrv.js";
import "./diagnostic-session-state-C8NH3PSI.js";
import "./send-CkynSxxD.js";
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
import "./exec-approvals-allowlist-B6arSB0T.js";
import "./exec-safe-bin-runtime-policy-BwT46TA_.js";
import "./reply-prefix-B0pLVTKg.js";
import "./memory-cli-Dz7xGF6Z.js";
import "./manager-DJ2nuij3.js";
import "./gemini-auth-BwpwqMEH.js";
import "./fetch-guard-DdlITp72.js";
import "./query-expansion-C6x4pKyg.js";
import "./retry-BoP38Evl.js";
import "./target-errors-zRZr7S-r.js";
import "./local-roots-DC5tcBeV.js";
import "./chunk-CDx-ekK4.js";
import "./markdown-tables-DCHQRiwX.js";
import "./ir-BufFMQ3o.js";
import "./render-e7fENCYH.js";
import "./commands-KKgWclzv.js";
import "./commands-registry-Dg8Rixk-.js";
import "./image-UdZytPX6.js";
import "./tool-display-TYTccNWv.js";
import "./retry-policy-CtbxW3Xf.js";
import "./runner-QvrPoSIs.js";
import "./model-catalog-B2D_BloA.js";
import "./fetch-C-_zRqDA.js";
import "./pairing-store-DjFn_dIY.js";
import "./exec-approvals-BMFhaWeS.js";
import "./nodes-screen-BQT-wV6c.js";
import "./system-run-command-DlF20rUR.js";
import "./session-utils-HX7tx2AA.js";
import "./session-cost-usage-rB-A7vpt.js";
import "./skill-commands-CVfpjHAz.js";
import "./workspace-dirs-BJKGMQ48.js";
import "./tables-D_QG3PE3.js";
import "./server-lifecycle-BKrYFSKV.js";
import "./stagger-DjNEVTNM.js";
import "./channel-selection-BVseVG8h.js";
import "./plugin-auto-enable-BZsoToeO.js";
import "./send-CUyX396a.js";
import "./outbound-attachment-Bzghzktq.js";
import "./delivery-queue-sFkGs-VC.js";
import "./send-B34oK_cg.js";
import "./resolve-route-Bv0lzNr2.js";
import "./pi-tools.policy-DobOP4bl.js";
import "./proxy-DZJY4nKm.js";
import "./links-CWyy563z.js";
import "./cli-utils-B7nApBgk.js";
import "./help-format-DYI1Qsgl.js";
import "./progress-CoLN8zGu.js";
import "./replies-BPCok6xi.js";
import "./onboard-helpers-gyti7QOy.js";
import "./prompt-style-BcyiLcfo.js";
import "./pairing-labels-D55D0emZ.js";

//#region src/plugins/cli.ts
const log = createSubsystemLogger("plugins");
function registerPluginCliCommands(program, cfg) {
	const config = cfg ?? loadConfig();
	const workspaceDir = resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	const logger = {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
	const registry = loadOpenClawPlugins({
		config,
		workspaceDir,
		logger
	});
	const existingCommands = new Set(program.commands.map((cmd) => cmd.name()));
	for (const entry of registry.cliRegistrars) {
		if (entry.commands.length > 0) {
			const overlaps = entry.commands.filter((command) => existingCommands.has(command));
			if (overlaps.length > 0) {
				log.debug(`plugin CLI register skipped (${entry.pluginId}): command already registered (${overlaps.join(", ")})`);
				continue;
			}
		}
		try {
			const result = entry.register({
				program,
				config,
				workspaceDir,
				logger
			});
			if (result && typeof result.then === "function") result.catch((err) => {
				log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
			});
			for (const command of entry.commands) existingCommands.add(command);
		} catch (err) {
			log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
		}
	}
}

//#endregion
export { registerPluginCliCommands };