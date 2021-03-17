# Mongoose Soft Delete Plugin

Mongoose plugin that enables soft deletion of Models/Documents. This plugin also supports Mongo Transaction (from MongoDB 4.4).

This plugin is based on [Mongoose Soft Delete](https://github.com/riyadhalnur/mongoose-softdelete) by [Riyadh Al Nur](https://github.com/riyadhalnur)

## License

This plugin is licensed under the MIT license and can ve viewed in the LICENSE file.

## Installation

Install using [npm](https://npmjs.org)

```
npm install mongoose-softdelete-typescript --save
```

## Tests

IMPORTANT: You need to have MongoDB running to run tests

```
npm test
```

## Typescript

```ts
import { Schema, model } from 'mongoose';
import { softDeletePlugin, ISoftDeletedModel, ISoftDeletedDocument } from 'mongoose-softdelete-typescript';

const TestSchema = new Schema({
  name: { type: String, default: '' },
  description: { type: String, default: 'description' },
});

TestSchema.plugin(softDeletePlugin);

const Test = model<ISoftDeletedDocument, ISoftDeletedModel<ISoftDeletedDocument>>('Test', TestSchema);
const test1 = new Test();
// delete single document
const newTest = await test1.softDelete();
// restore single document
const restoredTest = await test1.restore();
// find many deleted documents
const deletedTests = await Test.findDeleted(true);
// soft delete many documents with conditions
await Test.softDelete({ name: 'test' });

// support mongo transaction
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
```