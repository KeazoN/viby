import { httpClient } from './http-client';
import { requestSigner } from './request-signer';
import type { AxiosRequestConfig } from 'axios';

/**
 * Helper functions for making signed HTTP requests.
 * 
 * These functions automatically add request signatures to critical operations
 * to prevent tampering and replay attacks.
 * 
 * Requirements: 17.5
 */

/**
 * Make a signed POST request
 * @param url - Request URL path
 * @param data - Request body data
 * @param config - Optional Axios config
 * @returns Promise resolving to response data
 */
export async function signedPost<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  // Only sign if signing is enabled
  if (!requestSigner.isEnabled()) {
    return httpClient.post<T>(url, data, config);
  }

  const timestamp = Date.now();
  const signature = requestSigner.sign('POST', url, data, timestamp);

  return httpClient.post<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp.toString(),
    },
  });
}

/**
 * Make a signed PUT request
 * @param url - Request URL path
 * @param data - Request body data
 * @param config - Optional Axios config
 * @returns Promise resolving to response data
 */
export async function signedPut<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  // Only sign if signing is enabled
  if (!requestSigner.isEnabled()) {
    return httpClient.put<T>(url, data, config);
  }

  const timestamp = Date.now();
  const signature = requestSigner.sign('PUT', url, data, timestamp);

  return httpClient.put<T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp.toString(),
    },
  });
}

/**
 * Make a signed DELETE request
 * @param url - Request URL path
 * @param config - Optional Axios config
 * @returns Promise resolving to response data
 */
export async function signedDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  // Only sign if signing is enabled
  if (!requestSigner.isEnabled()) {
    return httpClient.delete<T>(url, config);
  }

  const timestamp = Date.now();
  const signature = requestSigner.sign('DELETE', url, null, timestamp);

  return httpClient.delete<T>(url, {
    ...config,
    headers: {
      ...config?.headers,
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp.toString(),
    },
  });
}
