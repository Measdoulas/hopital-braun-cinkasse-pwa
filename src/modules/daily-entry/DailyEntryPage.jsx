import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/storage';
import { generateId } from '../../utils/ids';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Calendar, Save, CheckCircle } from 'lucide-react';
import ServiceForm from './forms/ServiceForm';
import { SERVICES, ROLES } from '../../utils/data-models';

const DailyEntryPage = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedDateFin, setSelectedDateFin] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [formData, setFormData] = useState({});
    const [traceability, setTraceability] = useState({
        agentName: '',
        teamMembers: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Chargement des données au changement de date
    useEffect(() => {
        loadData(selectedDate);
    }, [selectedDate, user.username]);

    const loadData = async (date) => {
        if (!user?.username) return;

        setLoading(true);
        // Clé de stockage: rapports-journaliers:SERVICE:DATE ou rapports-journaliers:SERVICE:DATE_DATEFIN
        const key = selectedDateFin && selectedDateFin !== date
            ? `rapports-journaliers:${user.username}:${date}_${selectedDateFin}`
            : `rapports-journaliers:${user.username}:${date}`;
        // Note: storage.get est async maintenant
        const savedReport = await storage.get(key);

        if (savedReport) {
            setFormData(savedReport.data || {});
            setTraceability({
                agentName: savedReport.agentSaisissant || '',
                teamMembers: (savedReport.equipeGarde || []).join(', ') || ''
            });
            // Charger dateFin si disponible
            if (savedReport.dateFin && savedReport.dateFin !== savedReport.date) {
                setSelectedDateFin(savedReport.dateFin);
            }
        } else {
            // Nouvelle saisie
            setFormData({});
            setTraceability({ agentName: '', teamMembers: '' });
        }
        setSuccess(false);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!traceability.agentName) {
            setError("Le nom de l'agent saisissant est obligatoire");
            return;
        }

        // Validation période
        if (selectedDateFin < selectedDate) {
            setError("La date de fin doit être >= à la date de début");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const reportToSave = {
                serviceId: user.username,
                serviceName: user.serviceName, // Nouvelle propriété
                date: selectedDate,
                dateFin: selectedDateFin, // Nouvelle propriété
                data: formData,
                agentSaisissant: traceability.agentName,
                equipeGarde: traceability.teamMembers.split(',').map(m => m.trim()).filter(Boolean),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Clé incluant la période si nécessaire
            const key = selectedDateFin && selectedDateFin !== selectedDate
                ? `rapports-journaliers:${user.username}:${selectedDate}_${selectedDateFin}`
                : `rapports-journaliers:${user.username}:${selectedDate}`;

            const successSave = await storage.set(key, reportToSave);

            if (successSave) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                throw new Error("Erreur lors de l'écriture dans le stockage");
            }
        } catch (err) {
            setError("Erreur lors de la sauvegarde : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
        setSuccess(false); // Reset success message on change
    };

    const getServiceName = () => {
        const service = SERVICES.find(s => s.id === user.serviceId || s.id === user.username);
        return service ? service.name : user.serviceName;
    }

    // Chef de Service = Mode lecture seule
    const isReadOnly = user.role === ROLES.CHEF_SERVICE;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {isReadOnly && (
                <Alert type="info">
                    <strong>Mode Consultation</strong> - En tant que Chef de Service, vous pouvez consulter les rapports mais pas les modifier.
                </Alert>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-darkest">Rapport du Jour</h1>
                    <p className="text-neutral-500">{getServiceName()}</p>
                </div>

                <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    {/* Date de début */}
                    <div className="flex items-center gap-2">
                        <Calendar className="text-slate-500" size={20} />
                        <label className="text-sm font-medium text-slate-700">Début :</label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto"
                        />
                    </div>

                    {/* Date de fin */}
                    <div className="flex items-center gap-2">
                        <Calendar className="text-slate-500" size={20} />
                        <label className="text-sm font-medium text-slate-700">Fin :</label>
                        <Input
                            type="date"
                            value={selectedDateFin}
                            onChange={(e) => setSelectedDateFin(e.target.value)}
                            className="w-auto"
                        />
                    </div>

                    <p className="text-xs text-slate-500">
                        Période de garde ({selectedDate === selectedDateFin ? '1 jour' : 'garde 24h'})
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Agent Saisissant <span className="text-danger">*</span></label>
                            <Input
                                placeholder="Votre nom complet"
                                value={traceability.agentName}
                                onChange={(e) => setTraceability(prev => ({ ...prev, agentName: e.target.value }))}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Équipe de Garde</label>
                            <Input
                                placeholder="Noms séparés par des virgules"
                                value={traceability.teamMembers}
                                onChange={(e) => setTraceability(prev => ({ ...prev, teamMembers: e.target.value }))}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div className="border-t border-neutral-100 my-4" />

                    {/* Formulaire Spécifique au Service */}
                    <ServiceForm
                        serviceId={user.serviceId || user.username}
                        data={formData}
                        onChange={handleFormChange}
                    />

                    {error && (
                        <Alert variant="error" title="Erreur">
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success" title="Succès">
                            Données enregistrées avec succès.
                        </Alert>
                    )}

                    {!isReadOnly && (
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSave}
                                isLoading={loading}
                                className="w-full md:w-auto"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyEntryPage;
