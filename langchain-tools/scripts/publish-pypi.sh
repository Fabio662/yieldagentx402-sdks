#!/usr/bin/env bash
# Publish yieldagentx402-langchain to PyPI.
#
# PyPI blocks third-party uploads under the langchain-* namespace (403 Forbidden).
# Use yieldagentx402-langchain on PyPI; import: yieldagentx402_langchain
#
# Token: https://pypi.org/manage/account/token/
#   Scope: Entire account (first upload) or project yieldagentx402-langchain
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PYTHON="${PYTHON:-python3}"
if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHON="$ROOT/.venv/bin/python"
fi

rm -rf dist/
"$PYTHON" -m pip install -q build twine
"$PYTHON" -m build

if [[ -z "${TWINE_USERNAME:-}" ]]; then
  export TWINE_USERNAME=__token__
fi
if [[ -z "${TWINE_PASSWORD:-}" ]]; then
  echo "Set TWINE_PASSWORD to your pypi-... API token, then re-run." >&2
  echo "  export TWINE_PASSWORD='pypi-...'" >&2
  echo "  $0" >&2
  exit 1
fi

"$PYTHON" -m twine upload dist/yieldagentx402_langchain-* --non-interactive
echo "Published: https://pypi.org/project/yieldagentx402-langchain/"
