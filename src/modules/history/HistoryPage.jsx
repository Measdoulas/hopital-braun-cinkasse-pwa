import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { SERVICES } from '../../utils/data-models';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Calendar, Filter, FileText, Download, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/data-models';
import HistoryReportModal from './components/HistoryReportModal';

/**
 * HistoryPage - Historique des Rapports
 * Recherche et consultation de tous les rapports (quotidiens et hebdomadaires)
 */
const HistoryPage = () => {
    const { user } = useAuth();

    // Déterminer si l'utilisateur peut voir tous les services
    const canViewAll = user.role === ROLES.DIRECTION || user.role === ROLES.ADMIN;

    // Initialiser le filtre : si restreint, forcer le service de l'utilisateur
    const initialService = canViewAll ? 'all' : (user.serviceId || user.username);

    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState(initialService);
    const [filterType, setFilterType] = useState('all'); // daily, weekly, all
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        loadAllReports();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filterService, filterType, reports]);

    const loadAllReports = async () => {
        setLoading(true);
        const storage = StorageService.getInstance();

        const loadedReports = [];

        // 1. Rapports Hebdomadaires (Supporté via storage.list async)
        try {
            const weeklyKeyValues = await storage.list('rapports-hebdo');
            weeklyKeyValues.forEach(kv => {
                const report = kv.value;
                if (report) {
                    loadedReports.push({
                        ...report,
                        _key: kv.key,
                        _type: 'weekly',
                        displayDate: `Semaine ${report.weekNumber}/${report.year}`
                    });
                }
            });
        } catch (e) {
            console.error("Erreur chargement rapports hebdos:", e);
        }

        // 2. Rapports Mensuels (Nouveau)
        try {
            const monthlyKeyValues = await storage.list('rapports-mensuels');
            monthlyKeyValues.forEach(kv => {
                const report = kv.value;
                if (report) {
                    loadedReports.push(report);
                }
            });
        } catch (e) {
            console.error("Erreur chargement rapports mensuels:", e);
        }

        // 3. Rapports Quotidiens (30 derniers jours)
        try {
            const dailyReports = await storage.getRecentDailyReports(canViewAll ? 'all' : user.serviceId || user.username);
            dailyReports.forEach(report => {
                loadedReports.push({
                    ...report,
                    _key: `rapports-journaliers:${report.serviceId}:${report.date}`, // Reconstitution clé pour compat
                    _type: 'daily',
                    displayDate: format(parseISO(report.date), 'dd MMMM yyyy', { locale: fr })
                });
            });
        } catch (e) {
            console.error("Erreur chargement rapports quotidiens:", e);
        }

        // Trier par date (plus récent d'abord)
        loadedReports.sort((a, b) => {
            const dateA = a.submittedAt || a.date || a.createdAt;
            const dateB = b.submittedAt || b.date || b.createdAt;
            return new Date(dateB) - new Date(dateA);
        });

        setReports(loadedReports);
        setLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...reports];

        // Filtre par terme de recherche
        if (searchTerm) {
            filtered = filtered.filter(report => {
                const serviceName = getServiceName(report.serviceId).toLowerCase();
                const search = searchTerm.toLowerCase();
                return serviceName.includes(search) ||
                    report.displayDate.includes(search);
            });
        }

        // Filtre par service
        if (filterService !== 'all') {
            filtered = filtered.filter(report => report.serviceId === filterService);
        }

        // Filtre par type
        if (filterType !== 'all') {
            filtered = filtered.filter(report => report._type === filterType);
        }

        setFilteredReports(filtered);
    };

    const getServiceName = (serviceId) => {
        const service = Object.values(SERVICES).find(s => s.id === serviceId);
        return service ? service.name : serviceId;
    };

    const getStatusBadge = (report) => {
        if (report._type === 'daily') {
            return <Badge variant="primary">Quotidien</Badge>;
        }

        // Pour rapports mensuels
        if (report._type === 'monthly') {
            return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Mensuel</Badge>;
        }

        // Pour rapports hebdomadaires
        switch (report.status) {
            case 'pending':
                return <Badge variant="warning">En attente</Badge>;
            case 'validated':
                return <Badge variant="success">Validé</Badge>;
            case 'rejected':
                return <Badge variant="danger">Rejeté</Badge>;
            default:
                return <Badge variant="default">Hebdomadaire</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600">Chargement de l'historique...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Historique des Rapports</h1>
                <p className="text-slate-500 mt-1">Consultez et recherchez tous les rapports d'activité</p>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Recherche */}
                        <div className="md:col-span-1">
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                label="Recherche"
                            />
                        </div>

                        {/* Filtre Service */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Service
                            </label>
                            {canViewAll ? (
                                <select
                                    value={filterService}
                                    onChange={(e) => setFilterService(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                >
                                    <option value="all">Tous les services</option>
                                    {Object.values(SERVICES).map(service => (
                                        <option key={service.id} value={service.id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    value={getServiceName(filterService)}
                                    disabled={true}
                                    className="bg-slate-50 text-slate-500 border-slate-200"
                                />
                            )}
                        </div>

                        {/* Filtre Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Type de rapport
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            >
                                <option value="all">Tous les types</option>
                                <option value="daily">Rapports quotidiens</option>
                                <option value="weekly">Rapports hebdomadaires</option>
                                <option value="monthly">Rapports mensuels</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-slate-500">Total des rapports</p>
                        <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-slate-500">Rapports quotidiens</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {reports.filter(r => r._type === 'daily').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-slate-500">Rapports hebdos</p>
                        <p className="text-3xl font-bold text-green-600">
                            {reports.filter(r => r._type === 'weekly').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-slate-500">Rapports mensuels</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {reports.filter(r => r._type === 'monthly').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des rapports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Résultats ({filteredReports.length})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredReports.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="font-medium">Aucun rapport trouvé</p>
                            <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredReports.map((report) => (
                                <div
                                    key={report._key}
                                    onClick={() => setSelectedReport(report)}
                                    className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {getServiceName(report.serviceId)}
                                                </h3>
                                                {getStatusBadge(report)}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {report.displayDate}
                                                {report.submittedAt && (
                                                    <span className="text-xs">
                                                        • Soumis le {format(parseISO(report.submittedAt), 'dd/MM/yyyy', { locale: fr })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de visualisation/édition */}
            {selectedReport && (
                <HistoryReportModal
                    report={selectedReport}
                    user={user}
                    onClose={() => setSelectedReport(null)}
                    onSave={() => {
                        setSelectedReport(null);
                        loadAllReports(); // Refresh data
                    }}
                />
            )}
        </div>
    );
};

export default HistoryPage;
