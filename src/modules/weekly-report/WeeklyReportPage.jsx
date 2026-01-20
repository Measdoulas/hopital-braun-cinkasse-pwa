import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
            const key = `rapports-hebdo:${serviceId}:${period.start}`;
            const reportToSave = {
                id: generateId(),
                type: 'weekly',
                serviceId: serviceId,
                period: period,
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

                    <CardContent className="p-0">
                        {error && <div className="p-6 pb-0"><Alert variant="error">{error}</Alert></div>}

                        {/* Zone d'Edition / Visualisation */}
                        <div className="p-6 space-y-8">

                            {/* Mouvements */}
                            {reportData.data?.mouvements && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                            🏥 Mouvements de Patients
                                        </h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <EditableStatBox
                                            label="Entrées"
                                            value={reportData.data.mouvements.entrees}
                                            onChange={(val) => setReportData(prev => ({
                                                ...prev,
                                                data: { ...prev.data, mouvements: { ...prev.data.mouvements, entrees: parseInt(val) || 0 } }
                                            }))}
                                            color="green"
                                        />
                                        <EditableStatBox
                                            label="Sorties"
                                            value={reportData.data.mouvements.sorties?.total}
                                            onChange={(val) => setReportData(prev => ({
                                                ...prev,
                                                data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, total: parseInt(val) || 0 } } }
                                            }))}
                                            color="orange"
                                        />
                                        <EditableStatBox
                                            label="Décès"
                                            value={reportData.data.mouvements.sorties?.deces}
                                            onChange={(val) => setReportData(prev => ({
                                                ...prev,
                                                data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, deces: parseInt(val) || 0 } } }
                                            }))}
                                            color="red"
                                        />
                                        <EditableStatBox
                                            label="Transferts"
                                            value={reportData.data.mouvements.sorties?.transferts}
                                            onChange={(val) => setReportData(prev => ({
                                                ...prev,
                                                data: { ...prev.data, mouvements: { ...prev.data.mouvements, sorties: { ...prev.data.mouvements.sorties, transferts: parseInt(val) || 0 } } }
                                            }))}
                                            color="blue"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Consultations */}
                            {reportData.data?.consultations && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                                        <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                            🩺 Consultations
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <label className="text-sm font-medium text-slate-600">Total Consultations :</label>
                                            <input
                                                type="number"
                                                className="text-3xl font-bold text-purple-700 bg-transparent border-b-2 border-purple-100 focus:border-purple-500 outline-none w-32"
                                                value={reportData.data.consultations.total || 0}
                                                onChange={(e) => setReportData(prev => ({
                                                    ...prev,
                                                    data: { ...prev.data, consultations: { ...prev.data.consultations, total: parseInt(e.target.value) || 0 } }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actes (Liste simplifiée éditable) */}
                            {reportData.data?.actes && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                                        <h3 className="font-bold text-green-800 flex items-center gap-2">
                                            💉 Actes Médicaux
                                        </h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(reportData.data.actes).map(([actId, count]) => (
                                            <div key={actId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="font-medium text-slate-700">{actId}</span>
                                                <input
                                                    type="number"
                                                    className="w-20 text-right font-bold text-green-700 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 outline-none"
                                                    value={count}
                                                    onChange={(e) => setReportData(prev => ({
                                                        ...prev,
                                                        data: {
                                                            ...prev.data,
                                                            actes: { ...prev.data.actes, [actId]: parseInt(e.target.value) || 0 }
                                                        }
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                        {Object.keys(reportData.data.actes || {}).length === 0 && (
                                            <p className="text-slate-500 italic">Aucun acte enregistré pour cette période.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Observations (Textareas éditables) */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                                    <h3 className="font-bold text-amber-800">📝 Observations & Synthèse</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Synthèse de la semaine</label>
                                        <textarea
                                            className="w-full h-24 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ajoutez une synthèse ou des observations générales..."
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
                                </div>
                            </div>

                        </div>
                    </CardContent>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 rounded-b-xl">
                        {!isReadOnly && !success ? (
                            <>
                                <div className="text-xs text-slate-500 self-center mr-4 max-w-xs text-right">
                                    Vérifiez les données ci-dessus. Vous pouvez modifier les chiffres directement avant l'envoi.
                                </div>
                                <Button onClick={handleSubmit} variant="primary" isLoading={loading} className="px-6">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Transmettre au Chef de Service
                                </Button>
                            </>
                        ) : success && (
                            <Button variant="secondary" disabled className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Rapport Transmis !
                            </Button>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default WeeklyReportPage;
