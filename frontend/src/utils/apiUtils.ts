import { logger } from './logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.219.100:3000';

// API 요청 기본 설정
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// API 응답 타입
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// API 요청 함수 (GET)
export const apiGet = async <T = any>(url: string, params?: Record<string, any>): Promise<T> => {
  const fullUrl = params 
    ? `${API_BASE_URL}${url}?${new URLSearchParams(params).toString()}`
    : `${API_BASE_URL}${url}`;

  try {
    logger.api.request('GET', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: defaultHeaders,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    logger.api.response('GET', fullUrl, result);
    return result.data || result;
  } catch (error) {
    logger.api.error('GET', fullUrl, error);
    throw error;
  }
};

// API 요청 함수 (POST)
export const apiPost = async <T = any>(url: string, data?: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    logger.api.request('POST', fullUrl, data);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: defaultHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    logger.api.response('POST', fullUrl, result);
    return result.data || result;
  } catch (error) {
    logger.api.error('POST', fullUrl, error);
    throw error;
  }
};

// API 요청 함수 (PUT)
export const apiPut = async <T = any>(url: string, data?: any): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    logger.api.request('PUT', fullUrl, data);
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: defaultHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    logger.api.response('PUT', fullUrl, result);
    return result.data || result;
  } catch (error) {
    logger.api.error('PUT', fullUrl, error);
    throw error;
  }
};

// API 요청 함수 (DELETE)
export const apiDelete = async <T = any>(url: string): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    logger.api.request('DELETE', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: defaultHeaders,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    logger.api.response('DELETE', fullUrl, result);
    return result.data || result;
  } catch (error) {
    logger.api.error('DELETE', fullUrl, error);
    throw error;
  }
};

// 파일 업로드 함수
export const apiUpload = async <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> => {
  const fullUrl = `${API_BASE_URL}${url}`;
  const formData = new FormData();
  formData.append('file', file);

  try {
    logger.api.request('UPLOAD', fullUrl, { fileName: file.name, fileSize: file.size });
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // Content-Type은 자동으로 설정됨 (multipart/form-data)
      },
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    logger.api.response('UPLOAD', fullUrl, result);
    return result.data || result;
  } catch (error) {
    logger.api.error('UPLOAD', fullUrl, error);
    throw error;
  }
}; 