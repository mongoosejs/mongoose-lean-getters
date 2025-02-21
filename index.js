'use strict';

const mpath = require('mpath');

module.exports = function mongooseLeanGetters(schema, options) {
  const fn = applyGettersMiddleware(schema, options);
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

function applyGettersMiddleware(schema, options) {
  return function(res) {
    this._mongooseLeanGettersOptions = options || {};
    applyGetters.call(this, schema, res);
  };
}

function applyGetters(schema, res) {
  if (res == null) {
    return;
  }
  const { defaultLeanOptions } = this._mongooseLeanGettersOptions;
  const shouldCallGetters = this._mongooseOptions?.lean?.getters ?? defaultLeanOptions?.getters ?? false;

  if (shouldCallGetters) {
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

  // If no discriminator schema found, return the root schema (#39)
  return childSchema || schema;
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
    
    const pathExists = mpath.has(path, doc);
    if (pathExists) {
      const val = schematype.applyGetters(mpath.get(path, doc), doc, true);
      if (val && schematype.$isMongooseArray && !schematype.$isMongooseDocumentArray) {
        mpath.set(
          path,
          val.map(subdoc => {
            return schematype.caster.applyGetters(subdoc, doc);
          }),
          doc
        );
      } if (val && schematype.$isSingleNested) {
        applyGettersToDoc.call(this, schematype.schema, pathVal);
      } else {
        mpath.set(path, val, doc);
      }
    }

    mpath.set(path, schematype.applyGetters(pathVal, doc, true), doc);
  });
}

module.exports.default = module.exports;
module.exports.mongooseLeanGetters = module.exports;
