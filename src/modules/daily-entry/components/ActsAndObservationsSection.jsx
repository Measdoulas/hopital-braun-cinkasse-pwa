import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

const NumberField = ({ label, value, onChange, readOnly }) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600 truncate block" title={label}>{label}</label>
        <Input
            type="number"
            min="0"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 0)}
            className="text-right"
            disabled={readOnly}
        />
    </div>
);

const ActsAndObservationsSection = ({ actTypes = [], actGroups = [], data, onChange, readOnly = false }) => {

    const updateAct = (actId, val) => {
        const currentActs = data?.actes || {};
        onChange({ ...data, actes: { ...currentActs, [actId]: val } });
    };

    const updateObs = (field, val) => {
        const currentObs = data?.observations || {};
        onChange({ ...data, observations: { ...currentObs, [field]: val } });
    };

    return (
        <Card className="border shadow-none bg-neutral-50/50">
            <CardContent className="p-4 space-y-6">
                {/* Actes Médicaux (si configurés) */}
                {(actTypes.length > 0 || actGroups.length > 0) && (
                    <div>
                        <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                            💉 Actes Médicaux
                        </h3>

                        {actGroups.length > 0 ? (
                            <div className="space-y-6">
                                {actGroups.map((group, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                                        <h4 className="text-sm font-bold text-neutral-800 mb-3 border-b border-neutral-100 pb-2">{group.title}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {group.ids.map(actId => {
                                                const actDef = actTypes.find(a => a.id === actId) || { id: actId, label: actId };
                                                return (
                                                    <NumberField
                                                        key={actId}
                                                        label={actDef.label}
                                                        value={data?.actes?.[actId]}
                                                        onChange={(v) => updateAct(actId, v)}
                                                        readOnly={readOnly}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                                {actTypes.map((act) => (
                                    <NumberField
                                        key={act.id}
                                        label={act.label}
                                        value={data?.actes?.[act.id]}
                                        onChange={(v) => updateAct(act.id, v)}
                                        readOnly={readOnly}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pannes & Observations */}
                <div>
                    <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                        📝 Pannes, Décès & Observations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Pannes / Matériel défectueux</label>
                            <textarea
                                className="w-full rounded-lg border border-neutral-300 p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                                placeholder="Décrire les pannes..."
                                value={data?.observations?.pannes || ''}
                                onChange={(e) => updateObs('pannes', e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Observations Générales (Décès, événements...)</label>
                            <textarea
                                className="w-full rounded-lg border border-neutral-300 p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                                placeholder="Autres observations importantes..."
                                value={data?.observations?.general || ''}
                                onChange={(e) => updateObs('general', e.target.value)}
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ActsAndObservationsSection;
