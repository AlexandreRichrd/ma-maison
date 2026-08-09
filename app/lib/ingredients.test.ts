import { describe, expect, it } from "vitest";

import { normaliseIngredientName } from "./ingredients";

describe("normaliseIngredientName", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normaliseIngredientName("  Milk  ")).toBe("milk");
  });

  it("lowercases the name", () => {
    expect(normaliseIngredientName("Ground Beef")).toBe("ground beef");
  });

  it("collapses internal whitespace runs to a single space", () => {
    expect(normaliseIngredientName("Bell   pepper\t\tred")).toBe(
      "bell pepper red",
    );
  });

  it("treats differently-cased/spaced variants as equal", () => {
    expect(normaliseIngredientName("  Tomato Sauce ")).toBe(
      normaliseIngredientName("tomato    sauce"),
    );
  });
});
