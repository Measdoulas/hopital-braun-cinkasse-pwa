/**
 * Configuration des formulaires de saisie par service
 */

export const SERVICE_CONFIGS = {
    // Gynécologie-Obstétrique
    gyneco: {
        hasBeds: true,
        consultationTypes: [
            { id: 'cpn', label: 'CPN (Prénatale)' },
            { id: 'cpon', label: 'CPON (Post-natale)' },
            { id: 'gyneco', label: 'Gynécologie' },
            { id: 'pf', label: 'Planification Familiale' },
            { id: 'maternite', label: 'Maternité' },
            { id: 'vaccination', label: 'Vaccination' }
        ],
        actTypes: [
            { id: 'echo_ext', label: 'Echo Obst. Externe' },
            { id: 'echo_int', label: 'Echo Obst. Interne' },
            { id: 'echo_pelv', label: 'Echo Pelvienne' },
            { id: 'acc_vb', label: 'Accouchement VB' },
            { id: 'acc_cesarienne', label: 'Césarienne' },
            { id: 'amiu', label: 'AMIU' },
            { id: 'curetage', label: 'Curetage' },
            { id: 'pansement', label: 'Pansement' }
        ]
    },
    // Chirurgie
    chirurgie: {
        hasBeds: true,
        consultationTypes: [
            { id: 'chir_generale', label: 'Chirurgie Générale' },
            { id: 'traumato', label: 'Traumatologie' },
            { id: 'urologie', label: 'Urologie' }
        ],
        actTypes: [
            { id: 'intervention_majeure', label: 'Intervention Majeure' },
            { id: 'intervention_mineure', label: 'Intervention Mineure' },
            { id: 'pansement', label: 'Pansement' },
            { id: 'platre', label: 'Pose de plâtre' }
        ]
    },
    // Médecine Générale
    medecine: {
        hasBeds: true,
        consultationTypes: [
            { id: 'mg', label: 'Médecine Générale' },
            { id: 'cardio', label: 'Cardiologie' },
            { id: 'gast', label: 'Gastro-entérologie' }
        ],
        actTypes: [
            { id: 'ecg', label: 'ECG' },
            { id: 'prelevement', label: 'Prélèvement' }
        ]
    },
    // Pédiatrie
    pediatrie: {
        hasBeds: true,
        consultationTypes: [
            { id: 'ped_generale', label: 'Pédiatrie Générale' },
            { id: 'neonat', label: 'Néonatologie' },
            { id: 'malnutrition', label: 'Malnutrition' }
        ],
        actTypes: [
            { id: 'perf', label: 'Perfusion' },
            { id: 'cadr', label: 'Soins' }
        ]
    },
    // Ophtalmologie
    ophtalmo: {
        hasBeds: false,
        consultationTypes: [
            { id: 'opht_cons', label: 'Consultation Ophtalmo' },
            { id: 'refraction', label: 'Réfraction' }
        ],
        actTypes: [
            { id: 'chir_cataracte', label: 'Chirurgie Cataracte' },
            { id: 'fond_oeil', label: 'Fond d\'œil' }
        ]
    },
    // Par défaut
    default: {
        hasBeds: false,
        consultationTypes: [
            { id: 'consultation', label: 'Consultation Standard' },
            { id: 'urgence', label: 'Urgence' }
        ],
        actTypes: []
    }
};

export const getServiceConfig = (serviceId) => {
    return SERVICE_CONFIGS[serviceId] || SERVICE_CONFIGS.default;
};
