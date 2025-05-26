---
"@m2d/image": patch
---

Remove idb dependency and implement native IndexedDB API:
- Replace idb library with native IndexedDB API to reduce bundle size
- Fix SSR compatibility issues with Next.js
- Improve object store configuration with keyPath for better data structure