import * as bundledAcorn from 'acorn'
import { InvalidError } from './error.mjs'

const empty = []

function importAttributesPlugin (options, Parser) {
  // Engine
  const acorn = Parser.acorn ?? bundledAcorn
  const { tokTypes: tt } = acorn

  // Options
  const opener = Object.create(null)
  opener.with = Boolean(options.with ?? true)
  opener.assert = Boolean(options.assert ?? false)
  if (!(opener.with || opener.assert)) {
    const message = 'Invalid options: 1+ of with/assert must be enabled'
    throw new InvalidError(message)
  }

  // Extended parser
  class ImportAttributesParser extends Parser {
    isAttributesKeyword () {
      return (
        (opener.with && this.type === tt._with) ||
        (opener.assert && this.isContextual('assert'))
      )
    }

    parseDynamicImport (node) {
      this.next() // skip `(`
      node.source = this.parseMaybeAssign()
      if (this.eat(tt.comma) && this.type !== tt.parenR) {
        node.options = this.parseMaybeAssign()
        this.eat(tt.comma)
      } else node.options = null
      this.expect(tt.parenR)
      return this.finishNode(node, 'ImportExpression')
    }

    parseExport (node, exports) {
      this.next()
      // export * from '...'
      if (this.eat(tt.star)) {
        return this.parseExportAllDeclaration(node, exports)
      }
      if (this.eat(tt._default)) { // export default ...
        this.checkExport(exports, 'default', this.lastTokStart)
        node.declaration = this.parseExportDefaultDeclaration()
        return this.finishNode(node, 'ExportDefaultDeclaration')
      }
      node.attributesKeyword = null
      node.attributes = []
      // export var|const|let|function|class ...
      if (this.shouldParseExportStatement()) {
        node.declaration = this.parseExportDeclaration(node)
        if (node.declaration.type === 'VariableDeclaration') {
          this.checkVariableExport(exports, node.declaration.declarations)
        } else {
          this.checkExport(
            exports, node.declaration.id, node.declaration.id.start)
        }
        node.specifiers = []
        node.source = null
      } else { // export { x, y as z } [from '...']
        node.declaration = null
        node.specifiers = this.parseExportSpecifiers(exports)
        if (this.eatContextual('from')) {
          if (this.type !== tt.string) this.unexpected()
          node.source = this.parseExprAtom()
          this.parseMaybeWithClause(node)
        } else {
          for (const spec of node.specifiers) {
            // check for keywords used as local names
            this.checkUnreserved(spec.local)
            // check if export is defined
            this.checkLocalExport(spec.local)
            if (spec.local.type === 'Literal') {
              const message = 'A string literal cannot be used' +
                ' as an exported binding without `from`.'
              this.raise(spec.local.start, message)
            }
          }
          node.source = null
        }
        this.semicolon()
      }
      return this.finishNode(node, 'ExportNamedDeclaration')
    }

    parseExportAllDeclaration (node, exports) {
      if (this.options.ecmaVersion >= 11) {
        if (this.eatContextual('as')) {
          node.exported = this.parseModuleExportName()
          this.checkExport(exports, node.exported, this.lastTokStart)
        } else node.exported = null
      }
      this.expectContextual('from')
      if (this.type !== tt.string) this.unexpected()
      node.source = this.parseExprAtom()
      this.parseMaybeWithClause(node)
      this.semicolon()
      return this.finishNode(node, 'ExportAllDeclaration')
    }

    parseImport (node) {
      this.next()

      // import '...'
      if (this.type === tt.string) {
        node.specifiers = empty
        node.source = this.parseExprAtom()
      } else {
        node.specifiers = this.parseImportSpecifiers()
        this.expectContextual('from')
        node.source = this.type === tt.string
          ? this.parseExprAtom()
          : this.unexpected()
      }
      this.parseMaybeWithClause(node)
      this.semicolon()
      return this.finishNode(node, 'ImportDeclaration')
    }

    parseImportAttribute () {
      const attribute = this.startNode()
      attribute.key = this.type === tt.string
        ? this.parseExprAtom()
        : this.parseIdent(true)
      this.expect(tt.colon)
      if (!this.type === tt.string) this.unexpected()
      attribute.value = this.parseExprAtom()
      return this.finishNode(attribute, 'ImportAttribute')
    }

    parseMaybeWithClause (node) {
      node.attributesKeyword = null
      node.attributes = []
      if (!this.isAttributesKeyword()) return
      node.attributesKeyword = this.type === tt._with ? 'with' : 'assert'
      this.next() // skip `with` or `assert`
      this.expect(tt.braceL)
      let first = true
      while (!this.eat(tt.braceR)) {
        if (first) first = false
        else {
          this.eat(tt.comma)
          if (this.afterTrailingComma(tt.braceR)) break
        }
        const attribute = this.parseImportAttribute()
        node.attributes.push(attribute)
      }
    }
  }

  // Return extended parser
  return ImportAttributesParser
}

export default importAttributesPlugin
