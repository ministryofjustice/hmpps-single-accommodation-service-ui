#!/usr/bin/env bash

set -e
# shellcheck disable=SC3040
set -o pipefail

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
# shellcheck source=script/utils/render_env_template.sh
. "$SCRIPT_DIR"/utils/render_env_template.sh

repo_root="$(cd "$SCRIPT_DIR/.." && pwd)"
op_account="ministryofjustice.1password.eu"
k8s_namespace="hmpps-community-accommodation-dev"
date_suffix="$(date +%Y%m%d-%H%M%S)"

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
  render_env_template "$source_file" "$target_file" "$op_account" "$k8s_namespace"
done
