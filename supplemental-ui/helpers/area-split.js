/*
 * Copyright Alejandro Martínez Corriá and the Thinkube contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

// Splits an area page's contents at its Reference section, so the layout can
// place the area's playbook cards between the ideas and the reference links.
module.exports = (contents) => {
  const marker = '<div class="sect1">\n<h2 id="_reference">'
  const i = contents.indexOf(marker)
  if (i < 0) return { before: contents, after: '' }
  return { before: contents.slice(0, i), after: contents.slice(i) }
}
