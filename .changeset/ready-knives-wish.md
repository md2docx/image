---
"@m2d/image": patch
---

Do not use svg/fallback. Instead always convert to PNG as svg rendering in docx is inconsistent, e.g., image with data url within svg is ignored.
