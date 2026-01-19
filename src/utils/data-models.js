/**
 * Rôles utilisateurs disponibles dans l'application
 */
export const ROLES = {
    ADMIN: 'admin',
    DIRECTION: 'direction',
    CHEF_SERVICE: 'chef_service',
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
    DRAFT: 'brouillon',       // En cours de saisie par la garde
    PENDING: 'en_attente',    // Soumis au Chef de Service (Legacy: Direction) - On utilisera TRANSMITTED_TO_CHIEF pour être clair
    TRANSMITTED_TO_CHIEF: 'transmis_chef', // Soumis au Chef
    PENDING: 'en_attente',    // Soumis au Chef de Service
    TRANSMITTED_TO_CHIEF: 'transmis_chef', // Soumis au Chef
    VALIDATED_BY_CHIEF: 'valide_chef',     // Validé par Chef -> Visible Direction (Lecture Seule)
    VALIDATED: 'valide_chef',      // Alias pour compatibilité
    REJECTED: 'rejete',       // Rejeté par Chef (Retour au brouillon)
};
