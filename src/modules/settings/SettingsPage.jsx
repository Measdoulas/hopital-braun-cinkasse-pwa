import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { storage } from '../../services/storage';
import { Settings, Save, RefreshCw, Trash2, Database } from 'lucide-react';
import { ROLES, SERVICES } from '../../utils/data-models';
import ServiceConfigSection from './ServiceConfigSection';

const SettingsPage = () => {
    const { user } = useAuth();
    const [hospitalName, setHospitalName] = useState('Hôpital Braun Cinkassé');
    const [loading, setLoading] = useState(false);

    const handleResetData = () => {
        if (confirm("ATTENTION: Cela va effacer toutes les données locales (rapports, comptes, etc.) et recharger la page. Êtes-vous sûr ?")) {
            storage.clear();
            window.location.reload();
        }
    };

    const handleSaveConfig = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert("Configuration sauvegardée (simulation)");
        }, 1000);
    };

    // Déterminer si l'utilisateur est chef de service
    const isServiceChief = user?.role === ROLES.CHEF_SERVICE;
    const userService = SERVICES.find(s => s.id === user?.serviceId);
    const serviceName = userService ? userService.name : (user?.serviceId || 'Votre Service');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
                <p className="text-slate-500 mt-1">Configuration de l'application</p>
            </div>

            <div className="grid gap-6">

                {/* Configuration Spécifique Service (Visible uniquement pour les chefs) */}
                {isServiceChief && (
                    <ServiceConfigSection
                        serviceId={user.serviceId}
                        serviceName={serviceName}
                    />
                )}

                {/* Configuration Générale */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Général
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Nom de l'établissement"
                            value={hospitalName}
                            onChange={(e) => setHospitalName(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSaveConfig} disabled={loading}>
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Zone de Danger / Maintenance */}
                <Card className="border-red-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <Database className="w-5 h-5" />
                            Zone de maintenance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h4 className="font-medium text-red-800 mb-2">Réinitialisation des données</h4>
                            <p className="text-sm text-red-600 mb-4">
                                Cette action effacera toutes les données stockées localement sur cet appareil (comptes, rapports, historique).
                                Au prochain redémarrage, les données de démonstration seront recréées.
                            </p>
                            <Button variant="danger" onClick={handleResetData}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Réinitialiser toutes les données
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
