import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../services/storage';
import { SERVICES, ROLES, REPORT_STATUS } from '../../utils/data-models';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, XCircle, Eye, Clock, FileText } from 'lucide-react';
import ReportDetailModal from './components/ReportDetailModal';

/**
 * ValidationPage - Module Direction et Chef de Service
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

    const loadReports = async () => {
        setLoading(true);
        const storage = StorageService.getInstance();

        // storage.list est maintenant async et retourne { key, value }
        // On cible spécifiquement les rapports hebdos
        const loadedReportsKeyValues = await storage.list('rapports-hebdo:');

        const loadedReports = loadedReportsKeyValues.map(item => ({
            ...item.value,
            _key: item.key
        }));

        // Logique de filtrage hiérarchique
        const filteredReports = loadedReports.filter(report => {
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
                // Elle ne voit PAS les 'brouillons' ou 'en_attente' (qui sont chez le chef)
                return report.status === REPORT_STATUS.VALIDATED_BY_CHIEF;
            }

            return true; // Admin voit tout
        });

        // Trier par date de soumission (plus récent d'abord)
        const sorted = filteredReports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        setReports(sorted);
        setLoading(false);
    };

    const handleValidate = async (reportKey) => {
        const storage = StorageService.getInstance();
        const report = await storage.get(reportKey);

        if (!report) return;

        let newStatus = REPORT_STATUS.VALIDATED; // Par défaut (Direction)
        let note = "Validé par la direction";



        // Nouvelle logique : Direction ne valide plus, c'est le Chef
        // Mais nous gardons la logique générale si jamais on veut réactiver
        // Ici, seul le Chef de Service devrait appeler cette fonction normalement
        if (user.role === ROLES.CHEF_SERVICE) {
            newStatus = REPORT_STATUS.VALIDATED_BY_CHIEF;
            note = "Validé par le Chef de Service - Visible par la Direction";
        } else if (user.role === ROLES.DIRECTION) {
            // Securité : Direction ne devrait pas pouvoir valider ici dans le nouveau flux
            return;
        }

        report.status = newStatus;
        report.validatedAt = new Date().toISOString();
        if (note) report.validationNote = note;
        report.validatedBy = user.username;

        await storage.set(reportKey, report);

        // Mise à jour locale
        setReports(prev => prev.map(r =>
            r._key === reportKey ? { ...r, status: newStatus } : r
        ));

        setSelectedReport(null);
    };

    const handleReject = async (reportKey, reason) => {
        const storage = StorageService.getInstance();
        const report = await storage.get(reportKey);

        if (report) {
            report.status = REPORT_STATUS.REJECTED;
            report.rejectedAt = new Date().toISOString();
            report.rejectedBy = user.username;
            report.rejectionReason = reason || 'Non spécifié';
            await storage.set(reportKey, report);

            // Mise à jour locale
            setReports(prev => prev.map(r =>
                r._key === reportKey ? { ...r, status: REPORT_STATUS.REJECTED } : r
            ));

            setSelectedReport(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case REPORT_STATUS.PENDING:
            case REPORT_STATUS.TRANSMITTED_TO_CHIEF:
                return <Badge variant="warning" icon={Clock}>En attente</Badge>;
            case REPORT_STATUS.VALIDATED_BY_CHIEF:
                return <Badge variant="info" icon={CheckCircle2}>Validé Chef</Badge>;
            case REPORT_STATUS.VALIDATED:
                return <Badge variant="success" icon={CheckCircle2}>Validé</Badge>;
            case REPORT_STATUS.REJECTED:
                return <Badge variant="danger" icon={XCircle}>Rejeté</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getServiceName = (serviceId) => {
        const service = SERVICES.find(s => s.id === serviceId);
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
                                    {reports.filter(r => r.status === REPORT_STATUS.PENDING || r.status === REPORT_STATUS.TRANSMITTED_TO_CHIEF).length}
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
                                    {reports.filter(r => r.status === REPORT_STATUS.VALIDATED || r.status === REPORT_STATUS.VALIDATED_BY_CHIEF).length}
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
                                    {reports.filter(r => r.status === REPORT_STATUS.REJECTED).length}
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
                                <div key={report._key} className="space-y-3">
                                    <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
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

                                                {(report.status === REPORT_STATUS.PENDING ||
                                                    report.status === REPORT_STATUS.TRANSMITTED_TO_CHIEF) && (
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
                                                {/* Boutons cachés pour la Direction (Lecture Seule) */}
                                            </div>
                                        </div>
                                    </div>

                                    {report.rejectionReason && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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


            {/* Modal détail - Version professionnelle */}
            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    user={user}
                    onClose={() => setSelectedReport(null)}
                    onValidate={handleValidate}
                    onReject={handleReject}
                />
            )}
        </div >
    );
};

export default ValidationPage;
