import "./paths-BafI8hAX.js";
import { B as theme } from "./utils-C2rp27T1.js";
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
import { t as formatDocsLink } from "./links-CzqoXPP7.js";
import { n as registerQrCli } from "./qr-cli-DhkC9EnS.js";

//#region src/cli/clawbot-cli.ts
function registerClawbotCli(program) {
	registerQrCli(program.command("clawbot").description("Legacy clawbot command aliases").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/clawbot", "docs.openclaw.ai/cli/clawbot")}\n`));
}

//#endregion
export { registerClawbotCli };