import "./paths-BafI8hAX.js";
import "./utils-C2rp27T1.js";
import "./thinking-CJzCCbYy.js";
import { lt as loadOpenClawPlugins } from "./reply-CrnC5Dlb.js";
import { d as resolveDefaultAgentId, u as resolveAgentWorkspaceDir } from "./agent-scope-hUtx0Gmw.js";
import { t as createSubsystemLogger } from "./subsystem-DoASNpMz.js";
import "./openclaw-root-CMyEcfUW.js";
import "./exec-Cga3tCb5.js";
import { Ht as loadConfig } from "./model-selection-Byqz32hU.js";
import "./github-copilot-token-JNDxie17.js";
import "./boolean-CE7i9tBR.js";
import "./env-DT45e_cy.js";
import "./host-env-security-CJMD0__Z.js";
import "./env-vars-gp4sxqr7.js";
import "./manifest-registry-ZL7mwhHa.js";
import "./zod-schema.sensitive-CDAit1Bm.js";
import "./dock-ePhV6VyM.js";
import "./message-channel-CmxjO7-N.js";
import "./send-egoK549g.js";
import "./runner-CIqr0S-3.js";
import "./image-C3oA9o2g.js";
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
import "./send-Ci1eEwT7.js";
import "./paths-BU7I2tq5.js";
import "./chat-envelope-BBXhi7A0.js";
import "./tool-images-BURNGLH1.js";
import "./tool-display-ClrxvwZS.js";
import "./fetch-guard-B0hiUXhn.js";
import "./api-key-rotation-DLpVUZwR.js";
import "./local-roots-CmBllYW5.js";
import "./model-catalog-oUS4w7nM.js";
import "./tokens-DLprfzAy.js";
import "./deliver-Cmf5ni_0.js";
import "./commands-C25v8qFZ.js";
import "./commands-registry-BQfujkdE.js";
import "./client-Bdxi_Lgo.js";
import "./call-CKmCm4sY.js";
import "./pairing-token-BoiaEYMG.js";
import "./fetch-DRmPz6Ll.js";
import "./retry-wSxHKVU4.js";
import "./pairing-store-CvBGUb6r.js";
import "./exec-approvals-ByzfcQ3-.js";
import "./exec-approvals-allowlist-CO-7p4nJ.js";
import "./exec-safe-bin-runtime-policy-C8f2BxZQ.js";
import "./nodes-screen-BPahG2Xd.js";
import "./target-errors-BgG88Ywn.js";
import "./system-run-command-HSh4-NPi.js";
import "./diagnostic-session-state-BMLYUUEc.js";
import "./with-timeout-BvYJrDUT.js";
import "./diagnostic-C0DRl9oi.js";
import "./send-BIPoXwIL.js";
import "./model-Bfdx9JpP.js";
import "./reply-prefix-CZg50X8i.js";
import "./memory-cli-D3tQzbRt.js";
import "./manager-CBiA4ptE.js";
import "./query-expansion-CRFAcg7U.js";
import "./chunk-YVsOQNJl.js";
import "./markdown-tables-C6BbKelL.js";
import "./ir-CuwuI9Dp.js";
import "./render-Dq7Qk4fS.js";
import "./retry-policy-CRErIuSy.js";
import "./channel-selection-CNRebur-.js";
import "./plugin-auto-enable-DOpKMKzh.js";
import "./send-7mAaWeMu.js";
import "./outbound-attachment-wTRzMmAE.js";
import "./delivery-queue-DZicDLvH.js";
import "./send-DokbxZ_W.js";
import "./resolve-route-C9MaDbBv.js";
import "./pi-tools.policy-BRXBAM0X.js";
import "./tables-DwftZVrO.js";
import "./proxy-BAAOYiob.js";
import "./links-CzqoXPP7.js";
import "./cli-utils-nir8nXdI.js";
import "./help-format-S_UmL5y7.js";
import "./progress-BFhULz_W.js";
import "./replies-BOgfzCOR.js";
import "./skill-commands-BPgngIAs.js";
import "./workspace-dirs-BPMMpab9.js";
import "./session-cost-usage-D27QlchA.js";
import "./onboard-helpers-Cc-pFaG2.js";
import "./prompt-style-qOhNaOt0.js";
import "./pairing-labels-zyKdu0Vm.js";
import "./server-lifecycle-K8twFxWb.js";
import "./stagger-D_CWLS7Z.js";

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