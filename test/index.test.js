
'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const mongooseLeanGetters = require('../');

describe('mongoose-lean-getters', function() {
  before(function() {
    return mongoose.connect('mongodb://127.0.0.1:27017/test', { useNewUrlParser: true });
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
  it('avoids running getters on fields that are projected out (gh-9)', async function() {
    const childSchema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + '456'
      }
    });

    const schema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + '123'
      },
      age: {
        type: String,
        get: v => v + '333'
      },
      docArr: [childSchema]
    });
    schema.plugin(mongooseLeanGetters);

    const Model = mongoose.model('gh9', schema);

    await Model.deleteMany({});
    await Model.create({ name: 'test', age: '12', docArr: [{ name: 'foo' }] });

    const docs = await Model.find({}, '-name').lean({ getters: true });

    assert.equal(docs[0].name, undefined);
    assert.equal(docs[0].age, '12333');
    assert.equal(docs[0].docArr[0].name, 'foo456');
  });

  it('should call nested getters', async function () {
    const subChildSchema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + ' nested child'
      }
    });

    const childSchema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + ' child'
      },
      subChilren: [subChildSchema]
    });

    const schema = mongoose.Schema({
      name: {
        type: String,
        get: v => v + ' root'
      },
      children: [childSchema]
    });
    schema.plugin(mongooseLeanGetters);

    const Model = mongoose.model('nestedChildren', schema);

    await Model.deleteMany({});
    await Model.create({
      name: `I'm a`, children: [{
        name: `Hello, I'm a`,
        subChilren: [
          {
            name: 'The first'
          },
          {
            name: 'The second'
          }
        ]
      }]
    });

    const docs = await Model.find().lean({ getters: true });

    assert.equal(docs[0].name, `I'm a root`);
    assert.equal(docs[0].children[0].name, `Hello, I'm a child`);
    assert.equal(docs[0].children[0].subChilren[0].name, 'The first nested child');
    assert.equal(docs[0].children[0].subChilren[1].name, 'The second nested child');
  });
  it('should not add path to output if the path has not getters gh-20', async function() {
    const testSchema = new mongoose.Schema({
      firstName: {
        type: String,
        get: capitalize
      },
      email: String
    });

    function capitalize() {
      return 'Test';
    }

    testSchema.plugin(mongooseLeanGetters);

    const Test = mongoose.model('gh-20', testSchema);
    await Test.deleteMany({});
    await Test.create({
      firstName: 'test'
    });
    const res = await Test.findOne().lean({ getters: true });
    const otherRes = await Test.findOne().lean();
    const paths = Object.keys(res);
    assert.equal(paths.includes('email'), false);
  });
  it('should work with findByIdAndDelete gh-23', async function() {
    const testSchema = new mongoose.Schema({
      field: Number
    });
    testSchema.plugin(mongooseLeanGetters);

    testSchema.path('field').get(function(field) {
      return field.toString();
    });
    const Test = mongoose.model('gh-23', testSchema);

    await Test.deleteMany({});
    const entry = await Test.create({
      field: 1337
    });
    const doc = await Test.findByIdAndDelete({ _id: entry._id }).lean({ getters: true });
    assert.equal(typeof doc.field, 'string');
    assert.equal(doc.field, '1337');
  });
});
