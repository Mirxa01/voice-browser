export const LLM_FORBIDDEN_ERROR_MESSAGE =
  'Access denied (403 Forbidden). Please check:\n\n1. Your API key has the required permissions\n\n2. For Ollama: Set OLLAMA_ORIGINS=chrome-extension://* \nsee https://github.com/ollama/ollama/blob/main/docs/faq.md';

export const EXTENSION_CONFLICT_ERROR_MESSAGE = `
  Cannot access a chrome-extension:// URL of different extension.
  
  This is likely due to conflicting extensions. Please use Mirza Browser in a new profile.`;

/**
 * Custom error class for chat model authentication errors
 */
export class ChatModelAuthError extends Error {
  /**
   * Creates a new ChatModelAuthError
   *
   * @param message - The error message
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ChatModelAuthError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChatModelAuthError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

export class ChatModelForbiddenError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ChatModelForbiddenError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChatModelForbiddenError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

/**
 * Custom error class for chat model bad request errors (400)
 */
export class ChatModelBadRequestError extends Error {
  /**
   * Creates a new ChatModelBadRequestError
   *
   * @param message - The error message
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ChatModelBadRequestError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChatModelBadRequestError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

/**
 * Checks if an error is related to API authentication
 *
 * @param error - The error to check
 * @returns boolean indicating if it's an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message || '';

  // Check error.name which is explicitly set and survives minification
  if (error.name === 'AuthenticationError') {
    return true;
  }

  // Check for HTTP status code property (set by many LLM SDKs)
  if ('status' in error && (error as { status: number }).status === 401) {
    return true;
  }

  // Fallback: check the message for authentication-related indicators
  return (
    errorMessage.toLowerCase().includes('authentication') ||
    errorMessage.includes(' 401') ||
    errorMessage.toLowerCase().includes('api key')
  );
}

/**
 * Checks if an error is related 403 Forbidden
 *
 * @param error - The error to check
 * @returns boolean indicating if it's an 403 Forbidden error
 */
export function isForbiddenError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Check for HTTP status code property (set by many LLM SDKs)
  if ('status' in error && (error as { status: number }).status === 403) {
    return true;
  }

  return error.message.includes(' 403') || error.message.toLowerCase().includes('forbidden');
}

/**
 * Checks if an error is related to 400 Bad Request
 *
 * @param error - The error to check
 * @returns boolean indicating if it's a 400 Bad Request error
 */
export function isBadRequestError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message || '';

  // Check error.name which is explicitly set and survives minification
  if (error.name === 'BadRequestError') {
    return true;
  }

  // Check for HTTP status code property (set by many LLM SDKs)
  if ('status' in error && (error as { status: number }).status === 400) {
    return true;
  }

  // Check for specific patterns in the error message that indicate bad request
  return (
    errorMessage.includes(' 400') ||
    errorMessage.toLowerCase().includes('badrequest') ||
    errorMessage.includes('Invalid parameter') ||
    (errorMessage.includes('response_format') &&
      errorMessage.includes('json_schema') &&
      errorMessage.includes('not supported'))
  );
}

export function isAbortedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message.includes('Aborted');
}

/**
 * Checks if an error is related to extension conflicts
 *
 * @param error - The error to check
 * @returns boolean indicating if it's an extension conflict error
 */
export function isExtensionConflictError(error: unknown): boolean {
  const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return errorMessage.includes('cannot access a chrome-extension') && errorMessage.includes('of different extension');
}

export class RequestCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestCancelledError';
  }
}

export class ExtensionConflictError extends Error {
  /**
   * Creates a new ExtensionConflictError
   *
   * @param message - The error message
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ExtensionConflictError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtensionConflictError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

/**
 * Custom error class for when maximum execution steps are reached
 */
export class MaxStepsReachedError extends Error {
  /**
   * Creates a new MaxStepsReachedError
   *
   * @param message - The localized error message (should use t('exec_errors_maxStepsReached'))
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MaxStepsReachedError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MaxStepsReachedError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

/**
 * Custom error class for when maximum consecutive failures are reached
 */
export class MaxFailuresReachedError extends Error {
  /**
   * Creates a new MaxFailuresReachedError
   *
   * @param message - The localized error message (should use t('exec_errors_maxFailuresReached'))
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MaxFailuresReachedError';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MaxFailuresReachedError);
    }
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}

/**
 * Custom error class for when LLM response cannot be parsed into expected format
 */
export class ResponseParseError extends Error {
  /**
   * Creates a new ResponseParseError
   *
   * @param message - The error message describing the parsing failure
   * @param cause - The original error that caused this error
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ResponseParseError';
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `${this.name}: ${this.message}${this.cause ? ` (Caused by: ${this.cause})` : ''}`;
  }
}
