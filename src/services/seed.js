import { storage } from './storage';
import { hashPassword } from './auth';
import { ROLES, SERVICES } from '../utils/data-models';
import { generateId } from '../utils/ids';

/**
 * Initialise les données de l'application si elles n'existent pas.
 * Crée les comptes utilisateurs par défaut.
 */
export async function seedData() {
    const existingUsers = storage.get('users');

    if (!existingUsers || existingUsers.length === 0) {
        console.log("Initialisation des données de test...");
        // const users = []; // Original line, will be replaced by the new structure
        const now = new Date().toISOString();

        // 2. Créer les utilisateurs (Hiérarchie complète)
        const users = [];

        // Admin & Direction
        users.push({
            id: generateId(),
            username: 'admin',
            passwordHash: await hashPassword('admin123'),
            serviceName: 'Administrateur Système',
            role: ROLES.ADMIN,
            isActive: true,
            createdAt: now,
        });
        users.push({
            id: generateId(),
            username: 'direction',
            passwordHash: await hashPassword('direction123'),
            serviceName: 'Direction Hôpital',
            role: ROLES.DIRECTION,
            isActive: true,
            createdAt: now,
        });

        // Création des comptes Service (Garde) et Chef pour chaque département
        for (const service of SERVICES) {
            // Compte de Garde (Saisie)
            users.push({
                id: generateId(),
                username: service.id, // ex: gyneco
                passwordHash: await hashPassword('test123'),
                serviceName: `Garde ${service.name}`,
                role: ROLES.SERVICE,
                serviceId: service.id, // Lien vers la définition du service
                isActive: true,
                createdAt: now,
            });

            // Compte Chef de Service (Validation Niveau 1)
            users.push({
                id: generateId(),
                username: `${service.id}_chef`, // ex: gyneco_chef
                passwordHash: await hashPassword('chef123'),
                serviceName: `Chef ${service.name}`,
                role: ROLES.CHEF_SERVICE,
                serviceId: service.id,
                isActive: true,
                createdAt: now,
            });
        }

        storage.set('users', users);
        console.log(`${users.length} utilisateurs créés.`);

        // Initialisation configuration
        const config = {
            hospitalName: 'Hôpital Braun Cinkassé',
            initializedAt: now,
        };
        storage.set('config-generale', config);

        // PRODUCTION: Pas de données de démonstration
        // Les utilisateurs partiront d'une base propre
        // 4. Données de démonstration (Rapports)
        // console.log("Génération des données de démonstration...");
        // const demoReports = generateDemoData();
        // demoReports.daily.forEach(r => storage.set(`rapports-journaliers:${r.serviceId}:${r.date}`, r));
        // demoReports.weekly.forEach(r => storage.set(`rapports-hebdo:${r.serviceId}:${r.year}-${r.weekNumber}`, r));
        console.log("Configuration initialisée. Application prête pour la production.");

    } else {
        console.log("Données déjà initialisées.");
    }
}

// Fonction utilitaire pour générer des données fake
function generateDemoData() {
    const daily = [];
    const weekly = [];
    const services = SERVICES.map(s => s.id);
    const today = new Date();

    // Générer pour les 4 dernières semaines
    for (let i = 0; i < 28; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        services.forEach(serviceId => {
            // 80% de chance d'avoir un rapport
            if (Math.random() > 0.2) {
                daily.push({
                    serviceId,
                    date: dateStr,
                    data: {
                        entrees: Math.floor(Math.random() * 10),
                        sorties: Math.floor(Math.random() * 8),
                        deces: Math.floor(Math.random() * 2),
                        evacuations: Math.floor(Math.random() * 3),
                        observations: "R.A.S - Journée calme"
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });
    }

    // Rapports hebdomadaires (4 dernières semaines)
    // Semaines simplifiées pour la démo
    const weeks = [
        { num: 1, year: 2026 },
        { num: 52, year: 2025 },
        { num: 51, year: 2025 }
    ];

    weeks.forEach(week => {
        services.forEach(serviceId => {
            const status = Math.random() > 0.5 ? 'validated' : (Math.random() > 0.5 ? 'pending' : 'rejected');
            weekly.push({
                serviceId,
                weekNumber: week.num,
                year: week.year,
                status: status,
                data: {
                    totalEntrees: Math.floor(Math.random() * 50),
                    totalSorties: Math.floor(Math.random() * 45),
                    tauxOccupation: Math.floor(Math.random() * 100)
                },
                submittedAt: new Date().toISOString(),
                validatedAt: status === 'validated' ? new Date().toISOString() : null,
                validatedBy: status === 'validated' ? 'direction' : null,
                rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
                rejectionReason: status === 'rejected' ? "Données incohérentes sur les sorties" : null
            });
        });
    });

    return { daily, weekly };
}
