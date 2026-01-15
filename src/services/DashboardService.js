// Note: On importe directement SupabaseStorageService pour accès aux méthodes avancées non exposées par le wrapper
import { SupabaseStorageService } from './SupabaseStorageService';
import { ROLES, SERVICES } from '../utils/data-models';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, startOfMonth, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export class DashboardService {
    constructor() {
        this.storage = SupabaseStorageService.getInstance();
    }

    /**
     * Récupère les stats globales pour le dashboard (Dashboard principal)
     * @param {Object} user - Utilisateur connecté (pour filtrage rôle)
     */
    async getDashboardStats(user) {
        // 1. Définir le périmètre (Services)
        let targetServiceId = null; // null = Tous les services
        let targetServicesList = SERVICES.map(s => s.id);

        if (user.role === ROLES.SERVICE || user.role === ROLES.CHEF_SERVICE) {
            targetServiceId = user.serviceId || user.username;
            targetServicesList = [targetServiceId];
        }

        // 2. Définir les périodes
        const today = new Date();
        const startOfCurrentMonth = format(startOfMonth(today), 'yyyy-MM-dd');
        const startOfLastWeek = format(subDays(today, 7), 'yyyy-MM-dd'); // Pour les trends
        const todayStr = format(today, 'yyyy-MM-dd');

        // 3. Récupérer les rapports pertinents (Daily & Weekly)
        // On récupère large pour calculer les trends
        const reportsLast30Days = await this.storage.getDailyReportsInRange(startOfCurrentMonth, todayStr, targetServiceId);

        // 4. Calculer les KPIs

        // KPI: Consultations/Entrées (Mois courant)
        const consultations = this._calculateConsultations(reportsLast30Days);

        // KPI: Hospitalisations (Dernier état connu ou moyenne)
        // Pour être précis, il faudrait le dernier rapport de chaque service.
        // On va prendre le rapport le plus récent pour chaque service.
        const hospitalizations = this._calculateCurrentHospitalizations(reportsLast30Days, targetServicesList);

        // KPI: Taux d'Occupation
        const occupancy = this._calculateOccupancy(hospitalizations.current, targetServicesList);

        // KPI: Rapports en attente (Weekly)
        // On utilise getWeeklyReports qui est déjà capable de fetcher "tout"
        // Mais on va filtrer en mémoire pour l'instant
        const recentWeeklyReports = await this.storage.getWeeklyReports();
        const pendingReports = this._countPendingReports(user, recentWeeklyReports, targetServicesList);

        // Charts: Activité (7 derniers jours)
        const activityTrend = await this._calculateActivityTrend(targetServiceId);

        return {
            consultations,
            hospitalizations,
            occupancy,
            pendingReports,
            activityTrend
        };
    }

    // --- Helpers ---

    _calculateConsultations(reports) {
        let total = 0;
        reports.forEach(r => {
            // On somme les "entrees" (ou consultations si dispo dans data)
            // Dans le modèle actuel: mouvements.entrees est le KPI clé
            const entrees = parseInt(r.data?.mouvements?.entrees) || 0;
            const consult = parseInt(r.data?.consultations?.total) || 0;
            // Si pas de section consultation explicite, on utilise entrées, sinon on ajoute.
            // Pour simplifier l'affichage "Activité", on prend entrées hospitalisation + consults externes si dispo
            total += (entrees + consult);
        });

        return {
            value: total,
            trend: "Mois en cours",
            direction: "neutral"
        };
    }

    _calculateCurrentHospitalizations(reports, serviceIds) {
        let currentTotal = 0;
        let capacityTotal = 0;

        serviceIds.forEach(svcId => {
            const def = SERVICES.find(s => s.id === svcId);
            if (def && def.hasBeds) {
                capacityTotal += (def.defaultBeds || 0);

                // Trouver le rapport le plus récent pour ce service
                const svcReports = reports.filter(r => r.serviceId === svcId);
                if (svcReports.length > 0) {
                    // Trier par date desc
                    svcReports.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const lastReport = svcReports[0];
                    currentTotal += (parseInt(lastReport.data?.mouvements?.effectifFin) || 0);
                }
            }
        });

        return {
            current: currentTotal,
            capacity: capacityTotal,
            trend: "Temps réel",
            direction: "neutral"
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

        let direction = "neutral";
        if (percent > 85) direction = "up"; // Tension
        if (percent < 50) direction = "down"; // Calme

        return {
            value: `${percent}%`,
            percent: percent,
            trend: "Occupation",
            direction: direction
        };
    }

    _countPendingReports(user, allWeeklyReports, targetServiceIds) {
        let count = 0;

        allWeeklyReports.forEach(report => {
            if (targetServiceIds.includes(report.serviceId)) {
                // Direction: voit 'valide_chef' (à valider par Direction)
                // Chef: voit 'transmis_chef' (à valider par Chef - wait, le Chef reçoit du Service)
                // Le workflow : Service -> (Brouillon) -> Transmis Chef -> Valide Chef -> Valide Direction

                if (user.role === ROLES.DIRECTION && report.status === 'valide_chef') {
                    count++;
                } else if (user.role === ROLES.CHEF_SERVICE) {
                    // Le Chef doit valider les rapports transmis par son équipe
                    if (report.status === 'transmis_chef') count++;
                }
            }
        });

        return count;
    }

    async _calculateActivityTrend(serviceId) {
        // 7 derniers jours
        const endDate = new Date();
        const startDate = subDays(endDate, 6);

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        const reports = await this.storage.getDailyReportsInRange(startStr, endStr, serviceId);

        // Initialiser les 7 jours à 0
        const trendData = [];
        for (let i = 0; i <= 6; i++) {
            const d = subDays(endDate, 6 - i);
            const dStr = format(d, 'yyyy-MM-dd');
            trendData.push({
                name: format(d, 'dd/MM'),
                date: dStr,
                value: 0
            });
        }

        // Remplir avec données
        reports.forEach(r => {
            const dayStat = trendData.find(d => d.date === r.date);
            if (dayStat) {
                // On somme entrées + consults pour l'activité
                const val = (parseInt(r.data?.mouvements?.entrees) || 0) + (parseInt(r.data?.consultations?.total) || 0);
                dayStat.value += val;
            }
        });

        return trendData;
    }
}

export const dashboardService = new DashboardService();
