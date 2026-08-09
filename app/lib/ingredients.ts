/** Trim, lowercase, and collapse internal whitespace for ingredient/item matching. */
export function normaliseIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
