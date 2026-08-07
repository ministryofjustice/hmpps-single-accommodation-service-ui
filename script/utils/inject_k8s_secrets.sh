#!/usr/bin/env bash

set -e
# shellcheck disable=SC3040
set -o pipefail
# Replace k8s secret placeholders in a rendered dotenv file.
#
# The target file should already contain literal values in the form
# `k8s://<secret-name>/<secret-key>`. Each matching value is replaced in place
# with the decoded value of `<secret-key>` from the named Kubernetes secret.
inject_k8s_secrets() {
  local target_file="$1"
  local k8s_namespace="$2"

  if ! command -v kubectl >/dev/null 2>&1; then
    echo "Cannot find 'kubectl'. Please install it first." >&2
    exit 1
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "Cannot find 'jq'. Please install it first." >&2
    exit 1
  fi

  if [[ ! -f "$target_file" ]]; then
    echo "Target file '$target_file' does not exist." >&2
    exit 1
  fi

  local refs
  mapfile -t refs < <(grep -oE "k8s://[^[:space:]\"']+/[^[:space:]\"']+" "$target_file" | sort -u || true)

  if [[ ${#refs[@]} -eq 0 ]]; then
    echo "No k8s secret references found in '$target_file'"
    return 0
  fi

  declare -A secret_cache=()

  for ref in "${refs[@]}"; do
    local reference="${ref#k8s://}"
    local secret_name="${reference%%/*}"
    local secret_key="${reference#*/}"
    local secret_json
    local secret_value

    if [[ -z "${secret_cache[$secret_name]+x}" ]]; then
      secret_cache[$secret_name]="$(kubectl get secret "$secret_name" --namespace "$k8s_namespace" -o json)"
    fi

    secret_json="${secret_cache[$secret_name]}"

    # Check key existence before decoding (empty values are valid)
    if ! jq -e --arg key "$secret_key" '.data[$key]' <<<"$secret_json" >/dev/null 2>&1; then
      echo "Unable to resolve '$ref' from secret '$secret_name' in namespace '$k8s_namespace'" >&2
      exit 1
    fi

    secret_value="$(jq -r --arg key "$secret_key" '.data[$key] | @base64d' <<<"$secret_json")"

    OLD_REF="$ref" NEW_VALUE="$secret_value" perl -0pi -e '
      my $old = $ENV{OLD_REF};
      my $new = $ENV{NEW_VALUE};
      s/\Q$old\E/$new/g;
    ' "$target_file"
  done
}
