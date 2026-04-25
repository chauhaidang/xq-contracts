# /// script
# dependencies = ["pyyaml"]
# ///

import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

REST_DIR = Path(__file__).parent.parent / "rest"
BUILD_DIR = Path(__file__).parent.parent / "rest-gen-py"

BUILD_DIR.mkdir(parents=True, exist_ok=True)

files = [f for f in sorted(REST_DIR.iterdir()) if f.suffix in (".yaml", ".json")]

if not files:
    print("No OpenAPI spec files found in rest/")
    sys.exit(0)

success_count = 0

for spec_file in files:
    base_name = spec_file.stem
    client_dir = BUILD_DIR / base_name

    print(f"🚀 Started building {base_name}...")

    with open(spec_file) as f:
        spec = yaml.safe_load(f)

    api_version = spec.get("info", {}).get("version", "1.0.0")

    if client_dir.exists():
        shutil.rmtree(client_dir)

    result = subprocess.run(
        [
            "openapi-python-client",
            "generate",
            "--path", str(spec_file),
            "--output-path", str(client_dir),
            "--meta", "poetry",
            "--overwrite",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"❌ [{base_name}] Failed to generate client:\n{result.stderr}")
        continue

    pyproject_path = client_dir / "pyproject.toml"
    if pyproject_path.exists():
        content = pyproject_path.read_text()
        content = re.sub(r'(version\s*=\s*")[^"]*(")', rf'\g<1>{api_version}\2', content, count=1)
        pyproject_path.write_text(content)

    success_count += 1
    print(f"✅ Successfully built {base_name} → rest-gen-py/{base_name} (v{api_version})")

print(f"\n🎉 Build complete: {success_count}/{len(files)} processed successfully.")
