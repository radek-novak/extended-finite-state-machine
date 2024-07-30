export function getter(obj: Record<string, any>, path: string) {
  const segments = path.split(".");
  if (segments.length === 1) return obj[segments[0]];

  const [curr, ...rest] = segments;
  return getter(obj[curr], rest.join("."));
}
export function setter(obj: Record<string, any>, path: string, value: any) {
  const segments = path.split(".");
  if (segments.length === 1) {
    obj[segments[0]] = value;
    return;
  }

  const [curr, ...rest] = segments;
  if (!obj[curr]) obj[curr] = {};
  setter(obj[curr], rest.join("."), value);
}
