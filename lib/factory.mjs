import importAttributesPlugin from '#lib/plugin.mjs'

function importAttributesPluginFactory (options = {}) {
  return importAttributesPlugin.bind(undefined, options)
}

export default importAttributesPluginFactory
