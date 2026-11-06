/**
 * Builds an internal link that respects the configured base path,
 * so the site works both at "/" and under a sub-path like "/portfolio/".
 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}
