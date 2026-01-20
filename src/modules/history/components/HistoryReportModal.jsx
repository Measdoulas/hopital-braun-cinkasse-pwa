import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    X, Edit3, Save, Users, TrendingUp, Activity,
    FileText, AlertCircle, Calendar, CheckCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SERVICES, ROLES } from '../../../utils/data-models';
import { StorageService } from '../../../services/storage';

/**
 * HistoryReportModal - Modal universel pour visualiser et éditer tous types de rapports
 * Supporte: Rapports Quotidiens, Hebdomadaires, Mensuels
 */
const HistoryReportModal = ({ report, user, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(report?.data || {});
    const [saving, setSaving] = useState(false);

    if (!report) return null;

    const serviceName = SERVICES.find(s => s.id === report.serviceId)?.name || report.serviceId;
    const reportType = report._type; // 'daily', 'weekly', 'monthly'

    // Permissions d'édition
    const canEdit = () => {
        console.log('Checking canEdit:', { reportType, userRole: user.role, reportStatus: report.status });

        if (reportType === 'daily') {
            // Service peut modifier ses propres rapports quotidiens
            // Chef peut modifier les rapports quotidiens de son service
            // Pour l'instant, on autorise tous les rôles sauf DIRECTION
            return user.role !== ROLES.DIRECTION;
        }
        if (reportType === 'weekly') {
            // Chef peut modifier ses rapports hebdo non validés uniquement
            return user.role === ROLES.CHEF_SERVICE &&
                (report.status === 'en_attente' || report.status === 'transmis_chef' || report.status === 'brouillon');
        }
        return false; // Rapports mensuels = lecture seule dans historique
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const storage = StorageService.getInstance();

            if (reportType === 'daily') {
                // Sauvegarder rapport quotidien
                await storage.set(report._key, {
                    ...report,
                    data: editedData,
                    updatedAt: new Date().toISOString()
                });
            } else if (reportType === 'weekly') {
                // Sauvegarder rapport hebdo
                await storage.set(report._key, {
                    ...report,
                    data: editedData,
                    updatedAt: new Date().toISOString()
                });
            }

            setIsEditing(false);
            onSave && onSave();
        } catch (error) {
            alert('Erreur lors de la sauvegarde: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const displayData = isEditing ? editedData : report.data;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className={`p-6 text-white ${reportType === 'daily' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                    reportType === 'weekly' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                        'bg-gradient-to-r from-orange-600 to-orange-700'
                    }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-7 h-7" />
                                <h2 className="text-2xl font-bold">{serviceName}</h2>
                                <TypeBadge type={reportType} />
                            </div>
                            <div className="flex items-center gap-4 text-sm opacity-90">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {report.displayDate || format(new Date(report.date || report.submittedAt), 'dd MMMM yyyy', { locale: fr })}
                                </span>
                                {report.submittedAt && (
                                    <span className="text-xs">
                                        Soumis le {format(new Date(report.submittedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                    </span>
                                )}
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
                    {/* Mouvements de Patients */}
                    {displayData?.mouvements && (
                        <Section icon={Users} title="Mouvements de Patients" color="blue">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <EditableStatCard
                                    label="Entrées"
                                    value={displayData.mouvements?.entrees || 0}
                                    isEditing={isEditing}
                                    onChange={(val) => setEditedData(prev => ({
                                        ...prev,
                                        mouvements: { ...prev.mouvements, entrees: parseInt(val) || 0 }
                                    }))}
                                    color="green"
                                />
                                <EditableStatCard
                                    label="Sorties"
                                    value={displayData.mouvements?.sorties?.total || 0}
                                    isEditing={isEditing}
                                    onChange={(val) => setEditedData(prev => ({
                                        ...prev,
                                        mouvements: { ...prev.mouvements, sorties: { ...prev.mouvements.sorties, total: parseInt(val) || 0 } }
                                    }))}
                                    color="orange"
                                />
                                <EditableStatCard
                                    label="Décès"
                                    value={displayData.mouvements?.sorties?.deces || 0}
                                    isEditing={isEditing}
                                    onChange={(val) => setEditedData(prev => ({
                                        ...prev,
                                        mouvements: { ...prev.mouvements, sorties: { ...prev.mouvements.sorties, deces: parseInt(val) || 0 } }
                                    }))}
                                    color="red"
                                />
                                <EditableStatCard
                                    label="Transferts"
                                    value={displayData.mouvements?.sorties?.transferts || 0}
                                    isEditing={isEditing}
                                    onChange={(val) => setEditedData(prev => ({
                                        ...prev,
                                        mouvements: { ...prev.mouvements, sorties: { ...prev.mouvements.sorties, transferts: parseInt(val) || 0 } }
                                    }))}
                                    color="blue"
                                />
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                                <span className="text-sm text-blue-700 font-medium">Effectif fin de période: </span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="w-24 p-1 border rounded text-right font-bold text-blue-900"
                                        value={displayData.mouvements.effectifFin}
                                        onChange={(e) => setEditedData(prev => ({
                                            ...prev,
                                            mouvements: { ...prev.mouvements, effectifFin: parseInt(e.target.value) || 0 }
                                        }))}
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-blue-900">{displayData.mouvements?.effectifFin || 0}</span>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Consultations */}
                    {displayData?.consultations && (
                        <Section icon={Activity} title="Consultations" color="purple">
                            <div className="flex items-center gap-4">
                                {isEditing ? (
                                    <div className="w-full">
                                        <label className="block text-sm text-slate-500 mb-1">Consultations totales</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 text-3xl font-bold text-purple-600 border rounded-lg"
                                            value={displayData.consultations?.total || 0}
                                            onChange={(e) => setEditedData(prev => ({
                                                ...prev,
                                                consultations: { ...prev.consultations, total: parseInt(e.target.value) || 0 }
                                            }))}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-5xl font-bold text-purple-600">
                                            {displayData.consultations?.total || 0}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-2">Consultations totales</p>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Actes Médicaux */}
                    {(displayData?.actes || isEditing) && (
                        <Section icon={TrendingUp} title="Actes Médicaux" color="green">
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {/* En mode édition, on affiche tous les actes disponibles ou ceux déjà présents */}
                                {isEditing ? (
                                    Object.entries(displayData.actes || {}).map(([actId, count]) => (
                                        <div key={actId} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                            <span className="text-slate-700 font-medium">{actId}</span>
                                            <input
                                                type="number"
                                                className="w-20 p-1 border rounded text-center"
                                                value={count}
                                                onChange={(e) => setEditedData(prev => ({
                                                    ...prev,
                                                    actes: { ...prev.actes, [actId]: parseInt(e.target.value) || 0 }
                                                }))}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    /* En lecture seule, on filtre ceux > 0 */
                                    (Object.entries(displayData.actes || {})
                                        .filter(([_, count]) => count > 0)
                                        .length > 0) ? (
                                        Object.entries(displayData.actes)
                                            .filter(([_, count]) => count > 0)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([actId, count]) => (
                                                <div key={actId} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                                    <span className="text-slate-700">{actId}</span>
                                                    <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                        {count}
                                                    </span>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-slate-500 italic text-sm">Aucun acte enregistré</p>
                                    )
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Observations */}
                    {(displayData?.observations || isEditing) && (
                        <Section icon={AlertCircle} title="Observations & Pannes" color="amber">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Pannes Signalées
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={editedData?.observations?.pannes || ''}
                                            onChange={(e) => setEditedData(prev => ({
                                                ...prev,
                                                observations: { ...prev.observations || {}, pannes: e.target.value }
                                            }))}
                                        />
                                    ) : (
                                        <p className="p-3 bg-slate-50 rounded-lg text-slate-700 min-h-[60px] whitespace-pre-wrap">
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
                                            onChange={(e) => setEditedData(prev => ({
                                                ...prev,
                                                observations: { ...prev.observations || {}, general: e.target.value }
                                            }))}
                                        />
                                    ) : (
                                        <p className="p-3 bg-slate-50 rounded-lg text-slate-700 min-h-[60px] whitespace-pre-wrap">
                                            {displayData?.observations?.general || 'R.A.S.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Section>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between items-center">
                    <Button variant="ghost" onClick={onClose}>
                        Fermer
                    </Button>
                    <div className="flex gap-2">
                        {canEdit() && !isEditing && (
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
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedData(report.data);
                                    }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    isLoading={saving}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Enregistrer
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composants helpers
const TypeBadge = ({ type }) => {
    const config = {
        daily: { label: 'Quotidien', color: 'bg-purple-100 text-purple-700' },
        weekly: { label: 'Hebdomadaire', color: 'bg-blue-100 text-blue-700' },
        monthly: { label: 'Mensuel', color: 'bg-orange-100 text-orange-700' }
    };
    const { label, color } = config[type] || config.daily;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>{label}</span>;
};

const Section = ({ icon: Icon, title, color, children }) => {
    const colorClasses = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        green: 'text-green-600',
        amber: 'text-amber-600'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className={`font-bold text-lg text-slate-900 mb-4 flex items-center gap-2`}>
                <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
                {title}
            </h3>
            {children}
        </div>
    );
};

const EditableStatCard = ({ label, value, color = 'blue', isEditing, onChange }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        orange: 'text-orange-600 bg-orange-50',
        red: 'text-red-600 bg-red-50'
    };

    return (
        <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
            {isEditing ? (
                <input
                    type="number"
                    className="w-full p-1 text-xl font-bold border rounded bg-white/50"
                    value={value}
                    onChange={(e) => onChange && onChange(e.target.value)}
                />
            ) : (
                <div className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}>
                    {value}
                </div>
            )}
            <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
        </div>
    );
};

const StatCard = ({ label, value, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        orange: 'text-orange-600 bg-orange-50',
        red: 'text-red-600 bg-red-50'
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

export default HistoryReportModal;
