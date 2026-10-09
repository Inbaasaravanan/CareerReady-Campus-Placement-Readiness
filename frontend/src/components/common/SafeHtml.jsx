import React from 'react';

/**
 * Safe HTML renderer that sanitizes content to prevent XSS.
 * Removes <script>, <iframe>, <object>, <embed>, inline javascript (onclick etc).
 */
export const SafeHtml = ({ html = '', className = '', style = {} }) => {
  if (!html) return null;

  // Simple and safe HTML sanitization
  const sanitize = (raw) => {
    if (typeof raw !== 'string') return '';
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"']*/gi, '');
  };

  const clean = sanitize(html);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
