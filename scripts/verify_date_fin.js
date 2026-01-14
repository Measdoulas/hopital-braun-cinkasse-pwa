
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdzuzrscqmfhdzydbhwc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenV6cnNjcW1maGR6eWRiaHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjA2NzAsImV4cCI6MjA4Mzc5NjY3MH0.J9HEn64cxhuo68nQX_4ybXNAckUbjaEhEa5djKtk7yg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyMigration() {
    console.log("🔍 Démarrage de la vérification 'date_fin'...");

    // 1. Connexion (Gynéco)
    console.log("👉 Connexion avec gyneco@hopital-braun.com...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'gyneco@hopital-braun.com',
        password: 'test123'
    });

    if (authError) {
        console.error("❌ Échec de la connexion:", authError.message);
        return;
    }
    console.log("✅ Connecté.");

    // 2. Création d'un rapport avec Période (24h)
    const testDate = '2030-01-01'; // Date futuriste pour test
    const testDateFin = '2030-01-02';

    console.log(`👉 Tentative d'insertion rapport (Période: ${testDate} -> ${testDateFin})...`);

    // Note: On utilise l'API directe, pas le service, pour vérifier la DB
    const payload = {
        service_id: 'gyneco',
        date: testDate,
        date_fin: testDateFin, // LA NOUVELLE COLONNE
        data: { test: 'migration_check' }, // CORRECTION: Nom de colonne 'data'
        updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
        .from('daily_reports')
        .upsert(payload)
        .select()
        .single();

    if (insertError) {
        console.error("❌ Erreur d'insertion (La colonne date_fin existe-t-elle ?):", insertError.message);
        return;
    }
    console.log("✅ Insertion réussie:", insertData);

    // 3. Vérification des données
    if (insertData.date_fin === testDateFin) {
        console.log("🎉 SUCCÈS : La colonne 'date_fin' est bien prise en compte !");
    } else {
        console.error("⚠️ ATTENTION : L'insertion a fonctionné mais 'date_fin' ne correspond pas (ou est null).");
        console.log("Valeur reçue:", insertData.date_fin);
    }

    // 4. Nettoyage
    console.log("👉 Nettoyage du rapport de test...");
    await supabase.from('daily_reports').delete().eq('date', testDate).eq('service_id', 'gyneco');
    console.log("✅ Nettoyé.");
}

verifyMigration().catch(console.error);
