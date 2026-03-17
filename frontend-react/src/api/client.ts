import axios from 'axios';
import type { DatasetResponse, GenerateRequest, GenerateResponse } from '@/types';

// 1. 创建 Axios 实例
// 注意：这里使用相对路径 '/api' 是为了配合 vite.config.ts 中的代理配置
// 这样在 Docker 内部请求会被转发到 http://backend:8000
// 如果您更倾向于直接请求宿主机端口，也可以改为 'http://localhost:3001'
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000, // 本地生成可能较慢，设置 60s 超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. API 接口函数封装

/**
 * 获取所有数据集和聊天记录列表
 * 对应后端: GET /get_all_role_and_chat
 */
export const getDatasets = async (): Promise<DatasetResponse> => {
  const response = await apiClient.get<DatasetResponse>('/get_all_role_and_chat');
  return response.data;
};

/**
 * 发送消息并获取回复 (普通 POST，非流式)
 * 对应后端: POST /generate_reply
 */
export const generateReply = async (payload: GenerateRequest): Promise<GenerateResponse> => {
  const response = await apiClient.post<GenerateResponse>('/generate_reply', payload);
  return response.data;
};

/**
 * 获取本地图片列表
 * 对应后端: GET /local_images
 */
export const getLocalImages = async (path: string): Promise<string[]> => {
  const response = await apiClient.get<string[]>('/local_images', { params: { path } });
  return response.data;
};

/**
 * 上传图片
 * 对应后端: POST /upload_image
 */
export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ url: string }>('/upload_image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 3. 预留：流式响应处理 (SSE)
// 由于 Axios 对 SSE 支持一般，后续这里可能会改用原生 fetch 或 EventSource
export const generateReplyStream = async (payload: GenerateRequest): Promise<void> => {
  // TODO: 待实现 SSE 逻辑
  console.log('SSE stream logic placeholder', payload);
};

export default apiClient;