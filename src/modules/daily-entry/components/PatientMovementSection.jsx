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

const PatientMovementSection = ({ data, onChange, readOnly = false }) => {
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
    const totalSorties = (s.aDomicile || 0) + (s.deces || 0) + (s.referes || 0) + (s.transferts || 0) + (s.fugitifs || 0) + (s.observ || 0) + (s.autres || 0);
    const theoreticalFin = (data?.effectifDebut || 0) + (data?.entrees || 0) - totalSorties;

    return (
        <Card className="border shadow-none bg-neutral-50/50">
            <CardContent className="p-4 space-y-6">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                    🏥 Mouvements des Malades / Hospitalisation
                </h3>

                {/* Flux Principal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                    <NumberField label="Effectif Début" value={data?.effectifDebut} onChange={(v) => updateField('effectifDebut', v)} readOnly={readOnly} />
                    <NumberField label="Entrées" value={data?.entrees} onChange={(v) => updateField('entrees', v)} readOnly={readOnly} />
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Total Sorties</label>
                        <div className="px-3 py-2 bg-neutral-100 rounded-lg text-right font-bold text-neutral-700">
                            {totalSorties}
                        </div>
                    </div>
                    <NumberField label="Effectif Fin" value={data?.effectifFin} onChange={(v) => updateField('effectifFin', v)} readOnly={readOnly} />
                </div>

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
                        <NumberField label="Sorties (Guérison)" value={s.aDomicile} onChange={(v) => updateSortie('aDomicile', v)} readOnly={readOnly} />
                        <NumberField label="Décès" value={s.deces} onChange={(v) => updateSortie('deces', v)} readOnly={readOnly} />
                        <NumberField label="Référés (Vers ext.)" value={s.referes} onChange={(v) => updateSortie('referes', v)} readOnly={readOnly} />
                        <NumberField label="Transférés (Interne)" value={s.transferts} onChange={(v) => updateSortie('transferts', v)} readOnly={readOnly} />
                        <NumberField label="Évadés" value={s.fugitifs} onChange={(v) => updateSortie('fugitifs', v)} readOnly={readOnly} />
                        <NumberField label="Mise en OBS" value={s.observ} onChange={(v) => updateSortie('observ', v)} readOnly={readOnly} />
                        <NumberField label="Sorties c/ Avis Médical" value={s.contreAvis} onChange={(v) => updateSortie('contreAvis', v)} readOnly={readOnly} />
                        <NumberField label="Autres Sorties" value={s.autres} onChange={(v) => updateSortie('autres', v)} readOnly={readOnly} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PatientMovementSection;
