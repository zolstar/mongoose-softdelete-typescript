'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_softdelete_typescript_1 = require("mongoose-softdelete-typescript");
const mongoose_1 = require("mongoose");
mongoose_1.connect('mongodb://wise:boost2019@mongo1:27017/wise?retryWrites=false&authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose_1.connection.on('error', console.error.bind(console, 'Connection Error: please check if mongodb is running on localhost'));
const TestSchema = new mongoose_1.Schema({
    name: { type: String, default: '' },
    description: { type: String, default: 'description' },
});
TestSchema.plugin(mongoose_softdelete_typescript_1.softDeletePlugin);
const Test = mongoose_1.model('Test', TestSchema);
Test.deleteMany().then(() => {
});
const test1 = new Test();
const test2 = new Test({ isDeleted: true, deletedAt: new Date() });
const test3 = new Test({ isDeleted: true, deletedAt: new Date() });
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const newTest = yield test1.softDelete();
        yield test2.save();
        yield test3.save();
        const restoredTest = yield test2.restore();
        const deletedTests = yield Test.findDeleted(true);
        const tests = yield Test.find();
        yield Test.softDelete({});
        const softDeletedTests = yield Test.find();
        const session = yield Test.db.startSession();
        session.startTransaction();
        try {
            const newTest = yield test1.softDelete(session);
            yield session.commitTransaction();
        }
        catch (e) {
            console.log('e', e);
            yield session.abortTransaction();
        }
        finally {
            yield session.endSession();
        }
        console.log('done test');
    });
}
runTest();
//# sourceMappingURL=index.js.map