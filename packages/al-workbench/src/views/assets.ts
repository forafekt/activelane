export interface ExtensionAssetSource {
  baseUrl?: string
  resolve?: (extensionId: string, path: string) => Promise<{ url: string }> | { url: string }
}

export function normalizeExtensionAssetPath(path: string) {
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '')
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`Unsafe extension asset path: ${path}`)
  }
  return normalized
}

export async function resolveExtensionAsset(
  source: ExtensionAssetSource,
  extensionId: string,
  path: string,
) {
  const safePath = normalizeExtensionAssetPath(path)
  if (source.resolve) return (await source.resolve(extensionId, safePath)).url
  if (!source.baseUrl) throw new Error('The host does not provide extension asset resolution.')
  const identity = extensionId.replace(/^@/, '').split('/').map(encodeURIComponent).join('/')
  return `${source.baseUrl.replace(/\/$/, '')}/${identity}/${safePath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
}
