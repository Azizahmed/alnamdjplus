import { insforge } from './apiClient';

export const storageApi = {
  upload: async (bucket: string, file: File, path?: string) => {
    const key = path || `${Date.now()}-${file.name}`;
    const { data, error } = await insforge.storage.from(bucket).upload(key, file);
    if (error) throw error;
    return { key: data?.key || key, url: data?.url || '' };
  },

  getPublicUrl: (bucket: string, key: string) => {
    return `https://u74dqt4w.eu-central.insforge.app/api/storage/buckets/${bucket}/objects/${encodeURIComponent(key)}`;
  },

  download: async (bucket: string, key: string) => {
    return insforge.storage.from(bucket).download(key);
  },

  remove: async (bucket: string, key: string) => {
    return insforge.storage.from(bucket).remove(key);
  },
};
