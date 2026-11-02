/** Only ingredient detail pages may be used as an editor return destination. */
export function ingredientDetailReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^\/inventory\/ingredients\/([A-Za-z0-9_-]+)$/.exec(value);
  return match && match[0] === value && match[1] !== 'new' ? value : null;
}
