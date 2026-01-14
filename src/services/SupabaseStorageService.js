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
                data: data.report_data
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
                report_data: reportData
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
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error saving daily report:', error);
            return false;
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
}
