/* eslint-disable import/no-extraneous-dependencies, no-console */
const fs = require('node:fs/promises')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const esbuild = require('esbuild')
const nunjucks = require('nunjucks')
const prettier = require('prettier')
const { sassPlugin } = require('esbuild-sass-plugin')
const { PurgeCSS } = require('purgecss')
const ts = require('typescript')

const root = path.resolve(__dirname, '../..')

async function generate() {
  const templates = new Map()
  const loader = new nunjucks.FileSystemLoader([
    path.join(root, 'server/views'),
    path.join(root, 'node_modules/govuk-frontend/dist'),
  ])
  function collect(name) {
    if (templates.has(name)) return
    const template = loader.getSource(name)
    if (!template) throw new Error(`Missing preview template: ${name}`)
    templates.set(name, template.src)
    const ast = nunjucks.parser.parse(template.src)
    const dependencies = [
      nunjucks.nodes.Import,
      nunjucks.nodes.FromImport,
      nunjucks.nodes.Extends,
      nunjucks.nodes.Include,
    ]
    dependencies
      .flatMap(node => ast.findAll(node))
      .forEach(node => {
        if (!(node.template instanceof nunjucks.nodes.Literal) || typeof node.template.value !== 'string') {
          throw new Error(`Dynamic preview template dependency in ${name}`)
        }
        const dependency = node.template.value
        collect(dependency.startsWith('.') ? path.posix.join(path.posix.dirname(name), dependency) : dependency)
      })
  }
  // First discard unused server exports before resolving browser dependencies.
  const shared = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ['server/eligibilityGraphPreview/statusCardPreview.ts'],
    bundle: true,
    write: false,
    platform: 'node',
    packages: 'external',
    format: 'esm',
    plugins: [
      {
        name: 'preview-infrastructure',
        setup(build) {
          build.onResolve({ filter: /.*/ }, async args => {
            if (args.pluginData && args.pluginData.resolved) return undefined
            const resolved = await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              kind: args.kind,
              pluginData: { resolved: true },
            })
            if (resolved.errors.length) return { errors: resolved.errors }
            const replacements = {
              [path.join(root, 'server/config.ts')]: 'config.ts',
              [path.join(root, 'server/utils/nunjucksSetup.ts')]: 'templates.ts',
              [path.join(root, 'logger.ts')]: 'diagnostics.ts',
            }
            return {
              path: replacements[resolved.path]
                ? path.join(root, 'server/eligibilityGraphPreview', replacements[resolved.path])
                : resolved.path,
              external: resolved.external,
              sideEffects: false,
            }
          })
        },
      },
    ],
  })
  // Discover inline renderers by their Nunjucks call, not the helper's name or arrow-function shape.
  const renderers = new Map()
  const sharedSource = ts.createSourceFile('preview.js', shared.outputFiles[0].text, ts.ScriptTarget.Latest, true)
  function findRenderers(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'renderString' &&
      node.arguments[0] &&
      ts.isTemplateExpression(node.arguments[0])
    ) {
      let owner = node.parent
      while (
        owner &&
        !ts.isArrowFunction(owner) &&
        !ts.isFunctionExpression(owner) &&
        !ts.isFunctionDeclaration(owner)
      ) {
        owner = owner.parent
      }
      const name = owner && ts.isFunctionDeclaration(owner) ? owner.name : owner && owner.parent && owner.parent.name
      const parameter = owner && owner.parameters && owner.parameters[0] && owner.parameters[0].name
      if (!name || !ts.isIdentifier(name) || !parameter || !ts.isIdentifier(parameter)) {
        throw new Error('Preview inline renderers must be named functions with a macro-name parameter')
      }
      renderers.set(name.text, { wrapper: node.arguments[0], parameter: parameter.text })
    }
    ts.forEachChild(node, findRenderers)
  }
  findRenderers(sharedSource)
  const inlineTemplates = new Map()
  function findMacros(node) {
    const renderer =
      ts.isCallExpression(node) && ts.isIdentifier(node.expression) && renderers.get(node.expression.text)
    if (renderer) {
      if (!node.arguments[0] || !ts.isStringLiteral(node.arguments[0])) {
        throw new Error('Preview macro names must be static strings')
      }
      const name = node.arguments[0].text
      const source =
        renderer.wrapper.head.text +
        renderer.wrapper.templateSpans
          .map(span => {
            if (!ts.isIdentifier(span.expression) || span.expression.text !== renderer.parameter) {
              throw new Error('Unsupported inline macro wrapper interpolation')
            }
            return name + span.literal.text
          })
          .join('')
      inlineTemplates.set(source, name)
    }
    ts.forEachChild(node, findMacros)
  }
  findMacros(sharedSource)
  if (!inlineTemplates.size) throw new Error('No preview inline macro wrappers found in the UI bundle')
  inlineTemplates.forEach((name, source) => {
    templates.set(`inline:${source}`, source)
    const ast = nunjucks.parser.parse(source)
    const imports = [...ast.findAll(nunjucks.nodes.FromImport), ...ast.findAll(nunjucks.nodes.Import)]
    if (!imports.length) throw new Error(`Missing template import in inline macro: ${name}`)
    imports.forEach(node => {
      if (!(node.template instanceof nunjucks.nodes.Literal) || typeof node.template.value !== 'string') {
        throw new Error(`Dynamic template import in inline macro: ${name}`)
      }
      collect(node.template.value)
    })
  })
  const compiledTemplates = []
  const templateSources = [...templates]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, source]) => {
      const compiled = nunjucks.precompileString(source, {
        name,
        wrapper: entries => `(function() { ${entries[0].template} })()`,
      })
      compiledTemplates.push(`${JSON.stringify(name)}: ${compiled}`)
      return `/* Source: ${name}\n${source.replace(/\*\//g, '* /')}\n*/`
    })
    .join('\n\n')

  const compactTemplates = await esbuild.transform(
    `const statusCardPreviewTemplates = {${compiledTemplates.join(',\n')}};`,
    { minifyWhitespace: true, minifySyntax: true, target: 'es2020', supported: { 'template-literal': false } },
  )
  const dependencies = new Map()
  sharedSource.statements.filter(ts.isImportDeclaration).forEach(statement => {
    const name = statement.moduleSpecifier.text
    if (name === '@sentry/node') return
    const index = dependencies.size
    const exports = []
    if (statement.importClause.name)
      exports.push(`export default StatusCardPreviewDependencies.dependency${index}.default;`)
    const bindings = statement.importClause.namedBindings
    if (bindings) {
      if (!ts.isNamedImports(bindings)) throw new Error(`Unsupported preview dependency import: ${name}`)
      bindings.elements.forEach(binding => {
        const exported = (binding.propertyName || binding.name).text
        exports.push(`export const ${exported} = StatusCardPreviewDependencies.dependency${index}.${exported};`)
      })
    }
    dependencies.set(name, { index, exports: exports.join('\n') })
  })
  const runtime = await esbuild.build({
    stdin: {
      contents: [...dependencies]
        .map(
          ([name, { index }]) =>
            `import * as dependency${index} from ${JSON.stringify(name)}; export {dependency${index}};`,
        )
        .join('\n'),
      resolveDir: root,
    },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    globalName: 'StatusCardPreviewDependencies',
    target: 'es2020',
    supported: { 'template-literal': false },
    minify: true,
    alias: { nunjucks: 'nunjucks/browser/nunjucks-slim' },
  })
  const browser = await esbuild.build({
    stdin: { contents: shared.outputFiles[0].text, resolveDir: root },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    globalName: 'StatusCardPreview',
    target: 'es2020',
    alias: {
      '@sentry/node': './server/eligibilityGraphPreview/diagnostics.ts',
    },
    plugins: [
      {
        name: 'compact-preview-dependencies',
        setup(build) {
          build.onResolve({ filter: /.*/ }, args =>
            dependencies.has(args.path) ? { path: args.path, namespace: 'preview-dependency' } : undefined,
          )
          build.onLoad({ filter: /.*/, namespace: 'preview-dependency' }, args => ({
            contents: dependencies.get(args.path).exports,
          }))
        },
      },
    ],
  })
  const styles = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ['server/eligibilityGraphPreview/styles.scss'],
    bundle: true,
    write: false,
    plugins: [sassPlugin({ quietDeps: true, loadPaths: [path.join(root, 'node_modules')] })],
  })
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const [prunedStyles] = await new PurgeCSS().purge({
    content: [{ raw: [...templates.values(), shared.outputFiles[0].text].join('\n'), extension: 'html' }],
    css: [{ raw: styles.outputFiles[0].text }],
    defaultExtractor: content => content.match(/[\w!:/.-]+/g) || [],
    // Tags have dynamic colour suffixes; the other names are graph-owned containers.
    safelist: ['panel', 'result', 'trace-update', 'aria-disabled', /^govuk-tag/],
  })
  const script = `/* Original template sources */
${templateSources}
/* Readable UI logic and graph integration */
${browser.outputFiles[0].text}
function statusCardPreview(outcome, failureReasons) {
  return StatusCardPreview.statusCardPreview(outcome, failureReasons, data.statuses);
}
function statusActionPreview(outcome) {
  return StatusCardPreview.statusActionPreview(outcome, data.statuses);
}
function statusCardTag(outcome) {
  return StatusCardPreview.statusCardTag(outcome, data.statuses);
}`
  const html = `<!-- Generated by npm run generate:status-card-preview from UI commit ${revision}. Do not edit. -->
<style>${prunedStyles.css.replace(/<\/style/gi, '<\\/style')}</style>
<script>/* Compact third-party runtime: Nunjucks slim and URL path helpers. */
__COMPACT_RUNTIME__
/* Compact compiled templates; original sources are retained below. */
__COMPACT_TEMPLATES__
${script.replace(/<\/script/gi, '<\\/script')}</script>
`
  const output = path.join(root, 'dist/status-card-preview.html')
  await fs.mkdir(path.dirname(output), { recursive: true })
  const formattedHtml = await prettier.format(html, {
    parser: 'html',
    printWidth: 120,
    singleQuote: true,
    htmlWhitespaceSensitivity: 'ignore',
  })
  const formatted = formattedHtml
    .replace('__COMPACT_RUNTIME__', () => runtime.outputFiles[0].text.trim().replace(/<\/script/gi, '<\\/script'))
    .replace('__COMPACT_TEMPLATES__', () => compactTemplates.code.trim().replace(/<\/script/gi, '<\\/script'))
  await fs.writeFile(output, formatted)
  console.log(`Generated ${output} (${Buffer.byteLength(formatted)} bytes, ${formatted.split('\n').length} lines)`)
}

generate().catch(error => {
  console.error(error)
  process.exitCode = 1
})
