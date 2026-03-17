import { NavLink } from 'react-router-dom';
import { Home, FileText, BookOpen, Calendar, Clock, Wallet, Target } from 'lucide-react';

const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Notas', path: '/notes', icon: FileText },
    { name: 'Libros', path: '/books', icon: BookOpen },
    { name: 'Horarios', path: '/schedules', icon: Clock },
    { name: 'Eventos', path: '/events', icon: Calendar },
    { name: 'Finanzas', path: '/finances', icon: Wallet },
    { name: 'Hábitos', path: '/habits', icon: Target },
];

export const Sidebar = () => (
    <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
            <div className="sidebar-logo-glow" />
            <span className="sidebar-logo-text">Dash</span>
        </div>

        <nav className="sidebar-nav">
            {navItems.map(({ name, path, icon: Icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <span className={`sidebar-item-indicator ${isActive ? 'sidebar-item-indicator--active' : ''}`} />
                            <Icon className="sidebar-item-icon" />
                            <span className="sidebar-item-label">{name}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>

        {/* Bottom decoration */}
        <div className="sidebar-footer">
            <div className="sidebar-footer-line" />
        </div>
    </aside>
);
