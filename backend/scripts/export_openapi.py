import json
from pathlib import Path

from railniyojan.api.main import app

repository_root = Path(__file__).resolve().parents[2]
output_path = repository_root / "openapi" / "openapi.json"
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n")
print(f"wrote {output_path}")

