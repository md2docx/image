import type { IImageOptions } from "docx";
import { IPlugin, Optional } from "@m2d/core";

/**
 * List of image types fully supported by docx. SVG requires fallback thus we do not include that here.
 */
export const SUPPORTED_IMAGE_TYPES = ["jpeg", "jpg", "bmp", "gif", "png"] as const;

/**
 * Resolves an image source URL into the appropriate image options for DOCX conversion.
 */
export type ImageResolver = (
  src: string,
  options: IDefaultImagePluginOptions,
) => Promise<IImageOptions>;

/**
 * Options for the image plugin.
 */
export interface IDefaultImagePluginOptions {
  /**
   * Scaling factor for base64-encoded images.
   * @default 3
   */
  scale: number;
  /**
   * Fallback image type if the image type cannot be determined or is not supported.
   * @default "png"
   */
  fallbackImageType: "png" | "jpg" | "bmp" | "gif";

  /**
   * Custom image resolver to resolve an image source URL into the appropriate image options for DOCX conversion.
   */
  imageResolver: ImageResolver;

  maxW: number /** inch */;
  maxH: number /** inch */;
}

type IImagePluginOptions = Optional<IDefaultImagePluginOptions>;

/**
 * Determines the MIME type of an image based on its binary signature.
 *
 * @param buffer - The image buffer (ArrayBuffer or Buffer).
 * @returns The detected MIME type as a string.
 */
export const getImageMimeType = (buffer: Buffer | ArrayBuffer) => {
  const signatureArray = new Uint8Array(buffer).slice(0, 4);

  if (signatureArray[0] === 66 && signatureArray[1] === 77) return "bmp";

  const signature = signatureArray.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, "0"),
    "",
  );

  switch (signature) {
    case "89504E47":
      return "png";
    case "47494638":
      return "gif";
    case "FFD8FFE0": // JPEG signatures
    case "FFD8FFE1":
    case "FFD8FFE2":
    case "FFD8FFE3":
    case "FFD8FFE8":
      return "jpg";
  }
};

const handleSvg = async (svg: string, options?: IImagePluginOptions): Promise<IImageOptions> => {
  return {
    data: "src",
    // @ts-expect-error -- ok as one of SUPPORTED_TYPES
    type: imgType,
    transformation: {
      width: 1,
      height: 1,
    },
  };
};

/**
 * Processes base64-encoded images, extracts dimensions, and returns image options.
 *
 * @param src - Base64 image source.
 * @param scaleFactor - Scaling factor for resolution adjustment.
 * @returns Image options with transformation details.
 */
const handleDataUrls = async (
  src: string,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  const scaleFactor = options.scale;
  const imgType = src.split(";")[0].split("/")[1];

  const img = new Image();
  img.src = src;
  await new Promise(resolve => (img.onload = resolve));

  const width = img.width * scaleFactor;
  const height = img.height * scaleFactor;

  // skipcq: JS-0323
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (SUPPORTED_IMAGE_TYPES.includes(imgType as any)) {
    return {
      data: src,
      // @ts-expect-error -- ok as one of SUPPORTED_TYPES
      type: imgType,
      transformation: {
        width: width / scaleFactor,
        height: height / scaleFactor,
      },
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  /* v8 ignore start - canvas is not available in JSDOM */
  if (!ctx) throw new Error("Canvas context not available");

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const fallbackImageType = options?.fallbackImageType ?? "png";

  return {
    data: canvas.toDataURL(`image/${fallbackImageType}`),
    type: fallbackImageType,
    transformation: {
      width: width / scaleFactor,
      height: height / scaleFactor,
    },
  };
  /* v8 ignore stop */
};

/**
 * Fetches an image from an external URL, determines its type, and extracts dimensions.
 *
 * @param url - Image URL.
 * @returns Image options with metadata.
 */
const handleNonDataUrls = async (
  url: string,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  const response = await fetch(
    url.startsWith("http") ? url : `${window.location.origin}/${url.replace(/^\/+/, "")}`,
  );

  if (/(svg|xml)/.test(response.headers.get("content-type") ?? "") || url.endsWith(".svg")) {
    const svgText = await response.text();
    return handleSvg(svgText, options);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = getImageMimeType(arrayBuffer) || "png";

  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer], { type: mimeType }));

  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    console.warn(`${mimeType} not supported by docx. Using one of the supported mime types.`);
    return handleDataUrls(url, options);
  }

  return {
    type: mimeType,
    data: arrayBuffer,
    transformation: {
      width: imageBitmap.width,
      height: imageBitmap.height,
    },
  };
};

/**
 * Resolves an image source (base64 or external URL) into image options for DOCX conversion.
 *
 * @param src - Image source URL.
 * @param options - Plugin options including scaling factor.
 * @returns The resolved image options.
 */
const imageResolver: ImageResolver = async (src: string, options: IDefaultImagePluginOptions) => {
  try {
    return src.startsWith("data:")
      ? await handleDataUrls(src, options)
      : await handleNonDataUrls(src, options);
  } catch (error) {
    console.error(`Error resolving image: ${src}`, error);
    return {
      type: "png",
      data: Buffer.from([]),
      transformation: {
        width: 100,
        height: 100,
      },
    };
  }
};

const defaultOptions: IDefaultImagePluginOptions = {
  scale: 3,
  fallbackImageType: "png",
  imageResolver,
  // Assuming A4, portrait, and normal page margins
  maxW: 6.3,
  maxH: 9.7,
};

/**
 * Image plugin for processing inline image nodes in Markdown AST.
 * This plugin is designed for client-side (web) environments.
 */
export const imagePlugin: (options?: IImagePluginOptions) => IPlugin = options_ => {
  const options: IDefaultImagePluginOptions = { ...defaultOptions, ...options_ };
  return {
    inline: async (docx, node, _, definitions) => {
      if (/^image/.test(node.type)) {
        // Extract image URL from the node or definitions
        // @ts-expect-error - node might not have a URL or identifier, but those cases are handled
        const url = node.url ?? definitions[node.identifier?.toUpperCase()];
        // @ts-expect-error - node might not have alt text
        const alt = node.alt ?? url?.split("/").pop();
        node.type = "";
        return [
          new docx.ImageRun({
            ...(await options.imageResolver(url, options)),
            altText: { description: alt, name: alt, title: alt },
          }),
        ];
      }
      return [];
    },
  };
};
