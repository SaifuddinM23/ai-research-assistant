import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
};

export const getDocuments = () => api.get('/documents');

export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const sendMessage = (question, chatHistory, documentIds) =>
  api.post('/chat', {
    question,
    chat_history: chatHistory,
    document_ids: documentIds,
  });

export const healthCheck = () => api.get('/health');
