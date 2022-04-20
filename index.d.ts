


declare module 'mongoose-lean-getters' {
  import mongoose = require('mongoose');
  export default function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>, opts?: any): void;
  export function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>, opts?: any): void;
}