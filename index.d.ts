declare module 'mongoose-lean-getters' {
  import mongoose = require('mongoose');

  export default function mongooseLeanGetters(schema: mongoose.Schema); 
}