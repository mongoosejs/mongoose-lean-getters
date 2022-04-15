

declare module 'mongoose-lean-getters' {
  import mongoose = require('mongoose');

  export function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>): void;
}

declare module '*' {
  import mongoose = require('mongoose');
  export default function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>): void;
}

