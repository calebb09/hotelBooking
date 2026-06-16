const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "..", "src", "routes");
const outFile = path.join(__dirname, "..", "build", "api_endpoints.json");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith(".js")) {
      results.push(file);
    }
  });
  return results;
}

function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const endpoints = [];

  const routeRegex =
    /router\.(get|post|put|delete|patch)\s*\(\s*([`\'"])(.*?)\2\s*,/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(routeRegex);
    if (m) {
      endpoints.push({
        method: m[1].toUpperCase(),
        path: m[3],
        file: path.relative(process.cwd(), filePath),
        line: i + 1,
      });
    }
  }
  return endpoints;
}

function main() {
  if (!fs.existsSync(routesDir)) {
    console.error("routes directory not found:", routesDir);
    process.exit(1);
  }
  const files = walk(routesDir);
  const all = [];
  files.forEach((f) => {
    try {
      const ex = extractFromFile(f);
      all.push(...ex);
    } catch (err) {
      console.error("failed to parse", f, err.message);
    }
  });
  if (!fs.existsSync(path.dirname(outFile)))
    fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, JSON.stringify(all, null, 2));
  console.log("Wrote", outFile, "with", all.length, "endpoints");
}

main();
