import React from 'react';
import GynecoForm from './GynecoForm';
import ChirurgieForm from './ChirurgieForm';
import GenericForm from './GenericForm';

const ServiceForm = ({ serviceId, data, onChange, readOnly = false }) => {
    switch (serviceId) {
        case 'gyneco':
            return <GynecoForm data={data} onChange={onChange} readOnly={readOnly} />;
        case 'chirurgie':
            return <ChirurgieForm data={data} onChange={onChange} readOnly={readOnly} />;
        default:
            return <GenericForm data={data} onChange={onChange} readOnly={readOnly} />;
    }
};

export default ServiceForm;
