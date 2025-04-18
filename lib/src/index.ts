import type { IImageOptions } from "docx";
import type { Image, ImageReference, IPlugin, Optional, SVG } from "@m2d/core";
import { handleSvg } from "./svg-utils";

/**
 * List of image types directly supported by `docx`.
 * SVG is excluded here as it requires conversion before use.
 */
const SUPPORTED_IMAGE_TYPES = ["jpeg", "jpg", "bmp", "gif", "png"] as const;

/**
 * A function that resolves an image source into a `docx`-compatible image options object.
 *
 * @param src - Image source, either a base64-encoded string or URL.
 * @param options - Plugin options used during image resolution.
 * @returns Promise resolving to image options used in DOCX generation.
 */
export type ImageResolver = (
  src: string,
  options: IDefaultImagePluginOptions,
  isPlaceholder?: boolean,
) => Promise<IImageOptions>;

/**
 * Configuration options for the image plugin.
 */
export interface IDefaultImagePluginOptions {
  /**
   * Scaling factor applied to base64 images to simulate resolution.
   *
   * @default 3
   */
  scale: number;

  /**
   * Fallback image format for unsupported or unrecognized types.
   *
   * @default "png"
   */
  fallbackImageType: "png" | "jpg" | "bmp" | "gif";

  /**
   * Custom function to resolve image sources into DOCX image options.
   */
  imageResolver: ImageResolver;

  /**
   * Maximum allowed image width in inches.
   */
  maxW: number;

  /**
   * Maximum allowed image height in inches.
   */
  maxH: number;

  /**
   * Placeholder Image Src
   */
  placeholder?: string;

  /**
   * Target DPI (dots per inch) to calculate dimensions from pixels.
   */
  dpi: number;
}

/**
 * Optional configuration input for the plugin constructor.
 * The `dpi` field is managed internally and excluded.
 */
type IImagePluginOptions = Optional<Omit<IDefaultImagePluginOptions, "dpi">>;

/**
 * Determines the MIME type of an image buffer using file signature detection.
 *
 * @param buffer - Binary image data as a Buffer or ArrayBuffer.
 * @returns Detected MIME type, or `undefined` if unknown.
 */
export const getImageMimeType = (
  buffer: Buffer | ArrayBuffer,
): "bmp" | "png" | "jpg" | "gif" | undefined => {
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
    case "FFD8FFE0":
    case "FFD8FFE1":
    case "FFD8FFE2":
    case "FFD8FFE3":
    case "FFD8FFE8":
      return "jpg";
  }
};

/**
 * Resolves a base64 image (data URL) to a `docx` image object.
 * Converts unsupported formats to a supported fallback using Canvas.
 *
 * @param src - Base64 image source.
 * @param options - Plugin configuration including scaling and fallback type.
 * @returns Image options including dimensions and data.
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
      // @ts-expect-error -- imgType is known to be supported
      type: imgType,
      transformation: {
        width: width / scaleFactor,
        height: height / scaleFactor,
      },
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  /* v8 ignore start - canvas not supported in Node environments */
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
 * Resolves an image from a URL to a `docx` image object.
 * Automatically detects SVGs and delegates to SVG handler.
 *
 * @param url - External image URL.
 * @param options - Plugin configuration.
 * @returns Image options including binary data and dimensions.
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
    return handleSvg({ type: "svg", value: svgText, id: `s${crypto.randomUUID()}` }, options);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = getImageMimeType(arrayBuffer) || "png";

  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer], { type: mimeType }));

  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    console.warn(`${mimeType} not supported by docx. Using fallback.`);
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

let placeholderImg: IImageOptions | null = null;
/**
 * Resolves an image source to a DOCX-compatible image object.
 * Supports both base64 data URLs and remote URLs.
 *
 * @param src - Image source to resolve.
 * @param options - Plugin configuration.
 * @returns Resolved image options or fallback.
 */
const imageResolver: ImageResolver = async (src, options, isPlaceholder = false) => {
  try {
    return src.startsWith("data:")
      ? await handleDataUrls(src, options)
      : await handleNonDataUrls(src, options);
  } catch (error) {
    console.error(`Error resolving image: ${src}`, error);
    if (isPlaceholder || !options.placeholder)
      return {
        type: "gif",
        data: "",
        transformation: {
          width: 200,
          height: 200,
        },
      };
    return (
      placeholderImg || (placeholderImg = await imageResolver(options.placeholder, options, true))
    );
  }
};

/**
 * Default configuration values used when plugin options are not provided.
 */
const defaultOptions: IDefaultImagePluginOptions = {
  scale: 3,
  fallbackImageType: "png",
  imageResolver,
  // A4 page size with standard margins
  maxW: 6.3,
  maxH: 9.7,
  dpi: 96,
};

/**
 * Image plugin for processing inline image nodes in the Markdown AST.
 * Resolves both base64 and URL-based images for inclusion in DOCX.
 *
 * @param options - Optional image plugin configuration.
 * @returns Plugin implementation for use in the `@m2d/core` pipeline.
 */
export const imagePlugin: (options?: IImagePluginOptions) => IPlugin = options_ => {
  const options: IDefaultImagePluginOptions = { ...defaultOptions, ...options_ };
  return {
    inline: async (docx, node, runProps, definitions) => {
      if (/^(image|svg)/.test(node.type)) {
        const alt = (node as Image).alt ?? (node as Image).url?.split("/")?.pop() ?? "";
        const url =
          (node as Image).url ?? definitions[(node as ImageReference).identifier?.toUpperCase()];

        const imgOptions =
          node.type === "svg"
            ? await handleSvg(node, options)
            : await options.imageResolver(url, options);

        // apply data props
        const { data } = node as Image;
        const { width: origW, height: origH } = imgOptions.transformation;
        let { width, height } = data ?? {};
        if (width && !height) {
          height = (origH * width) / origW;
        } else if (!width && height) {
          width = (origW * height) / origH;
        } else if (!width && !height) {
          height = origH;
          width = origW;
        }

        const scale = Math.min(
          (options.maxW * options.dpi) / width!,
          (options.maxH * options.dpi) / height!,
          1,
        );
        // @ts-expect-error -- we are mutating the immutable options.
        imgOptions.transformation = { width: width * scale, height: height * scale };
        node.type = "";
        return [
          new docx.ImageRun({
            ...imgOptions,
            altText: { description: alt, name: alt, title: alt },
            ...runProps,
            ...(node as Image | SVG).data,
          }),
        ];
      }
      return [];
    },
  };
};
