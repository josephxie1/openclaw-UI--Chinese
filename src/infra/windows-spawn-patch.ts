import { createRequire } from "node:module";

/**
 * Global safety-net for Windows: monkey-patch child_process spawn functions
 * to always inject `windowsHide: true`, preventing console window flashes.
 *
 * This patches the CJS module cache so ALL subsequent imports/requires of
 * `child_process` see the patched versions — including third-party code.
 *
 * Call once at application entry, before any other code spawns processes.
 */
export function applyWindowsSpawnPatch(): void {
  if (process.platform !== "win32") {
    return;
  }

  try {
    // Access the CJS child_process module directly so patches are visible
    // to every importer (ESM live bindings reflect CJS export mutations).
    const cjsRequire = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = cjsRequire("node:child_process");

    const origSpawn = cp.spawn;
    cp.spawn = function patchedSpawn(command: string, ...rest: unknown[]) {
      injectWindowsHide(rest);
      return origSpawn.call(this, command, ...rest);
    };

    const origSpawnSync = cp.spawnSync;
    cp.spawnSync = function patchedSpawnSync(command: string, ...rest: unknown[]) {
      injectWindowsHide(rest);
      return origSpawnSync.call(this, command, ...rest);
    };

    const origExecFile = cp.execFile;
    cp.execFile = function patchedExecFile(file: string, ...rest: unknown[]) {
      injectWindowsHide(rest);
      return origExecFile.call(this, file, ...rest);
    };

    const origExecSync = cp.execSync;
    cp.execSync = function patchedExecSync(command: string, ...rest: unknown[]) {
      injectWindowsHide(rest);
      return origExecSync.call(this, command, ...rest);
    };
  } catch {
    // Best-effort; never block startup.
  }
}

/**
 * Find the options object among the trailing arguments of a spawn-like call
 * and set `windowsHide: true` if not already present.
 *
 * Handles all common signatures:
 *   spawn(cmd)
 *   spawn(cmd, args)
 *   spawn(cmd, opts)
 *   spawn(cmd, args, opts)
 *   execFile(file, args, opts, callback)
 *   execSync(cmd, opts)
 */
function injectWindowsHide(rest: unknown[]): void {
  // Look for an existing plain-object argument (the options).
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg != null && typeof arg === "object" && !Array.isArray(arg)) {
      const opts = arg as Record<string, unknown>;
      if (opts.windowsHide === undefined) {
        opts.windowsHide = true;
      }
      return;
    }
  }

  // No options object found — insert one (before a trailing callback if any).
  const last = rest.length > 0 ? rest[rest.length - 1] : undefined;
  if (typeof last === "function") {
    rest.splice(rest.length - 1, 0, { windowsHide: true });
  } else {
    rest.push({ windowsHide: true });
  }
}
