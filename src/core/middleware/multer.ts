import multer from 'multer';
import { ValidationError } from '../errors/CustomErrors';
import { ALLOWED_FILE_TYPES } from '../constants';
import { settings } from '../config/application';

const storage = multer.memoryStorage();
const limits = { fileSize: settings.maxFileSize };
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const isAllowed = ALLOWED_FILE_TYPES.includes(file.mimetype);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Unsupported file type: ${file.mimetype}`));
  }
};

export const upload = multer({ storage, limits, fileFilter });
