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
            { id: 'gyneco', label: 'Consultation Gynéco' },
            { id: 'maternite', label: 'Maternité (Admission)' },
            { id: 'pf', label: 'Planification Familiale' },
            { id: 'vaccination', label: 'Vaccination' },
            { id: 'ecoute', label: 'Écoute / Orientation' }
        ],
        actTypes: [
            // Échographies
            { id: 'echo_obs_ext', label: 'Echo Obst. Externe' },
            { id: 'echo_obs_int', label: 'Echo Obst. Interne' },
            { id: 'echo_pelv', label: 'Echo Pelvienne' },
            // Accouchements
            { id: 'acc_eutocique', label: 'Acc. Voie Basse (Eutocique)' },
            { id: 'acc_dystocique', label: 'Acc. Voie Basse (Dystocique)' },
            { id: 'cesarienne', label: 'Césarienne' },
            // Chirurgie Gynéco
            { id: 'hysterectomie', label: 'Hystérectomie' },
            { id: 'myomectomie', label: 'Myomectomie' },
            { id: 'kystectomie', label: 'Kystectomie' },
            { id: 'geu', label: 'GEU (Grossesse Extra-Utérine)' },
            // Petits actes
            { id: 'amiu', label: 'AMIU' },
            { id: 'curetage', label: 'Curetage' },
            { id: 'cerclage', label: 'Cerclage' },
            { id: 'pansement', label: 'Pansement' }
        ]
    },
    // Chirurgie
    chirurgie: {
        hasBeds: true,
        consultationTypes: [
            { id: 'chir_cons', label: 'Consultation Chirurgie' },
            { id: 'traumato', label: 'Consultation Traumato' },
            { id: 'urologie', label: 'Consultation Urologie' },
            { id: 'visite_pre_anest', label: 'Visite Pré-anesthésique' }
        ],
        actTypes: [
            // Grande Chirurgie
            { id: 'herniorraphie', label: 'Herniorraphie' },
            { id: 'appendicectomie', label: 'Appendicectomie' },
            { id: 'laparotomie', label: 'Laparotomie' },
            { id: 'prostatectomie', label: 'Prostatectomie' },
            { id: 'osteosynthese', label: 'Ostéosynthèse' },
            // Petite Chirurgie
            { id: 'circumcision', label: 'Circoncision' },
            { id: 'lipome', label: 'Exérèse Lipome/Kyste' },
            { id: 'suture', label: 'Suture' },
            { id: 'pansement', label: 'Pansement' },
            { id: 'platre', label: 'Pose Plâtre/Attelle' }
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
