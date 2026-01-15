import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
    LayoutDashboard,
    FileEdit,
    History,
    Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/data-models';

const BottomNav = ({ onMoreClick }) => {
    const { user } = useAuth();

    const getNavItems = (role) => {
        // Sur mobile, on limite à 4-5 items max pour l'espace
        const items = [
            { to: '/', icon: LayoutDashboard, label: 'Accueil', roles: [ROLES.SERVICE, ROLES.DIRECTION, ROLES.ADMIN] },
            { to: '/saisie', icon: FileEdit, label: 'Rapport du jour', roles: [ROLES.SERVICE] },
            { to: '/validation', icon: FileEdit, label: 'Valid.', roles: [ROLES.DIRECTION, ROLES.CHEF_SERVICE, ROLES.ADMIN] },
            { to: '/historique', icon: History, label: 'Historique', roles: [ROLES.SERVICE, ROLES.CHEF_SERVICE, ROLES.DIRECTION] },
        ];
        return items.filter(item => item.roles.includes(role));
    };

    const navItems = getNavItems(user?.role);

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 h-16 flex items-center justify-around px-2 z-30 lg:hidden pb-safe">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        clsx(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive ? "text-primary" : "text-neutral-500 hover:text-neutral-darkest"
                        )
                    }
                >
                    <item.icon size={24} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}

            {/* Bouton "Plus" pour ouvrir le menu complet (sidebar) sur mobile si besoin */}
            <button
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-neutral-500 hover:text-neutral-darkest"
            >
                <Menu size={24} />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </nav>
    );
};

export default BottomNav;
