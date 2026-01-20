import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    X, Edit3, Save, Users, TrendingUp, Activity,
    FileText, AlertCircle, CheckCircle, Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SERVICES, ROLES } from '../../utils/data-models';

/**
 * ReportDetailModal - Modal professionnel pour affichage/édition de rapports hebdomadaires
 * Design premium avec sections organisées, icônes et édition contextuelle
 */
const ReportDetailModal = ({ report, user, onClose, onValidate, onReject }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(report.data || {});

    if (!report) return null;

    const serviceName = SERVICES.find(s => s.id === report.serviceId)?.name || report.serviceId;
    const canEdit = user.role === ROLES.CHEF_SERVICE;
    const canValidate = canEdit; // Chef peut valider

    const handleSave = () => {
        // Sauvegarder les modifications localement sans valider
        setIsEditing(false);
        // TODO: Optionnellement, appeler une fonction de sauvegarde intermédiaire
    };

    const handleValidateWithData = () => {
        // Valider avec les données éditées
        onValidate(report._key, editedData);
    };

    const displayData = isEditing ? editedData : report.data;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <FileText className="w-7 h-7" />
                                {serviceName}
                            </h2>
                            <div className="mt-2 flex items-center gap-4 text-blue-100">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Semaine {report.weekNumber} / {report.year}
                                </span>
                                <span className="text-sm">
                                    Soumis le {format(new Date(report.submittedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Fermer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] space-y-6">
                    {/* Mouvements */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Mouvements de Patients
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                label="Entrées"
                                value={displayData?.mouvements?.entrees || 0}
                                color="green"
                            />
                            <StatCard
                                label="Sorties Totales"
                                value={displayData?.mouvements?.sorties?.total || 0}
                                color="orange"
                            />
                            <StatCard
                                label="Décès"
                                value={displayData?.mouvements?.sorties?.deces || 0}
                                color="red"
                            />
                            <StatCard
                                label="Transferts"
                                value={displayData?.mouvements?.sorties?.transferts || 0}
                                color="blue"
                            />
                        </div>
                    </div>

                    {/* Consultations */}
                    {displayData?.consultations && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Consultations
                            </h3>
                            <div className="text-4xl font-bold text-purple-600">
                                {displayData.consultations?.total || 0}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">Consultations totales</p>
                        </div>
                    )}

                    {/* Actes Médicaux */}
                    {displayData?.actes && Object.keys(displayData.actes).length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Actes Médicaux
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(displayData.actes)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([actId, count]) => (
                                        <div key={actId} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                            <span className="text-slate-700 truncate">{actId}</span>
                                            <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Observations */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            Observations & Pannes
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Pannes Signalées
                                </label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={editedData?.observations?.pannes || ''}
                                        onChange={(e) => setEditedData({
                                            ...editedData,
                                            observations: { ...editedData.observations, pannes: e.target.value }
                                        })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-lg text-slate-700 min-h-[60px]">
                                        {displayData?.observations?.pannes || 'Aucune panne signalée'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Observations Générales
                                </label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={editedData?.observations?.general || ''}
                                        onChange={(e) => setEditedData({
                                            ...editedData,
                                            observations: { ...editedData.observations, general: e.target.value }
                                        })}
                                    />
                                ) : (
                                    <p className="p-3 bg-slate-50 rounded-lg text-slate-700 min-h-[60px]">
                                        {displayData?.observations?.general || 'R.A.S.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between items-center">
                    <Button variant="ghost" onClick={onClose}>
                        Fermer
                    </Button>
                    <div className="flex gap-2">
                        {canEdit && !isEditing && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                Modifier
                            </Button>
                        )}
                        {isEditing && (
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                className="flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Enregistrer
                            </Button>
                        )}
                        {canValidate && (
                            <>
                                <Button
                                    variant="danger"
                                    onClick={() => {
                                        const reason = prompt('Raison du rejet (optionnel):');
                                        if (reason !== null) {
                                            onReject(report._key, reason);
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Rejeter
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={handleValidateWithData}
                                    className="flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Valider
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant helper pour les statistiques
const StatCard = ({ label, value, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        orange: 'text-orange-600 bg-orange-50',
        red: 'text-red-600 bg-red-50',
        purple: 'text-purple-600 bg-purple-50'
    };

    return (
        <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
            <div className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>
                {value}
            </div>
            <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
        </div>
    );
};

export default ReportDetailModal;
