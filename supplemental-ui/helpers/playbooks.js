'use strict'

// Lists every playbook page of the site for the card catalog.
//
//   {{#each (playbooks)}} … {{/each}}             every playbook
//   {{#each (playbooks area="gitops")}} … {{/each}} one area
//   {{#each (playbooks featured=true)}} … {{/each}} the featured one of each area
//
// A playbook is a page with `:page-type: playbook`. Its card fields are the
// page-* attributes the style guide lists; lib/playbook-check.js fails the
// build when one is missing or invalid, so this helper reads them as they are.

const AREA_ORDER = ['kubernetes', 'gitops', 'models', 'tandem']

module.exports = (options) => {
  const { data: { root }, hash } = options
  const pages = root.contentCatalog
    .findBy({ family: 'page' })
    .filter((page) => page.asciidoc && page.asciidoc.attributes['page-type'] === 'playbook')
    .map((page) => {
      const a = page.asciidoc.attributes
      return {
        title: page.asciidoc.doctitle,
        url: page.pub.url,
        area: a['page-area'],
        tagline: a['page-tagline'],
        difficulty: a['page-difficulty'],
        time: a['page-time'],
        tags: a['page-tags'].split(',').map((tag) => tag.trim()).slice(0, 3),
        order: Number(a['page-order']),
        featured: a['page-featured'] === 'true',
        updated: a['page-updated'],
      }
    })
    .filter((card) => !hash.area || card.area === hash.area)
    .filter((card) => !hash.featured || card.featured)
  return pages.sort((x, y) =>
    AREA_ORDER.indexOf(x.area) - AREA_ORDER.indexOf(y.area) || x.order - y.order)
}
