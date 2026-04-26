import { FilterQuery, HydratedDocument, Model, QueryOptions, UpdateQuery } from 'mongoose';
import { FindOptions } from '../interfaces/helpers';

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findOne(filter: FilterQuery<T>): Promise<HydratedDocument<T> | null> {
    return this.model.findOne(filter).exec();
  }

  async find(filter: FilterQuery<T>, options?: FindOptions): Promise<HydratedDocument<T>[]> {
    let q = this.model.find(filter);
    if (options?.sort) q = q.sort(options.sort);
    if (options?.skip) q = q.skip(options.skip);
    if (options?.limit) q = q.limit(options.limit);
    return q.exec();
  }

  async countDocuments(filter: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async create(data: Partial<T>): Promise<HydratedDocument<T>> {
    return this.model.create(data);
  }

  async updateOne(id: string, update: UpdateQuery<T>, options?: QueryOptions<T>): Promise<HydratedDocument<T> | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async deleteOne(filter: FilterQuery<T>): Promise<void> {
    await this.model.deleteOne(filter).exec();
  }
}
