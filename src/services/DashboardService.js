import { storage } from './storage';
import { ROLES, SERVICES } from '../utils/data-models';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export class DashboardService {
    constructor() {
        this.storage = storage; // StorageService.getInstance()
    }

    /**
     * Récupère les stats globales pour le dashboard (Dashboard principal)
     * @param {Object} user - Utilisateur connecté (pour filtrage rôle)
     */
    getDashboardStats(user) {
        // 1. Définir le périmètre (Services)
        let targetServices = [];
        if (user.role === ROLES.SERVICE) {
            targetServices = [user.serviceId || user.username];
        } else {
            // Direction/Admin : Tous les services
            targetServices = SERVICES.map(s => s.id);
        }

        // 2. Récupérer les rapports pertinents (Daily & Weekly)
        const allDailyReports = this._getDailyReports(targetServices);
        // Note: Pour l'instant on se base beaucoup sur les rapports journaliers pour le temps réel

        // 3. Calculer les KPIs

        // KPI: Consultations (Entrées du jour / semaine)
        const consultations = this._calculateConsultations(allDailyReports);

        // KPI: Hospitalisations (Patients actuellement présents)
        // C'est plus complexe car ça dépend des entrées/sorties cumulées ou d'un champ "présents"
        // Pour ce MVP, on va simuler en prenant le dernier "Total Présents" déclaré ou une approximation
        const hospitalizations = this._calculateHospitalizations(allDailyReports, targetServices);

        // KPI: Taux d'Occupation
        const occupancy = this._calculateOccupancy(hospitalizations.current, targetServices);

        // KPI: Rapports en attente (seulement pour Direction, ou pour Service voir ses propres brouillons)
        const pendingReports = this._countPendingReports(user, targetServices);

        // Charts: Activité sur les dernières semaines
        const activityTrend = this._calculateTrend(targetServices);

        return {
            consultations,
            hospitalizations,
            occupancy,
            pendingReports,
            activityTrend
        };
    }

    // --- Helpers ---

    _getDailyReports(serviceIds) {
        // Récupère toutes les clés et filtre
        const keys = this.storage.getAllKeys().filter(k => k.startsWith('rapports-journaliers:'));
        const reports = [];

        keys.forEach(key => {
            const parts = key.split(':'); // rapports-journaliers:serviceId:date
            if (parts.length === 3) {
                const serviceId = parts[1];
                if (serviceIds.includes(serviceId)) {
                    reports.push(this.storage.get(key));
                }
            }
        });
        return reports;
    }

    _calculateConsultations(reports) {
        // Total des entrées sur la période (ex: ce mois-ci ou total historique pour démo)
        // Pour "Ce mois", filtrons :
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let total = 0;
        let trend = 0; // Comparaison avec mois précendent (simulée pour l'instant ou calculée)

        reports.forEach(r => {
            const reportDate = parseISO(r.date);
            if (reportDate >= startOfMonth) {
                total += (parseInt(r.data?.entrees) || 0);
            }
        });

        return {
            value: total,
            trend: "+5%", // À calculer réellement plus tard (comparaison N-1)
            direction: "up"
        };
    }

    _calculateHospitalizations(reports, serviceIds) {
        // Pour l'instant, on n'a pas un "état des lieux temps réel" des lits dans daily reports.
        // On a "entrées" et "sorties". 
        // L'approximation : Somme (Entrées - Sorties) depuis le début ? Risqué.
        // Mieux : Utiliser une valeur "Total Présents" si elle existe dans le rapport, 
        // ou sinon prendre une valeur fictive cohérente avec la capacité pour la démo.

        // Dans generateDemoData, on n'a pas mis "restant".
        // On va estimer basé sur la capacité des services (mock intelligent).

        let current = 0;
        let capacity = 0;

        serviceIds.forEach(svcId => {
            const def = SERVICES.find(s => s.id === svcId);
            if (def && def.hasBeds) {
                const totalBeds = def.defaultBeds || 0;
                capacity += totalBeds;

                // Simulation réaliste : on prend un taux d'occupation aléatoire stable pour le service
                // (ou on regarde le dernier rapport hebdo qui contient souvent cette info)
                // Pour la démo, on va dire entre 50% et 90%
                // TODO: Connecter ça aux vraies données une fois le champ "Lits Occupés" ajouté au formulaire
                const randomOccupancy = 0.5 + (Math.random() * 0.4);
                current += Math.floor(totalBeds * randomOccupancy);
            }
        });

        return {
            current,
            capacity,
            trend: "+2%",
            direction: "up"
        };
    }

    _calculateOccupancy(currentPatients, serviceIds) {
        let totalBeds = 0;
        serviceIds.forEach(svcId => {
            const def = SERVICES.find(s => s.id === svcId);
            if (def && def.hasBeds) {
                totalBeds += (def.defaultBeds || 0);
            }
        });

        if (totalBeds === 0) return { value: "N/A", percent: 0 };

        const percent = Math.round((currentPatients / totalBeds) * 100);
        return {
            value: `${percent}%`,
            percent: percent,
            trend: "-1%",
            direction: "down"
        };
    }

    _countPendingReports(user, serviceIds) {
        // Compte les rapports hebdos statut 'pending'
        const keys = this.storage.getAllKeys().filter(k => k.startsWith('rapports-hebdo:'));
        let count = 0;

        keys.forEach(key => {
            const report = this.storage.get(key);
            if (serviceIds.includes(report.serviceId)) {
                if (report.status === 'pending') {
                    // Si c'est direction : tout.
                    // Si c'est service : seulement les siens (déjà filtré par serviceIds)
                    count++;
                }
            }
        });

        return count;
    }

    _calculateTrend(serviceIds) {
        // Courbe sur les 6 derniers mois ou semaines
        // Version simplifiée : Données statiques pour la courbe MAIS basées sur les services
        // Si 1 service : courbe détaillée. Si plusieurs : cumul.

        const data = [
            { name: 'Sem 1', value: 0 },
            { name: 'Sem 2', value: 0 },
            { name: 'Sem 3', value: 0 },
            { name: 'Sem 4', value: 0 },
            { name: 'Sem 5', value: 0 },
            { name: 'Sem 6', value: 0 },
        ];

        // Remplissage avec un peu d'aléatoire pondéré par la taille du service pour faire "vivant"
        // car on n'a pas assez d'historique réel dans le seed (seulement 4 dernières semaines)

        const baseValue = serviceIds.reduce((acc, sid) => {
            const def = SERVICES.find(s => s.id === sid);
            return acc + (def?.defaultBeds || 5) * 5; // ~5 consultations par lit par semaine
        }, 0);

        return data.map(d => ({
            name: d.name,
            value: Math.floor(baseValue * (0.8 + Math.random() * 0.4))
        }));
    }
}

export const dashboardService = new DashboardService();
