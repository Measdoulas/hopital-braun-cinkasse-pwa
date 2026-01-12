/**
 * Service de stockage pour la persistance des données via localStorage.
 * Implémente une API similaire à celle décrite dans le cahier des charges.
 */

const APP_PREFIX = 'hbc_app_';

class StorageService {
    /**
     * Récupère une valeur du stockage.
     * @param {string} key - La clé de l'élément.
     * @returns {any|null} La valeur parsée ou null si non trouvée.
     */
    get(key) {
        try {
            const item = localStorage.getItem(APP_PREFIX + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Erreur lors de la lecture de la clé ${key}:`, error);
            return null;
        }
    }

    /**
     * Enregistre une valeur dans le stockage.
     * @param {string} key - La clé de l'élément.
     * @param {any} value - La valeur à stocker.
     * @returns {boolean} True si succès, False sinon.
     */
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(APP_PREFIX + key, serializedValue);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'écriture de la clé ${key}:`, error);
            return false;
        }
    }

    /**
     * Supprime une valeur du stockage.
     * @param {string} key - La clé de l'élément à supprimer.
     */
    remove(key) {
        try {
            localStorage.removeItem(APP_PREFIX + key);
        } catch (error) {
            console.error(`Erreur lors de la suppression de la clé ${key}:`, error);
        }
    }

    /**
     * Liste les éléments dont la clé commence par un préfixe donné.
     * @param {string} prefix - Le préfixe à rechercher.
     * @returns {Array<{key: string, value: any}>} Liste des paires clé/valeur trouvées.
     */
    list(prefix = '') {
        try {
            const results = [];
            const fullPrefix = APP_PREFIX + prefix;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(fullPrefix)) {
                    const value = this.get(key.substring(APP_PREFIX.length));
                    results.push({
                        key: key.substring(APP_PREFIX.length),
                        value
                    });
                }
            }
            return results;
        } catch (error) {
            console.error(`Erreur lors du listage avec le préfixe ${prefix}:`, error);
            return [];
        }
    }

    /**
     * Vide tout le stockage de l'application (utile pour le debug/reset).
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(APP_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error("Erreur lors du nettoyage du stockage:", error);
        }
    }
}

export const storage = new StorageService();
