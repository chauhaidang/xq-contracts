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

// Find all yaml or json openapi contracts
const files = fs.readdirSync(REST_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.json'));

let successCount = 0;

async function buildClients() {
  const promises = files.map(async (file) => {
    const baseName = path.basename(file, path.extname(file));
    const clientDir = path.join(BUILD_DIR, baseName);

    console.log(`🚀 Started building @chauhaidang/${baseName}...`);

    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }

    // Parse OpenAPI version
    const yamlPath = path.resolve(REST_DIR, file);
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const versionMatch = yamlContent.match(/version:\s*['"]?([0-9\.]+)['"]?/);
    const apiVersion = versionMatch ? versionMatch[1].trim() : TEMPLATE_PKG.version || "1.0.0";

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
