import { defineConfig, type Options } from "tsup";
import react18Plugin from "esbuild-plugin-react18";
import cssPlugin from "esbuild-plugin-react18-css";
import { rdiPlugin } from "esbuild-plugin-rdi";
import { raw } from "esbuild-raw-plugin";

export default defineConfig(
  (options: Options) =>
    ({
      format: ["cjs", "esm"],
      target: "es2019",
      entry: ["./src/**"],
      sourcemap: false,
      clean: !options.watch,
      bundle: true,
      minify: !options.watch,
      esbuildPlugins: [
        raw({ textExtensions: ["md"] }),
        react18Plugin(),
        cssPlugin({ generateScopedName: "[folder]__[local]" }),
        // rdiPlugin(), <-- todo: rdiPlugin sometimes breaks the build when building all packages parallel
      ],
      external: ["react"],
      ...options,
    }) as Options,
);
