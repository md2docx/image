import { vi } from "vitest";

// Mock createImageBitmap
globalThis.createImageBitmap = vi.fn(async () => {
  return {
    width: 100,
    height: 100,
    close: () => {},
  };
});

// @ts-expect-error Mock getBBox (required for SVG operations)
SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
});

const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const dummyText = "<svg></svg>";
  const dummyArrayBuffer = new TextEncoder().encode(dummyText).buffer;

  console.log("mocking --- ", input);
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "Content-Type": "image/svg+xml" }),

    // 👇 All the response methods you're using
    text: async () => dummyText,
    arrayBuffer: async () => dummyArrayBuffer,
    blob: async () => new Blob([dummyArrayBuffer], { type: "image/svg+xml" }),
  } as unknown as Response;
});

vi.stubGlobal("fetch", mockFetch);

globalThis.fetch = mockFetch;

// setupTests.ts or in your test file

globalThis.Image = class {
  _src: string = "";
  width?: number;
  height?: number;
  onload: (() => void) | null = null;
  onerror: ((err?: any) => void) | null = null;

  constructor(width?: number, height?: number) {
    this.width = width;
    this.height = height;

    // Simulate async image load
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }

  set src(value: string) {
    this._src = value;
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }

  get src() {
    return this._src;
  }
} as unknown as typeof Image;
