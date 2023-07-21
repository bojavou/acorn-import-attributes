import test from 'ava'
import * as acorn from 'acorn'
import factory from '#lib/factory.mjs'

const options = { ecmaVersion: 'latest', sourceType: 'module' }

function extend (options) {
  const plugin = factory(options)
  const Parser = acorn.Parser.extend(plugin)
  return Parser
}

test('extend', t => {
  const Parser = extend()
  t.is(Object.getPrototypeOf(Parser), acorn.Parser)
})

test('es5', t => {
  const Parser = extend()
  const source = `
var a = 1
`.trim()
  const tree = Parser.parse(source, { ecmaVersion: 5 })
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'VariableDeclaration',
      declarations: [{
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'a' },
        init: { type: 'Literal', value: 1 }
      }],
      kind: 'var'
    }]
  })
})

test('import absent', t => {
  const Parser = extend()
  const source = `
import gadget from 'gadget'
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      attributes: []
    }]
  })
})

test('import with', t => {
  const Parser = extend()
  const source = `
import gadget from 'gadget' with {
  1: 'value1',
  two: 'value2',
  'three': 'value3',
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('import assert', t => {
  const Parser = extend({ assert: true })
  const source = `
import gadget from 'gadget' assert {
  1: 'value1',
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('import string', t => {
  const Parser = extend()
  const source = `
import { 'string name' as gadget } from 'gadget' with { attribute: 'value' }
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      specifiers: [{
        imported: { type: 'Literal', value: 'string name' },
        local: { type: 'Identifier', name: 'gadget' }
      }],
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
    }]
  })
})

test('import call absent', t => {
  const Parser = extend()
  const source = `
import('gadget')
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExpressionStatement',
      expression: {
        type: 'ImportExpression',
        source: { type: 'Literal', value: 'gadget' },
        options: null
      }
    }]
  })
})

test('import call absent trail', t => {
  const Parser = extend()
  const source = `
import('gadget',)
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExpressionStatement',
      expression: {
        type: 'ImportExpression',
        source: { type: 'Literal', value: 'gadget' },
        options: null
      }
    }]
  })
})

test('import call literal', t => {
  const Parser = extend()
  const source = `
import('gadget', { a: 1, b: 2, c: 3 })
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExpressionStatement',
      expression: {
        type: 'ImportExpression',
        source: { type: 'Literal', value: 'gadget' },
        options: {
          properties: [{
            key: { type: 'Identifier', name: 'a' },
            value: { type: 'Literal', value: 1 }
          }, {
            key: { type: 'Identifier', name: 'b' },
            value: { type: 'Literal', value: 2 }
          }, {
            key: { type: 'Identifier', name: 'c' },
            value: { type: 'Literal', value: 3 }
          }]
        }
      }
    }]
  })
})

test('import call variable', t => {
  const Parser = extend()
  const source = `
const options = {}
import('gadget', options)
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'VariableDeclaration',
      declarations: [{
        id: { type: 'Identifier', name: 'options' },
        init: { type: 'ObjectExpression' }
      }]
    }, {
      type: 'ExpressionStatement',
      expression: {
        type: 'ImportExpression',
        source: { type: 'Literal', value: 'gadget' },
        options: { type: 'Identifier', name: 'options' }
      }
    }]
  })
})

test('import call present trail', t => {
  const Parser = extend()
  const source = `
const options = {}
import('gadget', options,)
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'VariableDeclaration',
      declarations: [{
        id: { type: 'Identifier', name: 'options' },
        init: { type: 'ObjectExpression' }
      }]
    }, {
      type: 'ExpressionStatement',
      expression: {
        type: 'ImportExpression',
        source: { type: 'Literal', value: 'gadget' },
        options: { type: 'Identifier', name: 'options' }
      }
    }]
  })
})

test('export wildcard absent', t => {
  const Parser = extend()
  const source = `
export * from 'gadget'
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: null,
      source: { type: 'Literal', value: 'gadget' },
      attributes: []
    }]
  })
})

test('export wildcard with', t => {
  const Parser = extend()
  const source = `
export * from 'gadget' with {
  1: 'value1',
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: null,
      source: { type: 'Literal', value: 'gadget' },
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export wildcard assert', t => {
  const Parser = extend({ assert: true })
  const source = `
export * from 'gadget' assert {
  1: 'value1',
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: null,
      source: { type: 'Literal', value: 'gadget' },
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export namespace absent', t => {
  const Parser = extend()
  const source = `
export * as gadget from 'gadget'
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: { type: 'Identifier', name: 'gadget' },
      source: { type: 'Literal', value: 'gadget' },
      attributes: []
    }]
  })
})

test('export namespace with', t => {
  const Parser = extend()
  const source = `
export * as gadget from 'gadget' with {
  1: 'value1',
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: { type: 'Identifier', name: 'gadget' },
      source: { type: 'Literal', value: 'gadget' },
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export namespace assert', t => {
  const Parser = extend({ assert: true })
  const source = `
export * as gadget from 'gadget' assert {
  1: 'value1',
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: { type: 'Identifier', name: 'gadget' },
      source: { type: 'Literal', value: 'gadget' },
      attributes: [{
        key: { type: 'Literal', value: 1 },
        value: { type: 'Literal', value: 'value1' }
      }, {
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export namespace string', t => {
  const Parser = extend()
  const source = `
export * as 'string name' from 'gadget' with { attribute: 'value' }
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportAllDeclaration',
      exported: { type: 'Literal', value: 'string name' },
      source: { type: 'Literal', value: 'gadget' },
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
    }]
  })
})
