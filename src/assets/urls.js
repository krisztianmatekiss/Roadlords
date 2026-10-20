/** Resolve public assets under a repository Pages URL or a local development server. */
export function assetUrl(path) {
  return new URL(import.meta.env.BASE_URL + path, document.baseURI).href;
}
