import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StorageService } from '../../services/storage';
import { SERVICES } from '../../utils/data-models';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';

/**
 * StatisticsPage - Vue Statistiques
 * Graphiques et analyses de l'activité hospitalière
 */
const StatisticsPage = () => {
    const [stats, setStats] = useState({
        byService: [],
        byWeek: [],
        totalReports: 0,
        validatedReports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = () => {
        setLoading(true);
        const storage = StorageService.getInstance();
        const allKeys = storage.getAllKeys();

        // Statistiques par service
        const serviceStats = {};
        Object.values(SERVICES).forEach(service => {
            serviceStats[service.id] = {
                name: service.name,
                daily: 0,
                weekly: 0,
                total: 0
            };
        });

        // Compter rapports quotidiens
        const dailyKeys = allKeys.filter(key => key.startsWith('rapports-quotidiens:'));
        dailyKeys.forEach(key => {
            const [, serviceId] = key.split(':');
            if (serviceStats[serviceId]) {
                serviceStats[serviceId].daily++;
                serviceStats[serviceId].total++;
            }
        });

        // Compter rapports hebdomadaires
        const weeklyKeys = allKeys.filter(key => key.startsWith('rapports-hebdo:'));
        let validatedCount = 0;
        weeklyKeys.forEach(key => {
            const report = storage.get(key);
            if (report) {
                if (serviceStats[report.serviceId]) {
                    serviceStats[report.serviceId].weekly++;
                    serviceStats[report.serviceId].total++;
                }
                if (report.status === 'validated') {
                    validatedCount++;
                }
            }
        });

        // Convertir en tableau pour graphiques
        const byServiceData = Object.values(serviceStats)
            .filter(s => s.total > 0)
            .sort((a, b) => b.total - a.total);

        // Données par semaine (simulées pour démo)
        const weekData = [
            { week: 'S48', consultations: 245, hospitalisations: 89 },
            { week: 'S49', consultations: 267, hospitalisations: 92 },
            { week: 'S50', consultations: 289, hospitalisations: 78 },
            { week: 'S51', consultations: 234, hospitalisations: 85 },
            { week: 'S52', consultations: 198, hospitalisations: 65 },
            { week: 'S1', consultations: 312, hospitalisations: 98 },
        ];

        setStats({
            byService: byServiceData,
            byWeek: weekData,
            totalReports: dailyKeys.length + weeklyKeys.length,
            validatedReports: validatedCount
        });

        setLoading(false);
    };

    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600">Chargement des statistiques...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Statistiques</h1>
                <p className="text-slate-500 mt-1">Analysez l'activité hospitalière globale</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Rapports</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.totalReports}</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Validés</p>
                                <p className="text-3xl font-bold text-green-600">{stats.validatedReports}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Services Actifs</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.byService.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Taux Validation</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {stats.totalReports > 0 ? Math.round((stats.validatedReports / stats.totalReports) * 100) : 0}%
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rapports par service */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rapports par Service</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.byService}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                />
                                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFF',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="daily" fill="#2563EB" name="Quotidiens" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="weekly" fill="#10B981" name="Hebdomadaires" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Évolution hebdomadaire */}
                <Card>
                    <CardHeader>
                        <CardTitle>Évolution sur 6 Semaines</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.byWeek}>
                                <defs>
                                    <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFF',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="consultations"
                                    stroke="#2563EB"
                                    strokeWidth={3}
                                    dot={{ fill: '#2563EB', r: 4 }}
                                    name="Consultations"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="hospitalisations"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10B981', r: 4 }}
                                    name="Hospitalisations"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribution par service (Pie Chart) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Distribution des Rapports par Service</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.byService}
                                    dataKey="total"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={(entry) => `${entry.name}: ${entry.total}`}
                                >
                                    {stats.byService.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StatisticsPage;
