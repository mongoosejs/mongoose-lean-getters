'use strict';

const mpath = require('mpath');

module.exports = function mongooseLeanGetters(schema) {
  const fn = applyGettersMiddleware(schema);
  // Use `pre('find')` so this also works with `cursor()`
  // and `eachAsync()`, because those do not call `post('find')`
  schema.pre('find', function() {
    if (typeof this.map === 'function') {
      this.map((res) => {
        fn.call(this, res);
        return res;
      });
    } else if (typeof this.transform === 'function') {
      this.transform((res) => {
        fn.call(this, res);
        return res;
      });
    } else {
      this.options.transform = (res) => {
        fn.call(this, res);
        return res;
      };
    }
  });

  schema.post('findOne', fn);
  schema.post('findOneAndUpdate', fn);
  schema.post('findOneAndDelete', fn);
};

function applyGettersMiddleware(schema) {
  return function(res) {
    applyGetters.call(this, schema, res);
  };
}

function applyGetters(schema, res, path) {
  if (res == null) {
    return;
  }
  if (this._mongooseOptions.lean && this._mongooseOptions.lean.getters) {
    if (Array.isArray(res)) {
      const len = res.length;
      for (let i = 0; i < len; ++i) {
        applyGettersToDoc.call(this, schema, res[i], this._fields, path);
      }
    } else {
      applyGettersToDoc.call(this, schema, res, this._fields, path);
    }

    for (let i = 0; i < schema.childSchemas.length; ++i) {
      const childPath = path ? path + '.' + schema.childSchemas[i].model.path : schema.childSchemas[i].model.path;
      const _schema = schema.childSchemas[i].schema;
      const doc = mpath.get(schema.childSchemas[i].model.path, res);
      if (doc == null) {
        continue;
      }
      applyGetters.call(this, _schema, doc, childPath);
    }

    return res;
  } else {
    return res;
  }
}

function getSchemaForDoc(schema, res) {
  if (!schema.discriminatorMapping || !schema.discriminatorMapping.key) {
    return schema;
  }

  const discriminatorValue = res[schema.discriminatorMapping.key];
  const childSchema = Object.entries(schema.discriminators).find(([modelName, childSchema]) => {
    // Match against an explicit discriminator value if present
    const matchValue = childSchema.discriminatorMapping.value || modelName;
    return discriminatorValue === matchValue;
  })[1];
  return childSchema;
}

function applyGettersToDoc(schema, doc, fields, prefix) {
  if (doc == null) {
    return;
  }

  const schemaForDoc = getSchemaForDoc(schema, doc);

  if (Array.isArray(doc)) {
    for (let i = 0; i < doc.length; ++i) {
      applyGettersToDoc.call(this, schemaForDoc, doc[i], fields, prefix);
    }
    return;
  }

  schemaForDoc.eachPath((path, schematype) => {
    const pathWithPrefix = prefix ? prefix + '.' + path : path;
    if (this.selectedInclusively() &&
        fields &&
        fields[pathWithPrefix] == null &&
        !this.isPathSelectedInclusive(pathWithPrefix)) { // fields[pathWithPrefix] should return false
      return;
    }
    if (this.selectedExclusively() &&
        fields &&
        fields[pathWithPrefix] != null &&
        !this.isPathSelectedInclusive(pathWithPrefix)) {
      return;
    }
    if (mpath.has(path, doc)) {
      mpath.set(path, schematype.applyGetters(mpath.get(path, doc), doc, true), doc);
    }
  });
}

module.exports.default = module.exports;
module.exports.mongooseLeanGetters = module.exports;
