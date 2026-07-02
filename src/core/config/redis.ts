import { settings } from './application';

interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: Record<string, unknown>;
  maxRetriesPerRequest: null;
}

export const createRedisConnection = (): RedisConnectionConfig => {
  const url = new URL(settings.redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 6380,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null
  };
};
