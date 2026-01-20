import React, { useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

const NumberField = ({ label, value, onChange, readOnly, className }) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{label}</label>
        <Input
            type="number"
            min="0"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 0)}
            className="text-right font-medium"
            disabled={readOnly}
        />
    </div>
);

const PatientMovementSection = ({ data, onChange, readOnly = false, hideObservation = false, config = {} }) => {
    // Structure attendue de data: { effectifDebut, entrees, sorties: { aDomicile, deces, referes, transferts, fugitifs, observ, autres }, effectifFin }

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const updateSortie = (type, value) => {
        const currentSorties = data?.sorties || {};
        const newSorties = { ...currentSorties, [type]: value };

        // Recalculer le total des sorties si besoin, ou laisser le composant parent gérer
        onChange({ ...data, sorties: newSorties });
    };

    const s = data?.sorties || {};

    // Calcul automatique pour vérification (optionnel, affiché à titre indicatif)
    const totalSorties = (s.aDomicile || 0) + (s.deces || 0) + (s.referes || 0) + (s.transferts || 0) + (s.fugitifs || 0) + (s.observ || 0) + (s.contreAvis || 0) + (s.autres || 0);
    const theoreticalFin = (data?.effectifDebut || 0) + (data?.entrees || 0) - totalSorties;

    // Helper pour récupérer libellé et visibilité
    const getField = (key, defaultLabel) => {
        const isHidden = config.hiddenFields?.includes(key);
        const label = config.labelOverrides?.[key] || defaultLabel;
        return { isHidden, label };
    };

    const f_debut = getField('movements.effectifDebut', 'Effectif Début');
    const f_entrees = getField('movements.entrees', 'Entrées');
    const f_sortiesTotal = getField('movements.totalSorties', 'Total Sorties');
    const f_fin = getField('movements.effectifFin', 'Effectif Fin');


    return (
        <Card className="border shadow-none bg-neutral-50/50">
            <CardContent className="p-4 space-y-6">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                    🏥 Mouvements des Malades / Hospitalisation
                </h3>

                {/* Flux Principal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                    {!f_debut.isHidden && <NumberField label={f_debut.label} value={data?.effectifDebut} onChange={(v) => updateField('effectifDebut', v)} readOnly={readOnly} />}
                    {!f_entrees.isHidden && <NumberField label={f_entrees.label} value={data?.entrees} onChange={(v) => updateField('entrees', v)} readOnly={readOnly} />}
                    {!f_sortiesTotal.isHidden && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{f_sortiesTotal.label}</label>
                            <div className="px-3 py-2 bg-neutral-100 rounded-lg text-right font-bold text-neutral-700">
                                {totalSorties}
                            </div>
                        </div>
                    )}
                    {!f_fin.isHidden && <NumberField label={f_fin.label} value={data?.effectifFin} onChange={(v) => updateField('effectifFin', v)} readOnly={readOnly} />}
                </div>

                {/* Taux d'Occupation */}
                {config.bedCount > 0 && data?.effectifFin !== undefined && (
                    <div className="flex items-center justify-end">
                        <div className={`px-4 py-2 rounded-lg border ${(data.effectifFin / config.bedCount) > 1 ? 'bg-red-50 border-red-200 text-red-700' :
                                (data.effectifFin / config.bedCount) > 0.8 ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                    'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                            <span className="text-sm font-medium mr-2">Taux d'Occupation :</span>
                            <span className="text-lg font-bold">
                                {((data.effectifFin / config.bedCount) * 100).toFixed(1)}%
                            </span>
                            <span className="text-xs ml-2 opacity-75">
                                ({data.effectifFin} / {config.bedCount} lits)
                            </span>
                        </div>
                    </div>
                )}

                {/* Validation de cohérence */}
                {!readOnly && data?.effectifFin !== undefined && data?.effectifFin !== theoreticalFin && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ Attention : Théoriquement (Début + Entrées - Sorties) = {theoreticalFin}. Vous avez saisi {data.effectifFin}.
                    </div>
                )}

                {/* Détail des Sorties */}
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase mb-3 block">Détail des Sorties & Mouvements</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {(() => {
                            const fields = [
                                { key: 'sorties.domicile', def: 'Sorties (Guérison)', val: s.aDomicile, update: 'aDomicile' },
                                { key: 'sorties.deces', def: 'Décès', val: s.deces, update: 'deces' },
                                { key: 'sorties.referes', def: 'Référés (Vers ext.)', val: s.referes, update: 'referes' },
                                { key: 'sorties.transferts', def: 'Transférés (Interne)', val: s.transferts, update: 'transferts' },
                                { key: 'sorties.fugitifs', def: 'Évadés', val: s.fugitifs, update: 'fugitifs' },
                                { key: 'sorties.observ', def: 'Mise en OBS', val: s.observ, update: 'observ', condition: !hideObservation },
                                { key: 'sorties.contreAvis', def: 'Sorties c/ Avis Médical', val: s.contreAvis, update: 'contreAvis' },
                                { key: 'sorties.autres', def: 'Autres Sorties', val: s.autres, update: 'autres' },
                            ];

                            return fields.map(field => {
                                if (field.condition === false) return null;
                                const { isHidden, label } = getField(field.key, field.def);
                                if (isHidden) return null;
                                return (
                                    <NumberField
                                        key={field.key}
                                        label={label}
                                        value={field.val}
                                        onChange={(v) => updateSortie(field.update, v)}
                                        readOnly={readOnly}
                                    />
                                );
                            });
                        })()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PatientMovementSection;
