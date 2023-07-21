# @bojavou/acorn-import-attributes

[Import attributes](https://github.com/tc39/proposal-import-attributes) for [acorn](https://github.com/acornjs/acorn).

Parses to the [experimental Import Attributes](https://github.com/estree/estree/blob/master/experimental/import-attributes.md) ESTree extension.

Supports both the `with` and deprecated `assert` keywords. Both are parsed to the same tree structure. A property `attributesKeyword` is added to expose which keyword was present in the source.

## Usage

```sh
npm install @bojavou/acorn-import-attributes
```

```js
import * as acorn from 'acorn'
import importAttributes from '@bojavou/acorn-import-attributes'

const Parser = acorn.Parser.extend(
  importAttributes({ with: true, assert: true })
)

const source = `
import config from 'config.json' with { type: 'json' }
`.trim()
const tree = Parser.parse(source, {
  ecmaVersion: 'latest',
  sourceType: 'module'
})
```

```
{
  type: 'Program',
  body: [{
    type: 'ImportDeclaration',
    specifiers: [..],
    source: ..,
    attributesKeyword: 'with',
    attributes: [{
      type: 'ImportAttribute',
      key: { type: 'Identifier', name: 'type' },
      value: { type: 'Literal', value: 'json' }
    }]
  }]
}
```

## API

### importAttributes([options])

The default export is a factory function which produces a plugin. Pass an options object to configure which keywords to recognize.

**Options**

| Name | Type | Description | Default |
| ---- | ---- | ----------- | ------- |
| `with` | `boolean` | Recognize `with` as an import attributes keyword. | `true` |
| `assert` | `boolean` | Recognize `assert` as an import attributes kwyrod. | `false` |


## ESTree

Extensions to the Import Attributes ESTree structure. `attributesKeyword` is `null` when no attributes are present.

### ImportDeclaration

```js
extend interface ImportDeclaration {
    attributesKeyword: "with" | "assert" | null;
}
```

### ExportNamedDeclaration

```js
extend interface ExportNamedDeclaration {
    attributesKeyword: "with" | "assert" | null;
}
```

### ExportAllDeclaration

```js
extend interface ExportAllDeclaration {
    attributesKeyword: "with" | "assert" | null;
}
```
