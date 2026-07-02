import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../../config/redis';
import { QueueNames } from '../../constants';
import { logger } from '../../helpers/logger';
import { ServiceFactory } from '../../factories/ServiceFactory';
import { QueueJobPayload, QueueOperationType, JobStatus, UpdatePatientData, DeleteData, DeleteFileData } from './interface';
import { CreatePatientBody } from '../patient/interface';
import { IPatientCustomFields, IPatientCustomFieldsSection } from '../../interfaces/models';

function filterFileItems(items: unknown[], publicId: string): unknown[] {
  return items.filter((item) => (item as { publicId?: string })?.publicId !== publicId);
}

function removeFileFromRow(row: Record<string, unknown>, publicId: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, val]) => [key, Array.isArray(val) ? filterFileItems(val, publicId) : val]));
}

function removeFileFromSection(section: IPatientCustomFieldsSection, publicId: string): IPatientCustomFieldsSection {
  return { ...section, fields: section.fields.map((row) => removeFileFromRow(row, publicId)) };
}

function removeFile(customFields: IPatientCustomFields, publicId: string): IPatientCustomFields {
  return { sections: customFields.sections.map((section) => removeFileFromSection(section, publicId)) };
}

export const createSyncWorker = (): Worker => {
  const worker = new Worker<QueueJobPayload>(
    QueueNames.MAIN,
    async (job: Job<QueueJobPayload>) => {
      const { operation, userId, localId, data } = job.data;

      switch (operation) {
        case QueueOperationType.CREATE_PATIENT:
          return ServiceFactory.createPatientService().create(data as CreatePatientBody, userId);

        case QueueOperationType.UPDATE_PATIENT: {
          const { id, body } = data as UpdatePatientData;
          return ServiceFactory.createPatientService().update(id, body, userId);
        }

        case QueueOperationType.DELETE_PATIENT:
          return ServiceFactory.createPatientService().delete((data as DeleteData).id, userId);

        case QueueOperationType.DELETE_FILE: {
          const { publicId } = data as DeleteFileData;
          await ServiceFactory.createFileService().delete(publicId, userId);
          const patientService = ServiceFactory.createPatientService();
          const patient = await patientService.getById(localId, userId);
          const updatedCustomFields = removeFile(patient.customFields, publicId);
          return patientService.update(localId, { customFields: updatedCustomFields }, userId);
        }

        default:
          throw new Error(`Unknown queue operation: ${operation as string}`);
      }
    },
    { connection: createRedisConnection() }
  );

  worker.on('ready', () => {
    logger.info('redis_connected', { queue: QueueNames.MAIN });
  });

  worker.on('error', (err) => {
    logger.error('redis_connection_failed', { error: err.message });
  });

  worker.on('completed', (job, result) => {
    logger.info('job_completed', {
      jobId: job.id,
      status: JobStatus.COMPLETED,
      operation: (job.data as QueueJobPayload).operation
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('job_failed', {
      jobId: job?.id,
      status: JobStatus.FAILED,
      operation: job ? (job.data as QueueJobPayload).operation : undefined,
      error: err.message
    });
  });

  return worker;
};
