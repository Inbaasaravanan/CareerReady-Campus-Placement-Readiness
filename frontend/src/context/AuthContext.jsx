import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return authService.getCurrentUser();
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('careerready_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('careerready_user');
      localStorage.removeItem('careerready_token');
    }
  }, [user]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password, role);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (studentData) => {
    setLoading(true);
    try {
      const res = await authService.register(studentData);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchRole = async (targetRole) => {
    const roleEmails = {
      student: 'student@careerready.ai',
      staff: 'staff@careerready.ai',
      hod: 'hod@careerready.ai',
      admin: 'inbaasara@gmail.com'
    };
    const rolePasswords = {
      student: 'password123',
      staff: 'password123',
      hod: 'password123',
      admin: 'Inbaa@1234'
    };
    const roleMap = {
      student: 'STUDENT',
      staff: 'STAFF',
      hod: 'HOD',
      admin: 'ADMIN'
    };
    const email = roleEmails[targetRole] || 'student@careerready.ai';
    const password = rolePasswords[targetRole] || 'password123';
    const roleParam = roleMap[targetRole] || targetRole.toUpperCase();
    try {
      await login(email, password, roleParam);
    } catch (err) {
      console.error('Failed to switch to real database role account:', err);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    switchRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
