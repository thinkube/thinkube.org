#!/usr/bin/env bash
# Copyright Alejandro Martínez Corriá and the Thinkube contributors
# SPDX-License-Identifier: Apache-2.0

# Copies the thinkube-style hexagon icons the site uses into
# supplemental-ui/img/icons/. The site does not build with thinkube-style, so
# the copies are committed; run this again after an icon changes there.
#
#   tools/sync-icons.sh <path to a thinkube-style checkout>

set -euo pipefail

style="${1:?usage: tools/sync-icons.sh <path to a thinkube-style checkout>}"
src="$style/public/icons"
[ -d "$src" ] || { echo "no icons at $src: is $style a thinkube-style checkout?" >&2; exit 1; }

dst="$(cd "$(dirname "$0")/.." && pwd)/supplemental-ui/img/icons"

icons=(
  # the four areas
  lucide/container tk_devops tk_ai tk_code
  # the page types: concept, playbook, reference
  chars/upper-c chars/upper-p chars/upper-r
)
# the AI loop and the playbook steps
for n in $(seq 1 30); do icons+=("chars/number-$n"); done

rm -rf "$dst"
for icon in "${icons[@]}"; do
  mkdir -p "$dst/$(dirname "$icon")"
  cp "$src/$icon.svg" "$dst/$icon.svg"
done
echo "copied ${#icons[@]} icons into $dst"
