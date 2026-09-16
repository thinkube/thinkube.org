'use strict'

// The display name of an area id: {{area-name page.attributes.area}}.
const AREA_NAMES = {
  kubernetes: 'Thinkube Kubernetes',
  gitops: 'Thinkube GitOps',
  models: 'Thinkube Models',
  tandem: 'Thinkube Tandem',
}

module.exports = (area) => {
  const name = AREA_NAMES[area]
  if (!name) throw new Error(`area-name: "${area}" is not an area; use one of ${Object.keys(AREA_NAMES).join(', ')}`)
  return name
}
