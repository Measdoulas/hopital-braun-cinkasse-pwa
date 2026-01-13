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
     * @param {string} date (YYYY-MM-DD)
     */
    async getDailyReport(serviceId, date) {
        try {
            const { data, error } = await supabase
                .from('daily_reports')
                .select('data')
                .eq('service_id', serviceId)
                .eq('date', date)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                console.error('Supabase error:', error);
                throw error;
            }

            return data?.data || null;
        } catch (error) {
            console.error('Error fetching daily report:', error);
            return null;
        }
    }

    /**
     * Sauvegarde un rapport quotidien
     */
    async saveDailyReport(serviceId, date, reportData) {
        try {
            const { error } = await supabase
                .from('daily_reports')
                .upsert({
                    service_id: serviceId,
                    date: date,
                    data: reportData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'service_id,date' });

            if (error) throw error;
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
