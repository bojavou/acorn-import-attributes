import * as bundledAcorn from 'acorn'
import { keyword, keywordsRegexp } from './gear.mjs'
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
    constructor (options, input, startPos) {
      super(options, input, startPos)
      if (this.options.sourceType === 'module' && opener.assert) {
        // Add `assert` to keyword detection
        // `with` is already a keyword for other purposes
        keyword(acorn, 'assert')
        this.keywords = keywordsRegexp(this.keywords)
      }
    }

    isAttributesKeyword () {
      return (
        (opener.with && this.type === tt._with) ||
        (opener.assert && this.type === tt._assert)
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
      attribute.key = this.type === tt.num || this.type === tt.string
        ? this.parseExprAtom()
        : this.parseIdent(true)
      this.expect(tt.colon)
      if (!this.type === tt.string) this.unexpected()
      attribute.value = this.parseExprAtom()
      return this.finishNode(attribute, 'ImportAttribute')
    }

    parseMaybeWithClause (node) {
      node.attributes = []
      if (!this.isAttributesKeyword()) return
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
