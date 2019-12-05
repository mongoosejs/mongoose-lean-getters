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
    } else {
      this.options.transform = (res) => {
        fn.call(this, res);
        return res;
      };
    }
  });

  schema.post('findOne', fn);
  schema.post('findOneAndUpdate', fn);
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
        applyGettersToDoc(schema, res[i]);
      }
    } else {
      applyGettersToDoc(schema, res);
    }

    for (let i = 0; i < schema.childSchemas.length; ++i) {
      const _path = schema.childSchemas[i].model.path;
      const _schema = schema.childSchemas[i].schema;
      const _doc = mpath.get(_path, res);
      if (_doc == null) {
        continue;
      }
      applyGetters.call(this, _schema, _doc);
    }

    return res;
  } else {
    return res;
  }
}

function applyGettersToDoc(schema, doc) {
  if (doc == null) {
    return;
  }
  if (Array.isArray(doc)) {
    for (let i = 0; i < doc.length; ++i) {
      applyGettersToDoc(schema, doc[i]);
    }
    return;
  }

  schema.eachPath((path, schematype) => {
    mpath.set(path, schematype.applyGetters(mpath.get(path, doc), doc, true), doc);
  });
}