/**
 * Logger utility for consistent logging across the app
 * Provides controlled logging that can be easily disabled in production
 */

// Set to false to disable all logging in production
const LOGGING_ENABLED = __DEV__;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log general information
   */
  log(message: string, ...args: unknown[]): void {
    this.logWithLevel('log', message, ...args);
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    this.logWithLevel('info', message, ...args);
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    this.logWithLevel('warn', message, ...args);
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    // Errors should always be logged, even in production
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, message, error, ...args);
  }

  /**
   * Log debug messages
   */
  debug(message: string, ...args: unknown[]): void {
    this.logWithLevel('debug', message, ...args);
  }

  /**
   * Internal method to log with specific level
   */
  private logWithLevel(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!LOGGING_ENABLED) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    switch (level) {
      case 'log':
        console.log(`[${timestamp}] ${levelUpper}:`, message, ...args);
        break;
      case 'info':
        console.info(`[${timestamp}] ${levelUpper}:`, message, ...args);
        break;
      case 'warn':
        console.warn(`[${timestamp}] ${levelUpper}:`, message, ...args);
        break;
      case 'debug':
        console.debug(`[${timestamp}] ${levelUpper}:`, message, ...args);
        break;
      default:
        console.log(`[${timestamp}] ${levelUpper}:`, message, ...args);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export default for convenience
export default logger;
