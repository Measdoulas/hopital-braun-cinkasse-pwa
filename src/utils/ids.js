/**
 * Génère un identifiant unique (UUID v4 simplifié).
 * Suffisant pour les besoins de l'application client-side.
 * @returns {string} L'identifiant généré.
 */
export const generateId = () => {
    return crypto.randomUUID();
};
