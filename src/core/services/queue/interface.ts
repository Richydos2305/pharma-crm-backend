import { UpdatePatientBody } from '../patient/interface';

export enum QueueOperationType {
  CREATE_PATIENT = 'CREATE_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',
  DELETE_FILE = 'DELETE_FILE'
}

export enum JobStatus {
  QUEUED = 'queued',
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed'
}

export interface QueueJobPayload {
  operation: QueueOperationType;
  userId: string;
  localId: string;
  data: unknown;
}

export interface EnqueueJobResult {
  jobId: string;
  localId: string;
  operation: QueueOperationType;
  status: JobStatus.QUEUED;
}

export interface QueueJobStatus {
  jobId: string;
  localId: string;
  operation: QueueOperationType;
  status: JobStatus;
  result?: unknown;
  error?: string;
  createdAt?: number;
  completedAt?: number;
}

export interface UpdatePatientData {
  id: string;
  body: UpdatePatientBody;
}

export interface DeleteData {
  id: string;
}

export interface DeleteFileData {
  publicId: string;
}
