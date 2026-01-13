/**
 * Rôles utilisateurs disponibles dans l'application
 */
export const ROLES = {
    ADMIN: 'admin',
    DIRECTION: 'direction',
    SERVICE: 'service',
};

/**
 * Liste des services hospitaliers avec leurs identifiants et configurations.
 */
export const SERVICES = [
    { id: 'gyneco', name: 'Gynécologie-Obstétrique', hasBeds: true, defaultBeds: 5 },
    { id: 'chirurgie', name: 'Chirurgie', hasBeds: true, defaultBeds: 15 },
    { id: 'bloc', name: 'Bloc Opératoire', hasBeds: false },
    { id: 'medecine', name: 'Médecine Générale', hasBeds: true, defaultBeds: 25 },
    { id: 'pediatrie', name: 'Pédiatrie', hasBeds: true, defaultBeds: 10 },
    { id: 'laboratoire', name: 'Laboratoire', hasBeds: false },
    { id: 'radiologie', name: 'Radiologie / Imagerie', hasBeds: false },
    { id: 'cdt', name: 'Kinésithérapie', hasBeds: false },
    { id: 'ophtalmo', name: 'Ophtalmologie', hasBeds: false },
];

/**
 * Statuts possibles pour un rapport hebdomadaire.
 */
export const REPORT_STATUS = {
    DRAFT: 'brouillon',
    PENDING: 'en_attente',
    VALIDATED: 'valide',
    REJECTED: 'rejete',
};
