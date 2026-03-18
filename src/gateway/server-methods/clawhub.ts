import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { loadConfig, writeConfigFile } from "../../config/config.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

const CLAWHUB_API_BASE = "https://clawhub.ai";

/** Resolve ClawHub API token from config or env. */
function resolveToken(): string | null {
  // Env override first
  const envToken = process.env.CLAWHUB_TOKEN;
  if (envToken?.trim()) return envToken.trim();
  // Then config
  try {
    const cfg = loadConfig();
    const raw = (cfg as Record<string, unknown>)?.clawhub;
    if (raw && typeof raw === "object" && "token" in raw) {
      const t = (raw as Record<string, unknown>).token;
      if (typeof t === "string" && t.trim()) return t.trim();
    }
  } catch {}
  return null;
}

/** Build request headers with optional Bearer auth. */
function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": "openclaw-gateway" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function fetchJSON(url: string, token: string | null, timeoutMs = 15_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const attempt = (retriesLeft: number) => {
      const req = mod.get(
        url,
        { timeout: timeoutMs, headers: authHeaders(token) },
        (res) => {
          if (res.statusCode === 429 && retriesLeft > 0) {
            const retryAfter = Math.min(Number(res.headers["retry-after"]) || 5, 30);
            res.resume();
            setTimeout(() => attempt(retriesLeft - 1), retryAfter * 1000);
            return;
          }
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode} from ${url}`));
              return;
            }
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            } catch {
              reject(new Error(`Invalid JSON from ${url}`));
            }
          });
        },
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    };
    attempt(3);
  });
}

function downloadToFile(
  url: string,
  dest: string,
  token: string | null,
  timeoutMs = 120_000,
): Promise<{ bytes: number }> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      const parsed = new URL(url);
      const mod = parsed.protocol === "https:" ? https : http;
      const handleResponse = (res: http.IncomingMessage) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location;
          const redirectMod = redirectUrl.startsWith("https") ? https : http;
          redirectMod
            .get(redirectUrl, { timeout: timeoutMs, headers: authHeaders(token) }, handleDownload)
            .on("error", reject);
          return;
        }
        handleDownload(res);
      };
      const handleDownload = (res: http.IncomingMessage) => {
        if (res.statusCode === 429 && retriesLeft > 0) {
          const retryAfter = Math.min(Number(res.headers["retry-after"]) || 10, 60);
          res.resume();
          setTimeout(() => attempt(retriesLeft - 1), retryAfter * 1000);
          return;
        }
        if (res.statusCode === 429) {
          const retryAfter = res.headers["retry-after"];
          reject(
            new Error(
              `Rate limited (429). Try again in ${retryAfter ?? "~60"}s. Configure a ClawHub token for higher limits.`,
            ),
          );
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
          return;
        }
        let bytes = 0;
        const ws = fs.createWriteStream(dest);
        res.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
        });
        res.pipe(ws);
        ws.on("finish", () => {
          ws.close();
          resolve({ bytes });
        });
        ws.on("error", reject);
      };
      const req = mod.get(url, { timeout: timeoutMs, headers: authHeaders(token) }, handleResponse);
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Timeout downloading ${url}`));
      });
    };
    attempt(5);
  });
}

function extractZip(zipPath: string, destDir: string): Promise<void> {
  const { execSync } = require("node:child_process");
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(destDir, { recursive: true });
      execSync(`unzip -o "${zipPath}" -d "${destDir}"`, {
        stdio: "ignore",
        windowsHide: true,
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

export const clawhubHandlers: GatewayRequestHandlers = {
  "clawhub.search": async ({ params, respond }) => {
    const query = typeof params?.query === "string" ? params.query.trim() : "";
    const limit = typeof params?.limit === "number" ? Math.min(params.limit, 50) : 20;
    const token = resolveToken();
    if (!query) {
      try {
        const data = await fetchJSON(
          `${CLAWHUB_API_BASE}/api/v1/skills?limit=${limit}`,
          token,
        );
        respond(true, data, undefined);
      } catch (err) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.UNAVAILABLE, `ClawHub request failed: ${String(err)}`),
        );
      }
      return;
    }
    try {
      const data = await fetchJSON(
        `${CLAWHUB_API_BASE}/api/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        token,
      );
      respond(true, data, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `ClawHub search failed: ${String(err)}`),
      );
    }
  },

  "clawhub.install": async ({ params, respond }) => {
    const slug = typeof params?.slug === "string" ? params.slug.trim() : "";
    if (!slug) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "missing slug parameter"),
      );
      return;
    }
    const version = typeof params?.version === "string" ? params.version.trim() : "";
    const token = resolveToken();

    try {
      const cfg = loadConfig();
      const agentId = resolveDefaultAgentId(cfg);
      const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
      const skillsDir = path.join(workspaceDir, "skills");
      fs.mkdirSync(skillsDir, { recursive: true });

      // Build download URL: use `version` for semver, `tag` for tag names, omit for latest
      let downloadUrl = `${CLAWHUB_API_BASE}/api/v1/download?slug=${encodeURIComponent(slug)}`;
      if (version && /^\d+\.\d+/.test(version)) {
        downloadUrl += `&version=${encodeURIComponent(version)}`;
      } else if (version && version !== "latest") {
        downloadUrl += `&tag=${encodeURIComponent(version)}`;
      }
      // No version/tag param = defaults to latest
      const tmpZip = path.join(skillsDir, `.${slug}-download.zip`);

      let downloadBytes = 0;
      const dlStart = Date.now();
      try {
        const result = await downloadToFile(downloadUrl, tmpZip, token);
        downloadBytes = result.bytes;
      } catch (err) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.UNAVAILABLE, `Failed to download skill "${slug}": ${String(err)}`),
        );
        return;
      }
      const dlMs = Date.now() - dlStart;

      const skillDir = path.join(skillsDir, slug);
      try {
        await extractZip(tmpZip, skillDir);
      } catch (err) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.UNAVAILABLE, `Failed to extract skill "${slug}": ${String(err)}`),
        );
        return;
      } finally {
        try {
          fs.unlinkSync(tmpZip);
        } catch {}
      }

      const sizeKB = (downloadBytes / 1024).toFixed(1);
      const speedKBs = dlMs > 0 ? ((downloadBytes / 1024) / (dlMs / 1000)).toFixed(1) : "?";
      respond(
        true,
        { ok: true, slug, path: skillDir, version, bytes: downloadBytes, elapsedMs: dlMs, sizeKB, speedKBs },
        undefined,
      );
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `Install failed: ${String(err)}`),
      );
    }
  },

  "clawhub.token.get": async ({ respond }) => {
    const token = resolveToken();
    if (!token) {
      respond(true, { hasToken: false, masked: null }, undefined);
      return;
    }
    // Mask the token: show first 6 and last 4 chars
    const masked =
      token.length > 12
        ? `${token.slice(0, 6)}${"*".repeat(token.length - 10)}${token.slice(-4)}`
        : "****";
    respond(true, { hasToken: true, masked }, undefined);
  },

  "clawhub.token.set": async ({ params, respond }) => {
    const token = typeof params?.token === "string" ? params.token.trim() : "";
    try {
      const cfg = loadConfig() as Record<string, unknown>;
      const clawhub = (cfg.clawhub && typeof cfg.clawhub === "object" ? cfg.clawhub : {}) as Record<
        string,
        unknown
      >;
      if (token) {
        clawhub.token = token;
      } else {
        delete clawhub.token;
      }
      cfg.clawhub = clawhub;
      await writeConfigFile(cfg);
      respond(true, { ok: true }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `Failed to save token: ${String(err)}`),
      );
    }
  },
};
