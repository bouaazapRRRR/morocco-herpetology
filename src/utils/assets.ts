export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Prepends the deployment base path (e.g. /morocco-herpetology on GitHub Pages)
 * to internal static asset paths while preserving external URLs.
 */
export function getAssetPath(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}

