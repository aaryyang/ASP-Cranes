import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AlertCircle } from 'lucide-react';
import logo from '../../assets/asp-logo.jpg';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      // Clear password field on error for security
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-32">
              <img 
                src={logo} 
                alt="ASP Cranes" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ASP Cranes CRM</h1>
          <p className="text-gray-600 text-lg">
            Sign in to access your dashboard
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12"
              placeholder="Enter your email"
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-12"
              placeholder="Enter your password"
            />
          </div>
          
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="h-12 text-lg font-medium"
          >
            Sign in
          </Button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>© 2025 ASP Cranes.</p>
        <p className="mt-1">Built by AVARIQ Tech Solutions Pvt. Ltd.</p>
      </div>
    </div>
  );
}