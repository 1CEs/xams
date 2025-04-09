import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { loggerConfig } from './logger.config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class LoggerService {
  private static instance: LoggerService;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  private currentLogPath: string;

  private constructor() {
    this.currentLogPath = this.getCurrentLogPath();
    this.ensureLogDirectory();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private getCurrentLogPath(): string {
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return join(loggerConfig.logsDir, dateFolder, 'app.log');
  }

  private ensureLogDirectory(): void {
    const logDir = dirname(this.currentLogPath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[loggerConfig.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    let formattedMessage = loggerConfig.format
      .replace('{timestamp}', new Date().toISOString())
      .replace('{level}', level.toUpperCase())
      .replace('{message}', message);

    if (meta) {
      formattedMessage += ` ${JSON.stringify(meta)}`;
    }

    return formattedMessage + '\n';
  }

  private rotateLogFileIfNeeded(): void {
    if (!existsSync(this.currentLogPath)) return;

    const stats = require('fs').statSync(this.currentLogPath);
    if (stats.size >= loggerConfig.maxSize) {
      // Rotate log files
      for (let i = loggerConfig.maxFiles - 1; i >= 0; i--) {
        const oldPath = i === 0 ? this.currentLogPath : `${this.currentLogPath}.${i}`;
        const newPath = `${this.currentLogPath}.${i + 1}`;
        
        if (existsSync(oldPath)) {
          if (i === loggerConfig.maxFiles - 1) {
            require('fs').unlinkSync(oldPath);
          } else {
            require('fs').renameSync(oldPath, newPath);
          }
        }
      }
    }
  }

  private writeToFile(message: string): void {
    // Check if we need to switch to a new day's log file
    const newLogPath = this.getCurrentLogPath();
    if (newLogPath !== this.currentLogPath) {
      this.currentLogPath = newLogPath;
      this.ensureLogDirectory();
    }

    this.rotateLogFileIfNeeded();
    appendFileSync(this.currentLogPath, message);
  }

  public log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    console.log(formattedMessage);
    
    // File output
    this.writeToFile(formattedMessage);
  }

  public debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  public error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }
} 