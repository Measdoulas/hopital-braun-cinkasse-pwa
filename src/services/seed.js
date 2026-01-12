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
        const users = [];
        const now = new Date().toISOString();

        // 1. Compte Admin
        users.push({
            id: generateId(),
            username: 'admin',
            passwordHash: await hashPassword('admin123'),
            serviceName: 'Administrateur Système',
            role: ROLES.ADMIN,
            isActive: true,
            createdAt: now,
        });

        // 2. Compte Direction
        users.push({
            id: generateId(),
            username: 'direction',
            passwordHash: await hashPassword('direction123'),
            serviceName: 'Direction Hôpital',
            role: ROLES.DIRECTION,
            isActive: true,
            createdAt: now,
        });

        // 3. Comptes Services
        for (const service of SERVICES) {
            // Génère un username sans accents et sans espaces (ex: "gyneco-obstetrique" -> "gyneco")
            // Ici on utilise simplement l'ID du service qui est propre
            users.push({
                id: generateId(),
                username: service.id,
                passwordHash: await hashPassword('test123'),
                serviceName: service.name,
                role: ROLES.SERVICE,
                serviceId: service.id, // Lien vers la définition du service
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
    } else {
        console.log("Données déjà initialisées.");
    }
}
