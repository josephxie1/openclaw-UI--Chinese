import "./paths-DPETYfXn.js";
import "./subsystem-Cg_UWVEG.js";
import { z as theme } from "./utils-CfiuWRBq.js";
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
import { t as formatDocsLink } from "./links-DYpENcXv.js";
import { n as registerQrCli } from "./qr-cli-DY81n7Jq.js";

//#region src/cli/clawbot-cli.ts
function registerClawbotCli(program) {
	registerQrCli(program.command("clawbot").description("Legacy clawbot command aliases").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/clawbot", "docs.openclaw.ai/cli/clawbot")}\n`));
}

//#endregion
export { registerClawbotCli };