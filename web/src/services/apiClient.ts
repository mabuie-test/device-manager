import axios from 'axios';
import { clientEnv } from '../config/clientEnv';

export const apiClient = axios.create({
  baseURL: clientEnv.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
});
