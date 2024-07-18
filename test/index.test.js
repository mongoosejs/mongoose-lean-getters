
'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const mongooseLeanGetters = require('../');

describe('mongoose-lean-getters', function() {
  before(function() {
    return mongoose.connect('mongodb://127.0.0.1:27017/test');
  });

  after(() => mongoose.disconnect());

  it('with different types', async function() {
    const schema = new mongoose.Schema({
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
    const schema = new mongoose.Schema({
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
    const childSchema = new mongoose.Schema({
      name: {
        type: String,
        get: v => v + '456'
      }
    });

    const schema = new mongoose.Schema({
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

  it('should call nested getters', async function() {
    const subChildSchema = new mongoose.Schema({
      name: {
        type: String,
        get: v => v + ' nested child'
      }
    });

    const childSchema = new mongoose.Schema({
      name: {
        type: String,
        get: v => v + ' child'
      },
      subChilren: [subChildSchema]
    });

    const schema = new mongoose.Schema({
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
      name: 'I\'m a', children: [{
        name: 'Hello, I\'m a',
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

    assert.equal(docs[0].name, 'I\'m a root');
    assert.equal(docs[0].children[0].name, 'Hello, I\'m a child');
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

  it('should work with arrays gh-22', async function() {
    const schema = new mongoose.Schema({
      name: {
        type: String
      },
      items: [{
        text: { type: String, default: null, get: v => v.slice(-6) },
        num: Number,
      }]
    });

    schema.plugin(mongooseLeanGetters);

    const Test = mongoose.model('gh-22', schema);

    await Test.create({
      name: 'Captain Jean-Luc Picard'
    });

    const res = await Test.findOneAndUpdate({
      name: 'Captain Jean-Luc Picard'
    }, {
      $push: {
        items: {
          text: 'Lorem ipsum dolor sit amet',
          num: 1234,
        }
      }
    }, { new: true, projection: 'name items.text'}).lean({ getters: true });

    const success = await Test.findOneAndUpdate({
      name: 'Captain Jean-Luc Picard'
    }).lean({ getters: true });

    await Test.deleteMany({});
    assert.equal(success.items[0].text, 't amet', 'Success text is wrong');
    assert.equal(success.items[0].num, 1234);
    assert.equal(res.items[0].text, 't amet', 'Projected result is wrong');
    assert.equal(res.items[0].num, undefined, 'num should be undefined');
  });

  it('should call getters on schemas with discriminator', async function() {
    const options = { discriminatorKey: 'kind' };

    const eventSchema = new mongoose.Schema({ time: Date }, options);
    eventSchema.plugin(mongooseLeanGetters);
    const Event = mongoose.model('Event', eventSchema);

    const ClickedLinkEvent = Event.discriminator('ClickedLink', new mongoose.Schema({
      url: { type: String, get: v => v + ' discriminator field' }
    }, options));

    await ClickedLinkEvent.deleteMany({});
    await ClickedLinkEvent.create({
      url: 'https://www.test.com'
    });

    const docs = await ClickedLinkEvent.find().lean({ getters: true });

    assert.equal(docs[0].url, 'https://www.test.com discriminator field');
  });

  it('should call getters on schemas with discriminator using explicit value', async function() {
    const options = { discriminatorKey: 'kind' };

    const eventSchema = new mongoose.Schema({ time: Date }, options);
    eventSchema.plugin(mongooseLeanGetters);
    const Event = mongoose.model('Event2', eventSchema);

    const ClickedLinkEvent = Event.discriminator('ClickedLink2',
      new mongoose.Schema({
        url: { type: String, get: v => v + ' discriminator field' }
      }, options),
      {
        value: 'ExplicitClickedLink'
      }
    );

    await ClickedLinkEvent.deleteMany({});
    await ClickedLinkEvent.create({
      url: 'https://www.test.com'
    });

    // Should not throw "Cannot read properties of undefined (reading 'eachPath')"
    const docs = await ClickedLinkEvent.find().lean({ getters: true });

    assert.equal(docs[0].url, 'https://www.test.com discriminator field');
  });

  it('should work on schemas with discriminators in arrays', async function() {
    const options = { discriminatorKey: 'kind' };

    const eventSchema = new mongoose.Schema({ time: Date }, options);
    const clickedLinkSchema = new mongoose.Schema({
      url: { type: String, get: v => v + ' discriminator field' }
    });
    eventSchema.discriminator('ClickedLink', clickedLinkSchema);

    const eventListSchema = new mongoose.Schema({
      events: [eventSchema],
    });
    eventListSchema.plugin(mongooseLeanGetters);
    const EventList = mongoose.model('EventList', eventListSchema);

    await EventList.deleteMany({});
    await EventList.create({
      events: [{
        kind: 'ClickedLink',
        url: 'https://www.test.com'
      }],
    });

    const docs = await EventList.find().lean({ getters: true });

    assert.equal(docs[0].events[0].url, 'https://www.test.com discriminator field');
  });

  it('should work on schemas with discriminators in nested arrays', async function() {
    const options = { discriminatorKey: 'kind' };

    const eventSchema = new mongoose.Schema({ time: Date }, options);
    const clickedLinkSchema = new mongoose.Schema({
      url: { type: String, get: v => v + ' discriminator field' }
    });
    eventSchema.discriminator('VisitedPage', clickedLinkSchema);

    const eventGroupSchema = new mongoose.Schema({
      events: [eventSchema]
    });

    const eventListSchema = new mongoose.Schema({
      eventGroups: [eventGroupSchema],
    });
    eventListSchema.plugin(mongooseLeanGetters);
    const EventGroupList = mongoose.model('EventGroupList', eventListSchema);

    await EventGroupList.deleteMany({});
    await EventGroupList.create({
      eventGroups: [{
        events: [{
          kind: 'VisitedPage',
          url: 'https://www.test.com'
        }],
      }],
    });

    const docs = await EventGroupList.find().lean({ getters: true });

    assert.equal(docs[0].eventGroups[0].events[0].url, 'https://www.test.com discriminator field');
  });

  it('should call getters on arrays (gh-30)', async function() {
    function upper(value) {
      return value.toUpperCase();
    }

    const userSchema = new mongoose.Schema({
      name: {
        type: String,
        get: upper
      },
      emails: [{ type: String, get: upper }]
    });
    userSchema.plugin(mongooseLeanGetters);
    const User = mongoose.model('User', userSchema);

    const user = new User({
      name: 'one',
      emails: ['two', 'three'],
    });
    await user.save();

    const foundUser = await User.findById(user._id).lean({ getters: true });
    assert.strictEqual(user.name, 'ONE');
    assert.deepStrictEqual(foundUser.emails, ['TWO', 'THREE']);
  });

  it('should work with findOneAndReplace (gh-31)', async function() {
    const testSchema = new mongoose.Schema({
      field: Number,
    });
    testSchema.plugin(mongooseLeanGetters);

    testSchema.path('field').get(function(field) {
      return field.toString();
    });
    const Test = mongoose.model('gh-31', testSchema);

    await Test.deleteMany({});
    const entry = await Test.create({
      field: 1337
    });
    const doc = await Test.findOneAndReplace({ _id: entry._id }, entry).lean({ getters: true });
    assert.equal(typeof doc.field, 'string');
    assert.strictEqual(doc.field, '1337');
  });

  it('should call getters on nested schemas within discriminated models', async() => {
    const nestedSchema = new mongoose.Schema({
      num: {
        type: mongoose.Types.Decimal128,
        get: (val) => `${val}`
      }
    });

    const rootSchema = new mongoose.Schema({
      // These properties are here as a control (these always worked as expected)
      rootProp: { type: nestedSchema },
      rootArray: { type: [nestedSchema] },
    });
    rootSchema.plugin(mongooseLeanGetters);

    const discriminatedSchema = new mongoose.Schema({
      // These props on the discriminated schemas were not having getters called
      discriminatedProp: { type: nestedSchema },
      discriminatedArray: { type: [nestedSchema] },
    });

    const RootModel = mongoose.model('Root', rootSchema);
    const DiscriminatedModel = RootModel.discriminator('Discriminated', discriminatedSchema);

    const entry = await DiscriminatedModel.create({
      rootProp: { num: -0.1111111111111111111 },
      rootArray: [{ num: -0.1111111111111111111 }],
      discriminatedProp: { num: -0.222222222222222222 },
      discriminatedArray: [{ num: -0.333333333333333333 }],
    });

    const found = await DiscriminatedModel.findById(entry._id).lean({ getters: true }).exec();
    assert.equal(typeof found.rootProp.num, 'string', 'Root prop is not a string');
    assert.equal(typeof found.rootArray[0].num, 'string', 'Root array is not a string');
    assert.equal(typeof found.discriminatedProp.num, 'string', 'Discriminated prop is not a string');
    assert.equal(typeof found.discriminatedArray[0].num, 'string', 'Discriminated array is not a string');
  });
});
