import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../services/storage';
import { verifyPassword } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tentative de restauration de session au chargement
        const storedUser = storage.get('current_session');
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            // Récupérer tous les utilisateurs
            const users = storage.get('users') || [];
            const foundUser = users.find(u => u.username === username);

            if (!foundUser) {
                return { success: false, error: 'Identifiant incorrect' };
            }

            const isValid = await verifyPassword(password, foundUser.passwordHash);
            if (!isValid) {
                return { success: false, error: 'Mot de passe incorrect' };
            }

            if (!foundUser.isActive) {
                return { success: false, error: 'Ce compte a été désactivé' };
            }

            // Création de session (on exclut le hash du mot de passe de l'objet session)
            const { passwordHash, ...userSession } = foundUser;

            // Mise à jour date de dernière connexion
            foundUser.lastLogin = new Date().toISOString();
            const updatedUsers = users.map(u => u.id === foundUser.id ? foundUser : u);
            storage.set('users', updatedUsers);

            // Sauvegarde session
            setUser(userSession);
            storage.set('current_session', userSession);

            return { success: true };
        } catch (error) {
            console.error('Erreur login:', error);
            return { success: false, error: 'Erreur technique lors de la connexion' };
        }
    };

    const logout = () => {
        setUser(null);
        storage.remove('current_session');
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
