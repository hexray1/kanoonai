/**
 * ESM resolve hook for unit tests: maps `./x.js` -> `./x.ts` so the source
 * tree's ESM-style `.js` imports resolve under Node's native type stripping.
 * Falls through to default resolution for everything else (packages etc.).
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    if (typeof specifier === "string" && specifier.endsWith(".js")) {
      return await next(specifier.slice(0, -3) + ".ts", context);
    }
    throw err;
  }
}
