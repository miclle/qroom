import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { notification } from 'antd';
import { map } from 'lodash';

export type { AxiosError, AxiosResponse } from 'axios';

export interface IErrorMessage<T = any> {
  code: string
  message: T
}

axios.defaults.baseURL = '/api';
axios.defaults.withCredentials = true;

// Add a response interceptor
/* eslint arrow-body-style: "off" */
axios.interceptors.response.use((response) => {
  return response;
}, (error: AxiosError<IErrorMessage>) => {

  if (error.response?.status === 403) {
    notification.error({
      key: 'ErrForbidden',
      message: '权限不足',
      description: map(error.response?.data.message, (value, key) => value).join('\n')
    });
  }

  return Promise.reject(error.response);
});

/* eslint @typescript-eslint/explicit-module-boundary-types: off */

export class HTTP {
  GET = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const resp = await axios.get<T>(url, config);
    return resp.data;
  };

  HEAD = axios.head;

  OPTIONS = axios.options;

  POST = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const resp = await axios.post<T>(url, data, config);
    return resp.data;
  };

  PUT = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const resp = await axios.put<T>(url, data, config);
    return resp.data;
  };

  PATCH = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const resp = await axios.patch<T>(url, data, config);
    return resp.data;
  };

  DELETE = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const resp = await axios.delete<T>(url, config);
    return resp.data;
  };
}

const instance = new HTTP();

export default instance;
export const { GET, POST, PUT, PATCH, DELETE } = instance;
