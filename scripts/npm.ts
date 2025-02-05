// ex. scripts/build_npm.ts
import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  test: false,
  package: {
    // package.json properties
    name: "@levischuck/tiny-cbor",
    version: Deno.args[0],
    description: "Tiny CBOR library",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/levischuck/tiny-cbor.git",
    },
    bugs: {
      url: "https://github.com/levischuck/tiny-cbor/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE.txt", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
