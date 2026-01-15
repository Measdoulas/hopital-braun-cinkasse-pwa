import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { SupabaseStorageService } from '../../services/SupabaseStorageService';
import { SERVICES, ROLES } from '../../utils/data-models';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Users, Activity, BedDouble, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * StatisticsPage - Tableau de Bord Médical Analytique
 * Focus: Flux patients, Mortalité, Occupation
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
        trendData: []
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

    useEffect(() => {
        loadMedicalStats();
    }, [period, selectedService]);

    const loadMedicalStats = async () => {
        setLoading(true);
        const storage = SupabaseStorageService.getInstance();

        // 1. Récupérer les rapports sur la période
        // Si 'all', on passe null pour récupérer tout
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

        // Initialiser aggregation services
        Object.values(SERVICES).forEach(s => {
            serviceAggregation[s.id] = { name: s.name, admissions: 0, deces: 0, guerisons: 0, occupancy: 0, count: 0 };
        });

        reports.forEach(r => {
            const mvts = r.data?.mouvements || {};
            const admissions = parseInt(mvts.entrees) || 0;
            const deces = parseInt(mvts.sorties?.deces) || 0;
            const guerisons = parseInt(mvts.sorties?.aDomicile) || 0;
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
                s.occupancy += effectifFin;
                s.count++;
            }

            // Daily trend
            if (!dailyTrend[r.date]) {
                dailyTrend[r.date] = { date: r.date, admissions: 0, deces: 0, guerisons: 0 };
            }
            dailyTrend[r.date].admissions += admissions;
            dailyTrend[r.date].deces += deces;
            dailyTrend[r.date].guerisons += guerisons;
        });

        // Calcul occupation moyenne (approximatif: somme effectifs / nombre de jours de rapport)
        const avgOccupancy = countReports > 0 ? Math.round(sumOccupancy / countReports) : 0; // C'est une moyenne par rapport, attention si plusieurs services

        // Préparer données graphiques
        const byServiceData = Object.values(serviceAggregation)
            .filter(s => s.count > 0 || (selectedService !== 'all' && s.count === 0)) // Garder service vide si sélectionné
            .map(s => ({
                ...s,
                avgOccupancy: s.count > 0 ? Math.round(s.occupancy / s.count) : 0
            }));

        const trendData = Object.values(dailyTrend).sort((a, b) => new Date(a.date) - new Date(b.date));

        setStats({
            admissions: totalAdmissions,
            deces: totalDeces,
            guerisons: totalGuerisons,
            occupationMoyenne: avgOccupancy,
            byService: byServiceData,
            trendData: trendData
        });

        setLoading(false);
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
                        <input
                            type="checkbox"
                            checked={selectedMetrics.includes('admissions')}
                            onChange={() => toggleMetric('admissions')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600">Admissions</span>
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selectedMetrics.includes('guerisons')}
                            onChange={() => toggleMetric('guerisons')}
                            className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-600">Guérisons</span>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selectedMetrics.includes('deces')}
                            onChange={() => toggleMetric('deces')}
                            className="rounded text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-slate-600">Décès</span>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Flux Admissions vs Décès (Tendance)</CardTitle>
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
                                    <Line type="monotone" dataKey="deces" stroke="#EF4444" name="Décès" strokeWidth={2} />
                                )}
                                {selectedMetrics.includes('guerisons') && (
                                    <Line type="monotone" dataKey="guerisons" stroke="#22C55E" name="Guérisons" strokeWidth={2} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

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
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau Détaillé */}
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
        </div>
    );
};

export default StatisticsPage;
