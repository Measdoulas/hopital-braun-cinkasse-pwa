import { SupabaseStorageService } from './SupabaseStorageService';

/**
 * Service de stockage - FAÇADE ASYNCHRONE VERS SUPABASE
 * 
 * MIGRATION SUPABASE :
 * Ce service remplace l'ancien stockage localStorage synchrone.
 * 
 * ⚠️ ATTENTION : Toutes les méthodes sont désormais ASYNCHRONES.
 * Il faut utiliser `await` pour chaque appel.
 * 
 * Cette façade permet de conserver une compatibilité partielle basée sur les clés
 * (ex: 'rapports-journaliers:...') tout en redirigeant vers les tables SQL.
 */
export class StorageService {
    static instance = null;

    constructor() {
        this.supabaseService = SupabaseStorageService.getInstance();
    }

    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Récupère une valeur (Async)
     * Parse la clé pour déterminer quelle table Supabase interroger.
     */
    async get(key) {
        // 1. Rapports Journaliers : rapports-journaliers:serviceId:YYYY-MM-DD ou rapports-journaliers:serviceId:YYYY-MM-DD_YYYY-MM-DD
        if (key.startsWith('rapports-journaliers:')) {
            const parts = key.split(':');
            if (parts.length === 3) {
                const [_, serviceId, dateStr] = parts;

                // Vérifier si la date contient une période (date_dateFin)
                if (dateStr.includes('_')) {
                    const [date, dateFin] = dateStr.split('_');
                    return await this.supabaseService.getDailyReport(serviceId, date, dateFin);
                } else {
                    return await this.supabaseService.getDailyReport(serviceId, dateStr);
                }
            }
        }

        // 2. Rapports Hebdo : rapports-hebdo:serviceId:YYYY-Wnum
        // Clé legacy: rapports-hebdo:gyneco:2026-1
        if (key.startsWith('rapports-hebdo:')) {
            const parts = key.split(':');
            if (parts.length === 3) {
                // ex: 2026-1
                const [_, serviceId, periodStr] = parts;
                const [year, week] = periodStr.split('-');

                // On utilise getWeeklyReports avec filtre car pas de getSingle par défaut encore
                // TODO: Ajouter getSingleWeeklyReport dans SupabaseStorageService pour optimiser
                const reports = await this.supabaseService.getWeeklyReports();
                return reports.find(r => r.serviceId === serviceId && r.year == year && r.weekNumber == week) || null;
            }
        }

        // 3. Config (Table config ou localStorage fallback ?)
        // Pour l'instant on laisse null ou on implémente une table config
        if (key === 'config-generale') {
            console.warn("Config générale non encore migrée en base.");
            return null;
        }

        console.warn(`Clé non gérée par SupabaseStorageService: ${key}`);
        return null;
    }

    /**
     * Enregistre une valeur (Async)
     */
    async set(key, value) {
        // 1. Rapports Journaliers
        if (key.startsWith('rapports-journaliers:')) {
            const parts = key.split(':');
            if (parts.length === 3) {
                const [_, serviceId, dateStr] = parts;

                // Extraire date et dateFin du dateStr ou de value
                let date, dateFin;
                if (dateStr.includes('_')) {
                    [date, dateFin] = dateStr.split('_');
                } else {
                    date = dateStr;
                    dateFin = value.dateFin || null; // Lire depuis value si disponible
                }

                const reportData = value.data || value;
                return await this.supabaseService.saveDailyReport(serviceId, date, reportData, dateFin);
            }
        }

        // 2. Rapports Hebdo
        if (key.startsWith('rapports-hebdo:')) {
            // value est l'objet rapport complet compilé
            return await this.supabaseService.saveWeeklyReport(value);
        }

        console.warn(`Écriture non gérée pour la clé: ${key}`);
        return false;
    }

    /**
     * Suppression (Async)
     */
    async remove(key) {
        console.warn('Remove non implémenté pour Supabase (Soft delete recommandé)');
        // TODO: Implémenter delete si nécessaire
    }

    /**
     * Listage par préfixe (Async)
     * Très inefficace avec Supabase si on fetch tout. 
     * Il vaut mieux utiliser des méthodes spécifiques (getReportsByService...)
     */
    async list(prefix = '') {
        console.warn("⚠️ Utilisation de list() déconseillée avec Supabase. Utilisez des méthodes spécifiques.");

        if (prefix.startsWith('rapports-hebdo')) {
            const reports = await this.supabaseService.getWeeklyReports();
            // Filtrage JS temporaire
            return reports.map(r => ({ key: r._key, value: r }));
        }

        if (prefix.startsWith('rapports-mensuels')) {
            const reports = await this.supabaseService.getMonthlyReports();
            return reports.map(r => ({ key: r._key, value: r }));
        }

        return [];
    }

    /**
     * Legacy method - try to avoid using it
     */
    getAllKeys() {
        console.error("getAllKeys ne peut plus être utilisé de manière synchrone ni efficace avec Supabase.");
        return [];
    }
}

export const storage = new StorageService();
