// Note: On importe directement SupabaseStorageService pour accès aux méthodes avancées non exposées par le wrapper
import { SupabaseStorageService } from './SupabaseStorageService';
import { ROLES, SERVICES } from '../utils/data-models';
import { SERVICE_CONFIGS } from '../modules/daily-entry/forms/form-config';
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
        const todayStr = format(today, 'yyyy-MM-dd');

        // Période précédente (M-1 à la même date pour comparaison équitable)
        const prevMonthDate = subDays(today, 30); // Approx
        const startOfPrevMonth = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
        // On veut comparer 1er-19 Jan vs 1er-19 Déc
        const endOfPrevMonth = format(prevMonthDate, 'yyyy-MM-dd');

        // 3. Récupérer les rapports pertinents
        // Période Actuelle
        const reportsCurrent = await this.storage.getDailyReportsInRange(startOfCurrentMonth, todayStr, targetServiceId);
        // Période Précédente
        const reportsPrev = await this.storage.getDailyReportsInRange(startOfPrevMonth, endOfPrevMonth, targetServiceId);

        // 4. Calculer les KPIs

        // KPI: Consultations/Entrées (Mois courant vs Précédent)
        const consultations = this._calculateConsultations(reportsCurrent, reportsPrev);

        // KPI: Hospitalisations (Dernier état connu)
        const hospitalizations = this._calculateCurrentHospitalizations(reportsCurrent, targetServicesList);

        // KPI: Admissions & Sorties du jour (pour vue "Temps Réel")
        const dailyMovements = this._calculateDailyMovements(reportsCurrent, todayStr);

        // KPI: Date du dernier rapport (pour Services)
        const lastReportDate = this._getLastReportDate(reportsCurrent);

        // KPI: Rapports en attente (Weekly)
        const recentWeeklyReports = await this.storage.getWeeklyReports();
        const pendingReports = this._countPendingReports(user, recentWeeklyReports, targetServicesList);

        // Charts: Activité (7 derniers jours)
        const activityTrend = await this._calculateActivityTrend(targetServiceId);

        // Top 5 Actes Récurrents (7 derniers jours)
        const topActs = await this._calculateTopActs(targetServiceId);

        return {
            consultations,
            hospitalizations,
            pendingReports,
            activityTrend,
            dailyMovements,
            lastReportDate,
            topActs
        };
    }

    // --- Helpers ---

    _calculateConsultations(reports, prevReports = []) {
        const sumReports = (list) => {
            let total = 0;
            list.forEach(r => {
                const entrees = parseInt(r.data?.mouvements?.entrees) || 0;
                const consult = parseInt(r.data?.consultations?.total) || 0;
                total += (entrees + consult);
            });
            return total;
        };

        const currentTotal = sumReports(reports);
        const prevTotal = sumReports(prevReports);

        let percent = 0;
        let direction = "neutral";
        let trendLabel = "Stable";

        if (prevTotal > 0) {
            percent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
            if (percent > 0) {
                direction = "up";
                trendLabel = `+${percent}%`;
            } else if (percent < 0) {
                direction = "down";
                trendLabel = `${percent}%`;
            }
        } else if (currentTotal > 0) {
            direction = "up";
            trendLabel = "Nouveau";
        }

        return {
            value: currentTotal,
            trend: direction,
            direction: direction, // Double field for compatibility
            trendValue: trendLabel,
            percent: percent
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

    _calculateDailyMovements(reports, dateStr) {
        let admissions = 0;
        let sorties = 0;

        const todaysReports = reports.filter(r => r.date === dateStr);
        todaysReports.forEach(r => {
            admissions += (parseInt(r.data?.mouvements?.entrees) || 0);

            const s = r.data?.mouvements?.sorties || {};
            const totalSorties =
                (parseInt(s.deces) || 0) +
                (parseInt(s.aDomicile) || 0) +
                (parseInt(s.referes) || 0) +
                (parseInt(s.transferts) || 0) +
                (parseInt(s.fugitifs) || 0) +
                (parseInt(s.observ) || 0);

            sorties += totalSorties;
        });

        return {
            admissions,
            sorties
        };
    }

    _getLastReportDate(reports) {
        if (!reports || reports.length === 0) return null;
        // Trier par date desc
        reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        return reports[0].date;
    }

    _getActLabel(actId, serviceId) {
        if (!SERVICE_CONFIGS) return actId;

        const serviceConfig = SERVICE_CONFIGS[serviceId];
        if (serviceConfig?.actTypes) {
            const act = serviceConfig.actTypes.find(a => a.id === actId);
            if (act) return act.label;
        }

        try {
            for (const conf of Object.values(SERVICE_CONFIGS)) {
                const act = conf.actTypes?.find(a => a.id === actId);
                if (act) return act.label;
            }
        } catch (e) {
            console.warn("Error looking up act label", e);
        }
        return actId;
    }

    async _calculateTopActs(serviceId) {
        const today = new Date();
        const startStr = format(subDays(today, 7), 'yyyy-MM-dd'); // 7 derniers jours
        const endStr = format(today, 'yyyy-MM-dd');

        const reports = await this.storage.getDailyReportsInRange(startStr, endStr, serviceId);

        const actsAggregation = {};

        reports.forEach(r => {
            const reportActs = r.data?.autres?.actes || {};
            Object.entries(reportActs).forEach(([actId, count]) => {
                const val = parseInt(count) || 0;
                if (val > 0) {
                    if (!actsAggregation[actId]) {
                        actsAggregation[actId] = {
                            id: actId,
                            count: 0,
                            name: this._getActLabel(actId, r.serviceId)
                        };
                    }
                    actsAggregation[actId].count += val;
                }
            });
        });

        return Object.values(actsAggregation)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
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
