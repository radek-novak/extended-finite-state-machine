export function getter(obj: Record<string, any>, path: string) {
  const segments = path.split(".");
  if (segments.length === 1) return obj[segments[0]];

  const [curr, ...rest] = segments;
  return getter(obj[curr], rest.join("."));
}
