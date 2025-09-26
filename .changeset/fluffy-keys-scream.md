---
"@m2d/image": patch
---

♻️ Use `@svg-fns/io`'s `parseSvg` to safely generate `<svg>` elements before attaching to the DOM.

- Prevents unsafe string injection
- Ensures valid, namespaced SVG elements
- Improves consistency across different environments
