---
"@m2d/image": minor
---

Added support for optimized in-memory caching of resolved image data.

- Introduced `cacheConfig.cache` option to share or inject a memory cache instance across multiple plugin invocations.
- Consumers can now fine-tune cache behavior using `cacheConfig.parallel` (to avoid redundant parallel resolutions) and `cacheConfig.cacheMode` (choose between `"memory"`, `"idb"`, or `"both"`).
- Enhances image resolution performance in multi-page or repeated image scenarios, especially when used across sessions or documents.
