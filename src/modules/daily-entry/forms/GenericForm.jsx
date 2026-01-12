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

const GenericForm = ({ data, onChange, readOnly = false }) => {
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
            <SectionHeader title="Consultations / Examens" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Total Consultations" value={d('consultations', 'total')} onChange={u('consultations', 'total')} disabled={readOnly} />
                <NumberField label="Nouveaux Cas" value={d('consultations', 'nouveauxCas')} onChange={u('consultations', 'nouveauxCas')} disabled={readOnly} />
            </div>

            <SectionHeader title="Hospitalisations" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Total Entrées" value={d('hospitalisations', 'total')} onChange={u('hospitalisations', 'total')} />
                <NumberField label="Total Sorties" value={d('hospitalisations', 'sorties')} onChange={u('hospitalisations', 'sorties')} />
                <NumberField label="Décès" value={d('hospitalisations', 'deces')} onChange={u('hospitalisations', 'deces')} />
            </div>

            <SectionHeader title="Actes & Soins" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Total Actes" value={d('actes', 'total')} onChange={u('actes', 'total')} />
                <NumberField label="Soins Infirmiers" value={d('actes', 'soins')} onChange={u('actes', 'soins')} />
            </div>

            <SectionHeader title="Observations" />
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Remarques / Pannes</label>
                    <textarea
                        className="w-full rounded-lg border border-neutral-300 p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500"
                        rows={3}
                        value={d('pannes', 'observations') || ''}
                        onChange={(e) => updateSection('pannes', 'observations', e.target.value)}
                        disabled={readOnly}
                    />
                </div>
            </div>
        </div>
    );
};

export default GenericForm;
