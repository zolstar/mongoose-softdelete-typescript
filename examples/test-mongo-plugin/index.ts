'use strict';
import { softDeletePlugin, ISoftDeletedModel, ISoftDeletedDocument } from 'mongoose-softdelete-typescript';
import { connect, connection, model, Schema } from 'mongoose';

connect('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
connection.on(
    'error',
    console.error.bind(console, 'Connection Error: please check if mongodb is running on localhost'),
);

const TestSchema = new Schema({
    name: {type: String, default: ''},
    description: {type: String, default: 'description'},
});

TestSchema.plugin(softDeletePlugin);

const Test = model<ISoftDeletedDocument, ISoftDeletedModel<ISoftDeletedDocument>>('Test', TestSchema);
Test.deleteMany().then();
const test1 = new Test();
const test2 = new Test({isDeleted: true, deletedAt: new Date()});
const test3 = new Test({isDeleted: true, deletedAt: new Date()});


async function runTest() {
    const newTest = await test1.softDelete();

    await test2.save();
    await test3.save();

    const restoredTest = await test2.restore();

    const deletedTests = await Test.findDeleted(true);

    const tests = await Test.find();

    await Test.softDelete({});
    const softDeletedTests = await Test.find();

    const session = await Test.db.startSession();
    session.startTransaction();
    try {
        const newTest = await test1.softDelete(session);
        await session.commitTransaction();
    } catch (e) {
        console.log('e', e);
        await session.abortTransaction();
    } finally {
        await session.endSession();
    }
    console.log('done test');
}
runTest();
