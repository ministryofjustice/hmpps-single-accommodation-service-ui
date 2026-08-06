#!/usr/bin/env bash

set -e
# shellcheck disable=SC3040
set -o pipefail

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
# shellcheck source=script/utils/inject_k8s_secrets.sh
. "$SCRIPT_DIR"/utils/inject_k8s_secrets.sh

repo_root="$(cd "$SCRIPT_DIR/.." && pwd)"
op_account="ministryofjustice.1password.eu"
k8s_namespace="hmpps-community-accommodation-dev"
date_suffix="$(date +%Y%m%d-%H%M%S)"

if ! command -v op >/dev/null 2>&1; then
  echo "Cannot find 'op'. Please install it first." >&2
  exit 1
fi

shopt -s nullglob

source_files=("$repo_root"/.env*.tpl)

if [[ ${#source_files[@]} -eq 0 ]]; then
  echo "No .env*.tpl files found"
  exit 0
fi

echo "==> Creating dotenv files"

for source_file in "${source_files[@]}"; do
  target_file="${source_file%.tpl}"

  if [[ -f "$target_file" ]]; then
    backup_file="$target_file.backup-$date_suffix"

    echo "Backing up '$target_file' to '$backup_file'"
    cp -p "$target_file" "$backup_file"
    rm -f "$target_file"
  fi

  echo "Rendering '$source_file' to '$target_file'"
  op inject --account "$op_account" -i "$source_file" -o "$target_file"
  inject_k8s_secrets "$target_file" "$k8s_namespace"
done
