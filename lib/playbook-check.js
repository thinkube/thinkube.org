'use strict'

// Antora extension: every page with `:page-type: playbook` must carry the card
// attributes and the Overview / Instructions / Troubleshooting shape. A page
// that does not is reported as an error naming the page and what it lacks;
// with `runtime.log.failure_level: warn` the build then fails.

const AREAS = ['kubernetes', 'gitops', 'models', 'tandem']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const RISKS = ['low', 'medium', 'high']

const REQUIRED_ATTRIBUTES = [
  'page-area', 'page-tagline', 'page-difficulty', 'page-time', 'page-risk',
  'page-tags', 'page-order', 'page-updated',
]

const SECTIONS = ['Overview', 'Instructions', 'Troubleshooting']

const OVERVIEW = [
  'Basic idea',
  'What you\'ll accomplish',
  'What to know before starting',
  'Supported hardware',
  'Prerequisites',
  'Time & risk',
]

function headings (html, level) {
  const found = []
  const pattern = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g')
  let match
  while ((match = pattern.exec(html))) {
    found.push(match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;/g, '\'').trim())
  }
  return found
}

function sectionBody (html, title) {
  const parts = html.split(/(?=<h2[\s>])/)
  const part = parts.find((chunk) => {
    const heading = /^<h2[^>]*>([\s\S]*?)<\/h2>/.exec(chunk)
    return heading && heading[1].replace(/<[^>]+>/g, '').trim() === title
  })
  return part || ''
}

function problemsOf (page) {
  const problems = []
  const a = page.asciidoc.attributes

  for (const name of REQUIRED_ATTRIBUTES) {
    if (!a[name] || !String(a[name]).trim()) problems.push(`attribute :${name}: is missing`)
  }
  if (a['page-area'] && !AREAS.includes(a['page-area'])) {
    problems.push(`:page-area: is "${a['page-area']}"; it must be one of ${AREAS.join(', ')}`)
  }
  if (a['page-difficulty'] && !DIFFICULTIES.includes(a['page-difficulty'])) {
    problems.push(`:page-difficulty: is "${a['page-difficulty']}"; it must be one of ${DIFFICULTIES.join(', ')}`)
  }
  if (a['page-risk'] && !RISKS.includes(a['page-risk'])) {
    problems.push(`:page-risk: is "${a['page-risk']}"; it must be one of ${RISKS.join(', ')}`)
  }
  if (a['page-time'] && !/^\d+(–\d+)? (min|h)$/.test(a['page-time'])) {
    problems.push(`:page-time: is "${a['page-time']}"; write a measured time such as "5 min", "3–4 min" or "2 h"`)
  }
  if (a['page-order'] && !/^\d+$/.test(a['page-order'])) {
    problems.push(`:page-order: is "${a['page-order']}"; it must be a whole number`)
  }
  if (a['page-updated'] && !/^\d{4}-\d{2}-\d{2}$/.test(a['page-updated'])) {
    problems.push(`:page-updated: is "${a['page-updated']}"; write the date as YYYY-MM-DD`)
  }

  const html = page.contents.toString()
  const h2 = headings(html, 2)
  if (h2.join('|') !== SECTIONS.join('|')) {
    problems.push(`the sections are [${h2.join(', ')}]; they must be exactly [${SECTIONS.join(', ')}]`)
    return problems
  }

  const overview = headings(sectionBody(html, 'Overview'), 3)
  if (overview.join('|') !== OVERVIEW.join('|')) {
    problems.push(`Overview has [${overview.join(', ')}]; it must have [${OVERVIEW.join(', ')}] in that order`)
  }

  const steps = headings(sectionBody(html, 'Instructions'), 3)
  steps.forEach((step, i) => {
    if (!step.startsWith(`Step ${i + 1}. `)) {
      problems.push(`Instructions heading "${step}" must start with "Step ${i + 1}. "`)
    }
  })
  const last = (steps[steps.length - 1] || '').replace(/^Step \d+\. /, '')
  if (last !== 'Next steps') {
    problems.push('Instructions must end with the step "Next steps"')
  }

  if (!/<table/.test(sectionBody(html, 'Troubleshooting'))) {
    problems.push('Troubleshooting must hold a Symptom | Cause | Fix table')
  }
  return problems
}

module.exports.register = function register () {
  const logger = this.getLogger('playbook-check')
  this.on('documentsConverted', ({ contentCatalog }) => {
    for (const page of contentCatalog.getPages((p) => p.out)) {
      if (!page.asciidoc || page.asciidoc.attributes['page-type'] !== 'playbook') continue
      for (const problem of problemsOf(page)) {
        logger.error({ file: page.src }, `playbook ${page.src.module}:${page.src.relative}: ${problem}`)
      }
    }
  })
}
