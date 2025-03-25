import { describe, it } from "vitest";
import { toDocx } from "@m2d/core"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import fs from "fs";
import { imagePlugin } from "../src";

const markdown = fs.readFileSync("../sample.md", "utf-8");

describe("toDocx", () => {
  it("should handle images", async ({ expect }) => {
    const mdast = unified().use(remarkParse).use(remarkGfm).parse(markdown);

    const docxBlob = await toDocx(mdast, {}, { plugins: [imagePlugin()] });

    expect(docxBlob).toBeInstanceOf(Blob);
  });
});
