  
'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const mongooseLeanGetters = require('../');

describe('mongoose-lean-getters', function() {
  before(function() {
    return mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true });
  });

  after(() => mongoose.disconnect());

  it('example', async function() {
    const mongoose = require('mongoose');

    const schema = mongoose.Schema({
      name: {
        type: String,
        // Get the last 6 characters of the string
        get: v => v.slice(-6)
      }
    });
    // Add this plugin to apply getters when using `lean()`.
    schema.plugin(mongooseLeanGetters);

    const Model = mongoose.model('Test', schema);

    // acquit:ignore:start
    await Model.deleteMany({});
    // acquit:ignore:end
    await Model.create({ name: 'Captain Jean-Luc Picard' });

    const doc = await Model.findOne().lean({ getters: true });

    assert.equal(doc.name, 'Picard');
  });
});