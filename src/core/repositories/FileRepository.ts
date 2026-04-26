import { IFile, FileModel } from '../models/File';
import { BaseRepository } from './BaseRepository';

export class FileRepository extends BaseRepository<IFile> {
  constructor() {
    super(FileModel);
  }
}
