# @m2d/image

## 1.1.1

### Patch Changes

- d260e28: Update mermaid plugin to use the diagramType infered by the mermaid library itself.
- 0998cd8: refactor: simplify URL handling in image resolver and update TypeScript target to ES2021
- acef6ad: fix the placeholder typo
- 42c9527: Use shared caching mechanism from @m2d/core

## 1.1.0

### Minor Changes

- c0ccdda: Rewrite image resolver to handle svg as well - prelude for cutom caching
- 3c2a0d7: Add IndexedDB image caching

  - Implement persistent image caching using IndexedDB
  - Add idb dependency for IndexedDB operations
  - Create cache get/set/clear operations
  - Integrate with image resolution pipeline
  - Improve performance for repeated image rendering

- 47c16c5: Enhanced image caching system with improved performance and reliability:
  - Replaced basic IndexedDB utilities with comprehensive caching system
  - Added deterministic hash-based cache keys using xxhash-wasm
  - Implemented in-memory cache to deduplicate parallel requests
  - Added salt option for cache key differentiation
  - Improved documentation with JSDoc comments
- a31621c: Make IndexedDB caching truly optional:

  - Only apply caching wrapper when idb option is enabled
  - Set default idb value to true for backward compatibility

### Patch Changes

- 3add133: Remove idb dependency and implement native IndexedDB API:
  - Replace idb library with native IndexedDB API to reduce bundle size
  - Fix SSR compatibility issues with Next.js
  - Improve object store configuration with keyPath for better data structure

## 1.0.1

### Patch Changes

- ecc0afa: fix image data types

## 1.0.0

### Major Changes

- 553a654: Changing the plugin signature in accordace with this discussion - https://github.com/md2docx/mdast2docx/discussions/15

### Minor Changes

- 9d1f896: Use caching

## 0.2.4

### Patch Changes

- a9f8cb3: limit scaling Gantt chart to avoid painting issues

## 0.2.3

### Patch Changes

- 5c0e37c: Fix: Improve error handling

## 0.2.2

### Patch Changes

- 43aeaf2: Fix placeholder image.

## 0.2.1

### Patch Changes

- c75c66d: fix: Update Readme

## 0.2.0

### Minor Changes

- d6d07b7: Add option to provide placeholder image

## 0.1.2

### Patch Changes

- dfddd4d: Add placeholder image option

## 0.1.1

### Patch Changes

- 25bf5f0: fix: avoid enlargement in tightlyCropSvg to avoid issues with gantt charts, etc.
- 6ee90b2: enhance: scale images appropreately to avoid extra enlargement after cropping.
- a0d6990: Do not tight crop Gantt charts.

## 0.1.0

### Minor Changes

- 299306f: Support svg node, handle urls returning svg and more...

### Patch Changes

- dd80547: refactor: prep for handling svg
- d8383f3: Apply data props, i.e., support html styling.
- 173f22c: Fix missing svg images

## 0.0.4

### Patch Changes

- 4dc7964: Do not use svg/fallback. Instead always convert to PNG as svg rendering in docx is inconsistent, e.g., image with data url within svg is ignored.
