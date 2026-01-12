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
export const compileWeeklyReport = (serviceId, dateInWeek) => {
    const { start, end } = getWeekRange(dateInWeek);
    const days = [];
    let current = start;

    while (current <= end) {
        days.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
    }

    const dailyReports = days.map(date => {
        const key = `rapports-quotidiens:${serviceId}:${date}`;
        return storage.get(key);
    }).filter(Boolean); // Garde seulement les rapports existants

    // Structure de base du rapport compilé
    const compiledData = {};

    // Algorithme de sommation récursif pour les objets imbriqués
    const aggregate = (target, source) => {
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                if (!target[key]) target[key] = {};
                aggregate(target[key], source[key]);
            } else if (typeof source[key] === 'number') {
                target[key] = (target[key] || 0) + source[key];
            } else if (typeof source[key] === 'string') {
                // Pour les chaînes (ex: observations), on concatène si unique
                if (source[key].trim()) {
                    const existing = target[key] ? target[key] + '\n' : '';
                    // Évite les doublons exacts pour cleaner le rapport
                    if (!target[key] || !target[key].includes(source[key])) {
                        target[key] = existing + `[${source.date || 'J'}]: ${source[key]}`;
                    }
                }
            }
        }
    };

    dailyReports.forEach(report => {
        if (report.data) {
            // Hack pour inclure la date dans l'agrégation de texte
            const dataWithContext = { ...report.data, date: report.date };
            aggregate(compiledData, dataWithContext);
        }
    });

    // Calculs spécifiques (Moyennes, Taux)
    if (compiledData.hospitalisations) {
        // Effectif Début Semaine = Effectif Début du premier jour dispo (ou Lundi)
        // Effectif Fin Semaine = Effectif Fin du dernier jour dispo (ou Dimanche)
        // Note: C'est une simplification. Idéalement il faut prendre le vrai début/fin.

        const firstReport = dailyReports.sort((a, b) => a.date.localeCompare(b.date))[0];
        const lastReport = dailyReports.sort((a, b) => b.date.localeCompare(a.date))[0];

        if (firstReport?.data?.hospitalisations) {
            compiledData.hospitalisations.effectifDebut = firstReport.data.hospitalisations.effectifDebut;
        }
        if (lastReport?.data?.hospitalisations) {
            compiledData.hospitalisations.effectifFin = lastReport.data.hospitalisations.effectifFin;
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
