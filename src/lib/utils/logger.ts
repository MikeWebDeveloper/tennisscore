export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isProduction: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Set log level based on environment
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLogLevel) {
      case 'debug':
        this.logLevel = LogLevel.DEBUG;
        break;
      case 'info':
        this.logLevel = LogLevel.INFO;
        break;
      case 'warn':
        this.logLevel = LogLevel.WARN;
        break;
      case 'error':
        this.logLevel = LogLevel.ERROR;
        break;
      case 'silent':
        this.logLevel = LogLevel.SILENT;
        break;
      default:
        // Default to DEBUG in development, ERROR in production
        this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (args.length > 0) {
      return `${prefix} ${message} ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`;
    }
    
    return `${prefix} ${message}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      if (this.isDevelopment) {
        console.log(this.formatMessage('DEBUG', message, ...args));
      }
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('INFO', message, ...args));
      }
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('WARN', message, ...args));
      }
    }
  }

  public error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // Always log errors, even in production
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  public log(message: string, ...args: unknown[]): void {
    // Alias for debug
    this.debug(message, ...args);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const { debug, info, warn, error, log } = logger;