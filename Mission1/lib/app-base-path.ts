/**
 * Must match `basePath` in `next.config.mjs`.
 * Client-side `fetch()` does not auto-prefix basePath — use this for API routes.
 */
export const APP_BASE_PATH = "/mission1";

export function appPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${p}`;
}
