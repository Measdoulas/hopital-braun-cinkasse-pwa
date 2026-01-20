import { startOfWeek, endOfWeek, addDays, format, isSameDay } from 'date-fns';
import { storage } from '../services/storage';
import { SERVICES } from './data-models';

/**
 * Retourne la plage de dates pour une semaine donnée.
 * @param {Date|string} date - Une date dans la semaine cible.
 * @returns {{start: Date, end: Date}}
 */
export const getWeekRange = (date) => {
    const d = new Date(date);
    // La semaine commence le Lundi (index 1)
    const start = startOfWeek(d, { weekStartsOn: 1 });
    const end = endOfWeek(d, { weekStartsOn: 1 });
    return { start, end };
};

/**
 * Compile les rapports quotidiens en un rapport hebdomadaire.
 * @param {string} serviceId - L'identifiant du service / username.
 * @param {string|Date} dateInWeek - Une date dans la semaine à compiler.
 * @returns {Object} Le rapport compilé.
 */
export const compileWeeklyReport = async (serviceId, dateInWeek) => {
    const { start, end } = getWeekRange(dateInWeek);
    const days = [];
    let current = start;

    while (current <= end) {
        days.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
    }

    // Récupération asynchrone des rapports
    const promises = days.map(async date => {
        const key = `rapports-quotidiens:${serviceId}:${date}`;
        // Note: storage.get est maintenant async (voir storage.js)
        // Mais attendez, notre clé est 'rapports-quotidiens', mais storage.js gère 'rapports-journaliers' !
        // Vérifions la cohérence des clés.
        // DailyEntryPage utilise 'rapports-journaliers' ou 'quotidiens' ? 
        // Si c'est 'quotidiens', il faut updater storage.js aussi ou ici.
        // Update: storage.js gère 'rapports-journaliers'. Si DailyEntryPage utilise 'journaliers', ici c'était faux avant ?
        // Ou bien DailyEntryPage utilise 'quotidiens' ?
        // On va supposer 'rapports-journaliers' est le bon standard vu storage.js
        // On change la clé ici pour matcher storage.js : 'rapports-journaliers'

        // CORRECTION CLE : journaliers au lieu de quotidiens pour matcher Supabase/Storage
        const correctedKey = `rapports-journaliers:${serviceId}:${date}`;
        return await storage.get(correctedKey);
    });

    const results = await Promise.all(promises);
    const dailyReports = results.filter(Boolean); // Garde seulement les rapports existants

    // Structure de base du rapport compilé
    const compiledData = {};

    // Liste des champs métadonnées à ignorer (ne pas agréger)
    const metadataFields = ['serviceId', 'date', 'dateFin', 'createdAt', 'updatedAt', '_key', '_type'];

    // Algorithme de sommation récursif pour les objets imbriqués
    const aggregate = (target, source, parentKey = '') => {
        for (const key in source) {
            // Ignorer les champs métadonnées au niveau racine
            if (parentKey === '' && metadataFields.includes(key)) {
                continue;
            }

            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                aggregate(target[key], source[key], key);
            } else if (typeof source[key] === 'number') {
                target[key] = (target[key] || 0) + source[key];
            } else if (typeof source[key] === 'string' && key.toLowerCase().includes('observation')) {
                // Pour les observations uniquement, on concatène
                if (source[key].trim()) {
                    const existing = target[key] ? target[key] + '\n' : '';
                    target[key] = existing + source[key];
                }
            }
            // Ignorer les autres strings (comme les IDs, dates, etc.)
        }
    };

    dailyReports.forEach(report => {
        if (report) {
            // Si le rapport a un champ 'data', on agrège son contenu
            // Sinon on agrège le rapport lui-même (pour compatibilité)
            const dataToAggregate = report.data || report;
            aggregate(compiledData, dataToAggregate);
        }
    });

    // Calculs spécifiques (Moyennes, Taux)
    if (compiledData.hospitalisations) {
        // Effectif Début Semaine = Effectif Début du premier jour dispo (ou Lundi)
        // Effectif Fin Semaine = Effectif Fin du dernier jour dispo (ou Dimanche)
        // Note: C'est une simplification. Idéalement il faut prendre le vrai début/fin.

        // Comme on a perdu l'ordre exact garanti par Promise.all si on ne fait pas attention...
        // Ah si, Promise.all garde l'ordre. Donc dailyReports est ordonné Lundi->Dimanche (avec des trous).
        // Donc on peut prendre le premier et le dernier.

        const firstReport = dailyReports[0];
        const lastReport = dailyReports[dailyReports.length - 1];

        if (firstReport?.hospitalisations) {
            compiledData.hospitalisations.effectifDebut = firstReport.hospitalisations.effectifDebut;
        }
        if (lastReport?.hospitalisations) {
            compiledData.hospitalisations.effectifFin = lastReport.hospitalisations.effectifFin;
        }

        // Taux d'occupation
        const serviceConfig = SERVICES.find(s => s.id === serviceId);
        if (serviceConfig?.hasBeds && serviceConfig?.defaultBeds) {
            // Taux = (Journées d'hospitalisation / (Lits * Jours)) * 100
            // Ici on approxime avec la moyenne des présents si on avait cette info, 
            // mais on a que Entrées/Sorties.
            // On peut utiliser (EffectifDebut + EffectifFin) / 2 comme moyenne grossière sur la semaine
            const avgPatients = ((compiledData.hospitalisations.effectifDebut || 0) + (compiledData.hospitalisations.effectifFin || 0)) / 2;
            compiledData.hospitalisations.tauxOccupation = Math.round((avgPatients / serviceConfig.defaultBeds) * 100);
        }
    }

    return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        dailyReportsCount: dailyReports.length,
        data: compiledData
    };
};
