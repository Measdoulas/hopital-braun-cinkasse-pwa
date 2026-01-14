import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { SERVICES } from '../../utils/data-models';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, Eye, Clock, FileText } from 'lucide-react';

/**
 * ValidationPage - Module Direction
 * Liste des rapports hebdomadaires en attente de validation
 */
const ValidationPage = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);

    // Charger tous les rapports hebdomadaires
    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = () => {
        setLoading(true);
        const storage = StorageService.getInstance();
        const allKeys = storage.getAllKeys();

        // Filtrer les clés des rapports hebdomadaires
        const reportKeys = allKeys.filter(key => key.startsWith('rapports-hebdo:'));

        const loadedReports = reportKeys.map(key => {
            const report = storage.get(key);
            return {
                ...report,
                _key: key
            };
        });

        // Trier par date de soumission    // Filtrage des rapports selon le rôle
        const filteredReports = reports.filter(report => {
            // Filtre de base (recherche)
            const matchesSearch =
                report.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.week.includes(searchTerm);

            if (!matchesSearch) return false;

            // Logique Hiérarchique
            if (user.role === ROLES.CHEF_SERVICE) {
                // Le Chef ne voit que SON service
                // Et seulement ceux transmis par la garde (TRANSMITTED_TO_CHIEF) ou déjà validés par lui (VALIDATED_BY_CHIEF)
                if (report.serviceId !== user.serviceId) return false;
                return report.status === REPORT_STATUS.TRANSMITTED_TO_CHIEF ||
                    report.status === REPORT_STATUS.VALIDATED_BY_CHIEF ||
                    report.status === REPORT_STATUS.PENDING; // Support legacy
            }

            if (user.role === ROLES.DIRECTION) {
                // La Direction voit ce qui a été validé par les Chefs (VALIDATED_BY_CHIEF)
                // Ou tout si c'est déjà validé final (VALIDATED)
                return report.status === REPORT_STATUS.VALIDATED_BY_CHIEF ||
                    report.status === REPORT_STATUS.VALIDATED ||
                    report.status === REPORT_STATUS.PENDING; // Support legacy (directement soumis)
            }

            return true; // Admin voit tout
        });

        const handleValidate = async () => {
            if (!selectedReport) return;

            let newStatus = REPORT_STATUS.VALIDATED; // Par défaut (Direction)
            let note = "Validé par la direction";

            if (user.role === ROLES.CHEF_SERVICE) {
                newStatus = REPORT_STATUS.VALIDATED_BY_CHIEF;
                note = "Validé par le Chef de Service - Transmis à la Direction";
            }

            const success = await updateReportStatus(selectedReport.id, newStatus, note);
            if (success) {
                setReports(prev => prev.map(r =>
                    r.id === selectedReport.id ? { ...r, status: newStatus } : r
                ));
                setSelectedReport(null);
                // Show toast success
            }
        };

        const handleReject = async () => {
            if (!selectedReport) return;

            // Rejet renvoie toujours au brouillon pour correction
            const success = await updateReportStatus(selectedReport.id, REPORT_STATUS.REJECTED, rejectionReason);
            if (success) {
                setReports(prev => prev.map(r =>
                    r.id === selectedReport.id ? { ...r, status: REPORT_STATUS.REJECTED } : r
                ));
                setIsRejectModalOpen(false);
                setSelectedReport(null);
                setRejectionReason('');
            }
        }; 'Non spécifié';
        storage.set(reportKey, report);

        loadReports();
        setSelectedReport(null);
    }
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending':
            return <Badge variant="warning" icon={Clock}>En attente</Badge>;
        case 'validated':
            return <Badge variant="success" icon={CheckCircle2}>Validé</Badge>;
        case 'rejected':
            return <Badge variant="danger" icon={XCircle}>Rejeté</Badge>;
        default:
            return <Badge variant="default">{status}</Badge>;
    }
};

const getServiceName = (serviceId) => {
    const service = Object.values(SERVICES).find(s => s.id === serviceId);
    return service ? service.name : serviceId;
};

if (loading) {
    return (
        <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-600">Chargement des rapports...</p>
            </div>
        </div>
    );
}

return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Validation des Rapports</h1>
            <p className="text-slate-500 mt-1">Valider ou rejeter les rapports hebdomadaires soumis</p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">En attente</p>
                            <p className="text-2xl font-bold text-amber-600">
                                {reports.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Validés</p>
                            <p className="text-2xl font-bold text-green-600">
                                {reports.filter(r => r.status === 'validated').length}
                            </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Rejetés</p>
                            <p className="text-2xl font-bold text-red-600">
                                {reports.filter(r => r.status === 'rejected').length}
                            </p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Liste des rapports */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Rapports Soumis
                </CardTitle>
            </CardHeader>
            <CardContent>
                {reports.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">Aucun rapport trouvé</p>
                        <p className="text-sm">Les rapports hebdomadaires apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <div
                                key={report._key}
                                className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-slate-900">
                                                {getServiceName(report.serviceId)}
                                            </h3>
                                            {getStatusBadge(report.status)}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Semaine {report.weekNumber} - {report.year} •
                                            Soumis le {format(new Date(report.submittedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            Voir
                                        </Button>

                                        {report.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    onClick={() => handleValidate(report._key)}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                    Valider
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => {
                                                        const reason = prompt('Raison du rejet (optionnel):');
                                                        if (reason !== null) {
                                                            handleReject(report._key, reason);
                                                        }
                                                    }}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Rejeter
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {report.rejectionReason && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-800">
                                            <span className="font-medium">Raison du rejet :</span> {report.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Modal détail (simple pour l'instant) */}
        {selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold">{getServiceName(selectedReport.serviceId)}</h2>
                        <p className="text-slate-500">Semaine {selectedReport.weekNumber} - {selectedReport.year}</p>
                    </div>
                    <div className="p-6">
                        <pre className="text-sm bg-slate-50 p-4 rounded-lg overflow-auto">
                            {JSON.stringify(selectedReport.data, null, 2)}
                        </pre>
                    </div>
                    <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setSelectedReport(null)}>
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default ValidationPage;
