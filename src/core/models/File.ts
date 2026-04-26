import { Schema, model, HydratedDocument } from 'mongoose';
import { IFile } from '../interfaces/models';

export type { IFile };

const fileSchema = new Schema<IFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, required: true, ref: 'Patient' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
  },
  { timestamps: true }
);

export type IFileDocument = HydratedDocument<IFile>;
export const FileModel = model<IFile>('File', fileSchema);
