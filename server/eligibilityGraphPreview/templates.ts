import nunjucks from 'nunjucks'

declare const statusCardPreviewTemplates: ConstructorParameters<typeof nunjucks.PrecompiledLoader>[0]

class PreviewLoader extends nunjucks.PrecompiledLoader {
  // The browser runtime does not include Node's path module for relative GOV.UK imports.
  resolve(parent: string, name: string): string {
    const parts = parent.split('/')
    parts.pop()
    name.split('/').forEach(part => {
      if (part === '..') parts.pop()
      else if (part !== '.') parts.push(part)
    })
    return parts.join('/')
  }
}

let environment: nunjucks.Environment

// eslint-disable-next-line import/prefer-default-export
export const nunjucksInline = () => {
  if (!environment) {
    environment = new nunjucks.Environment(new PreviewLoader(statusCardPreviewTemplates), { autoescape: true })
  }
  return {
    // Inline macro wrappers are compiled by the generator, not by the browser runtime.
    renderString: (source: string, context: object): string => environment.render(`inline:${source}`, context),
  }
}
