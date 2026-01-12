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

const GynecoForm = ({ data, onChange, readOnly = false }) => {
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <NumberField label="Total Lundi" value={d('consultations', 'totalS1')} onChange={u('consultations', 'totalS1')} disabled={readOnly} />
                <NumberField label="Total Mardi" value={d('consultations', 'totalS2')} onChange={u('consultations', 'totalS2')} disabled={readOnly} />
                <NumberField label="Total Mercredi" value={d('consultations', 'totalS3')} onChange={u('consultations', 'totalS3')} disabled={readOnly} />
                <NumberField label="Total Jeudi" value={d('consultations', 'totalS4')} onChange={u('consultations', 'totalS4')} disabled={readOnly} />
                <NumberField label="Total Vendredi" value={d('consultations', 'totalS5')} onChange={u('consultations', 'totalS5')} disabled={readOnly} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <NumberField label="CPN" value={d('consultations', 'cpn')} onChange={u('consultations', 'cpn')} />
                <NumberField label="Post-Natale" value={d('consultations', 'postNatale')} onChange={u('consultations', 'postNatale')} />
                <NumberField label="Maternité" value={d('consultations', 'maternite')} onChange={u('consultations', 'maternite')} />
                <NumberField label="Gynécologie" value={d('consultations', 'gynecologie')} onChange={u('consultations', 'gynecologie')} />
            </div>

            <SectionHeader title="Hospitalisations" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Nouveaux Cas" value={d('hospitalisations', 'total')} onChange={u('hospitalisations', 'total')} />
                <NumberField label="Mise en OBS" value={d('hospitalisations', 'miseObservation')} onChange={u('hospitalisations', 'miseObservation')} />
                <NumberField label="Effectif Début" value={d('hospitalisations', 'effectifDebut')} onChange={u('hospitalisations', 'effectifDebut')} />
                <NumberField label="Effectif Fin" value={d('hospitalisations', 'effectifFin')} onChange={u('hospitalisations', 'effectifFin')} />
                <NumberField label="Référés" value={d('hospitalisations', 'casReferes')} onChange={u('hospitalisations', 'casReferes')} />
                <NumberField label="Exéats" value={d('hospitalisations', 'exeat')} onChange={u('hospitalisations', 'exeat')} />
                <NumberField label="Sorties / Avis" value={d('hospitalisations', 'sortieContreAvis')} onChange={u('hospitalisations', 'sortieContreAvis')} />
                <NumberField label="Décès" value={d('hospitalisations', 'deces')} onChange={u('hospitalisations', 'deces')} />
            </div>

            <SectionHeader title="Actes Médicaux" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Echo Obst. Ext." value={d('actes', 'echoObstetricaleExterne')} onChange={u('actes', 'echoObstetricaleExterne')} />
                <NumberField label="Echo Obst. Int." value={d('actes', 'echoObstetricaleInterne')} onChange={u('actes', 'echoObstetricaleInterne')} />
                <NumberField label="Echo Pelvienne" value={d('actes', 'echoPelvienne')} onChange={u('actes', 'echoPelvienne')} />
                <NumberField label="Acc. Voie Basse" value={d('actes', 'accouchementVB')} onChange={u('actes', 'accouchementVB')} />
                <NumberField label="Acc. Césarienne" value={d('actes', 'accouchementCesarienne')} onChange={u('actes', 'accouchementCesarienne')} />
                <NumberField label="Pansements" value={d('actes', 'pansements')} onChange={u('actes', 'pansements')} />
                <NumberField label="AMIU" value={d('actes', 'amiu')} onChange={u('actes', 'amiu')} />
                <NumberField label="Curetage" value={d('actes', 'curetageDigital')} onChange={u('actes', 'curetageDigital')} />
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

export default GynecoForm;
