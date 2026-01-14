
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://jdzuzrscqmfhdzydbhwc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenV6cnNjcW1maGR6eWRiaHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjA2NzAsImV4cCI6MjA4Mzc5NjY3MH0.J9HEn64cxhuo68nQX_4ybXNAckUbjaEhEa5djKtk7yg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROLES = {
    ADMIN: 'admin',
    DIRECTION: 'direction',
    CHEF_SERVICE: 'chef_service',
    SERVICE: 'service',
};

const SERVICES = [
    { id: 'gyneco', name: 'Gynécologie-Obstétrique' },
    { id: 'chirurgie', name: 'Chirurgie' },
    { id: 'bloc', name: 'Bloc Opératoire' },
    { id: 'medecine', name: 'Médecine Générale' },
    { id: 'pediatrie', name: 'Pédiatrie' },
    { id: 'laboratoire', name: 'Laboratoire' },
    { id: 'radiologie', name: 'Radiologie / Imagerie' },
    { id: 'cdt', name: 'Kinésithérapie' },
    { id: 'ophtalmo', name: 'Ophtalmologie' },
];

async function createAccount(username, password, role, serviceName, serviceId = null) {
    const email = `${username}@hopital-braun.com`; // Faux email pour Auth

    console.log(`Création compte: ${username} (${role})...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                role,
                serviceName,
                serviceId // Peut être null pour admin/direction
            }
        }
    });

    if (error) {
        console.error(`❌ Erreur ${username}:`, error.message);
        return false;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
        console.log(`⚠️ Compte ${username} existe déjà.`);
        return true;
    }

    console.log(`✅ Succès ${username}`);
    return true;
}

async function main() {
    console.log("=== Démarrage création comptes Supabase ===");

    // Fonction utilitaire pour la pause
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Admin & Direction
    await createAccount('admin', 'admin123', ROLES.ADMIN, 'Administrateur Système');
    await sleep(3000); // Pause 3s
    await createAccount('direction', 'direction123', ROLES.DIRECTION, 'Direction Hôpital');
    await sleep(3000);

    // 2. Services & Chefs
    for (const service of SERVICES) {
        // Garde
        await createAccount(
            service.id,
            'test123',
            ROLES.SERVICE,
            `Garde ${service.name}`,
            service.id
        );
        await sleep(3000); // Pause 3s entre chaque appel

        // Chef
        await createAccount(
            `${service.id}_chef`,
            'chef123',
            ROLES.CHEF_SERVICE,
            `Chef ${service.name}`,
            service.id
        );
        await sleep(3000); // Pause 3s
    }

    console.log("=== Terminé ===");
}

main();
