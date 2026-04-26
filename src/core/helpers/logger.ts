import winston from 'winston';

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

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
