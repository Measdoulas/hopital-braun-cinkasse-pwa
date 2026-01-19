import React, { useState, useEffect } from 'react';
import PatientMovementSection from '../components/PatientMovementSection';
import ConsultationSection from '../components/ConsultationSection';
import ActsAndObservationsSection from '../components/ActsAndObservationsSection';
import { getServiceConfig } from './form-config';
import { DEFAULT_SERVICE_CONFIG } from '../../../utils/data-models';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { FileText } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

const ServiceForm = ({ serviceId, data, onChange, readOnly = false }) => {
    // 1. Charger la config statique (pour les types d'actes spécifique au service)
    const staticConfig = getServiceConfig(serviceId);

    // 2. Charger la config dynamique (activations/désactivations & champs custom)
    const [dynamicConfig, setDynamicConfig] = useState(DEFAULT_SERVICE_CONFIG);

    useEffect(() => {
        const savedConfig = localStorage.getItem(`service_config_${serviceId}`);
        if (savedConfig) {
            setDynamicConfig(JSON.parse(savedConfig));
        } else {
            // Si pas de config sauvegardée, on peut initialiser avec des défauts intelligents
            // ou fusionner avec staticConfig si nécessaire.
            setDynamicConfig(DEFAULT_SERVICE_CONFIG);
        }
    }, [serviceId]);

    const handleSectionChange = (sectionKey, sectionData) => {
        onChange({ ...data, [sectionKey]: sectionData });
    };

    const handleCustomFieldChange = (fieldId, value) => {
        const currentCustomData = data.customData || {};
        onChange({
            ...data,
            customData: {
                ...currentCustomData,
                [fieldId]: value
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Section 1: Mouvements (si lits ET activé) */}
            {staticConfig.hasBeds && dynamicConfig.enableMovements && (
                <PatientMovementSection
                    data={data.mouvements}
                    onChange={(val) => handleSectionChange('mouvements', val)}
                    readOnly={readOnly}
                    hideObservation={staticConfig.hideObservation}
                />
            )}

            {/* Section 2: Consultations (si activé) */}
            {dynamicConfig.enableConsultations && (
                <ConsultationSection
                    types={staticConfig.consultationTypes}
                    data={data.consultations}
                    onChange={(val) => handleSectionChange('consultations', val)}
                    readOnly={readOnly}
                />
            )}

            {/* Section 3: Actes (si activé) */}
            {dynamicConfig.enableActs && (
                <ActsAndObservationsSection
                    actTypes={staticConfig.actTypes}
                    data={data.autres}
                    onChange={(val) => handleSectionChange('autres', val)}
                    readOnly={readOnly}
                    actGroups={staticConfig.actGroups}
                    hideObservations={!dynamicConfig.enableObservations}
                />
            )}

            {/* Section 4: Champs Personnalisés */}
            {dynamicConfig.customOptions && dynamicConfig.customOptions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Données Spécifiques Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dynamicConfig.customOptions.map(option => (
                                <div key={option.id}>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {option.label}
                                    </label>
                                    {option.type === 'boolean' ? (
                                        <div className="flex items-center gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={option.id}
                                                    checked={data.customData?.[option.id] === true}
                                                    onChange={() => !readOnly && handleCustomFieldChange(option.id, true)}
                                                    disabled={readOnly}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                Oui
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={option.id}
                                                    checked={data.customData?.[option.id] === false}
                                                    onChange={() => !readOnly && handleCustomFieldChange(option.id, false)}
                                                    disabled={readOnly}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                Non
                                            </label>
                                        </div>
                                    ) : (
                                        <Input
                                            type={option.type === 'number' ? 'number' : 'text'}
                                            value={data.customData?.[option.id] || ''}
                                            onChange={(e) => handleCustomFieldChange(option.id, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder={`Saisir ${option.label}...`}
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ServiceForm;
