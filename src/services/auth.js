/**
 * Utilitaires pour la sécurité l'authentification.
 */

/**
 * Hache une chaîne de caractères en utilisant l'algorithme SHA-256.
 * @param {string} message - Le message à hacher (mot de passe).
 * @returns {Promise<string>} Le hash hexadécimal.
 */
export async function hashPassword(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Vérifie si un mot de passe correspond à un hash.
 * @param {string} password - Le mot de passe en clair.
 * @param {string} savedHash - Le hash stocké.
 * @returns {Promise<boolean>} True si correspondance.
 */
export async function verifyPassword(password, savedHash) {
    const hash = await hashPassword(password);
    return hash === savedHash;
}
