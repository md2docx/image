# @m2d/image

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
