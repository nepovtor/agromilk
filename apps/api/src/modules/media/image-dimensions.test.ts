import { describe, expect, it } from "vitest";
import { ValidationError } from "../../lib/errors.js";
import { validateImageDimensions } from "./image-dimensions.js";

function pngHeader(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

describe("validateImageDimensions", () => {
  it("accepts dimensions within configured limits", () => {
    expect(validateImageDimensions(pngHeader(1200, 800), "image/png")).toEqual({
      width: 1200,
      height: 800,
    });
  });

  it("rejects an image with excessive dimensions or pixels", () => {
    expect(() => validateImageDimensions(pngHeader(9000, 9000), "image/png")).toThrow(
      ValidationError,
    );
  });
});
