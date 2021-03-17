'use strict';
import { softDeletePlugin, ISoftDeletedModel, ISoftDeletedDocument } from '../index';
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

describe('Mongoose Soft Delete Plugin', function () {
    it('should delete data', async function (done) {
        expect(test1.deletedAt).toBeNull();
        expect(test1.isDeleted).toBe(false);

        const newTest = await test1.softDelete();
        expect(newTest.isDeleted).toBe(true);
        expect(newTest).toHaveProperty('deletedAt');
        expect(newTest.deletedAt).not.toBeNull();

        await test2.save();
        await test3.save();

        const restoredTest = await test2.restore();
        expect(restoredTest.isDeleted).toBe(false);
        expect(restoredTest.deletedAt).toBeNull();

        const deletedTests = await Test.findDeleted(true);
        expect(deletedTests).toHaveLength(2);

        const tests = await Test.find();
        expect(tests).toHaveLength(1);

        await Test.softDelete({});
        const softDeletedTests = await Test.find();
        expect(softDeletedTests).toHaveLength(0);

        done();
    });
    it('should delete data using transaction', async function (done) {
        const session = await Test.db.startSession();
        session.startTransaction();
        try {
            const newTest = await test1.softDelete(session);
            expect(newTest.isDeleted).toBe(true);
            expect(newTest).toHaveProperty('deletedAt');
            expect(newTest.deletedAt).not.toBeNull();

            await session.commitTransaction();
        } catch (e) {
            console.log('e', e);
            await session.abortTransaction();
        } finally {
            await session.endSession();
        }

        done();
    });
});
