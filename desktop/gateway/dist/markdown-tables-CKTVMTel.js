import { h as normalizeAccountId } from "./session-key-Bbgq13tJ.js";
import { t as resolveAccountEntry } from "./account-lookup-rCZ5SnBa.js";
import { r as normalizeChannelId } from "./plugins-Bxiq3d8j.js";

//#region src/config/markdown-tables.ts
const DEFAULT_TABLE_MODES = new Map([["signal", "bullets"], ["whatsapp", "bullets"]]);
const isMarkdownTableMode = (value) => value === "off" || value === "bullets" || value === "code";
function resolveMarkdownModeFromSection(section, accountId) {
	if (!section) return;
	const normalizedAccountId = normalizeAccountId(accountId);
	const accounts = section.accounts;
	if (accounts && typeof accounts === "object") {
		const matchMode = resolveAccountEntry(accounts, normalizedAccountId)?.markdown?.tables;
		if (isMarkdownTableMode(matchMode)) return matchMode;
	}
	const sectionMode = section.markdown?.tables;
	return isMarkdownTableMode(sectionMode) ? sectionMode : void 0;
}
function resolveMarkdownTableMode(params) {
	const channel = normalizeChannelId(params.channel);
	const defaultMode = channel ? DEFAULT_TABLE_MODES.get(channel) ?? "code" : "code";
	if (!channel || !params.cfg) return defaultMode;
	return resolveMarkdownModeFromSection(params.cfg.channels?.[channel] ?? params.cfg?.[channel], params.accountId) ?? defaultMode;
}

//#endregion
export { resolveMarkdownTableMode as t };