import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
    LayoutDashboard,
    FileEdit,
    FileText,
    History,
    BarChart2,
    LogOut,
    Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/data-models';

/**
 * Sidebar Component - Premium Design with Accessibility
 * Navigation verticale avec états actifs clairs, ARIA labels, et navigation clavier
 */
const Sidebar = ({ className, onClose }) => {
    const { user, logout } = useAuth();

    const getNavItems = (role) => {
        const items = [
            {
                to: '/',
                icon: LayoutDashboard,
                label: 'Tableau de bord',
                roles: [ROLES.SERVICE, ROLES.CHEF_SERVICE, ROLES.DIRECTION, ROLES.ADMIN]
            },
            {
                to: '/saisie',
                icon: FileEdit,
                label: 'Rapport du jour',
                roles: [ROLES.SERVICE, ROLES.CHEF_SERVICE]
            },
            {
                to: '/rapports',
                icon: FileText,
                label: 'Rapports Hebdo',
                roles: [ROLES.SERVICE, ROLES.CHEF_SERVICE]
            },
            {
                to: '/validation',
                icon: FileText,
                label: 'Validation',
                roles: [ROLES.DIRECTION, ROLES.CHEF_SERVICE, ROLES.ADMIN]
            },
            {
                to: '/historique',
                icon: History,
                label: 'Historique',
                roles: [ROLES.SERVICE, ROLES.CHEF_SERVICE, ROLES.DIRECTION, ROLES.ADMIN]
            },
            {
                to: '/statistiques',
                icon: BarChart2,
                label: 'Statistiques',
                roles: [ROLES.DIRECTION, ROLES.ADMIN]
            },
            {
                to: '/parametres',
                icon: Settings,
                label: 'Paramètres',
                roles: [ROLES.DIRECTION, ROLES.ADMIN]
            },
        ];
        return items.filter(item => item.roles.includes(role));
    };

    const navItems = getNavItems(user?.role);

    return (
        <aside
            className={clsx(
                "w-full h-full bg-white flex flex-col",
                "border-r border-slate-200",
                className
            )}
            role="navigation"
            aria-label="Navigation principale"
        >
            {/* En-tête de navigation */}
            <div className="p-6 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Navigation
                </p>
            </div>

            {/* Items de navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            clsx(
                                // Base styles
                                "flex items-center gap-3 px-4 py-3",
                                "rounded-xl text-sm font-medium",
                                "transition-all duration-200",
                                "group",

                                // Focus visible (accessibilité clavier)
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",

                                // États
                                isActive ? [
                                    // État actif - Bleu avec fond
                                    "bg-blue-50 text-blue-700",
                                    "shadow-sm"
                                ] : [
                                    // État inactif
                                    "text-slate-600",
                                    "hover:bg-slate-50 hover:text-slate-900"
                                ]
                            )
                        }
                        aria-label={`Aller à ${item.label}`}
                        aria-current={({ isActive }) => isActive ? 'page' : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    className={clsx(
                                        "w-5 h-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                    )}
                                    aria-hidden="true"
                                />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer avec bouton déconnexion */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={() => {
                        logout();
                        onClose && onClose();
                    }}
                    className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3",
                        "rounded-xl text-sm font-medium",
                        "text-red-600",
                        "hover:bg-red-50",
                        "transition-colors duration-200",
                        // Focus visible
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    )}
                    aria-label="Se déconnecter de l'application"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
