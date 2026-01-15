import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { SupabaseStorageService } from '../../services/SupabaseStorageService';
import { SERVICES, ROLES } from '../../utils/data-models';
import { SERVICE_CONFIGS } from '../daily-entry/forms/form-config';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Users, Activity, BedDouble, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * StatisticsPage - Tableau de Bord Médical Analytique
 * Focus: Flux patients, Mortalité, Occupation, Actes
 */
const StatisticsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [stats, setStats] = useState({
        admissions: 0,
        deces: 0,
        guerisons: 0,
        occupationMoyenne: 0,
        byService: [],
        trendData: [],
        actsData: []
    });

    // Filtre Service : Bloqué pour les chefs, ouvert pour la Direction
    const canFilterService = user.role === ROLES.DIRECTION || user.role === ROLES.ADMIN;
    const initialService = (user.role === ROLES.SERVICE || user.role === ROLES.CHEF_SERVICE)
        ? (user.serviceId || user.username)
        : 'all';
    const [selectedService, setSelectedService] = useState(initialService);

    // Métriques sélectionnées pour l'affichage
    const [selectedMetrics, setSelectedMetrics] = useState(['admissions', 'deces']);

    const toggleMetric = (metric) => {
        setSelectedMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    };

    const getChartTitle = () => {
        if (selectedMetrics.length === 0) return "Aucune donnée sélectionnée";

        const labels = {
            admissions: "Admissions",
            deces: "Décès",
            guerisons: "Guérisons",
            referes: "Référés (Ext)",
            transferts: "Transférés (Int)",
            evasions: "Évasions",
            observ: "Mise en Obs."
        };

        if (selectedMetrics.length <= 3) {
            return "Évolution : " + selectedMetrics.map(m => labels[m]).join(" vs ");
        }
        return "Vue d'ensemble Multi-Métrique (" + selectedMetrics.length + " indicateurs)";
    };

    useEffect(() => {
        loadMedicalStats();
    }, [period, selectedService]);

    const loadMedicalStats = async () => {
        setLoading(true);
        const storage = SupabaseStorageService.getInstance();

        try {
            // 1. Récupérer les rapports sur la période
            const serviceFilter = selectedService === 'all' ? null : selectedService;
            const reports = await storage.getDailyReportsInRange(period.start, period.end, serviceFilter);

            // 2. Agréger les données médicales
            let totalAdmissions = 0;
            let totalDeces = 0;
            let totalGuerisons = 0;
            let sumOccupancy = 0;
            let countReports = 0;

            const serviceAggregation = {};
            const dailyTrend = {};
            const actsAggregation = {};

            // Initialiser aggregation services
            // Pour les Services/Chefs: seulement LEUR service
            // Pour Direction/Admin: tous les services
            if (serviceFilter) {
                // Un service spécifique sélectionné (Service/Chef)
                const serviceDef = Object.values(SERVICES).find(s => s.id === serviceFilter);
                if (serviceDef) {
                    serviceAggregation[serviceDef.id] = {
                        name: serviceDef.name,
                        admissions: 0,
                        deces: 0,
                        guerisons: 0,
                        referes: 0,
                        transferts: 0,
                        evasions: 0,
                        observ: 0,
                        occupancy: 0,
                        count: 0
                    };
                }
            } else {
                // Direction/Admin: tous les services
                Object.values(SERVICES).forEach(s => {
                    serviceAggregation[s.id] = {
                        name: s.name,
                        admissions: 0,
                        deces: 0,
                        guerisons: 0,
                        referes: 0,
                        transferts: 0,
                        evasions: 0,
                        observ: 0,
                        occupancy: 0,
                        count: 0
                    };
                });
            }

            // Helper pour trouver le label d'un acte
            const getActLabel = (actId, serviceId) => {
                if (!SERVICE_CONFIGS) return actId;

                const serviceConfig = SERVICE_CONFIGS[serviceId];
                if (serviceConfig?.actTypes) {
                    const act = serviceConfig.actTypes.find(a => a.id === actId);
                    if (act) return act.label;
                }

                try {
                    for (const conf of Object.values(SERVICE_CONFIGS)) {
                        const act = conf.actTypes?.find(a => a.id === actId);
                        if (act) return act.label;
                    }
                } catch (e) {
                    console.warn("Error looking up act label", e);
                }
                return actId;
            };

            reports.forEach(r => {
                const mvts = r.data?.mouvements || {};
                const sorties = mvts.sorties || {};

                const admissions = parseInt(mvts.entrees) || 0;
                const deces = parseInt(sorties.deces) || 0;
                const guerisons = parseInt(sorties.aDomicile) || 0;
                const referes = parseInt(sorties.referes) || 0;
                const transferts = parseInt(sorties.transferts) || 0;
                const evasions = parseInt(sorties.fugitifs) || 0;
                const observ = parseInt(sorties.observ) || 0;
                const effectifFin = parseInt(mvts.effectifFin) || 0;

                // Global totals
                totalAdmissions += admissions;
                totalDeces += deces;
                totalGuerisons += guerisons;
                sumOccupancy += effectifFin;
                countReports++;

                // Service aggregation
                if (serviceAggregation[r.serviceId]) {
                    const s = serviceAggregation[r.serviceId];
                    s.admissions += admissions;
                    s.deces += deces;
                    s.guerisons += guerisons;
                    s.referes += referes;
                    s.transferts += transferts;
                    s.evasions += evasions;
                    s.observ += observ;
                    s.occupancy += effectifFin;
                    s.count++;
                }

                // Daily trend
                if (!dailyTrend[r.date]) {
                    dailyTrend[r.date] = {
                        date: r.date,
                        admissions: 0,
                        deces: 0,
                        guerisons: 0,
                        referes: 0,
                        transferts: 0,
                        evasions: 0,
                        observ: 0
                    };
                }
                dailyTrend[r.date].admissions += admissions;
                dailyTrend[r.date].deces += deces;
                dailyTrend[r.date].guerisons += guerisons;
                dailyTrend[r.date].referes += referes;
                dailyTrend[r.date].transferts += transferts;
                dailyTrend[r.date].evasions += evasions;
                dailyTrend[r.date].observ += observ;

                // Acts Aggregation
                const reportActs = r.data?.autres?.actes || {};
                Object.entries(reportActs).forEach(([actId, count]) => {
                    const val = parseInt(count) || 0;
                    if (val > 0) {
                        if (!actsAggregation[actId]) {
                            actsAggregation[actId] = {
                                id: actId,
                                count: 0,
                                name: getActLabel(actId, r.serviceId)
                            };
                        }
                        actsAggregation[actId].count += val;
                    }
                });
            });

            // Calcul occupation moyenne
            const avgOccupancy = countReports > 0 ? Math.round(sumOccupancy / countReports) : 0;

            // Préparer données graphiques
            const byServiceData = Object.values(serviceAggregation)
                .filter(s => s.count > 0 || (selectedService !== 'all' && s.count === 0))
                .map(s => ({
                    ...s,
                    avgOccupancy: s.count > 0 ? Math.round(s.occupancy / s.count) : 0
                }));

            const trendData = Object.values(dailyTrend).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Acts Data Sorted (Top 15)
            const actsData = Object.values(actsAggregation)
                .sort((a, b) => b.count - a.count)
                .slice(0, 15);

            setStats({
                admissions: totalAdmissions,
                deces: totalDeces,
                guerisons: totalGuerisons,
                occupationMoyenne: avgOccupancy,
                byService: byServiceData,
                trendData: trendData,
                actsData: actsData
            });
        } catch (error) {
            console.error("Erreur lors du chargement des statistiques:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Chargement des données médicales...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Filters */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analyses Médicales</h1>
                        <p className="text-slate-500">Flux de patients et indicateurs de mortalité</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-white p-2 border rounded-lg">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={period.start}
                                onChange={e => setPeriod({ ...period, start: e.target.value })}
                                className="text-sm border-none p-0 focus:ring-0"
                            />
                            <span className="text-slate-400">→</span>
                            <input
                                type="date"
                                value={period.end}
                                onChange={e => setPeriod({ ...period, end: e.target.value })}
                                className="text-sm border-none p-0 focus:ring-0"
                            />
                        </div>

                        {canFilterService && (
                            <select
                                value={selectedService}
                                onChange={e => setSelectedService(e.target.value)}
                                className="p-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="all">Tous les services</option>
                                {Object.values(SERVICES).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Sélecteur de Métriques */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 mr-2 my-auto">Afficher :</span>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('admissions')} onChange={() => toggleMetric('admissions')} className="rounded text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-slate-600">Admissions</span>
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('guerisons')} onChange={() => toggleMetric('guerisons')} className="rounded text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-slate-600">Guérisons</span>
                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('deces')} onChange={() => toggleMetric('deces')} className="rounded text-red-600 focus:ring-red-500" />
                        <span className="text-sm text-slate-600">Décès</span>
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                    </label>

                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('referes')} onChange={() => toggleMetric('referes')} className="rounded text-amber-500 focus:ring-amber-500" />
                        <span className="text-sm text-slate-600">Référés (Ext)</span>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('transferts')} onChange={() => toggleMetric('transferts')} className="rounded text-indigo-500 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-600">Transférés (Int)</span>
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('evasions')} onChange={() => toggleMetric('evasions')} className="rounded text-slate-600 focus:ring-slate-500" />
                        <span className="text-sm text-slate-600">Évasions</span>
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={selectedMetrics.includes('observ')} onChange={() => toggleMetric('observ')} className="rounded text-cyan-500 focus:ring-cyan-500" />
                        <span className="text-sm text-slate-600">Mise en Obs.</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </label>
                </div>
            </div>

            {/* KPIs Médicaux */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={selectedMetrics.includes('admissions') ? 'ring-2 ring-blue-100' : 'opacity-60'}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Admissions Totales</p>
                                <h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.admissions}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={selectedMetrics.includes('deces') ? 'ring-2 ring-red-100' : 'opacity-60'}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Décès Hospitaliers</p>
                                <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.deces}</h3>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={selectedMetrics.includes('guerisons') ? 'ring-2 ring-green-100' : 'opacity-60'}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Sorties (Guérison)</p>
                                <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.guerisons}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Occupation Moy. (Lits)</p>
                                <h3 className="text-3xl font-bold text-purple-600 mt-2">{stats.occupationMoyenne}</h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <BedDouble className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques */}
            <div className={`grid grid-cols-1 ${canFilterService ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
                <Card>
                    <CardHeader>
                        <CardTitle>{getChartTitle()}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={d => format(parseISO(d), 'dd/MM')} />
                                <YAxis />
                                <Tooltip labelFormatter={d => format(parseISO(d), 'dd MMMM yyyy', { locale: fr })} />
                                <Legend />
                                {selectedMetrics.includes('admissions') && (
                                    <Line type="monotone" dataKey="admissions" stroke="#2563EB" name="Admissions" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('deces') && (
                                    <Line type="monotone" dataKey="deces" stroke="##EF4444" name="Décès" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('guerisons') && (
                                    <Line type="monotone" dataKey="guerisons" stroke="#22C55E" name="Guérisons" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('referes') && (
                                    <Line type="monotone" dataKey="referes" stroke="#F59E0B" name="Référés" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('transferts') && (
                                    <Line type="monotone" dataKey="transferts" stroke="#6366F1" name="Transférés" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('evasions') && (
                                    <Line type="monotone" dataKey="evasions" stroke="#4B5563" name="Évasions" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('observ') && (
                                    <Line type="monotone" dataKey="observ" stroke="#06B6D4" name="Mise en Obs." strokeWidth={2} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {canFilterService && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparatif par Service</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.byService} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Legend />
                                    {selectedMetrics.includes('admissions') && (
                                        <Bar dataKey="admissions" fill="#3B82F6" name="Admissions" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('guerisons') && (
                                        <Bar dataKey="guerisons" fill="#22C55E" name="Guérisons" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('deces') && (
                                        <Bar dataKey="deces" fill="#EF4444" name="Décès" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('referes') && (
                                        <Bar dataKey="referes" fill="#F59E0B" name="Référés" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('transferts') && (
                                        <Bar dataKey="transferts" fill="#6366F1" name="Transférés" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('evasions') && (
                                        <Bar dataKey="evasions" fill="#4B5563" name="Évasions" stackId="a" />
                                    )}
                                    {selectedMetrics.includes('observ') && (
                                        <Bar dataKey="observ" fill="#06B6D4" name="Mise en Obs." stackId="a" />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Tableau Détaillé - Seulement pour Direction/Admin */}
            {canFilterService && (
                <Card>
                    <CardHeader>
                        <CardTitle>Détail de l'activité par Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">Service</th>
                                        <th className="px-6 py-3 text-right">Admissions</th>
                                        <th className="px-6 py-3 text-right">Guérisons</th>
                                        <th className="px-6 py-3 text-right">Décès</th>
                                        <th className="px-6 py-3 text-right">Occupation Moy.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.byService.map((s, idx) => (
                                        <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                                            <td className="px-6 py-4 text-right">{s.admissions}</td>
                                            <td className="px-6 py-4 text-right text-green-600">{s.guerisons}</td>
                                            <td className="px-6 py-4 text-right text-red-600 font-bold">{s.deces}</td>
                                            <td className="px-6 py-4 text-right">{s.avgOccupancy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Analyse des Actes Médicaux */}
            <Card>
                <CardHeader>
                    <CardTitle>Actes Médicaux & Interventions (Top 15)</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.actsData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={180} interval={0} fontSize={12} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} />
                            <Bar
                                dataKey="count"
                                fill="#0ea5e9"
                                radius={[0, 4, 4, 0]}
                                name="Nombre d'actes"
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-center text-sm text-slate-500">
                        * Les actes ayant une nomenclature identique inter-services sont cumulés.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatisticsPage;
