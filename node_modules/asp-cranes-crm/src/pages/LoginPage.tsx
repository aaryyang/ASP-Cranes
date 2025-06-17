import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return <LoginForm />;
}