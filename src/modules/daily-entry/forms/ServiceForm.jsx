import React from 'react';
import PatientMovementSection from '../components/PatientMovementSection';
import ConsultationSection from '../components/ConsultationSection';
import ActsAndObservationsSection from '../components/ActsAndObservationsSection';
import { getServiceConfig } from './form-config';

const ServiceForm = ({ serviceId, data, onChange, readOnly = false }) => {
    const config = getServiceConfig(serviceId);

    const handleSectionChange = (sectionKey, sectionData) => {
        onChange({ ...data, [sectionKey]: sectionData });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section 1: Mouvements (si lits) */}
            {config.hasBeds && (
                <PatientMovementSection
                    data={data.mouvements}
                    onChange={(val) => handleSectionChange('mouvements', val)}
                    readOnly={readOnly}
                    hideObservation={config.hideObservation}
                />
            )}

            {/* Section 2: Consultations */}
            <ConsultationSection
                types={config.consultationTypes}
                data={data.consultations}
                onChange={(val) => handleSectionChange('consultations', val)}
                readOnly={readOnly}
            />

            {/* Section 3: Actes & Observations */}
            <ActsAndObservationsSection
                actTypes={config.actTypes}
                data={data.autres}
                onChange={(val) => handleSectionChange('autres', val)}
                readOnly={readOnly}
                actGroups={config.actGroups}
            />
        </div>
    );
};

export default ServiceForm;
