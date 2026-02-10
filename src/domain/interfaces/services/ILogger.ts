export interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface ILogger {
  debug(context: LogContext, message: string): void;
  info(context: LogContext, message: string): void;
  warn(context: LogContext, message: string): void;
  error(context: LogContext, message: string): void;

  child(context: LogContext): ILogger;
}
