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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{getTitle()}</h1>
                    <p className="text-slate-500 mt-1">
                        {user?.role === ROLES.DIRECTION
                            ? "Vue d'ensemble de l'activité hospitalière."
                            : "Pilotage de votre service en temps réel."}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-medium text-slate-600 px-2 capitalize">
                        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors relative">
                        <Bell size={20} />
                        {stats.pendingReports > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Consultations (Mois)"
                    value={stats.consultations.value}
                    trend={stats.consultations.direction}
                    trendValue={stats.consultations.trend}
                    icon={Stethoscope}
                    color="blue"
                />
                <StatCard
                    title="Hospitalisations"
                    value={stats.hospitalizations.current}
                    subValue={`/ ${stats.hospitalizations.capacity} lits`}
                    trend={stats.hospitalizations.direction}
                    trendValue={stats.hospitalizations.trend}
                    icon={BedDouble}
                    color="purple"
                />
                <StatCard
                    title="Taux d'Occupation"
                    value={stats.occupancy.value}
                    trend={stats.occupancy.direction}
                    trendValue={stats.occupancy.trend}
                    icon={Activity}
                    color="orange"
                />
                <StatCard
                    title="Rapports à Valider"
                    value={stats.pendingReports}
                    trendValue={stats.pendingReports > 0 ? "Action requise" : "À jour"}
                    icon={Users}
                    color="red"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Charts Area (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-[400px]">
                        <ActivityChart
                            title="Activité Hebdomadaire (Entrées)"
                            data={stats.activityTrend}
                        />
                    </div>
                </div>

                {/* Side Content (1/3 width) - Liste des sous-services ou infos */}
                <div className="space-y-8">
                    {/* On affiche la liste des services seulement pour la Direction */}
                    {user?.role === ROLES.DIRECTION && <ServiceList />}

                    {/* Pour les services, on pourrait afficher autre chose, ex: Dernières entrées */}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
