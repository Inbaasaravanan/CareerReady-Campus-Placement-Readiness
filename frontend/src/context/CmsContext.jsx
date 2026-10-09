import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cmsService } from '../services/cmsService';

const CmsContext = createContext(null);

export const CmsProvider = ({ children }) => {
  const [content, setContent] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCmsData = useCallback(async () => {
    try {
      const [allContent, globalSettings] = await Promise.all([
        cmsService.getAllContent().catch(() => ({})),
        cmsService.getGlobalSettings().catch(() => ({}))
      ]);
      setContent(allContent || {});
      setSettings(globalSettings || {});
    } catch (err) {
      console.warn('Could not load CMS content from backend, falling back to defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCmsData();
  }, [fetchCmsData]);

  /**
   * Look up a dynamic presentation string from CMS with immediate fallback
   */
  const cms = useCallback((key, fallback = '') => {
    if (content && content[key] !== undefined && content[key] !== null && content[key] !== '') {
      return content[key];
    }
    return fallback;
  }, [content]);

  /**
   * Look up a global application setting from CMS with immediate fallback
   */
  const setting = useCallback((key, fallback = '') => {
    if (settings && settings[key] !== undefined && settings[key] !== null && settings[key] !== '') {
      return settings[key];
    }
    return fallback;
  }, [settings]);

  const value = {
    content,
    settings,
    loading,
    cms,
    setting,
    refreshCms: fetchCmsData
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    // Return a safe dummy fallback if called outside provider
    return {
      content: {},
      settings: {},
      loading: false,
      cms: (_k, fallback = '') => fallback,
      setting: (_k, fallback = '') => fallback,
      refreshCms: () => {}
    };
  }
  return context;
};
