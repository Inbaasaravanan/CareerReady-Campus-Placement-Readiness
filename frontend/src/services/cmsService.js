import api, { getErrorMessage } from './api';

export const cmsService = {
  // --- Public / Frontend Consumer APIs ---

  async getAllContent() {
    try {
      const res = await api.get('/cms/all');
      if (res.data && res.data.success) {
        return res.data.data || {};
      }
      return {};
    } catch {
      return {};
    }
  },

  async getPageContent(pageKey) {
    try {
      const res = await api.get(`/cms/page/${pageKey}`);
      if (res.data && res.data.success) {
        return res.data.data || {};
      }
      return {};
    } catch {
      return {};
    }
  },

  async getGlobalSettings() {
    try {
      const res = await api.get('/cms/settings');
      if (res.data && res.data.success) {
        return res.data.data || {};
      }
      return {};
    } catch {
      return {};
    }
  },

  // --- Admin CMS Management APIs (Strictly Admin Role Only) ---

  async adminGetContent() {
    try {
      const res = await api.get('/admin/cms/content');
      if (res.data && res.data.success) {
        return res.data.data || [];
      }
      throw new Error(res.data?.message || 'Failed to fetch CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminGetPageContent(pageKey) {
    try {
      const res = await api.get(`/admin/cms/page/${pageKey}`);
      if (res.data && res.data.success) {
        return res.data.data || [];
      }
      throw new Error(res.data?.message || 'Failed to fetch page CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminSaveContent(contentDto) {
    try {
      const res = await api.post('/admin/cms/content', contentDto);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to save CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminSaveBatch(items) {
    try {
      const res = await api.post('/admin/cms/batch', { items });
      if (res.data && res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to save batch CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminUpdateContent(id, contentDto) {
    try {
      const res = await api.put(`/admin/cms/content/${id}`, contentDto);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to update CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminDeleteContent(id) {
    try {
      const res = await api.delete(`/admin/cms/content/${id}`);
      if (res.data && res.data.success) {
        return true;
      }
      throw new Error(res.data?.message || 'Failed to delete CMS content');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- Admin Media Library APIs ---

  async adminGetMedia() {
    try {
      const res = await api.get('/admin/cms/media');
      if (res.data && res.data.success) {
        return res.data.data || [];
      }
      throw new Error(res.data?.message || 'Failed to fetch media library');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminUploadMedia(file, altText = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (altText) {
        formData.append('altText', altText);
      }

      const res = await api.post('/admin/cms/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to upload media file');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminDeleteMedia(id) {
    try {
      const res = await api.delete(`/admin/cms/media/${id}`);
      if (res.data && res.data.success) {
        return true;
      }
      throw new Error(res.data?.message || 'Failed to delete media');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- Admin Global Settings APIs ---

  async adminGetSettings() {
    try {
      const res = await api.get('/admin/cms/settings');
      if (res.data && res.data.success) {
        return res.data.data || [];
      }
      throw new Error(res.data?.message || 'Failed to fetch global settings');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async adminUpdateSettings(settingsMap) {
    try {
      const res = await api.put('/admin/cms/settings', settingsMap);
      if (res.data && res.data.success) {
        return res.data.data || {};
      }
      throw new Error(res.data?.message || 'Failed to update global settings');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};
