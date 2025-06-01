# `@m2d/image` <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" height="40"/>

[![test](https://github.com/md2docx/image/actions/workflows/test.yml/badge.svg)](https://github.com/md2docx/image/actions/workflows/test.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/aa896ec14c570f3bb274/maintainability)](https://codeclimate.com/github/md2docx/image/maintainability) [![codecov](https://codecov.io/gh/md2docx/image/graph/badge.svg)](https://codecov.io/gh/md2docx/image) [![Version](https://img.shields.io/npm/v/@m2d/image.svg?colorB=green)](https://www.npmjs.com/package/@m2d/image) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/@m2d/image.svg)](https://www.npmjs.com/package/@m2d/image) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@m2d/image)

> Converts Markdown (`![alt](url)`), HTML `<img>`, and custom `image`/`svg` nodes into **DOCX-compatible** `ImageRun` elements.

> Parsing HTML or Mermaid to SVG or image tags requires `@m2d/html` or `@m2d/mermaid`, respectively.  
> However, `@m2d/image` handles all image rendering to DOCX regardless of origin.

---

## 📦 Installation

```bash
npm install @m2d/image
```

```bash
pnpm add @m2d/image
```

```bash
yarn add @m2d/image
```

---

## 🚀 Overview

The `@m2d/image` plugin for [`mdast2docx`](https://github.com/mayankchaudhari/mdast2docx) renders image nodes in DOCX output.

It supports:

- Markdown image syntax: `![alt](url)`
- Images parsed from HTML via `@m2d/html`
- Images or SVGs emitted by plugins like `@m2d/mermaid`
- Base64 and external URLs
- Fallback handling
- Automatic caching

---

## 🛠️ Usage

```ts
import { imagePlugin } from "@m2d/image";

const plugins = [
  htmlPlugin(), // Optional — parses HTML <img> into image nodes
  mermaidPlugin(), // Optional — emits image/svg nodes for diagrams
  imagePlugin(), // ✅ Must come after HTML/Mermaid plugins
  tablePlugin(),
];
```

> 🧠 If using `@m2d/html` or `@m2d/mermaid`, place them **before** this plugin.
> They generate `image` or `svg` nodes, but only `@m2d/image` renders them to DOCX.

---

## 🧪 Production Ready

This plugin is **production-grade**, supporting all major image scenarios:

- Remote images (CORS-safe)
- Data URIs and base64
- SVG-to-PNG fallback
- Image resolution caching (memory + IndexedDB)
- Partial style propagation via `data-*` attributes from HTML

> 💬 **We welcome feedback, bugs, and contributions** — open an issue or PR anytime.

---

## ⚙️ Plugin Options

```ts
IImagePluginOptions {
  /** Scale factor for base64 (data URL) images. @default 3 */
  scale?: number;

  /** Fallback format to convert unsupported image types. @default "png" */
  fallbackImageType?: "png" | "jpg" | "bmp" | "gif";

  /** Image resolution function used to convert URL/base64/SVG to image options */
  imageResolver?: ImageResolver;

  /** Max image width (in inches) for inserted image */
  maxW?: number;

  /** Max image height (in inches) for inserted image */
  maxH?: number;

  /** Optional placeholder image (base64 or URL) used on errors */
  placeholder?: string;

  /** Enable IndexedDB-based caching. @default true */
  idb?: boolean;

  /**
   * Optional salt string used to differentiate cache keys for similar images (e.g., dark/light theme).
   */
  salt?: string;

  /** Duration in minutes after which cached records are removed as stale. Default: 7 days (10080 minutes). */
  maxAgeMinutes?: number;
}
```

### `imageResolver`

A custom function to fetch or transform the image. Receives the full `image` or `svg` node.

```ts
imagePlugin({
  imageResolver: async (src, options, node) => {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return {
      type: "png",
      data: arrayBuffer,
      transformation: {
        width: 400,
        height: 300,
      },
    };
  },
});
```

> You don’t need to implement caching — it’s handled internally with persistent storage.

---

### `placeholder`

Used if the image fails to load or decode. Can be:

- A base64/data URL string
- An url to placeholder image

---

### `idb`

Whether to enable IndexedDB caching (in addition to in-memory).

- `true` (default): uses IndexedDB
- `false`: disables persistent cache

---

## 🧠 How It Works

1. Walks the MDAST tree for `image` and `svg` nodes
2. Resolves the image via default or custom `imageResolver`
3. Converts to a `docx.ImageRun`, including alt text and limited styles
4. Caches results keyed on the full node and options
5. Falls back if resolution fails

---

## 💡 Features

- **Markdown images**: `![alt](url)`
- **HTML `<img>`, `<svg>` support** via `@m2d/html`
- **Mermaid support** via `@m2d/mermaid` or custom plugins
- **Cross-environment caching** (memory + IndexedDB)
- **Alt text + basic style support** from HTML via `data-*`

---

## ⚠️ Limitations

- Requires client-side (DOM) environment (uses `<canvas>`, `<img>`, etc.)
- Not compatible with server-side rendering (SSR) _Node.js image plugin coming soon!_
- External images must be accessible (CORS-safe URLs)
- Only a subset of styles are supported
- `object-fit`, `fitWidth`, and complex layout constraints are **not supported**
- Broken images are replaced with placeholder if defined; otherwise skipped

---

## 🔌 Related Plugins/Packages

| Plugin                                                   | Purpose                                  |
| -------------------------------------------------------- | ---------------------------------------- |
| [`@m2d/core`](https://npmjs.com/package/@m2d/core)       | Converts extended MDAST to DOCX          |
| [`@m2d/html`](https://npmjs.com/package/@m2d/html)       | Parses raw HTML to extended MDAST        |
| [`@m2d/mermaid`](https://npmjs.com/package/@m2d/mermaid) | Adds mermaid diagrams as SVG/image nodes |
| [`@m2d/table`](https://npmjs.com/package/@m2d/table)     | Renders table nodes to DOCX              |
| [`@m2d/list`](https://npmjs.com/package/@m2d/list)       | Enhanced list support (tasks, bullets)   |

---

## ⭐ Support Us

If you find this useful:

- ⭐ Star [mdast2docx](https://github.com/tiny-md/mdast2docx) on GitHub
- ❤️ Consider [sponsoring](https://github.com/sponsors/mayank1513)

---

## 🧾 License

MIT © [Mayank Chaudhari](https://github.com/mayankchaudhari)

---

<p align="center">Made with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
