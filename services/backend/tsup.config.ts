import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  noExternal: ["@workspace/db"],
  outDir: "dist",
  sourcemap: true,
  target: "node20",
})
