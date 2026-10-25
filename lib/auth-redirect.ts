export function nextPath() {
  const next = new URLSearchParams(window.location.search).get("callbackUrl");
  if (next?.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}

export function callbackHref(path: string) {
  const next = new URLSearchParams(window.location.search).get("callbackUrl");
  if (next?.startsWith("/") && !next.startsWith("//")) {
    return `${path}?callbackUrl=${encodeURIComponent(next)}`;
  }
  return path;
}
