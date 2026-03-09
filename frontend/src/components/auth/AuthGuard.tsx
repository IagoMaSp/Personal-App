import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, checkSession } = useAuthStore();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-hk-dark">
                <div className="w-8 h-8 border-4 border-hk-accent/30 border-t-hk-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    return <>{children}</>;
};
