---
"@m2d/image": minor
---

Enhanced image caching system with improved performance and reliability:
- Replaced basic IndexedDB utilities with comprehensive caching system
- Added deterministic hash-based cache keys using xxhash-wasm
- Implemented in-memory cache to deduplicate parallel requests
- Added salt option for cache key differentiation
- Improved documentation with JSDoc comments