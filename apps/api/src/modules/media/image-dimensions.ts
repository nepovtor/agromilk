import { env } from "../../config/env.js";
import { ValidationError } from "../../lib/errors.js";

function jpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker,
      )
    )
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    if (length < 2) break;
    offset += length + 2;
  }
  return undefined;
}

function webpDimensions(buffer: Buffer) {
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8X" && buffer.length >= 30)
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (kind === "VP8 " && buffer.length >= 30)
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  return undefined;
}

export function validateImageDimensions(buffer: Buffer, mimeType: string) {
  const dimensions =
    mimeType === "image/png" && buffer.length >= 24
      ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
      : mimeType === "image/gif" && buffer.length >= 10
        ? { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
        : mimeType === "image/jpeg"
          ? jpegDimensions(buffer)
          : mimeType === "image/webp"
            ? webpDimensions(buffer)
            : undefined;
  if (
    !dimensions ||
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    dimensions.width > env.MAX_IMAGE_WIDTH ||
    dimensions.height > env.MAX_IMAGE_HEIGHT ||
    dimensions.width * dimensions.height > env.MAX_IMAGE_PIXELS
  )
    throw new ValidationError("Недопустимые размеры изображения", {
      file: ["Изображение превышает допустимые ширину, высоту или количество пикселей"],
    });
  return dimensions;
}
