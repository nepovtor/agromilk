import { describe, expect, it } from "vitest";
import { ValidationError } from "../../lib/errors.js";
import { validateImageDimensions } from "./image-dimensions.js";

function pngHeader(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function jpegHeader(width: number, height: number) {
  const buffer = Buffer.alloc(12);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xc0;
  buffer.writeUInt16BE(7, 4);
  buffer.writeUInt16BE(height, 7);
  buffer.writeUInt16BE(width, 9);
  return buffer;
}

function webpHeader(kind: "VP8X" | "VP8 " | "VP8L", width: number, height: number) {
  const buffer = Buffer.alloc(30);
  buffer.write("RIFF");
  buffer.write("WEBP", 8);
  buffer.write(kind, 12);
  if (kind === "VP8X") {
    buffer.writeUIntLE(width - 1, 24, 3);
    buffer.writeUIntLE(height - 1, 27, 3);
  } else if (kind === "VP8 ") {
    buffer.writeUInt16LE(width, 26);
    buffer.writeUInt16LE(height, 28);
  } else {
    buffer.writeUInt32LE((width - 1) | ((height - 1) << 14), 21);
  }
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

  it("reads JPEG, GIF and every supported WebP header", () => {
    expect(validateImageDimensions(jpegHeader(640, 480), "image/jpeg")).toEqual({
      width: 640,
      height: 480,
    });
    const gif = Buffer.alloc(10);
    gif.writeUInt16LE(320, 6);
    gif.writeUInt16LE(240, 8);
    expect(validateImageDimensions(gif, "image/gif")).toEqual({ width: 320, height: 240 });
    for (const kind of ["VP8X", "VP8 ", "VP8L"] as const)
      expect(validateImageDimensions(webpHeader(kind, 700, 500), "image/webp")).toEqual({
        width: 700,
        height: 500,
      });
  });

  it("rejects truncated, malformed and zero-sized images", () => {
    for (const [buffer, mime] of [
      [Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg"],
      [Buffer.from("RIFFxxxxWEBPVP8X"), "image/webp"],
      [pngHeader(0, 1), "image/png"],
      [Buffer.alloc(2), "image/gif"],
      [pngHeader(1, 1), "image/svg+xml"],
    ] as const)
      expect(() => validateImageDimensions(buffer, mime)).toThrow(ValidationError);
  });
});
