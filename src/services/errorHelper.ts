export type NetworkError =
  | 'noData'
  | 'decodingError'
  | 'tooManyRequests'
  | 'limitWAF'
  | 'cancelReplace'
  | 'bannedIP'
  | 'malformedRequests'
  | 'exchengeError'
  | 'unknownError'
  | 'incorrectURL';

export interface ApiError {
  code: NetworkError;
  /** Raw message from iOS/Android network stack, if available */
  raw?: string;
}

export function mapHttpError(status: number): ApiError {
  switch (status) {
    case 401: return { code: 'malformedRequests' };
    case 429: return { code: 'tooManyRequests' };
    case 403: return { code: 'limitWAF' };
    case 409: return { code: 'cancelReplace' };
    case 418: return { code: 'bannedIP' };
    default:
      if (status >= 400 && status <= 499) return { code: 'malformedRequests' };
      if (status >= 500 && status <= 599) return { code: 'exchengeError' };
      return { code: 'unknownError' };
  }
}

export function mapCatchError(e: unknown): ApiError {
  const raw = e instanceof Error ? e.message : String(e);
  return { code: 'unknownError', raw };
}

export function errorCode(error: NetworkError | ApiError): NetworkError {
  return typeof error === 'string' ? error : error.code;
}

export function errorKey(error: NetworkError | ApiError): string {
  switch (errorCode(error)) {
    case 'tooManyRequests': return 'error.too_many_requests';
    case 'noData':          return 'error.no_data';
    case 'decodingError':   return 'error.decoding_error';
    case 'limitWAF':        return 'error.waf_limit';
    case 'cancelReplace':   return 'error.cancel_replace';
    case 'bannedIP':        return 'error.banned_ip';
    case 'malformedRequests': return 'error.malformed_request';
    case 'exchengeError':   return 'error.exchange_side';
    case 'incorrectURL':    return 'error.incorrect_api_url';
    default:                return 'error.unknown';
  }
}

/** Human-readable message: i18n label + raw network detail if present */
export function formatApiError(err: ApiError, t: (k: string) => string): string {
  const base = t(errorKey(err.code));
  if (err.raw && err.code === 'unknownError') {
    return `${base}: ${err.raw}`;
  }
  return base;
}
