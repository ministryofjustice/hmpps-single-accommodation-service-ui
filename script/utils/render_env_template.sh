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
  local tmp_dir
  local tmp_rendered
  local template_basename
  local rendered_basename

  if [[ ! -f "$template_file" ]]; then
    echo "Template file '$template_file' does not exist." >&2
    exit 1
  fi

  if ! command -v op >/dev/null 2>&1; then
    echo "Cannot find 'op' (1Password cli). Please install it first." >&2
    exit 1
  fi

  # Create temp directory and set umask for secure file creation
  tmp_dir="$(mktemp -d)"
  trap "rm -rf '$tmp_dir'" RETURN
  template_basename="$(basename "$template_file")"
  rendered_basename="${template_basename%.tpl}"
  tmp_rendered="$tmp_dir/$rendered_basename"

  # Set restrictive umask so op inject creates the file with mode 600
  (
    umask 077
    op inject --account "$op_account" -i "$template_file" -o "$tmp_rendered" >/dev/null
  )
  inject_k8s_secrets "$tmp_rendered" "$k8s_namespace"

  # Move temp file to target and ensure restrictive permissions
  rm -f "$target_file"
  mv "$tmp_rendered" "$target_file"
  chmod 600 "$target_file"
}
