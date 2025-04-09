import { join } from 'path';

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  logsDir: string;
  maxSize: number; // in bytes
  maxFiles: number;
  format: string;
}

export const loggerConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LoggerConfig['level']) || 'info',
  logsDir: join(process.cwd(), 'logs'),
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  format: '[{timestamp}] [{level}] {message}',
}; 