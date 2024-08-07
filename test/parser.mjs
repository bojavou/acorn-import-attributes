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
      attributesKeyword: null,
      attributes: []
    }]
  })
})

test('import number key', t => {
  const Parser = extend()
  const source = `
import gadget from 'gadget' with { 1: 'value' }
`.trim()
  t.throws(() => { Parser.parse(source, options) })
})

test('import bigint key', t => {
  const Parser = extend()
  const source = `
import gadget from 'gadget' with { 1n: 'value' }
`.trim()
  t.throws(() => { Parser.parse(source, options) })
})

test('import with', t => {
  const Parser = extend()
  const source = `
import gadget from 'gadget' with {
  two: 'value2',
  'three': 'value3',
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      attributesKeyword: 'with',
      attributes: [{
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
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      attributesKeyword: 'assert',
      attributes: [{
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
      attributesKeyword: 'with',
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
    }]
  })
})

test('import default+named', t => {
  const Parser = extend()
  const source = `
import gadget, { widget } from 'gadget' with { attribute: 'value' }
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      specifiers: [{
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: 'gadget' }
      }, {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: 'widget' },
        local: { type: 'Identifier', name: 'widget' }
      }],
      attributesKeyword: 'with',
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
    }]
  })
})

test('import default+namespace', t => {
  const Parse = extend()
  const source = `
import gadget, * as module from 'gadget' with { attribute: 'value' }
`.trim()
  const tree = Parse.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ImportDeclaration',
      specifiers: [{
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: 'gadget' }
      }, {
        type: 'ImportNamespaceSpecifier',
        local: { type: 'Identifier', name: 'module' }
      }],
      attributesKeyword: 'with',
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

test('export named absent', t => {
  const Parser = extend()
  const source = `
export { gadget } from 'gadget'
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportNamedDeclaration',
      specifiers: [{
        local: { type: 'Identifier', name: 'gadget' },
        exported: { type: 'Identifier', name: 'gadget' }
      }],
      attributesKeyword: null,
      attributes: []
    }]
  })
})

test('export named with', t => {
  const Parser = extend()
  const source = `
export { gadget } from 'gadget' with {
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportNamedDeclaration',
      specifiers: [{
        local: { type: 'Identifier', name: 'gadget' },
        exported: { type: 'Identifier', name: 'gadget' }
      }],
      attributesKeyword: 'with',
      attributes: [{
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export named assert', t => {
  const Parser = extend({ assert: true })
  const source = `
export { gadget } from 'gadget' assert {
  two: 'value2',
  'three': 'value3'
}
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportNamedDeclaration',
      specifiers: [{
        local: { type: 'Identifier', name: 'gadget' },
        exported: { type: 'Identifier', name: 'gadget' }
      }],
      attributesKeyword: 'assert',
      attributes: [{
        key: { type: 'Identifier', name: 'two' },
        value: { type: 'Literal', value: 'value2' }
      }, {
        key: { type: 'Literal', value: 'three' },
        value: { type: 'Literal', value: 'value3' }
      }]
    }]
  })
})

test('export named string', t => {
  const Parser = extend()
  const source = `
export { 'string name' } from 'gadget' with { attribute: 'value' }
`.trim()
  const tree = Parser.parse(source, options)
  t.like(tree, {
    type: 'Program',
    body: [{
      type: 'ExportNamedDeclaration',
      specifiers: [{
        local: { type: 'Literal', value: 'string name' },
        exported: { type: 'Literal', value: 'string name' }
      }],
      attributesKeyword: 'with',
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
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
      attributesKeyword: null,
      attributes: []
    }]
  })
})

test('export wildcard with', t => {
  const Parser = extend()
  const source = `
export * from 'gadget' with {
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
      attributesKeyword: 'with',
      attributes: [{
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
      attributesKeyword: 'assert',
      attributes: [{
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
      attributesKeyword: null,
      attributes: []
    }]
  })
})

test('export namespace with', t => {
  const Parser = extend()
  const source = `
export * as gadget from 'gadget' with {
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
      attributesKeyword: 'with',
      attributes: [{
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
      attributesKeyword: 'assert',
      attributes: [{
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
      attributesKeyword: 'with',
      attributes: [{
        key: { type: 'Identifier', name: 'attribute' },
        value: { type: 'Literal', value: 'value' }
      }]
    }]
  })
})

test('assert variable', t => {
  const Parser = extend({ assert: true })
  const source = `
const assert = null
`.trim()
  t.notThrows(() => { Parser.parse(source, options) })
})

test('assert function', t => {
  const Parser = extend({ assert: true })
  const source = `
function assert () {}
`.trim()
  t.notThrows(() => { Parser.parse(source, options) })
})

test('assert class', t => {
  const Parser = extend({ assert: true })
  const source = `
class assert {}
`.trim()
  t.notThrows(() => { Parser.parse(source, options) })
})
