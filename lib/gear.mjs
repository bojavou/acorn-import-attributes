export function keyword (acorn, name) {
  const options = { keyword: name }
  const type = new acorn.TokenType(name, options)
  acorn.tokTypes[`_${name}`] = type
  acorn.keywordTypes[name] = type
  return type
}

export function keywordsRegexp (present) {
  const string = present.toString()
  const essence = string.slice(5, -3)
  const extended = `^(?:${essence}|assert)$`
  return new RegExp(extended)
}
