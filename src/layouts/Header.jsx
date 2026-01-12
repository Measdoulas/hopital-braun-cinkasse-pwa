import React from 'react';
import { Activity, Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 w-full z-30 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-neutral-light rounded-md"
                >
                    <Menu size={24} className="text-neutral-darkest" />
                </button>

                <div className="flex items-center gap-2 text-primary">
                    <Activity className="h-6 w-6" />
                    <h1 className="font-bold text-lg hidden sm:block text-neutral-darkest">
                        Hôpital Braun
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-medium text-neutral-darkest">
                        {user?.serviceName || user?.username}
                    </span>
                    <span className="text-xs text-neutral-500 capitalize">
                        {user?.role}
                    </span>
                </div>

                <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {/* Notification badge placeholder */}
                    <span className="absolute top-2 right-2 h-2 w-2 bg-danger rounded-full" />
                </Button>
            </div>
        </header>
    );
};

export default Header;
