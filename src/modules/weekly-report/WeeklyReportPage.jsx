import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/storage';
import { compileWeeklyReport, getWeekRange } from '../../utils/reports';
import { generateId } from '../../utils/ids';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import ServiceForm from '../daily-entry/forms/ServiceForm';
import { Calendar, FileText, CheckCircle } from 'lucide-react';

const WeeklyReportPage = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reportData, setReportData] = useState(null);
    const [period, setPeriod] = useState({ start: null, end: null });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // S'assurer que le serviceId est correct (user.username ou user.serviceId selon implémentation)
    const serviceId = user?.username;

    const handleGenerate = () => {
        if (!serviceId) return;

        setLoading(true);
        try {
            const compiled = compileWeeklyReport(serviceId, selectedDate);
            setReportData(compiled);
            setPeriod({
                start: compiled.startDate,
                end: compiled.endDate
            });
            console.log("Rapport généré:", compiled);
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la compilation des données.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!reportData || !period.start) return;

        setLoading(true);
        setError('');

        try {
            // Clé unique pour la semaine : rapports-hebdo:SERVICE:YYYY-MM-DD(start)
            const key = `rapports-hebdo:${serviceId}:${period.start}`;
            const reportToSave = {
                id: generateId(),
                type: 'weekly',
                serviceId: serviceId,
                period: period,
                data: reportData.data,
                status: 'pending', // pending, validated, rejected
                submittedAt: new Date().toISOString(),
                submittedBy: user.username,
                dailyReportsCount: reportData.dailyReportsCount
            };

            const saved = storage.set(key, reportToSave);
            if (saved) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                throw new Error("Échec de la sauvegarde.");
            }
        } catch (err) {
            setError("Erreur lors de la soumission : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-darkest">Rapport Hebdomadaire</h1>
                    <p className="text-neutral-500">Compilation et soumission</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sélection de la période</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1 max-w-xs">
                            <label className="text-sm font-medium">Sélectionner une date dans la semaine</label>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                                <Calendar className="text-primary h-5 w-5" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border-none focus:ring-0 text-sm w-full"
                                />
                            </div>
                        </div>
                        <Button onClick={handleGenerate} isLoading={loading}>
                            <FileText className="mr-2 h-4 w-4" />
                            Générer Prévisualisation
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Prévisualisation du Rapport</CardTitle>
                            <p className="text-sm text-neutral-500 mt-1">
                                Période du {format(new Date(period.start), 'dd/MM/yyyy')} au {format(new Date(period.end), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Basé sur {reportData.dailyReportsCount} rapports quotidiens trouvés.
                            </p>
                        </div>
                        {!success ? (
                            <Button onClick={handleSubmit} variant="primary" isLoading={loading}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Soumettre à la Direction
                            </Button>
                        ) : (
                            <Button variant="secondary" disabled className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Soumis avec succès !
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

                        <div className="pointer-events-none opacity-90 bg-neutral-50/50 p-4 rounded-lg border border-neutral-100">
                            <ServiceForm
                                serviceId={serviceId}
                                data={reportData.data}
                                onChange={() => { }}
                                readOnly={true}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WeeklyReportPage;
