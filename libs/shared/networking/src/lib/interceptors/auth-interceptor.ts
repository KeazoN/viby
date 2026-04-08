import type { InternalAxiosRequestConfig } from 'axios';
import { storageService } from '@viby/shared/storage';

/**
 * Request interceptor that injects the access token into the Authorization header
 */
export async function authRequestInterceptor(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const token = await storageService.getAccessToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}
