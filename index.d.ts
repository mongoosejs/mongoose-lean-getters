


declare module 'mongoose-lean-getters' {
  import mongoose from 'mongoose';
  export function plugin(fn: (schema: mongoose.Schema, opts?: any) => void, opts?: any): typeof mongoose;
  export default function mongooseLeanGetters(schema: any): any;
}



