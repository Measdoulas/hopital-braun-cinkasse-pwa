import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Activity } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await login(formData.username, formData.password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Activity size={24} />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Hôpital Braun Cinkassé
                        </CardTitle>
                        <CardDescription className="text-base">
                            Portail de Rapports d'Activité
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="error" title="Erreur de connexion">
                                {error}
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700" htmlFor="username">
                                Identifiant du service
                            </label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Ex: gyneco, chirurgie..."
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="h-11"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700" htmlFor="password">
                                Mot de passe
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="h-11"
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base" isLoading={loading}>
                            Se connecter
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="fixed bottom-4 text-center w-full text-xs text-gray-400">
                © 2026 Hôpital Braun Cinkassé • Système de Reporting v1.0
            </div>
        </div>
    );
};

export default LoginPage;
