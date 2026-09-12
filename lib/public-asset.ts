/** Local previews use /; the standalone GitHub build supplies its repository path. */
export function publicAsset(path: string): string {
  const base =
    typeof window === 'undefined'
      ? '/'
      : (window as Window & { __HULAN_PUBLIC_BASE__?: string })
          .__HULAN_PUBLIC_BASE__ || '/';
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (base !== '/' && path.startsWith(base)) return path;
  return base.replace(/\/$/, '') + path;
}
