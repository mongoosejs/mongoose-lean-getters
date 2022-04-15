import * as mongoose from 'mongoose';
import * as mongooseLeanGetters from 'mongooseLeanGetters';

interface Test {
    name: string
}

const testSchema = new mongoose.Schema<Test>({
    name: String
});

testSchema.plugin(mongooseLeanGetters);