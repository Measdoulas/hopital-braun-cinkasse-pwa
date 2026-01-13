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

const ConsultationSection = ({ types = [], data, onChange, readOnly = false }) => {
    // data structure: { [typeId]: count }

    const updateCount = (typeId, val) => {
        onChange({ ...data, [typeId]: val });
    };

    const totalConsultations = Object.values(data || {}).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);

    return (
        <Card className="border shadow-none bg-neutral-50/50">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        🩺 Consultations
                    </h3>
                    <div className="text-sm font-medium text-neutral-600 bg-white px-3 py-1 rounded-full border">
                        Total : <span className="font-bold text-primary">{totalConsultations}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                    {types.map((type) => (
                        <NumberField
                            key={type.id}
                            label={type.label}
                            value={data?.[type.id]}
                            onChange={(v) => updateCount(type.id, v)}
                            readOnly={readOnly}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ConsultationSection;
