/**
 * The installed package version, read from the manifest that ships beside the
 * built host half. The number is never hardcoded: a release only bumps
 * `package.json`, and the settings page picks it up on the next load.
 * @module dsh-remote-development/version
 */

import { readFileSync } from 'node:fs'

/**
 * Read this package's version.
 * @returns the version string, or '' when the manifest cannot be read (a
 *   packaging fault must not break the settings page).
 */
export function installedVersion(): string {
  try {
    // `import.meta.url` is `<package>/lib/index.js` at runtime and
    // `<repo>/src/version.ts` under tsx, so one level up is the manifest in
    // both cases.
    const raw = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    const parsed = JSON.parse(raw) as { version?: unknown }
    return typeof parsed.version === 'string' ? parsed.version : ''
  } catch {
    return ''
  }
}
