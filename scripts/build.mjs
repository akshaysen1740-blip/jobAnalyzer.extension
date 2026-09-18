import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build, context } from "esbuild";

function loadEnv(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['\"]|['\"]$/g, "");
        return [key, value];
      }),
  );
}

const env = loadEnv(resolve(process.cwd(), ".env"));
const apiUrl = env.API_URL;

if (!apiUrl) {
  throw new Error("Missing API_URL in extension/.env");
}

const options = {
  entryPoints: ["src/content.ts", "src/background.ts"],
  bundle: true,
  outdir: "dist",
  define: {
    __JOB_ANALYZER_API_URL__: JSON.stringify(apiUrl),
  },
};

if (process.argv.includes("--watch")) {
  const buildContext = await context(options);
  await buildContext.watch();
  console.log("Watching extension files for changes...");
} else {
  await build(options);
}
