import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { monthlyReportService } from '../../services/MonthlyReportService';
import { ROLES, SERVICES } from '../../utils/data-models';

const MonthlyReportPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedService, setSelectedService] = useState(user?.serviceId || SERVICES[0].id);

    // Si l'utilisateur est un service, il ne peut voir que son service
    const isServiceUser = user?.role === ROLES.SERVICE || user?.role === ROLES.CHEF_SERVICE;

    useEffect(() => {
        if (isServiceUser && user?.serviceId) {
            setSelectedService(user.serviceId);
        }
    }, [isServiceUser, user]);

    useEffect(() => {
        loadReport();
    }, [selectedService, selectedMonth, selectedYear]);

    const loadReport = async () => {
        if (!selectedService) return;
        setLoading(true);
        try {
            const data = await monthlyReportService.getOrGenerateReport(selectedService, selectedMonth, selectedYear);
            setReport(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!report) return;
        setLoading(true);
        try {
            await monthlyReportService.saveReport(report);
            // Reload to confirm save
            await loadReport();
            alert('Rapport sauvegardé avec succès');
        } catch (e) {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir valider ce rapport ? Il ne sera plus modifiable.')) return;
        setLoading(true);
        try {
            await monthlyReportService.validateReport(report, user.id);
            await loadReport();
        } catch (e) {
            alert('Erreur lors de la validation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        Rapports Mensuels
                    </h1>
                    <p className="text-slate-500">Consultez et validez les rapports mensuels d'activité.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    {!isServiceUser && (
                        <select
                            className="p-2 border rounded"
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                        >
                            {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    <select
                        className="p-2 border rounded"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {format(new Date(2000, i, 1), 'MMMM', { locale: fr })}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2 border rounded"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </header>

            {loading && !report ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : report ? (
                <div className="space-y-6">
                    {/* Status Bar */}
                    <div className={`p-4 rounded-lg flex items-center justify-between ${report.status === 'validated' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                        <div className="flex items-center gap-2 font-medium">
                            {report.status === 'validated' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            Statut : {report.status === 'validated' ? 'Validé' : 'Brouillon (Calculé automatiquement)'}
                        </div>
                        <div className="flex gap-2">
                            {report.status !== 'validated' && (
                                <>
                                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-white border border-yellow-300 rounded hover:bg-yellow-100 flex items-center gap-2 text-sm font-medium">
                                        <Save size={16} /> Sauvegarder
                                    </button>
                                    {(user.role === ROLES.CHEF_SERVICE || user.role === ROLES.Admin) && (
                                        <button onClick={handleValidate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">
                                            Valider
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Mouvements */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">Mouvements</h3>
                            <div className="flex justify-between">
                                <span>Entrées</span>
                                <span className="font-bold">{report.data?.mouvements?.entrees}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sorties (Total)</span>
                                <span className="font-bold">{report.data?.mouvements?.sorties?.total}</span>
                            </div>
                            <div className="pl-4 text-sm text-slate-600 space-y-1 bg-slate-50 p-2 rounded">
                                <div className="flex justify-between"><span>Décès</span><span>{report.data?.mouvements?.sorties?.deces}</span></div>
                                <div className="flex justify-between"><span>Transferts</span><span>{report.data?.mouvements?.sorties?.transferts}</span></div>
                                <div className="flex justify-between"><span>Référés</span><span>{report.data?.mouvements?.sorties?.referes}</span></div>
                                <div className="flex justify-between"><span>À Domicile</span><span>{report.data?.mouvements?.sorties?.aDomicile}</span></div>
                            </div>
                        </div>

                        {/* Consultations */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">Consultations</h3>
                            <div className="flex justify-between text-xl">
                                <span>Total</span>
                                <span className="font-bold text-blue-600">{report.data?.consultations?.total}</span>
                            </div>
                        </div>

                        {/* Actes (Top 5) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">Actes Principaux</h3>
                            <div className="space-y-2">
                                {Object.entries(report.data?.actes || {})
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([actId, count]) => (
                                        <div key={actId} className="flex justify-between">
                                            <span className="truncate">{actId}</span>
                                            <span className="font-mono font-bold">{count}</span>
                                        </div>
                                    ))}
                                {Object.keys(report.data?.actes || {}).length === 0 && <p className="text-slate-400 italic">Aucun acte enregistré</p>}
                            </div>
                        </div>

                        {/* Observations */}
                        <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">Observations & Pannes</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-red-600 mb-2">Pannes Signalées</h4>
                                    <textarea
                                        readOnly={report.status === 'validated'}
                                        className="w-full h-32 p-2 text-sm border rounded bg-slate-50"
                                        value={report.data?.observations?.pannes || 'R.A.S.'}
                                        onChange={e => setReport(prev => ({ ...prev, data: { ...prev.data, observations: { ...prev.data.observations, pannes: e.target.value } } }))}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-600 mb-2">Observations Générales</h4>
                                    <textarea
                                        readOnly={report.status === 'validated'}
                                        className="w-full h-32 p-2 text-sm border rounded bg-slate-50"
                                        value={report.data?.observations?.general || 'R.A.S.'}
                                        onChange={e => setReport(prev => ({ ...prev, data: { ...prev.data, observations: { ...prev.data.observations, general: e.target.value } } }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-500 py-12">Sélectionnez un service et un mois pour voir le rapport.</div>
            )}
        </div>
    );
};

export default MonthlyReportPage;
