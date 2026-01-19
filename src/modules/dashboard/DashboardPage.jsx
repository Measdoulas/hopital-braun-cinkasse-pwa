import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stethoscope, Users, BedDouble, Activity, Bell } from 'lucide-react';
import StatCard from './components/StatCard';
import ActivityChart from './components/ActivityChart';
import ServiceList from './components/ServiceList';
import { dashboardService } from '../../services/DashboardService';
import { ROLES, SERVICES } from '../../utils/data-models';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const loadStats = async () => {
                setLoading(true);
                try {
                    const data = await dashboardService.getDashboardStats(user);
                    setStats(data);
                } catch (error) {
                    console.error("Erreur chargement dashboard:", error);
                } finally {
                    setLoading(false);
                }
            };
            loadStats();
        }
    }, [user]);

    // Déterminer le titre en fonction du rôle
    const getTitle = () => {
        if (user?.role === ROLES.SERVICE) {
            // Trouver le nom propre du service
            const serviceDef = SERVICES.find(s => s.id === user.serviceId)
                || SERVICES.find(s => s.id === user.username);
            return `Tableau de bord - ${serviceDef ? serviceDef.name : 'Service'}`;
        }
        return "Tableau de bord Général";
    };

    if (loading || !stats) {
        return <div className="p-8 text-center">Chargement des indicateurs...</div>;
    }

    // --- Rendu conditionnel des cartes ---
    const renderCards = () => {
        // SCENARIO 1: SERVICE (Vue Opérationnelle)
        if (user?.role === ROLES.SERVICE || user?.role === ROLES.CHEF_SERVICE) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Carte 1: Patients Présents (Effectif) */}
                    <StatCard
                        title="Patients Présents"
                        value={stats.hospitalizations.current}
                        subValue={stats.hospitalizations.capacity > 0 ? `/ ${stats.hospitalizations.capacity} lits` : null}
                        icon={BedDouble}
                        color="blue"
                    />

                    {/* Carte 2: Admissions du Jour */}
                    <StatCard
                        title="Admissions (Ce jour)"
                        value={stats.dailyMovements.admissions}
                        trend={stats.dailyMovements.admissions > 0 ? "up" : "neutral"}
                        trendValue="Flux entrant"
                        icon={Activity}
                        color="green"
                    />

                    {/* Carte 3: Sorties du Jour */}
                    <StatCard
                        title="Sorties (Ce jour)"
                        value={stats.dailyMovements.sorties}
                        trend="neutral"
                        trendValue="Flux sortant"
                        icon={Users}
                        color="orange"
                    />

                    {/* Carte 4: Statut Dernier Rapport */}
                    <StatCard
                        title="Dernier Rapport"
                        value={stats.lastReportDate ? format(new Date(stats.lastReportDate), 'dd/MM') : "Aucun"}
                        trendValue={stats.lastReportDate === format(new Date(), 'yyyy-MM-dd') ? "À jour" : "Retard possible"}
                        icon={Bell}
                        color={stats.lastReportDate === format(new Date(), 'yyyy-MM-dd') ? "indigo" : "red"}
                    />
                </div>
            );
        }

        // SCENARIO 2: DIRECTION (Vue Globale)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Carte 1: Total Patients Hospitalisés */}
                <StatCard
                    title="Hospitalisations (Total)"
                    value={stats.hospitalizations.current}
                    trend="neutral"
                    trendValue="Tous services confondu"
                    icon={BedDouble}
                    color="blue"
                />

                {/* Carte 2: Admissions Jour (Global) */}
                <StatCard
                    title="Admissions (Global 24h)"
                    value={stats.dailyMovements.admissions}
                    trend={stats.dailyMovements.admissions > 10 ? "up" : "neutral"}
                    trendValue="Tendance journée"
                    icon={Activity}
                    color="green"
                />

                {/* Carte 3: Consultations Mois */}
                <StatCard
                    title="Consultations (Mois)"
                    value={stats.consultations.value}
                    trend={stats.consultations.direction}
                    trendValue={stats.consultations.trendValue} // Updated
                    icon={Stethoscope}
                    color="purple"
                />

                {/* Carte 4: Rapports à Valider */}
                <StatCard
                    title="Rapports à Valider"
                    value={stats.pendingReports}
                    trendValue={stats.pendingReports > 0 ? "Action requise" : "Tout est validé"}
                    icon={Bell}
                    color={stats.pendingReports > 0 ? "red" : "indigo"}
                />
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getTitle()}</h1>
                    <p className="text-slate-500 mt-1">
                        {user?.role === ROLES.DIRECTION || user?.role === ROLES.ADMIN
                            ? "Vue d'ensemble de l'activité hospitalière."
                            : "Pilotage de votre service en temps réel."}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-medium text-slate-600 px-2 capitalize">
                        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity size={20} />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {renderCards()}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Charts Area (2/3 width) - Toujours pertinent pour tout le monde */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-[400px]">
                        <ActivityChart
                            title="Activité Hebdomadaire (Entrées + Consultations)"
                            data={stats.activityTrend}
                        />
                    </div>
                </div>

                {/* Side Content (1/3 width) */}
                <div className="space-y-8">
                    {/* On affiche la liste des services seulement pour la Direction */}
                    {(user?.role === ROLES.DIRECTION || user?.role === ROLES.ADMIN) && <ServiceList />}

                    {/* Pour les services : Widget Actes Récurrents + Actions Rapides */}
                    {(user?.role === ROLES.SERVICE || user?.role === ROLES.CHEF_SERVICE) && (
                        <div className="space-y-6">
                            {/* Widget: Actes Médicaux Récurrents (7 derniers jours) */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Actes Fréquents (7j)
                                </h3>
                                {stats.topActs && stats.topActs.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.topActs.map((act, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                                <span className="text-sm text-slate-700 truncate flex-1 pr-2">{act.name}</span>
                                                <span className="text-sm font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded">{act.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Aucun acte enregistré récemment.</p>
                                )}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <a href="/statistiques" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                        Voir toutes les statistiques →
                                    </a>
                                </div>
                            </div>

                            {/* Actions Rapides */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-800 mb-4">Actions Rapides</h3>
                                <button
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    onClick={() => window.location.href = '/daily-entry'}
                                >
                                    + Nouveau Rapport Quotidien
                                </button>
                                <div className="mt-4 text-sm text-slate-500">
                                    Assurez-vous de soumettre votre rapport avant 9h00.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
