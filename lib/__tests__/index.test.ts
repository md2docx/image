import { describe, it, vi } from "vitest";
import { toDocx } from "@m2d/core"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import fs from "fs";
import { imagePlugin } from "../src";
import { htmlPlugin } from "@m2d/html";
import { mermaidPlugin } from "@m2d/mermaid";
import { getImageMimeType, getPlaceHolderImage } from "../src/utils";

const markdown = fs.readFileSync("../sample.md", "utf-8");

const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

describe.concurrent("toDocx", () => {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(markdown);

  it("should handle images", async ({ expect }) => {
    const docxBlob = await toDocx(
      mdast,
      {},
      { plugins: [htmlPlugin(), mermaidPlugin(), imagePlugin()] },
    );
    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should not have any console.log", async ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "log");
    await toDocx(mdast, {}, { plugins: [imagePlugin()] });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("detects known image formats from Buffer and ArrayBuffer", ({ expect }) => {
    const cases = [
      { bytes: [0x42, 0x4d, 0x00, 0x00], expected: "bmp" }, // BMP
      { bytes: [0x89, 0x50, 0x4e, 0x47], expected: "png" }, // PNG
      { bytes: [0x47, 0x49, 0x46, 0x38], expected: "gif" }, // GIF
      { bytes: [0xff, 0xd8, 0xff, 0xe0], expected: "jpg" }, // JPG
    ] as const;

    for (const { bytes, expected } of cases) {
      const buffer = Buffer.from(bytes);
      const arrayBuffer = toArrayBuffer(buffer);
      expect(getImageMimeType(buffer)).toBe(expected);
      expect(getImageMimeType(arrayBuffer)).toBe(expected);
    }
  });

  it("returns undefined for unknown or too short buffers", ({ expect }) => {
    const unknown = Buffer.from([0x00, 0x11, 0x22, 0x33]);
    const short = Buffer.from([0x42]); // too short

    expect(getImageMimeType(unknown)).toBeUndefined();
    expect(getImageMimeType(toArrayBuffer(unknown))).toBeUndefined();
    expect(getImageMimeType(short)).toBeUndefined();
    expect(getImageMimeType(toArrayBuffer(short))).toBeUndefined();
  });

  it("should handle placeholder", async ({ expect }) => {
    const options = {
      // @ts-expect-error -- ok
      imageResolver: () => getPlaceHolderImage(options),
      placeholder: "some-url",
    };
    // @ts-expect-error -- ok
    const placeholderImg = await getPlaceHolderImage(options);
    expect(placeholderImg.data).toBe("");
    expect(placeholderImg.type).toBe("gif");
  });
});
