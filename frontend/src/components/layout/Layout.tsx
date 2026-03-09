import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useThemeStore } from '../../store/themeStore';
import { useEffect } from 'react';

export const Layout = () => {
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-hk-dark text-hk-light' : 'light bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
