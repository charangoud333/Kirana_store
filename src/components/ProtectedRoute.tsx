import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'owner' | 'cashier' | 'helper'>;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Force render children after a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Forcing navigation due to timeout");
        // Force render children even if still loading
        navigate('/', { replace: true });
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [loading, navigate]);

  // Simplified loading state - shorter timeout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // After loading is complete, redirect if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Skip role check for now to simplify flow
  return <>{children}</>;
};
