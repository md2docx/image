---
"@m2d/image": patch
---

Improve SVG → image conversion by preferring **OffscreenCanvas** over `<canvas>` when available.

- OffscreenCanvas advantages:
  - Runs in worker contexts → avoids blocking the main thread during rasterization.
  - Provides more consistent and reliable Blob generation compared to `HTMLCanvasElement.toBlob`.
  - Better performance for large or complex SVGs.

- Fallback to `<canvas>` remains for browsers without OffscreenCanvas support (e.g., Safari).
