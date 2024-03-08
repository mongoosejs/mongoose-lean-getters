# mongoose-lean-getters
Apply getters on lean() documents: https://mongoosejs.com/docs/tutorials/lean.html

This package requires Mongoose `>= 7.1.0`. Do not use with Mongoose 7.0.x or 6.x.

## Usage

```javascript
const mongoose = require('mongoose');
const mongooseLeanGetters = require('mongoose-lean-getters');

const schema = mongoose.Schema({
  name: {
    type: String,
    // Get the last 6 characters of the string
    get: v => v.slice(-6)
  }
});
// Add this plugin to apply getters when using `lean()`.
schema.plugin(mongooseLeanGetters);

await Model.create({ name: 'Captain Jean-Luc Picard' });

const doc = await Model.findOne().lean({ getters: true });
doc.name; // 'Picard'
```
