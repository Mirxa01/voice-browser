import { describe, it, expect } from 'vitest';
import {
  isAuthenticationError,
  isForbiddenError,
  isBadRequestError,
  isAbortedError,
  isExtensionConflictError,
  ChatModelAuthError,
  ChatModelForbiddenError,
  ChatModelBadRequestError,
  MaxStepsReachedError,
  MaxFailuresReachedError,
  RequestCancelledError,
  ExtensionConflictError,
  ResponseParseError,
} from '../errors';

describe('Error detection functions - minification safe', () => {
  describe('isAuthenticationError', () => {
    it('detects error with name "AuthenticationError"', () => {
      const error = new Error('some error');
      error.name = 'AuthenticationError';
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('detects error with status 401', () => {
      const error = new Error('Unauthorized') as Error & { status: number };
      error.status = 401;
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('detects error with 401 in message', () => {
      const error = new Error('Request failed with status code 401');
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('detects error with "authentication" in message', () => {
      const error = new Error('Authentication failed');
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('detects error with "api key" in message', () => {
      const error = new Error('Invalid API key provided');
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('returns false for non-Error values', () => {
      expect(isAuthenticationError('string error')).toBe(false);
      expect(isAuthenticationError(null)).toBe(false);
      expect(isAuthenticationError(undefined)).toBe(false);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Something went wrong');
      expect(isAuthenticationError(error)).toBe(false);
    });
  });

  describe('isForbiddenError', () => {
    it('detects error with status 403', () => {
      const error = new Error('Access denied') as Error & { status: number };
      error.status = 403;
      expect(isForbiddenError(error)).toBe(true);
    });

    it('detects error with 403 in message', () => {
      const error = new Error('Request failed with status 403');
      expect(isForbiddenError(error)).toBe(true);
    });

    it('detects error with "forbidden" in message (case-insensitive)', () => {
      const error = new Error('Access Forbidden');
      expect(isForbiddenError(error)).toBe(true);
    });

    it('returns false for non-Error values', () => {
      expect(isForbiddenError('forbidden')).toBe(false);
    });

    it('returns false for unrelated errors', () => {
      expect(isForbiddenError(new Error('Not found'))).toBe(false);
    });
  });

  describe('isBadRequestError', () => {
    it('detects error with name "BadRequestError"', () => {
      const error = new Error('bad request');
      error.name = 'BadRequestError';
      expect(isBadRequestError(error)).toBe(true);
    });

    it('detects error with status 400', () => {
      const error = new Error('Invalid request') as Error & { status: number };
      error.status = 400;
      expect(isBadRequestError(error)).toBe(true);
    });

    it('detects error with 400 in message', () => {
      const error = new Error('Request failed with status 400');
      expect(isBadRequestError(error)).toBe(true);
    });

    it('detects json_schema not supported error', () => {
      const error = new Error('response_format with json_schema type is not supported');
      expect(isBadRequestError(error)).toBe(true);
    });

    it('returns false for non-Error values', () => {
      expect(isBadRequestError(400)).toBe(false);
    });

    it('returns false for unrelated errors', () => {
      expect(isBadRequestError(new Error('timeout'))).toBe(false);
    });
  });

  describe('isAbortedError', () => {
    it('detects AbortError by name', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      expect(isAbortedError(error)).toBe(true);
    });

    it('detects Aborted in message', () => {
      const error = new Error('Request Aborted by client');
      expect(isAbortedError(error)).toBe(true);
    });

    it('returns false for non-Error values', () => {
      expect(isAbortedError('aborted')).toBe(false);
    });
  });

  describe('isExtensionConflictError', () => {
    it('detects extension conflict error', () => {
      const error = new Error('Cannot access a chrome-extension:// URL of different extension');
      expect(isExtensionConflictError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(isExtensionConflictError(new Error('some error'))).toBe(false);
    });

    it('handles non-Error values (strings)', () => {
      expect(isExtensionConflictError('Cannot access a chrome-extension of different extension')).toBe(true);
    });
  });
});

describe('Custom error classes', () => {
  it('ChatModelAuthError preserves name through minification', () => {
    const error = new ChatModelAuthError('test message');
    expect(error.name).toBe('ChatModelAuthError');
    expect(error.message).toBe('test message');
    expect(error instanceof Error).toBe(true);
  });

  it('ChatModelForbiddenError preserves name', () => {
    const error = new ChatModelForbiddenError('test');
    expect(error.name).toBe('ChatModelForbiddenError');
  });

  it('ChatModelBadRequestError preserves name', () => {
    const error = new ChatModelBadRequestError('test');
    expect(error.name).toBe('ChatModelBadRequestError');
  });

  it('MaxStepsReachedError preserves name', () => {
    const error = new MaxStepsReachedError('test');
    expect(error.name).toBe('MaxStepsReachedError');
  });

  it('MaxFailuresReachedError preserves name', () => {
    const error = new MaxFailuresReachedError('test');
    expect(error.name).toBe('MaxFailuresReachedError');
  });

  it('RequestCancelledError preserves name', () => {
    const error = new RequestCancelledError('test');
    expect(error.name).toBe('RequestCancelledError');
  });

  it('ExtensionConflictError preserves name and cause', () => {
    const cause = new Error('original');
    const error = new ExtensionConflictError('test', cause);
    expect(error.name).toBe('ExtensionConflictError');
    expect(error.cause).toBe(cause);
  });

  it('ResponseParseError preserves name', () => {
    const error = new ResponseParseError('test');
    expect(error.name).toBe('ResponseParseError');
  });

  it('toString includes cause when provided', () => {
    const cause = new Error('root cause');
    const error = new ChatModelAuthError('auth failed', cause);
    const str = error.toString();
    expect(str).toContain('ChatModelAuthError');
    expect(str).toContain('auth failed');
    expect(str).toContain('root cause');
  });
});
