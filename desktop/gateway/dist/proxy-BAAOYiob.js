import { ProxyAgent, fetch } from "undici";

//#region src/telegram/proxy.ts
function makeProxyFetch(proxyUrl) {
	const agent = new ProxyAgent(proxyUrl);
	const fetcher = ((input, init) => fetch(input, {
		...init,
		dispatcher: agent
	}));
	return fetcher;
}

//#endregion
export { makeProxyFetch as t };