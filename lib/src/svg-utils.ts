// svg-utils.ts

import type { IImageOptions } from "docx";
import { IDefaultImagePluginOptions } from ".";

/**
 * Converts a raw SVG string into a base64-encoded data URL.
 */
const svgToBase64 = (svg: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
};

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

    if (!svgEl || svgEl.nodeType !== 1) return reject(new Error("No or invalid <svg> found"));

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
        resolve({ svg, scale: Math.min(croppedW / origW, croppedH / origH, 1) });
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
 * Converts SVG into fallback raster image (PNG/JPG/etc.) for DOCX insertion.
 */
export const handleSvg = async (
  svg: string,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  try {
    const img = new Image();
    const container = getContainer(options);
    container.appendChild(img);

    const croppedSvg = await tightlyCropSvg(svg, container);
    const svgDataURL = await svgToBase64(croppedSvg.svg);
    img.src = svgDataURL;

    await new Promise(resolve => (img.onload = resolve));

    const width = img.width * options.scale;
    const height = img.height * options.scale;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    /* v8 ignore start */
    if (!ctx) throw new Error("Canvas context not available");

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const data = canvas.toDataURL(`image/${options.fallbackImageType}`);
    img.remove();

    const scale = Math.min(
      ((options.maxW * options.dpi) / width) * croppedSvg.scale,
      ((options.maxH * options.dpi) / height) * croppedSvg.scale,
      1,
    );
    return {
      type: options.fallbackImageType,
      data,
      transformation: {
        width: width * scale,
        height: height * scale,
      },
    };
  } catch (error) {
    console.error("Error resolving SVG image: ", error);
    return {
      type: "png",
      data: Buffer.from([]),
      transformation: {
        width: 100,
        height: 100,
      },
    };
  }
  /* v8 ignore stop */
};
