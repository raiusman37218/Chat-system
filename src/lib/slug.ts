/**
 * Utility to generate clean, URL-safe article and section slugs.
 * Converts to lowercase, strips invalid characters, collapses hyphens,
 * and trims leading/trailing hyphens.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
