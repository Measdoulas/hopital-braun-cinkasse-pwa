import React from 'react';
import { Input } from '../../../components/ui/Input';

const SectionHeader = ({ title }) => (
    <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2 mb-4 mt-6 first:mt-0">
        {title}
    </h3>
);

const NumberField = ({ label, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-sm text-neutral-600">{label}</label>
        <Input
            type="number"
            min="0"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 0)}
            className="text-right"
        />
    </div>
);

const ChirurgieForm = ({ data, onChange, readOnly = false }) => {
    const updateSection = (section, field, value) => {
        onChange({
            [section]: {
                ...(data[section] || {}),
                [field]: value
            }
        });
    };

    const d = (section, field) => (data[section] || {})[field];
    const u = (section, field) => (val) => updateSection(section, field, val);

    return (
        <div className="space-y-2">
            <SectionHeader title="Consultations" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <NumberField label="Total Consultations" value={d('consultations', 'total')} onChange={u('consultations', 'total')} disabled={readOnly} />
                <NumberField label="Nouveaux Cas" value={d('consultations', 'nouveauxCas')} onChange={u('consultations', 'nouveauxCas')} disabled={readOnly} />
                <NumberField label="Anciens Cas" value={d('consultations', 'anciensCas')} onChange={u('consultations', 'anciensCas')} disabled={readOnly} />
            </div>

            <SectionHeader title="Hospitalisations" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Admissions" value={d('hospitalisations', 'total')} onChange={u('hospitalisations', 'total')} />
                <NumberField label="Mise en OBS" value={d('hospitalisations', 'miseObservation')} onChange={u('hospitalisations', 'miseObservation')} />
                <NumberField label="Effectif Début" value={d('hospitalisations', 'effectifDebut')} onChange={u('hospitalisations', 'effectifDebut')} />
                <NumberField label="Effectif Fin" value={d('hospitalisations', 'effectifFin')} onChange={u('hospitalisations', 'effectifFin')} />
                <NumberField label="Référés" value={d('hospitalisations', 'casReferes')} onChange={u('hospitalisations', 'casReferes')} />
                <NumberField label="Exéats" value={d('hospitalisations', 'exeat')} onChange={u('hospitalisations', 'exeat')} />
                <NumberField label="Sorties / Avis" value={d('hospitalisations', 'sortieContreAvis')} onChange={u('hospitalisations', 'sortieContreAvis')} />
                <NumberField label="Décès" value={d('hospitalisations', 'deces')} onChange={u('hospitalisations', 'deces')} />
            </div>

            <SectionHeader title="Actes Chirurgicaux & Soins" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Actes Opératoires" value={d('actes', 'actesOperatoires')} onChange={u('actes', 'actesOperatoires')} />
                <NumberField label="Pansements" value={d('actes', 'pansements')} onChange={u('actes', 'pansements')} />
                <NumberField label="Sutures" value={d('actes', 'sutures')} onChange={u('actes', 'sutures')} />
                <NumberField label="Corps Étrangers" value={d('actes', 'extractionCE')} onChange={u('actes', 'extractionCE')} />
                <NumberField label="Oxygénothérapie" value={d('actes', 'oxygenotherapie')} onChange={u('actes', 'oxygenotherapie')} />
            </div>

            <SectionHeader title="Pannes & Observations" />
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Pannes Réparées / Observations</label>
                    <textarea
                        className="w-full rounded-lg border border-neutral-300 p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500"
                        rows={3}
                        value={d('pannes', 'pannesReparees') || ''}
                        onChange={(e) => updateSection('pannes', 'pannesReparees', e.target.value)}
                        disabled={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChirurgieForm;
