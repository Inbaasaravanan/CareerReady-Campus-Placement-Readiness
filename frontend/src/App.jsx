import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CmsProvider } from './context/CmsContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CmsProvider>
          <AppRoutes />
        </CmsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
