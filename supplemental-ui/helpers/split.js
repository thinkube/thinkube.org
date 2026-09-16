'use strict'

// Splits a comma-separated page attribute into its trimmed items:
// {{#each (split page.attributes.tags)}} … {{/each}}
module.exports = (text) => String(text).split(',').map((item) => item.trim()).filter(Boolean)
