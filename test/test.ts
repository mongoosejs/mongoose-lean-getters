import * as mongoose from 'mongoose';
import {mongooseLeanGetters} from 'mongoose-lean-getters';

interface Test {
    name: string
}
/*
const testSchema = new mongoose.Schema({
    name: String
});
*/

const testSchema = new mongoose.Schema<Test>({
    name: String
});

testSchema.plugin(mongooseLeanGetters);