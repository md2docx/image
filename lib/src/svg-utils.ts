// svg-utils.ts

import type { SVG } from "@m2d/core";
import { svgToBlob } from "@svg-fns/svg2img";
import type { IImageOptions } from "docx";
import type { IDefaultImagePluginOptions } from ".";
import { getPlaceHolderImage } from "./utils";

/**
 * Crops an SVG element tightly to its contents and adjusts dimensions.
 */
const tightlyCropSvg = (
  svgRaw: string,
  container: HTMLDivElement,
): Promise<{ svg: string; scale: number }> =>
  new Promise((resolve, reject) => {
    const svgContainer = document.createElement("div");
    svgContainer.innerHTML = svgRaw;
    svgContainer.style = "width:100%;height:100%;position:absolute;";
    container.appendChild(svgContainer);
    const svgEl = svgContainer.querySelector("svg");

    if (!svgEl || svgEl.nodeType !== 1)
      return reject(new Error("No or invalid <svg> found"));

    requestAnimationFrame(() => {
      try {
        const bbox = svgEl.getBBox();
        const origW = parseFloat(getComputedStyle(svgEl).width) || 0;
        const origH = parseFloat(getComputedStyle(svgEl).height) || 0;

        const margin = 4;
        const x = bbox.x - margin;
        const y = bbox.y - margin;
        const croppedW = bbox.width + margin * 2;
        const croppedH = bbox.height + margin * 2;

        const finalW = origW > 0 ? Math.min(croppedW, origW) : croppedW;
        const finalH = origH > 0 ? Math.min(croppedH, origH) : croppedH;

        const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
        clonedSvg.setAttribute("viewBox", `${x} ${y} ${croppedW} ${croppedH}`);
        clonedSvg.setAttribute("width", `${finalW}`);
        clonedSvg.setAttribute("height", `${finalH}`);
        clonedSvg.removeAttribute("style");

        const svg = new XMLSerializer().serializeToString(clonedSvg);
        svgContainer.remove();
        resolve({
          svg,
          scale: Math.min(croppedW / origW, croppedH / origH, 1),
        });
      } catch (err) {
        svgContainer.remove();
        reject(err);
      }
    });
  });

let container: HTMLDivElement;
/**
 * Ensures a singleton offscreen container used to render and measure SVG content.
 */
const getContainer = (options: IDefaultImagePluginOptions) => {
  if (!container) {
    container = document.createElement("div");
    container.style = `height:${options.maxH}in;width:${options.maxW}in;position:absolute;left:-2500vw;`;
    document.body.appendChild(container);
    options.dpi = parseFloat(getComputedStyle(container).width) / options.maxW;
  }
  return container;
};

/**
 * Applies generic fixes to known SVG rendering issues (e.g., Mermaid pie chart title alignment).
 * Designed to be overridden to handle tool-specific quirks in generated SVGs.
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
          (match, m1) => {
            return match
              .replace(m1, m1.replace(/^"|"$/g, ""))
              .replace(/ x=".*?"/, ' x="-20%"');
          },
        )
    : svg;
};

/**
 * Converts SVG into fallback raster image (PNG/JPG/etc.) for DOCX insertion.
 */
export const handleSvg = async (
  svgNode: SVG,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  const value = svgNode.value;
  let svg: string;
  let isGantt = false;
  if (typeof value === "string") {
    svg = value;
  } else {
    const renderedData = await value;
    if (!renderedData) return getPlaceHolderImage(options);
    svg = renderedData.svg;
    isGantt = renderedData.diagramType === "gantt";
    svg = options.fixGeneratedSvg(svg, renderedData);
  }
  try {
    const croppedSvg =
      isGantt || !svg
        ? { svg, scale: 1 }
        : await tightlyCropSvg(svg, getContainer(options));

    const { blob, width, height } = await svgToBlob(croppedSvg.svg, {
      format: options.fallbackImageType,
      scale: options.scale,
      quality: options.quality,
    });

    if (!blob || !height || !width)
      throw new Error("Failed to convert SVG to data URL.");

    // Increase Gantt chart resolution - can be enlarge more without getting blurred
    if (isGantt)
      options.scale = Math.max(
        options.scale,
        Math.floor(
          Math.min(
            (innerWidth * options.scale) / width,
            (innerHeight * options.scale) / height,
          ),
        ),
      );

    const scale =
      Math.min(
        (options.maxW * options.dpi) / width,
        (options.maxH * options.dpi) / height,
        1,
      ) * croppedSvg.scale;
    return {
      type: options.fallbackImageType,
      data: await blob.arrayBuffer(),
      transformation: {
        width: width * scale,
        height: height * scale,
      },
    };
  } catch (error) {
    console.error("Error resolving SVG image: ", error);
    return getPlaceHolderImage(options);
  }
  /* v8 ignore stop */
};
