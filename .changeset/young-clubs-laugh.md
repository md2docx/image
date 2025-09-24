---
"@m2d/image": patch
---

Remove `bmp` and `gif` fallback formats. These formats are not well supported on canvas, causing issues with our Canvas-based fallback conversion.
