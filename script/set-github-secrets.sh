#!/usr/bin/env bash

set -e
# shellcheck disable=SC3040
set -o pipefail

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

# shellcheck source=script/utils/render_env_template.sh
. "$SCRIPT_DIR"/utils/render_env_template.sh

repo_root="$(cd "$SCRIPT_DIR/.." && pwd)"

OP_ACCOUNT="ministryofjustice.1password.eu"
K8S_NAMESPACE="hmpps-community-accommodation-dev"
GITHUB_REPO="ministryofjustice/hmpps-single-accommodation-service-ui"
dry_run=false

for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)
      dry_run=true
      ;;
    --help|-h)
      echo "Usage: script/set-github-secrets.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: script/set-github-secrets.sh [--dry-run]" >&2
      exit 1
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "Cannot find 'gh'. Please install GitHub CLI first." >&2
  exit 1
fi

if [[ "$dry_run" != true ]] && ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

shopt -s nullglob
template_files=("$repo_root"/.env*.tpl)

if [[ ${#template_files[@]} -eq 0 ]]; then
  echo "No .env*.tpl files found"
  exit 0
fi

declare -A secret_values=()
tmp_dirs=()

cleanup() {
  if [[ ${#tmp_dirs[@]} -gt 0 ]]; then
    rm -rf "${tmp_dirs[@]}"
  fi
}
trap cleanup EXIT

for template_file in "${template_files[@]}"; do
  tmp_dir="$(mktemp -d)"
  tmp_dirs+=("$tmp_dir")
  tmp_rendered="$tmp_dir/rendered.env"

  render_env_template "$template_file" "$tmp_rendered" "$OP_ACCOUNT" "$K8S_NAMESPACE"

  # Extract variable names marked with GH_SECRET from the template file
  # and resolve their values from the rendered env file via source
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Check if line contains GH_SECRET marker
    if [[ "$line" =~ GH_SECRET[:/]([A-Za-z0-9_]+) ]]; then
      prefix="${BASH_REMATCH[1]}"
    else
      continue
    fi

    # Extract variable name (everything before first '=' character)
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
      var_name="${BASH_REMATCH[1]}"
    else
      continue
    fi

    # Source the rendered file and get the variable's value
    var_value=$( (source "$tmp_rendered" 2>/dev/null; eval "printf '%s' \"\${$var_name:-}\"") )

    secret_name="${prefix}_${var_name}"
    secret_values["$secret_name"]="$var_value"
  done < "$template_file"
done

if [[ ${#secret_values[@]} -eq 0 ]]; then
  echo "No GH_SECRET markers found in .env*.tpl files"
  exit 0
fi

echo "==> Setting GitHub secrets in '$GITHUB_REPO'"

for secret_name in "${!secret_values[@]}"; do
  if [[ "$dry_run" == true ]]; then
    echo "Would set secret '$secret_name'"
    continue
  fi

  gh secret set "$secret_name" --repo "$GITHUB_REPO" --body "${secret_values[$secret_name]}"
  echo "Set '$secret_name'"
done
