import svelte from "rollup-plugin-svelte";
import css from "rollup-plugin-css-only";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import terser from "@rollup/plugin-terser";
import alias from "@rollup/plugin-alias";
import path from "path";
import { fileURLToPath } from "url";
import sveltePreprocess from "svelte-preprocess";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = process.env.BUILD === "production";

export default {
  input: "src/main.ts",
  output: {
    dir: ".",
    sourcemap: true,
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian"],
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      emitCss: true,
    }),
    css({ output: "styles.css" }),
    alias({
      entries: [
        { find: "@", replacement: path.resolve(__dirname, "src") },
      ],
    }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
      include: ["src/**/*.ts"],
      tsconfigOverride: {
        include: ["src/**/*.ts"],
      },
    }),
    production && terser(),
  ],
  onwarn(warning, handler) {
    if (warning.code === "THIS_IS_UNDEFINED") {
      return;
    }
    handler(warning);
  },
  watch: {
    clearScreen: false,
  },
};
