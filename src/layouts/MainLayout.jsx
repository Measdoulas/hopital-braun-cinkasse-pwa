import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { X } from 'lucide-react';

/**
 * MainLayout - Approche Mobile-First
 * 
 * MOBILE (default) : Header fixe + Contenu + BottomNav fixe
 * DESKTOP (lg+) : Header fixe + Sidebar (flow normal, pas fixed) + Contenu
 */
const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header - Fixe en haut sur toutes les résolutions */}
            <Header onMenuClick={toggleMobileMenu} />

            {/* Container principal - Flexbox pour Desktop */}
            <div className="flex flex-1 pt-16">
                {/* Sidebar Desktop (lg+) - Flow normal, pas fixed */}
                <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0">
                    <Sidebar />
                </aside>

                {/* Mobile Sidebar (Overlay sur mobile <lg) */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={closeMobileMenu}
                        />

                        {/* Sidebar Panel */}
                        <div className="absolute left-0 top-0 h-full w-3/4 max-w-xs bg-white shadow-2xl">
                            {/* Close button */}
                            <div className="flex items-center justify-end p-4 border-b border-slate-200">
                                <button
                                    onClick={closeMobileMenu}
                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                    aria-label="Fermer le menu"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Sidebar content */}
                            <Sidebar onClose={closeMobileMenu} />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto">
                    {/* Padding bottom pour le BottomNav sur mobile */}
                    <div className="p-4 pb-24 lg:p-8 lg:pb-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Bottom Navigation - Visible uniquement sur mobile */}
            <div className="lg:hidden">
                <BottomNav onMoreClick={toggleMobileMenu} />
            </div>
        </div>
    );
};

export default MainLayout;
