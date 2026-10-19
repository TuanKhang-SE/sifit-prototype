// Existing catalogue filters operate locally. Read every server page instead of
// silently filtering only the first 50 products.
export async function collectPages(list, params = {}) {
  const items = [];
  let page = 1;
  let result;
  do {
    result = await list({ ...params, page, limit: 50 });
    items.push(...result.items);
    page += 1;
  } while (page <= (result.pagination?.pages || 1));
  return { items, pagination: result.pagination };
}
