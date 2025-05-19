import { describe, it, vi } from "vitest";
import { toDocx } from "@m2d/core"; // Adjust path based on your setup
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import fs from "fs";
import { imagePlugin } from "../src";
import { htmlPlugin } from "@m2d/html";
import { mermaidPlugin } from "@m2d/mermaid";

const markdown = fs.readFileSync("../sample.md", "utf-8");

describe.concurrent("toDocx", () => {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(markdown);

  it("should handle images", async ({ expect }) => {
    const docxBlob = await toDocx(
      mdast,
      {},
      // @ts-expect-error -- plugin types mismatch for time being
      { plugins: [htmlPlugin(), mermaidPlugin(), imagePlugin()] },
    );
    expect(docxBlob).toBeInstanceOf(Blob);
  });

  it("should not have any console.log", async ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "log");
    await toDocx(mdast, {}, { plugins: [imagePlugin()] });
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
