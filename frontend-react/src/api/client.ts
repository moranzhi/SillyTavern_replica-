import axios from 'axios';
// 导入类型
import type { GenerateRequest, GenerateResponse, Message } from '@/types';

// 定义角色列表接口
// 结构: { "RoleName": ["file1.jsonl", "file2.jsonl"] }
export interface ChatRoleListResponse {
  [roleName: string]: string[];
}

//  创建 Axios 实例
const apiClient = axios.create({
  baseURL: '/api', // 配合 Vite 代理，转发到 http://backend:8000
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// API 接口函数封装
// ==========================================

/**
 * 获取所有角色和聊天记录列表
 * 对应后端: GET /get_all_role_and_chat
 */
export const getChatRoleList = async (): Promise<ChatRoleListResponse> => {
  const response = await apiClient.get<ChatRoleListResponse>('/get_all_role_and_chat');
  return response.data;
};

/**
 * 获取特定聊天记录
 * 对应后端: GET /chat_history?file_path=xxx.jsonl
 *
 * @param filePath - 文件路径，如 "RoleA/chat1.jsonl"
 * @returns Message[] - 消息数组
 */
export const getChatHistory = async (filePath: string): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>('/chat_history', {
    params: { file_path: filePath }
  });
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
export const generateReplyStream = async (payload: GenerateRequest): Promise<void> => {
  // TODO: 待实现 SSE 逻辑
  console.log('SSE stream logic placeholder', payload);
};

export default apiClient;
