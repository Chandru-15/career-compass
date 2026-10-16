const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const dotenv = require("dotenv");
const root = path.join(__dirname, "../..");
const environment = dotenv.parse(
  fs.readFileSync(path.join(root, "backend/.env")),
);
const sensitive = Object.entries(environment).filter(
  ([key, value]) =>
    /KEY|CONNECTION_STRING|ENDPOINT|SUPABASE_URL/.test(key) && value.length > 8,
);
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
const bundleDir = path.join(root, "frontend/dist");
if (!fs.existsSync(bundleDir))
  throw new Error("Build the frontend before scanning the bundle.");
let failures = 0;
for (const filename of [
  ...files.map((f) => path.join(root, f)),
  ...walk(bundleDir),
]) {
  if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) continue;
  if (
    path.basename(filename).startsWith(".env") &&
    !filename.endsWith(".env.example")
  ) {
    console.log("FAIL environment file is tracked");
    failures++;
    continue;
  }
  const content = fs.readFileSync(filename, "utf8");
  for (const [key, value] of sensitive)
    if (content.includes(value)) {
      console.log(
        "FAIL secret/config value in " +
          path.relative(root, filename) +
          " (" +
          key +
          ")",
      );
      failures++;
    }
}
for (const directory of ["backend", "frontend"]) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, directory, "package.json")),
  );
  if (pkg.dependencies?.["@azure/cosmos"]) failures++;
  if (directory === "frontend" && pkg.dependencies?.["@supabase/supabase-js"])
    failures++;
}
for (const filename of ["backend/.env", "frontend/.env"])
  try {
    execFileSync("git", ["check-ignore", "--quiet", filename], { cwd: root });
  } catch {
    console.log("FAIL env not ignored: " + filename);
    failures++;
  }
console.log(
  failures
    ? "Security checks failed; values withheld."
    : "PASS no server secret values in source/bundle; env files ignored; privileged SDKs confined to backend.",
);
process.exitCode = failures ? 1 : 0;
