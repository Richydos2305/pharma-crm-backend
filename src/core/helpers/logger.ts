import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston from 'winston';
import { settings } from '../config/application';

const consoleFormat =
  process.env.NODE_ENV === 'development'
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${level}: ${String(message)}${metaStr}`;
        })
      )
    : winston.format.json();

const logtail = settings.logtailToken ? new Logtail(settings.logtailToken) : null;

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(logtail ? [new LogtailTransport(logtail)] : [])
  ]
});
