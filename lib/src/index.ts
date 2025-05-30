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
import { createPersistentCache, simpleCleanup } from "@m2d/core/cache";
import { handleSvg } from "./svg-utils";
import { Definitions } from "@m2d/core/utils";
import { getImageMimeType, getPlaceHolderImage } from "./utils";

/**
 * List of supported image MIME types that can be embedded directly in DOCX.
 * SVG is intentionally excluded due to its special handling.
 */
const SUPPORTED_IMAGE_TYPES = ["jpeg", "jpg", "bmp", "gif", "png"] as const;

/** namespace used for cleaning up the idb cache */
const NAMESPACE = "img";

/**
 * A resolver function that transforms an image `src` into
 * a `docx`-compatible `IImageOptions` object.
 *
 * @param src - Base64 or URL image source.
 * @param options - Current plugin options.
 * @param node - Image or SVG node in the Markdown AST.
 */
export type ImageResolver = (
  src: string,
  options: IDefaultImagePluginOptions,
  node?: Image | SVG,
) => Promise<IImageOptions>;

/**
 * Full configuration for the image plugin including defaulted and required options.
 */
export interface IDefaultImagePluginOptions {
  /** Scale factor for base64 (data URL) images. @default 3 */
  scale: number;

  /** Fallback format to convert unsupported image types. @default "png" */
  fallbackImageType: "png" | "jpg" | "bmp" | "gif";

  /** Image resolution function used to convert URL/base64/SVG to image options */
  imageResolver: ImageResolver;

  /** Max image width (in inches) for inserted image */
  maxW: number;

  /** Max image height (in inches) for inserted image */
  maxH: number;

  /** Optional placeholder image (base64 or URL) used on errors */
  placeholder?: string;

  /** Enable IndexedDB-based caching. @default true */
  idb: boolean;

  /**
   * Optional salt string used to differentiate cache keys for similar images (e.g., dark/light theme).
   */
  salt?: string;

  /** Target resolution in DPI for calculating physical dimensions */
  dpi: number;

  /** Duration in minutes after which cached records are removed as stale. Default: 7 days (10080 minutes). */
  maxAgeMinutes: number;
}

/**
 * External plugin options accepted by consumers, omitting internal-only values.
 */
export type IImagePluginOptions = Optional<Omit<IDefaultImagePluginOptions, "dpi">>;

/**
 * Handles base64 data URL images. Returns image options suitable for DOCX.
 * Converts unsupported types to canvas-based fallback.
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

  /* v8 ignore start */
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context not available");

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const fallbackImageType = options.fallbackImageType ?? "png";

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
 * Fetches and processes external image URLs.
 * Automatically detects SVGs and delegates them to SVG handler.
 */
const handleNonDataUrls = async (
  url: string,
  options: IDefaultImagePluginOptions,
): Promise<IImageOptions> => {
  const response = await fetch(
    url.startsWith("http") ? url : `${window.location.origin}/${url.replace(/^\/+/, "/")}`,
  );

  if (/(svg|xml)/.test(response.headers.get("content-type") ?? "") || url.endsWith(".svg")) {
    const svgText = await response.text();
    return handleSvg({ type: "svg", value: svgText }, options);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = getImageMimeType(arrayBuffer) || "png";

  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer], { type: mimeType }));

  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    /* v8 ignore next 3 */
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
 * The default image resolver.
 * Detects source type and invokes the correct handler (SVG, base64, remote).
 * Computes final dimensions while respecting maxW/maxH and DPI.
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

    /* v8 ignore start */
    // Fill in missing dimensions using aspect ratio
    if (width && !height) {
      height = (origH * width) / origW;
    } else if (!width && height) {
      width = (origW * height) / origH;
    } else if (!width && !height) {
      width = origW;
      height = origH;
    }
    /* v8 ignore end */

    // Enforce maxW/maxH constraints using DPI
    const scale = Math.min(
      // skipcq: JS-0339
      (options.maxW * options.dpi) / width!,
      // skipcq: JS-0339
      (options.maxH * options.dpi) / height!,
      1,
    );

    // @ts-expect-error -- mutating transformation
    imgOptions.transformation = { width: width * scale, height: height * scale };
    return imgOptions;
  } catch (error) {
    console.error(`Error resolving image: ${src}`, error);
    return getPlaceHolderImage(options);
  }
};

/**
 * Default fallback plugin configuration.
 * `imageResolver` is wrapped in a persistent cache to avoid redundant work.
 */
const defaultOptions: IDefaultImagePluginOptions = {
  scale: 3,
  fallbackImageType: "png",
  imageResolver: defaultImageResolver,
  maxW: 6.3,
  maxH: 9.7,
  dpi: 96,
  idb: true,
  maxAgeMinutes: 7 * 24 * 60,
};

/**
 * Image plugin for `@m2d/core`.
 * Resolves all inline images (base64, SVG, URL) for DOCX generation.
 */
export const imagePlugin: (options?: IImagePluginOptions) => IPlugin = options_ => {
  const options = { ...defaultOptions, ...options_ };

  options.imageResolver = createPersistentCache(
    options.imageResolver,
    NAMESPACE,
    ["dpi", "idb", "type", "alt"],
    options.idb,
  );

  /** clean up images data which is not used for last 7 days */
  simpleCleanup(options.maxAgeMinutes, NAMESPACE);
  /** Preprocess step: resolves all image references in the MDAST. */
  const preprocess = async (root: Root, definitions: Definitions) => {
    const promises: Promise<void>[] = [];

    const preprocessInternal = (node: Root | RootContent | PhrasingContent) => {
      (node as Parent).children?.forEach(preprocessInternal);

      if (/^(image|svg)/.test(node.type)) {
        promises.push(
          (async () => {
            const src =
              (node as Image).url ??
              definitions[(node as ImageReference).identifier?.toUpperCase()];

            const alt = (node as Image).alt ?? src?.split("/")?.pop() ?? "";

            node.data = {
              ...(await options.imageResolver(src, options, node as Image | SVG)),
              altText: { description: alt, name: alt, title: alt },
              ...(node as Image | SVG).data,
            };
          })(),
        );
      }
    };

    preprocessInternal(root);
    await Promise.all(promises);
  };

  return {
    preprocess,

    /** Renderer step: injects resolved image data into the final DOCX AST */
    inline: (docx, node, runProps) => {
      if (/^(image|svg)/.test(node.type)) {
        node.type = "";
        // @ts-expect-error -- extra props used for ImageRun
        return [new docx.ImageRun({ ...(node as Image).data, ...runProps })];
      }
      return [];
    },
  };
};
