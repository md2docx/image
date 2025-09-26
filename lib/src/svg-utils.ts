import type { SVG } from "@m2d/core";
import { parseSvg } from "@svg-fns/io";
import { svgToBlob } from "@svg-fns/svg2img";
import type { IImageOptions } from "docx";
import type { IDefaultImagePluginOptions } from ".";
import { getPlaceHolderImage } from "./utils";

let globalContainer: HTMLDivElement;

/**
 * Returns a hidden singleton container for measuring SVGs.
 * Lazily created on first use and reused for performance.
 */
const getContainer = (options: IDefaultImagePluginOptions): HTMLDivElement => {
  if (!globalContainer) {
    globalContainer = document.createElement("div");
    globalContainer.style.cssText = `
      height:${options.maxH}in;
      width:${options.maxW}in;
      position:absolute;
      visibility:hidden;
      pointer-events:none;
    `;
    document.body.appendChild(globalContainer);

    // Calculate DPI once, based on computed width
    const width = parseFloat(getComputedStyle(globalContainer).width);
    if (!Number.isNaN(width)) {
      options.dpi = width / options.maxW;
    }
  }
  return globalContainer;
};

/**
 * Crops an SVG to tightly fit its contents by adjusting viewBox and dimensions.
 *
 * @param svgRaw - Raw SVG string
 * @param container - Hidden container for DOM measurement
 * @returns Serialized cropped SVG and a relative scale factor
 */
const tightlyCropSvg = (
  svgRaw: string,
  container: HTMLDivElement,
): Promise<{ svg: string; scale: number }> =>
  new Promise((resolve, reject) => {
    const svgEl = parseSvg(svgRaw) as SVGSVGElement;
    container.appendChild(svgEl);

    requestAnimationFrame(() => {
      try {
        const bbox = svgEl.getBBox();
        const origW = parseFloat(getComputedStyle(svgEl).width) || bbox.width;
        const origH = parseFloat(getComputedStyle(svgEl).height) || bbox.height;

        const margin = 4;
        const croppedW = bbox.width + margin * 2;
        const croppedH = bbox.height + margin * 2;

        const finalW = origW > 0 ? Math.min(croppedW, origW) : croppedW;
        const finalH = origH > 0 ? Math.min(croppedH, origH) : croppedH;

        const clone = svgEl.cloneNode(true) as SVGSVGElement;
        clone.setAttribute(
          "viewBox",
          `${bbox.x - margin} ${bbox.y - margin} ${croppedW} ${croppedH}`,
        );
        clone.setAttribute("width", `${finalW}`);
        clone.setAttribute("height", `${finalH}`);
        clone.removeAttribute("style");

        const serialized = new XMLSerializer().serializeToString(clone);
        svgEl.remove();

        const scale =
          origW && origH ? Math.min(croppedW / origW, croppedH / origH, 1) : 1;

        resolve({ svg: serialized, scale });
      } catch (err) {
        svgEl.remove();
        reject(err);
      }
    });
  });

/**
 * Fixes known quirks in generated SVGs (e.g., Mermaid pie chart title alignment).
 * Override or extend this function for tool-specific handling.
 *
 * @param svg - Raw SVG string to transform.
 * @returns Modified SVG string.
 */
export const fixGeneratedSvg = (
  svg: string,
  metadata: { diagramType: string },
): string => {
  return metadata.diagramType === "pie"
    ? svg
        .replace(".pieTitleText{text-anchor:middle;", ".pieTitleText{")
        .replace(
          /<text[^>]*class="pieTitleText"[^>]*>(.*?)<\/text>/,
          (match, m1) =>
            match
              .replace(m1, m1.replace(/^"|"$/g, ""))
              .replace(/ x=".*?"/, ' x="-20%"'),
        )
    : svg;
};

/**
 * Converts an `SVG` node into a fallback raster image (PNG/JPEG/etc.)
 * suitable for embedding in DOCX.
 *
 * @param svgNode - Extended MDAST `SVG` node
 * @param options - Image plugin options
 * @link {IDefaultImagePluginOptions}
 * @returns Image options for docx.js consumption
 */
export const handleSvg = async (
  svgNode: SVG,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  try {
    const value = svgNode.value;
    let svg: string;
    let isGantt = false;

    if (typeof value === "string") {
      svg = value;
    } else {
      const rendered = await value;
      if (!rendered) return getPlaceHolderImage(options);
      svg = options.fixGeneratedSvg(rendered.svg, rendered);
      isGantt = rendered.diagramType === "gantt";
    }

    const cropped =
      isGantt || !svg
        ? { svg, scale: 1 }
        : await tightlyCropSvg(svg, getContainer(options));

    const { blob, width, height } = await svgToBlob(cropped.svg, {
      format: options.fallbackImageType,
      scale: options.scale,
      quality: options.quality,
    });

    if (!blob || !width || !height) {
      throw new Error("Failed to convert SVG to raster");
    }

    // Special case: Gantt charts can be upscaled safely
    if (isGantt) {
      options.scale = Math.max(
        options.scale,
        Math.floor(
          Math.min(
            (innerWidth * options.scale) / width,
            (innerHeight * options.scale) / height,
          ),
        ),
      );
    }

    const scale =
      Math.min(
        (options.maxW * options.dpi) / width,
        (options.maxH * options.dpi) / height,
        1,
      ) * cropped.scale;

    return {
      type: options.fallbackImageType,
      data: await blob.arrayBuffer(),
      transformation: {
        width: width * scale,
        height: height * scale,
      },
    };
  } catch (err) {
    console.error("Error handling SVG:", err);
    return getPlaceHolderImage(options);
  }
};
