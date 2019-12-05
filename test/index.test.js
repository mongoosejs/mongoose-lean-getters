  
'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const mongooseLeanGetters = require('../');

describe('mongoose-lean-getters', function() {
  before(function() {
    return mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true });
  });

  after(() => mongoose.disconnect());

  it('with different types', async function() {
    const schema = mongoose.Schema({
      name: {
        type: String,
        get: v => v != null ? v.toLowerCase() : v
      },
      nested: {
        test: {
          type: String,
          get: v => v != null ? v.toLowerCase() : v
        }
      },
      arr: [{
        test: {
          type: String,
          get: v => v != null ? v.toLowerCase() : v
        }
      }]
    });
    schema.plugin(mongooseLeanGetters);

    const Model = mongoose.model('withDifferentTypes', schema);

    await Model.deleteMany({});
    await Model.create({ name: 'FOO', nested: { test: 'BAR' }, arr: [{ test: 'BAZ' }] });

    const doc = await Model.findOne().lean({ getters: true });

    assert.equal(doc.name, 'foo');
    assert.equal(doc.nested.test, 'bar');
    assert.equal(doc.arr[0].test, 'baz');
  });

  it('only calls getters once with find() (gh-1)', async function() {
    const schema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + '123'
      }
    });
    schema.plugin(mongooseLeanGetters);

    const Model = mongoose.model('gh1', schema);

    await Model.deleteMany({});
    await Model.create({ name: 'test' });

    const docs = await Model.find().lean({ getters: true });

    assert.equal(docs[0].name, 'test123');
  });
});