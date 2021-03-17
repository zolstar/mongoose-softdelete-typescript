import { ClientSession, Document, DocumentQuery, FilterQuery, HookNextFunction, Model, Schema } from 'mongoose';

export interface ISoftDeletedDocument extends Document {
  isDeleted: Boolean;
  deletedAt: Date | null;
  softDelete(session?: ClientSession): Promise<ISoftDeletedDocument>;
  restore(session?: ClientSession): Promise<ISoftDeletedDocument>;
  findDeleted(): Promise<any>;
}

export interface ISoftDeletedModel<T> extends Model<T & ISoftDeletedDocument> {
  softDelete(conditions: FilterQuery<ISoftDeletedDocument>, session?: ClientSession): Promise<any>;
  restore(conditions: FilterQuery<ISoftDeletedDocument>, session?: ClientSession): Promise<any>;
  findDeleted(cond: boolean): Promise<any>;
}

const softDeletePlugin = (schema: Schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  schema.pre('save', function (this: ISoftDeletedDocument, next) {
    if (!this.isDeleted) {
      this.isDeleted = false;
    }

    if (!this.deletedAt) {
      this.deletedAt = null;
    }

    next();
  });

  schema.statics.softDelete = function (conditions: FilterQuery<ISoftDeletedDocument>, session: ClientSession) {
    const updateQuery = this.updateMany(conditions, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    if (session) {
      updateQuery.session(session);
    }
    return updateQuery;
  };

  schema.statics.restore = function (conditions: FilterQuery<ISoftDeletedDocument>, session: ClientSession) {
    const restoreQuery = this.updateMany(conditions, {
      isDeleted: false,
      deletedAt: null,
    });
    if (session) {
      restoreQuery.session(session);
    }
    return restoreQuery;
  };

  schema.methods.softDelete = function (this: ISoftDeletedDocument, session: ClientSession) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (session) {
      return this.save({ session });
    }
    return this.save();
  };

  schema.methods.restore = function (this: ISoftDeletedDocument, session: ClientSession) {
    this.isDeleted = false;
    this.deletedAt = null;
    if (session) {
      return this.save({ session });
    }
    return this.save();
  };

  schema.statics.findDeleted = function (cond: boolean) {
    if (typeof cond === 'undefined') {
      cond = true;
    }

    return this.where({
      isDeleted: cond,
    });
  };

  const typesFindQueryMiddleware = [
    'count',
    'countDocuments',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndUpdate',
    'update',
    'updateOne',
    'updateMany',
  ];

  const excludeInFindQueriesIsDeleted = async function (
    this: DocumentQuery<ISoftDeletedDocument, ISoftDeletedDocument>,
    next: HookNextFunction,
  ) {
    const filters = this.getFilter();
    if (!filters.hasOwnProperty('isDeleted')) {
      this.where({ isDeleted: false });
    }
    next();
  };

  typesFindQueryMiddleware.forEach((type: string) => {
    // @ts-ignore
    schema.pre(type, excludeInFindQueriesIsDeleted);
  });
};

export { softDeletePlugin };
