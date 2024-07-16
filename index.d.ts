


declare module 'mongoose-lean-getters' {
  import mongoose = require('mongoose');
  export type LeanGettersOptions = { defaultLeanOptions?: { getters: boolean } };
  export default function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>, opts?: LeanGettersOptions): void;
  export function mongooseLeanGetters(schema: mongoose.Schema<any, any, any, any>, opts?: LeanGettersOptions): void;
}
