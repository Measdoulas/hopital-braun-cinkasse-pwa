import { supabase } from './supabase';

/**
 * Service de stockage utilisant Supabase
 * Remplace StorageService (localStorage) pour la production
 */
export class SupabaseStorageService {
    static instance = null;

    static getInstance() {
        if (!SupabaseStorageService.instance) {
            SupabaseStorageService.instance = new SupabaseStorageService();
        }
        return SupabaseStorageService.instance;
    }

    // ==================== DAILY REPORTS ====================

    /**
     * Récupère un rapport quotidien
     * @param {string} serviceId 
     * @param {string} date (YYYY-MM-DD) - Date de début
     * @param {string} dateFin (YYYY-MM-DD) - Date de fin (optionnel)
     */
    async getDailyReport(serviceId, date, dateFin = null) {
        try {
            let query = supabase
                .from('daily_reports')
                .select('*')
                .eq('service_id', serviceId)
                .eq('date', date);

            // Si dateFin est fourni, on filtre aussi par date_fin
            if (dateFin) {
                query = query.eq('date_fin', dateFin);
            }

            const { data, error } = await query.single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                console.error('Supabase error:', error);
                throw error;
            }

            // Retourner l'objet complet avec date_fin
            return {
                serviceId: data.service_id,
                date: data.date,
                dateFin: data.date_fin,
                data: data.data // <--- FIXED: Column name is 'data'
            };
        } catch (error) {
            console.error('Error fetching daily report:', error);
            return null;
        }
    }

    /**
     * Sauvegarde un rapport quotidien
     * @param {string} serviceId
     * @param {string} date - Date de début
     * @param {object} reportData - Données du rapport
     * @param {string} dateFin - Date de fin (optionnel, pour gardes 24h)
     */
    async saveDailyReport(serviceId, date, reportData, dateFin = null) {
        try {
            const payload = {
                service_id: serviceId,
                date: date,
                date_fin: dateFin || date, // Si pas de fin, fin = début (rétrocompat)
                data: reportData // <--- FIXED: Column name is 'data'
            };

            const { data, error } = await supabase
                .from('daily_reports')
                .upsert(payload, {
                    onConflict: 'service_id,date,date_fin'
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase save error:', error);
                throw new Error(`Erreur Supabase: ${error.message || JSON.stringify(error)}`);
            }

            return true;
        } catch (error) {
            console.error('Error saving daily report:', error);
            throw error; // Re-throw the error instead of returning false
        }
    }

    /**
     * Récupère les rapports quotidiens sur une période donnée
     * @param {string} startDate (YYYY-MM-DD)
     * @param {string} endDate (YYYY-MM-DD)
     * @param {string|null} serviceId (Optionnel)
     */
    async getDailyReportsInRange(startDate, endDate, serviceId = null) {
        try {
            let query = supabase
                .from('daily_reports')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate);

            if (serviceId) {
                query = query.eq('service_id', serviceId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map(row => ({
                serviceId: row.service_id,
                date: row.date,
                dateFin: row.date_fin,
                data: row.data
            }));
        } catch (error) {
            console.error('Error fetching daily reports in range:', error);
            return [];
        }
    }

    // ==================== WEEKLY REPORTS ====================

    /**
     * Récupère tous les rapports hebdomadaires filtrés
     */
    async getWeeklyReports(filters = {}) {
        try {
            let query = supabase
                .from('weekly_reports')
                .select('*')
                .order('submitted_at', { ascending: false });

            // Apply filters if needed...

            const { data, error } = await query;
            if (error) throw error;

            // Map to application format
            return data.map(row => ({
                serviceId: row.service_id,
                weekNumber: row.week_number,
                year: row.year,
                status: row.status,
                data: row.data,
                submittedAt: row.submitted_at,
                validatedAt: row.validated_at,
                rejectedAt: row.rejected_at,
                rejectionReason: row.rejection_reason,
                _key: `rapports-hebdo:${row.service_id}:${row.year}-${row.week_number}` // Fake key for compatibility
            }));
        } catch (error) {
            console.error('Error fetching weekly reports:', error);
            return [];
        }
    }

    async saveWeeklyReport(report) {
        try {
            const { error } = await supabase
                .from('weekly_reports')
                .upsert({
                    service_id: report.serviceId,
                    week_number: report.weekNumber,
                    year: report.year,
                    status: report.status || 'pending',
                    data: report.data,
                    submitted_at: report.submittedAt || new Date().toISOString()
                }, { onConflict: 'service_id,week_number,year' });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving weekly report:', error);
            return false;
        }
    }

    /**
     * Récupère les rapports hebdomadaires sur une période (basé sur submitted_at)
     */
    async getWeeklyReportsInRange(startDate, endDate, serviceId = null) {
        try {
            let query = supabase
                .from('weekly_reports')
                .select('*')
                .gte('submitted_at', startDate)
                .lte('submitted_at', endDate);

            if (serviceId) {
                query = query.eq('service_id', serviceId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data.map(row => ({
                serviceId: row.service_id,
                weekNumber: row.week_number,
                year: row.year,
                status: row.status,
                submittedAt: row.submitted_at
            }));
        } catch (error) {
            console.error('Error fetching weekly reports in range:', error);
            return [];
        }
    }

    async updateReportStatus(serviceId, week, year, status, meta = {}) {
        try {
            const updateData = {
                status,
                ...meta // validated_at, rejected_reason, etc.
            };

            const { error } = await supabase
                .from('weekly_reports')
                .update(updateData)
                .eq('service_id', serviceId)
                .eq('week_number', week)
                .eq('year', year);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating report status:', error);
            return false;
        }
    }

    // ==================== UTILS (Shim for existing calls) ====================

    // Note: getAllKeys() ne peut pas être implémenté efficacement en SQL pur
    // Il faut refactorer les appelants pour utiliser des méthodes spécifiques (getReports, getHistory, etc.)
    // ==================== MONTHLY REPORTS ====================

    /**
     * Récupère un rapport mensuel
     * @param {string} serviceId
     * @param {number} month
     * @param {number} year
     */
    async getMonthlyReport(serviceId, month, year) {
        try {
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('*')
                .eq('service_id', serviceId)
                .eq('month', month)
                .eq('year', year)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return {
                serviceId: data.service_id,
                month: data.month,
                year: data.year,
                status: data.status,
                data: data.data,
                validatedAt: data.validated_at,
                validatedBy: data.validated_by
            };
        } catch (error) {
            console.error('Error fetching monthly report:', error);
            return null;
        }
    }

    /**
     * Récupère tous les rapports mensuels (pour l'historique)
     */
    async getMonthlyReports() {
        try {
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('*')
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) throw error;

            return data.map(row => ({
                serviceId: row.service_id,
                month: row.month,
                year: row.year,
                status: row.status,
                data: row.data,
                validatedAt: row.validated_at,
                // Clé virtuelle pour le tri/affichage dans l'historique
                _key: `rapports-mensuels:${row.service_id}:${row.year}-${row.month}`,
                _type: 'monthly',
                displayDate: `${new Date(Date.UTC(row.year, row.month - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
            }));
        } catch (error) {
            console.error('Error fetching all monthly reports:', error);
            return [];
        }
    }

    /**
     * Sauvegarde un rapport mensuel
     * @param {object} report
     */
    async saveMonthlyReport(report) {
        try {
            const payload = {
                service_id: report.serviceId,
                month: report.month,
                year: report.year,
                status: report.status || 'draft',
                data: report.data,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('monthly_reports')
                .upsert(payload, {
                    onConflict: 'service_id,month,year'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving monthly report:', error);
            return false;
        }
    }
}
