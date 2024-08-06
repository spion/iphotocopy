export function joinPath(...parts: string[]) {
  return parts
    .map((p, ix) => (ix > 0 ? p.replace(/^\/|\/$/g, "") : p.replace(/\/$/g, "")))
    .filter(p => p)
    .join("/")
}
