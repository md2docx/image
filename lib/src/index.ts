import type { IImageOptions } from "docx";
import type {
  Image,
  ImageReference,
  IPlugin,
  Optional,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
  SVG,
} from "@m2d/core";
import { handleSvg } from "./svg-utils";
import { Definitions } from "@m2d/core/utils";
import { imageCache } from "./cache-utils";
import { getImageMimeType, getPlaceHolderImage } from "./utils";

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
  node?: Image | SVG,
) => Promise<IImageOptions>;

/**
 * Configuration options for the image plugin.
 */
export interface IDefaultImagePluginOptions {
  /**
   * Scale factor applied to base64 images to simulate resolution.
   * @default 3
   */
  scale: number;

  /**
   * Fallback image format for unsupported or unrecognized types.
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
   * Placeholder image source URL or base64.
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
    return handleSvg({ type: "svg", value: svgText }, options);
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

/**
 * Resolves an image source to a DOCX-compatible image object.
 * Supports both base64 data URLs and remote URLs.
 *
 * @param src - Image source to resolve.
 * @param options - Plugin configuration.
 * @returns Resolved image options or fallback.
 */
const defaultImageResolver: ImageResolver = async (src, options, node) => {
  try {
    const imgOptions = await (node?.type === "svg"
      ? handleSvg(node, options)
      : src.startsWith("data:")
        ? handleDataUrls(src, options)
        : handleNonDataUrls(src, options));
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
      // skipcq: JS-0339
      (options.maxW * options.dpi) / width!,
      // skipcq: JS-0339
      (options.maxH * options.dpi) / height!,
      1,
    );
    // @ts-expect-error -- we are mutating the immutable options.
    imgOptions.transformation = { width: width * scale, height: height * scale };
    return imgOptions;
  } catch (error) {
    console.error(`Error resolving image: ${src}`, error);
    return getPlaceHolderImage(options);
  }
};

/**
 * Default configuration values used when plugin options are not provided.
 */
const defaultOptions: IDefaultImagePluginOptions = {
  scale: 3,
  fallbackImageType: "png",
  imageResolver: defaultImageResolver,
  // A4 page size with standard margins
  maxW: 6.3,
  maxH: 9.7,
  dpi: 96,
};

const cache: Record<string, Promise<IImageOptions>> = {};

/**
 * Image plugin for processing inline image nodes in the Markdown AST.
 * Resolves both base64 and URL-based images for inclusion in DOCX.
 *
 * @param options - Optional image plugin configuration.
 * @returns Plugin implementation for use in the `@m2d/core` pipeline.
 */
export const imagePlugin: (options?: IImagePluginOptions) => IPlugin = options_ => {
  const options = { ...defaultOptions, ...options_ };

  /** Preprocess images and resolve sources */
  const preprocess = async (root: Root, definitions: Definitions) => {
    const promises: Promise<void>[] = [];

    /** process images and create promises - use max parallel processing */
    const preprocessInternal = (node: Root | RootContent | PhrasingContent) => {
      (node as Parent).children?.forEach(preprocessInternal);

      if (/^(image|svg)/.test(node.type))
        promises.push(
          (async () => {
            const url =
              (node as Image).url ??
              definitions[(node as ImageReference).identifier?.toUpperCase()];

            const cacheKey = node.type === "svg" ? (node.data?.mermaid ?? String(node.value)) : url;

            cache[cacheKey] ??= (async () => {
              const cached = await imageCache.get(cacheKey);
              if (cached) return cached;

              const result = await options.imageResolver(url, options, node as Image | SVG);
              await imageCache.set(cacheKey, result);
              return result;
            })();
            const alt = (node as Image).alt ?? url?.split("/")?.pop() ?? "";

            node.data = {
              ...(await cache[cacheKey]),
              altText: { description: alt, name: alt, title: alt },
              ...(node as Image | SVG).data,
            };
          })(),
        );
    };
    preprocessInternal(root);
    await Promise.all(promises);
  };

  return {
    preprocess,
    inline: (docx, node, runProps) => {
      if (/^(image|svg)/.test(node.type)) {
        // @ts-expect-error -- adding extra props
        return [new docx.ImageRun({ ...(node as Image).data, ...runProps })];
      }
      return [];
    },
  };
};
