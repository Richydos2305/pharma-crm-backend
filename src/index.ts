import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { settings } from './core/config/application';
import { connectDB } from './core/config/database';
import { createRedisConnection } from './core/config/redis';
import { QueueNames } from './core/constants';
import { router } from './core/routes/index';
import { errorHandler } from './core/middleware/errorhandler';
import { logger } from './core/helpers/logger';
import { createSyncWorker } from './core/services/queue/workers';

const app = express();

app.use(helmet());
// TODO: Restrict CORS before going to production
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const boardQueue = new Queue(QueueNames.MAIN, { connection: createRedisConnection() });
createBullBoard({ queues: [new BullMQAdapter(boardQueue)], serverAdapter });
app.use('/admin/queues', serverAdapter.getRouter());

app.use('/', router);

app.use(errorHandler);

connectDB().then(() => {
  createSyncWorker();
  app.listen(settings.port, () => {
    logger.info('server_started', { port: settings.port });
  });
});
