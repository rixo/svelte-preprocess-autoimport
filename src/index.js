import { parse, walk } from 'svelte/compiler'

const defaultConfig = {
  aliases: {
    onMount: 'svelte',
    beforeUpdate: 'svelte',
    afterUpdate: 'svelte',
    onDestroy: 'svelte',
    tick: 'svelte',
    setContext: 'svelte',
    getContext: 'svelte',
    createEventDispatcher: 'svelte',

    writable: 'svelte/store',
    readable: 'svelte/store',
    derived: 'svelte/store',
    get: 'svelte/store',

    tweened: 'svelte/motion',
    spring: 'svelte/motion',

    fade: 'svelte/transition',
    blur: 'svelte/transition',
    fly: 'svelte/transition',
    slide: 'svelte/transition',
    scale: 'svelte/transition',
    draw: 'svelte/transition',

    flip: 'svelte/animate',
  },
  createEventDispatcher: 'dispatch',
}

const parseAlias = (x, as) =>
  typeof x === 'string' ? { from: x, import: as, as } : { import: as, ...x, as }

const isDeclaration = (node, parent) => {
  if (!parent) return false
  switch (parent.type) {
    case 'VariableDeclarator':
      return true
    case 'ImportDefaultSpecifier':
    case 'ImportSpecifier':
      return parent.local.name === node.name
  }
  return false
}

const parseConfig = (arg = {}) => {
  if (typeof arg === 'function') {
    return arg(defaultConfig)
  }
  return {
    ...defaultConfig,
    ...arg,
  }
}

const createPreprocessor = ({
  aliases,
  createEventDispatcher,
} = defaultConfig) => ({
  markup: async ({ content, filename }) => {
    let code = content

    const ast = parse(content)

    const found = new Set()
    const excluded = {}

    const dispatches = []

    walk(ast, {
      enter(node, parent) {
        switch (node.type) {
          case 'Identifier': {
            const { name } = node
            if (isDeclaration(node, parent)) {
              excluded[name] = true
              break
            }
            if (
              createEventDispatcher === name &&
              !isDeclaration(node, parent)
            ) {
              dispatches.push(node)
              break
            }
            if (!aliases[name]) break
            if (!excluded[name]) found.add(name)
            break
          }
        }
      },
    })

    const statements = []

    const grouped = {}

    if (dispatches.length > 0) {
      grouped['svelte'] = ['createEventDispatcher']
      const targetName = createEventDispatcher.replace(/^(\$+)/, a =>
        '_'.repeat(a.length)
      )
      for (const { start, end, name } of dispatches) {
        code = code.slice(0, start) + targetName + code.slice(end)
      }
      statements.push(`const ${targetName} = createEventDispatcher()`)
    }

    // aliases
    if (found.size > 0) {
      for (const alias of found) {
        const { from, import: name, as } = parseAlias(aliases[alias], alias)
        if (!grouped[from]) grouped[from] = []
        grouped[from].push(name === as ? name : `${name} as ${as}`)
      }
    }

    if (Object.keys(grouped).length > 0) {
      statements.unshift(
        Object.entries(grouped)
          .map(
            ([from, names]) =>
              `import { ${names.sort().join(', ')} } from '${from}'`
          )
          .join('; ')
      )
    }

    if (statements.length > 0) {
      const target = ast.module || ast.instance

      const line = statements.join('; ') + ';'

      if (target) {
        code =
          code.slice(0, target.content.start) +
          line +
          code.slice(target.content.start)
      } else {
        code = code + `\n<script>${line}</script>`
      }
    }

    return { code, map: null }
  },
})

export default config => createPreprocessor(parseConfig(config))
