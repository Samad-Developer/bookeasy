// Builds "/venues?city=Lahore&page=2" from a path and an object. Empty values are left out,
// and page 1 is left out too because it is the default.
export function buildHref(basePath: string, params: Record<string, string | undefined>, page = 1) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set('page', String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}