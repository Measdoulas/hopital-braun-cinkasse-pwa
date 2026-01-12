import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stethoscope, Users, BedDouble, Activity, Bell } from 'lucide-react';
import StatCard from './components/StatCard';
import ActivityChart from './components/ActivityChart';
import ServiceList from './components/ServiceList';

const DashboardPage = () => {
    const { user } = useAuth();

    // Mock Data for Charts
    const activityData = [
        { name: 'Sem 1', value: 400 },
        { name: 'Sem 2', value: 300 },
        { name: 'Sem 3', value: 550 },
        { name: 'Sem 4', value: 480 },
        { name: 'Sem 5', value: 650 },
        { name: 'Sem 6', value: 700 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
                    <p className="text-slate-500 mt-1">Aperçu de l'activité hospitalière en temps réel.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-medium text-slate-600 px-2 capitalize">
                        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                    <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Consultations Totales"
                    value="1,245"
                    trend="up"
                    trendValue="+12%"
                    icon={Stethoscope}
                    color="blue"
                />
                <StatCard
                    title="Hospitalisations"
                    value="340"
                    trend="up"
                    trendValue="+5%"
                    icon={BedDouble}
                    color="purple"
                />
                <StatCard
                    title="Taux d'Occupation"
                    value="78%"
                    trend="down"
                    trendValue="-2%"
                    icon={Activity}
                    color="orange"
                />
                <StatCard
                    title="Rapports en Attente"
                    value="5"
                    trendValue="Action requise"
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
                            title="Tendance des Consultations (Semestriel)"
                            data={activityData}
                        />
                    </div>
                </div>

                {/* Side Content (1/3 width) */}
                <div className="space-y-8">
                    <ServiceList />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
