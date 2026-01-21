import React, { useState, useEffect } from 'react';
import { format, getISOWeek, getYear } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/storage';
import { compileWeeklyReport, getWeekRange } from '../../utils/reports';
import { generateId } from '../../utils/ids';
import { REPORT_STATUS, ROLES } from '../../utils/data-models';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import ServiceForm from '../daily-entry/forms/ServiceForm';
import { Calendar, FileText, CheckCircle } from 'lucide-react';

// Composant helper pour les stats éditables
const EditableStatBox = ({ label, value, onChange, color }) => {
    const colorClasses = {
        green: 'text-green-700 focus:border-green-500',
        orange: 'text-orange-700 focus:border-orange-500',
        red: 'text-red-700 focus:border-red-500',
        blue: 'text-blue-700 focus:border-blue-500',
    };

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            <input
                type="number"
                className={`text-2xl font-bold bg-white border border-slate-200 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-offset-1 ${colorClasses[color] || 'text-slate-900'}`}
                value={value || 0}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

const WeeklyReportPage = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reportData, setReportData] = useState(null);
    const [period, setPeriod] = useState({ start: null, end: null });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // S'assurer que le serviceId est correct (user.username ou user.serviceId selon implémentation)
    const serviceId = user?.username;

    const handleGenerate = async () => {
        if (!serviceId) return;

        setLoading(true);
        try {
            const compiled = await compileWeeklyReport(serviceId, selectedDate);
            setReportData(compiled);
            setPeriod({
                start: compiled.startDate,
                end: compiled.endDate
            });
            console.log("Rapport généré:", compiled);
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la compilation des données.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!reportData || !period.start) return;

        setLoading(true);
        setError('');

        try {
            // Clé unique pour la semaine : rapports-hebdo:SERVICE:YYYY-MM-DD(start)
            const startDate = new Date(period.start);
            const key = `rapports-hebdo:${serviceId}:${period.start}`;

            const reportToSave = {
                id: generateId(), // Supabase générera son propre UUID, ceci est pour le fallback localStorage
                type: 'weekly',
                serviceId: serviceId,
                period: period,
                weekNumber: getISOWeek(startDate),
                year: getYear(startDate),
                data: reportData.data,
                status: REPORT_STATUS.TRANSMITTED_TO_CHIEF,
                submittedAt: new Date().toISOString(),
                submittedBy: user.username,
                dailyReportsCount: reportData.dailyReportsCount
            };

            const saved = await storage.set(key, reportToSave);
            if (saved) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                throw new Error("Échec de la sauvegarde.");
            }
        } catch (err) {
            setError("Erreur lors de la soumission : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Chef de Service = Mode lecture seule
    const isReadOnly = user.role === ROLES.CHEF_SERVICE;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {isReadOnly && (
                <Alert type="info">
                    <strong>Mode Consultation</strong> - En tant que Chef de Service, vous pouvez consulter les rapports hebdomadaires mais pas en générer de nouveaux.
                </Alert>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-darkest">Rapport Hebdomadaire</h1>
                    <p className="text-neutral-500">Compilation et soumission</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sélection de la période</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1 max-w-xs">
                            <label className="text-sm font-medium">Sélectionner une date dans la semaine</label>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                                <Calendar className="text-primary h-5 w-5" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border-none focus:ring-0 text-sm w-full"
                                />
                            </div>
                        </div>
                        {!isReadOnly && (
                            <Button onClick={handleGenerate} isLoading={loading}>
                                <FileText className="mr-2 h-4 w-4" />
                                Générer Prévisualisation
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100">
                        <div>
                            <CardTitle className="text-xl text-blue-900">Prévisualisation du Rapport Hebdomadaire</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                                    Semaine du {format(new Date(period.start), 'dd/MM/yyyy')} au {format(new Date(period.end), 'dd/MM/yyyy')}
                                </span>
                                <span className="text-sm text-slate-500">
                                    • {reportData.dailyReportsCount} rapports quotidiens inclus
                                </span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 bg-neutral-100/50 min-h-screen flex justify-center py-8">
                        {error && <div className="max-w-4xl mx-auto mb-4 w-full"><Alert variant="error">{error}</Alert></div>}

                        {/* Feuille A4 "Virtuelle" pour le rapport */}
                        <div className="bg-white shadow-lg border border-neutral-200 max-w-[210mm] w-full mx-auto p-[15mm] text-neutral-900">

                            {/* En-tête du Document */}
                            <div className="border-b-2 border-neutral-800 pb-4 mb-8 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-wide text-neutral-900">Rapport d'Activité Hebdomadaire</h1>
                                    <div className="mt-2 text-sm text-neutral-600">
                                        <p><span className="font-bold">Service :</span> {serviceId?.toUpperCase()}</p>
                                        <p><span className="font-bold">Période :</span> du {format(new Date(period.start), 'dd/MM/yyyy')} au {format(new Date(period.end), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-neutral-500">
                                    <p>Généré le {format(new Date(), 'dd/MM/yyyy')}</p>
                                    <p>Réf: HEB-{format(new Date(period.start), 'ww-yyyy')}</p>
                                </div>
                            </div>

                            <div className="space-y-8">

                                {/* TABLEAU 1: MOUVEMENTS & EFFECTIFS */}
                                <section>
                                    <h2 className="text-sm font-bold uppercase border-b border-neutral-300 mb-2 pb-1 text-neutral-700">1. Mouvements des Malades</h2>
                                    <table className="w-full border-collapse border border-neutral-300 text-sm">
                                        <thead className="bg-neutral-50 text-neutral-700">
                                            <tr>
                                                <th className="border border-neutral-300 p-2 text-left w-1/2">Désignation</th>
                                                <th className="border border-neutral-300 p-2 text-center w-1/4">Valeur</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Entrées */}
                                            <tr>
                                                <td className="border border-neutral-300 p-2 font-medium">Entrées</td>
                                                <td className="border border-neutral-300 p-0">
                                                    <input
                                                        type="number"
                                                        className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50 font-bold"
                                                        value={reportData.data.mouvements.entrees}
                                                        onChange={(e) => setReportData(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data, mouvements: { ...prev.data.mouvements, entrees: parseInt(e.target.value) || 0 } }
                                                        }))}
                                                    />
                                                </td>
                                            </tr>
                                            {/* Sorties (Sous-titre) */}
                                            <tr className="bg-neutral-50">
                                                <td colSpan="2" className="border border-neutral-300 p-1 text-xs font-bold text-neutral-500 uppercase tracking-wider pl-2">Sorties</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-neutral-300 p-2 pl-6">Guéris / Améliorés (Sorties)</td>
                                                <td className="border border-neutral-300 p-0">
                                                    <input
                                                        type="number"
                                                        className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50"
                                                        value={reportData.data.mouvements.sorties?.total}
                                                        onChange={(e) => setReportData(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, total: parseInt(e.target.value) || 0 } } }
                                                        }))}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-neutral-300 p-2 pl-6">Décès</td>
                                                <td className="border border-neutral-300 p-0">
                                                    <input
                                                        type="number"
                                                        className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50 text-red-600 font-medium"
                                                        value={reportData.data.mouvements.sorties?.deces}
                                                        onChange={(e) => setReportData(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, deces: parseInt(e.target.value) || 0 } } }
                                                        }))}
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-neutral-300 p-2 pl-6">Transferts / Évadés</td>
                                                <td className="border border-neutral-300 p-0">
                                                    <input
                                                        type="number"
                                                        className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50"
                                                        value={reportData.data.mouvements.sorties?.transferts}
                                                        onChange={(e) => setReportData(prev => ({
                                                            ...prev,
                                                            data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, transferts: parseInt(e.target.value) || 0 } } }
                                                        }))}
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </section>

                                {/* TABLEAU 2: ACTIVITÉS & CONSULTATIONS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section>
                                        <h2 className="text-sm font-bold uppercase border-b border-neutral-300 mb-2 pb-1 text-neutral-700">2. Consultations</h2>
                                        <table className="w-full border-collapse border border-neutral-300 text-sm">
                                            <tbody>
                                                <tr>
                                                    <td className="border border-neutral-300 p-2 font-medium bg-neutral-50 w-2/3">Total Consultations</td>
                                                    <td className="border border-neutral-300 p-0">
                                                        <input
                                                            type="number"
                                                            className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50 font-bold"
                                                            value={reportData.data.consultations.total || 0}
                                                            onChange={(e) => setReportData(prev => ({
                                                                ...prev,
                                                                data: { ...prev.data, consultations: { ...prev.data.consultations, total: parseInt(e.target.value) || 0 } }
                                                            }))}
                                                        />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </section>

                                    <section>
                                        <h2 className="text-sm font-bold uppercase border-b border-neutral-300 mb-2 pb-1 text-neutral-700">3. Actes Médicaux</h2>
                                        <table className="w-full border-collapse border border-neutral-300 text-sm">
                                            <thead className="bg-neutral-50 text-neutral-700">
                                                <tr>
                                                    <th className="border border-neutral-300 p-2 text-left">Acte</th>
                                                    <th className="border border-neutral-300 p-2 text-center w-24">Nb</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(reportData.data.actes || {}).map(([actId, count]) => (
                                                    <tr key={actId}>
                                                        <td className="border border-neutral-300 p-2">{actId}</td>
                                                        <td className="border border-neutral-300 p-0">
                                                            <input
                                                                type="number"
                                                                className="w-full h-full p-2 text-center bg-transparent outline-none focus:bg-blue-50"
                                                                value={count}
                                                                onChange={(e) => setReportData(prev => ({
                                                                    ...prev,
                                                                    data: {
                                                                        ...prev.data,
                                                                        actes: { ...prev.data.actes, [actId]: parseInt(e.target.value) || 0 }
                                                                    }
                                                                }))}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                {Object.keys(reportData.data.actes || {}).length === 0 && (
                                                    <tr><td colSpan="2" className="border border-neutral-300 p-2 text-center italic text-neutral-500">Aucun acte</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                </div>

                                {/* SECTION 4: OBSERVATIONS */}
                                <section>
                                    <h2 className="text-sm font-bold uppercase border-b border-neutral-300 mb-2 pb-1 text-neutral-700">4. Observations & Synthèse</h2>
                                    <div className="border border-neutral-300 rounded p-0">
                                        <textarea
                                            className="w-full h-32 p-4 text-sm bg-transparent outline-none resize-y"
                                            placeholder="Saisir les observations générales, problèmes rencontrés ou synthèse de la semaine..."
                                            value={reportData.data.observations?.general || ''}
                                            onChange={(e) => setReportData(prev => ({
                                                ...prev,
                                                data: {
                                                    ...prev.data,
                                                    observations: { ...prev.data.observations || {}, general: e.target.value }
                                                }
                                            }))}
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-1 text-right">Ce champ s'agrandit automatiquement à la saisie</p>
                                </section>

                                <div className="pt-8 flex justify-end">
                                    <div className="text-center w-48">
                                        <p className="text-sm font-bold mb-8">Le Chef de Service</p>
                                        <div className="border-t border-neutral-300 pt-1 text-xs text-neutral-500">(Signature)</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Actions Flottantes ou Fixes en bas */}
                        {!isReadOnly && !success && (
                            <div className="fixed bottom-6 right-6 flex gap-4 bg-white/90 backdrop-blur shadow-lg p-2 rounded-lg border border-neutral-200">
                                <Button onClick={handleSubmit} variant="primary" isLoading={loading} className="shadow-md">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Transmettre au Chef de Service
                                </Button>
                            </div>
                        )}

                        {success && (
                            <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur shadow-lg p-2 rounded-lg border border-green-200">
                                <Button variant="secondary" disabled className="text-green-600 bg-green-50 border-none">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Rapport Transmis avec succès
                                </Button>
                            </div>
                        )}

                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WeeklyReportPage;
