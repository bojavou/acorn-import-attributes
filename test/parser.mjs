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
