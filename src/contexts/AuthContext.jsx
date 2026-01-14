import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(mapSupabaseUser(session.user));
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                setUser(null);
            }
            // Note: onAuthStateChange fires initially too, but checkSession is usually safer for initial load blocking
            // We set loading false in checkSession mostly.
        });

        return () => subscription.unsubscribe();
    }, []);

    // Helper to map Supabase user to App user structure
    const mapSupabaseUser = (sbUser) => {
        const metadata = sbUser.user_metadata || {};
        return {
            id: sbUser.id,
            email: sbUser.email,
            username: metadata.username || sbUser.email.split('@')[0],
            role: metadata.role || 'service', // Default or from metadata
            serviceId: metadata.serviceId,
            serviceName: metadata.serviceName,
            isActive: true
        };
    };

    const login = async (username, password) => {
        try {
            // We use username as email prefix for this app
            const email = `${username}@hopital-braun.com`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Identifiant ou mot de passe incorrect' };
            }

            // User is set via onAuthStateChange
            return { success: true };
        } catch (error) {
            console.error('Unexpected login error:', error);
            return { success: false, error: 'Erreur technique lors de la connexion' };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            // LocalStorage cleaning if needed for mixed mode artifacts
            // localStorage.removeItem('hbc_app_current_session');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
    }
    return context;
};
