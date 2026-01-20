
import { SupabaseStorageService } from './SupabaseStorageService';
import { REPORT_STATUS } from '../utils/data-models';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export class MonthlyReportService {
    constructor() {
        this.storage = SupabaseStorageService.getInstance();
    }

    /**
     * Génère ou récupère un rapport mensuel pour un service donné
     * @param {string} serviceId
     * @param {number} month (0-11, attention aux index JS !)
     * @param {number} year
     * @returns {Promise<Object>} Le rapport agrégé
     */
    async getOrGenerateReport(serviceId, month, year) {
        // 1. Essayer de récupérer un rapport existant
        const existingReport = await this.storage.getMonthlyReport(serviceId, month, year);

        // Si le rapport existe et est validé, on le retourne tel quel
        if (existingReport && (existingReport.status === REPORT_STATUS.VALIDATED || existingReport.status === REPORT_STATUS.VALIDATED_BY_CHIEF)) {
            return existingReport;
        }

        // Sinon (nouveau ou brouillon), on recalcule à la volée pour avoir les dernières données
        // Note: Si c'est un brouillon, on pourrait vouloir récupérer les commentaires manuels déjà saisis...
        // Pour l'instant, on ré-agrège tout, sauf si on implémente une logique de fusion.
        // Simplification V1: On ré-agrège les stats, mais on garde les observations manuelles si existantes.

        const aggregatedData = await this._aggregateData(serviceId, month, year);

        if (existingReport) {
            return {
                ...existingReport,
                data: {
                    ...aggregatedData,
                    // On pourrait vouloir préserver certaines saisies manuelles ici si on en ajoute plus tard
                    observations: existingReport.data.observations || aggregatedData.observations
                }
            };
        }

        return {
            serviceId,
            month,
            year,
            status: REPORT_STATUS.DRAFT,
            data: aggregatedData
        };
    }

    async saveReport(report) {
        // On sauvegarde
        return await this.storage.saveMonthlyReport(report);
    }

    async validateReport(report, userId) {
        const validatedReport = {
            ...report,
            status: REPORT_STATUS.VALIDATED_BY_CHIEF,
            validatedAt: new Date().toISOString(),
            validatedBy: userId
        };
        return await this.storage.saveMonthlyReport(validatedReport);
    }

    // --- Aggregation Logic ---

    async _aggregateData(serviceId, month, year) {
        const startDate = startOfMonth(new Date(year, month));
        const endDate = endOfMonth(startDate);

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        const dailyReports = await this.storage.getDailyReportsInRange(startStr, endStr, serviceId);

        // Structure d'agrégation vide
        const stats = {
            mouvements: {
                entrees: 0,
                sorties: {
                    total: 0,
                    deces: 0,
                    aDomicile: 0,
                    transferts: 0,
                    referes: 0,
                    fugitifs: 0,
                    observ: 0
                }
            },
            consultations: {
                total: 0,
                pec: 0 // Prise en charge (si applicable)
            },
            actes: {}, // Map dynamqiue { actId: count }
            observations: {
                pannes: [], // Liste de strings
                general: []
            }
        };

        // Parcours des rapports journaliers
        dailyReports.forEach(report => {
            const d = report.data || {};

            // 1. Mouvements
            if (d.mouvements) {
                stats.mouvements.entrees += (parseInt(d.mouvements.entrees) || 0);

                const s = d.mouvements.sorties || {};
                stats.mouvements.sorties.deces += (parseInt(s.deces) || 0);
                stats.mouvements.sorties.aDomicile += (parseInt(s.aDomicile) || 0);
                stats.mouvements.sorties.transferts += (parseInt(s.transferts) || 0);
                stats.mouvements.sorties.referes += (parseInt(s.referes) || 0);
                stats.mouvements.sorties.fugitifs += (parseInt(s.fugitifs) || 0);
                stats.mouvements.sorties.observ += (parseInt(s.observ) || 0);
            }

            // 2. Consultations
            if (d.consultations) {
                stats.consultations.total += (parseInt(d.consultations.total) || 0);
            }

            // 3. Actes
            if (d.actes) {
                Object.entries(d.actes).forEach(([actId, count]) => {
                    const val = parseInt(count) || 0;
                    if (val > 0) {
                        stats.actes[actId] = (stats.actes[actId] || 0) + val;
                    }
                });
            }

            // 4. Observations (Concaténation intelligente)
            if (d.observations) {
                if (d.observations.pannes && d.observations.pannes.trim()) {
                    stats.observations.pannes.push(`[${format(new Date(report.date), 'dd/MM')}] ${d.observations.pannes.trim()}`);
                }
                if (d.observations.general && d.observations.general.trim()) {
                    stats.observations.general.push(`[${format(new Date(report.date), 'dd/MM')}] ${d.observations.general.trim()}`);
                }
            }
        });

        // Calcul total sorties
        const s = stats.mouvements.sorties;
        s.total = s.deces + s.aDomicile + s.transferts + s.referes + s.fugitifs + s.observ;

        // Formater observations en string pour textarea
        stats.observations.pannes = stats.observations.pannes.join('\n');
        stats.observations.general = stats.observations.general.join('\n');

        return stats;
    }
}

export const monthlyReportService = new MonthlyReportService();
