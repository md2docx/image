import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      include: ["src/**"],
      // No proper way to test DOM interactions with SVG yet
      exclude: ["src/**/*.test.*", "src/**/svg-utils.ts", "src/**/declaration.d.ts"],
      reporter: ["text", "json", "clover", "html"],
    },
  },
});
