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
  schema.post('findOneAndReplace', fn);
};

function applyGettersMiddleware(schema) {
  return function(res) {
    applyGetters.call(this, schema, res);
  };
}

function applyGetters(schema, res) {
  if (res == null) {
    return;
  }
  if (this._mongooseOptions.lean && this._mongooseOptions.lean.getters) {
    if (Array.isArray(res)) {
      const len = res.length;
      for (let i = 0; i < len; ++i) {
        applyGettersToDoc.call(this, schema, res[i]);
      }
    } else {
      applyGettersToDoc.call(this, schema, res);
    }
    return res;
  } else {
    return res;
  }
}

function getSchemaForDoc(schema, res) {
  if (!schema.discriminatorMapping || !schema.discriminatorMapping.key || !schema.discriminators) {
    return schema;
  }

  const discriminatorValue = res[schema.discriminatorMapping.key];
  let childSchema = undefined;
  for (const name of Object.keys(schema.discriminators)) {
    const matchValue = schema.discriminators[name].discriminatorMapping.value;
    if (matchValue === discriminatorValue) {
      childSchema = schema.discriminators[name];
      break;
    }
  }
  return childSchema;
}

function applyGettersToDoc(schema, doc) {
  if (doc == null) {
    return;
  }

  if (Array.isArray(doc)) {
    for (let i = 0; i < doc.length; ++i) {
      const currentDoc = doc[i];
      // If the current doc is null/undefined, there's nothing to do
      if (currentDoc == null) continue;
      // If it is a nested array, apply getters to each subdocument (otherwise it would attempt to apply getters to the array itself)
      if (Array.isArray(currentDoc)) {
        applyGettersToDoc.call(this, schema, currentDoc);
        continue;
      }
      const schemaForDoc = getSchemaForDoc(schema, currentDoc);
      applyGettersToDoc.call(this, schemaForDoc, currentDoc);
    }
    return;
  }

  const schemaForDoc = getSchemaForDoc(schema, doc);

  schemaForDoc.eachPath((path, schematype) => {
    if (!mpath.has(path, doc)) {
      // The path is not present (likely from projection)
      return;
    }

    const pathVal = mpath.get(path, doc);
    if (schematype.$isMongooseArray) {
      if (schematype.$isMongooseDocumentArray) {
        pathVal.forEach((subdoc) => applyGettersToDoc.call(this, schematype.schema, subdoc));
        return;
      }

      mpath.set(
        path,
        schematype.applyGetters(pathVal, doc, true).map(subdoc => {
          return schematype.caster.applyGetters(subdoc, doc);
        }),
        doc
      );
      return;
    }

    if (schematype.$isSingleNested) {
      applyGettersToDoc.call(this, schematype.schema, pathVal);
      return;
    }

    mpath.set(path, schematype.applyGetters(pathVal, doc, true), doc);
  });
}

module.exports.default = module.exports;
module.exports.mongooseLeanGetters = module.exports;
