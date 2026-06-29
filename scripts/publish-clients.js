const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const REST_DIR = path.join(__dirname, '../rest');
const BUILD_DIR = path.join(__dirname, '../rest-gen');
const TEMPLATE_PKG_PATH = path.join(__dirname, '../package-template.json');
const NPM_RC_PATH = path.join(__dirname, '../.npmrc-template');

// Ensure base template files exist
if (!fs.existsSync(TEMPLATE_PKG_PATH)) {
  console.error("Missing package-template.json");
  process.exit(1);
}
if (!fs.existsSync(NPM_RC_PATH)) {
  console.error("Missing .npmrc-template");
  process.exit(1);
}

const TEMPLATE_PKG = require(TEMPLATE_PKG_PATH);
const NPM_RC = fs.readFileSync(NPM_RC_PATH, 'utf-8');

if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

function getOpenApiInfoVersion(yamlContent, fallbackVersion) {
  try {
    const spec = JSON.parse(yamlContent);
    return spec.info?.version || fallbackVersion;
  } catch {
    // Not JSON; continue with the YAML scanner below.
  }

  const lines = yamlContent.split(/\r?\n/);
  const infoIndex = lines.findIndex(line => /^info:\s*$/.test(line));

  if (infoIndex === -1) {
    return fallbackVersion;
  }

  for (let i = infoIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (/^\S/.test(line)) {
      break;
    }

    const versionMatch = line.match(/^\s+version:\s*['"]?([^'"\s]+)['"]?\s*$/);
    if (versionMatch) {
      return versionMatch[1].trim();
    }
  }

  return fallbackVersion;
}

function getContractFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getContractFiles(entryPath);
    }

    if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.json'))) {
      return [entryPath];
    }

    return [];
  }).sort();
}

function getClientBaseName(filePath) {
  return path.parse(filePath).name;
}

// Find all yaml or json openapi contracts under rest/.
const files = getContractFiles(REST_DIR);
const duplicateBaseNames = files
  .map(getClientBaseName)
  .filter((baseName, index, baseNames) => baseNames.indexOf(baseName) !== index);

if (duplicateBaseNames.length > 0) {
  console.error(`Duplicate REST contract names found: ${[...new Set(duplicateBaseNames)].join(', ')}`);
  process.exit(1);
}

let successCount = 0;

async function buildClients() {
  const promises = files.map(async (file) => {
    const baseName = getClientBaseName(file);
    const clientDir = path.join(BUILD_DIR, baseName);

    console.log(`🚀 Started building @chauhaidang/${baseName}...`);

    if (fs.existsSync(clientDir)) {
      fs.rmSync(clientDir, { recursive: true, force: true });
    }
    fs.mkdirSync(clientDir, { recursive: true });

    // Parse OpenAPI info.version
    const yamlPath = path.resolve(file);
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const apiVersion = getOpenApiInfoVersion(yamlContent, TEMPLATE_PKG.version || "1.0.0");
    console.log(`📦 ${baseName} package version resolved from ${path.relative(REST_DIR, file)}: ${apiVersion}`);

    // 1. Scaffold package.json
    const pkg = { ...TEMPLATE_PKG };
    pkg.name = `@chauhaidang/${baseName}`;
    pkg.version = apiVersion;
    pkg.description = `Generated API client for ${baseName}`;

    pkg.scripts = {
      "build": "tsc",
      "clean": "rm -rf dist"
    };

    pkg.dependencies = {
      "@hey-api/client-fetch": "0.8.1"
    };

    pkg.devDependencies = {
      "typescript": "^5.0.0"
    };

    fs.writeFileSync(path.join(clientDir, 'package.json'), JSON.stringify(pkg, null, 2));

    // 2. Insert .npmrc
    fs.writeFileSync(path.join(clientDir, '.npmrc'), NPM_RC);

    // 3. Inject strict tsconfig
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        declaration: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: "./dist"
      },
      include: ["src/**/*"]
    };
    fs.writeFileSync(path.join(clientDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // 4. Generate Typescript SDK via Hey API
    try {
      await execAsync(`npx --yes @hey-api/openapi-ts -i ${yamlPath} -o src -c @hey-api/client-fetch`, { cwd: clientDir });
    } catch (err) {
      console.error(`❌ [@chauhaidang/${baseName}] Failed to generate ts client`, err.message);
      return;
    }

    // 5. Build JS and Type Definitions
    try {
      // Run npm install first to grab the required devDependencies like typescript and @hey-api/client-fetch
      await execAsync(`npm install --no-package-lock`, { cwd: clientDir });
      await execAsync(`npx tsc`, { cwd: clientDir });
    } catch (err) {
      console.error(`❌ [@chauhaidang/${baseName}] Failed to compile`, err.message);
      return;
    }

    successCount++;
    console.log(`✅ Successfully built @chauhaidang/${baseName} in ./rest-gen/${baseName}`);
  });

  await Promise.all(promises);
  console.log(`\n🎉 Build complete: ${successCount}/${files.length} processed successfully.`);
}

buildClients().catch(console.error);
