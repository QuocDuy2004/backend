export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
