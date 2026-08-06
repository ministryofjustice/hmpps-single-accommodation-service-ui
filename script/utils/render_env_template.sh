#!/usr/bin/env bash

set -e
# shellcheck disable=SC3040
set -o pipefail

SCRIPT_UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=script/utils/inject_k8s_secrets.sh
. "$SCRIPT_UTILS_DIR"/inject_k8s_secrets.sh

render_env_template() {
  local template_file="$1"
  local target_file="$2"
  local op_account="$3"
  local k8s_namespace="$4"

  if [[ ! -f "$template_file" ]]; then
    echo "Template file '$template_file' does not exist." >&2
    exit 1
  fi

  if ! command -v op >/dev/null 2>&1; then
    echo "Cannot find 'op'. Please install it first." >&2
    exit 1
  fi

  op inject --account "$op_account" -i "$template_file" -o "$target_file"
  inject_k8s_secrets "$target_file" "$k8s_namespace"
}
