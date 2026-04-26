import { Router } from 'express';
import { authRouter } from './auth';
import { usersRouter } from './users';
import { patientsRouter } from './patients';
import { customFieldsRouter } from './customFields';
import { filesRouter } from './files';
import { pharmacistsRouter } from './pharmacists';

export const router = Router();

router.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/api/auth', authRouter);
router.use('/api/users', usersRouter);
router.use('/api/patients', patientsRouter);
router.use('/api/custom-fields', customFieldsRouter);
router.use('/api/files', filesRouter);
router.use('/api/pharmacists', pharmacistsRouter);
