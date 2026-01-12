# PWA Hôpital Braun Cinkassé

Application Web Progressive (PWA) pour la gestion des rapports d'activité hospitaliers de l'Hôpital Braun Cinkassé.

## 🚀 Technologies

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS v3.4.0
- **Charts:** Recharts
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Database:** Supabase (à configurer)

## 📋 Fonctionnalités

- ✅ Authentification multi-rôles (Service, Direction, Admin)
- ✅ Dashboard avec statistiques et graphiques
- ✅ Saisie quotidienne des activités par service
- ✅ Génération automatique de rapports hebdomadaires
- ✅ Workflow de validation (Direction)
- ✅ Historique avec recherche et filtrage
- ✅ Statistiques visuelles (Recharts)

## 🔑 Identifiants de Test

- **Gynécologie:** `gyneco` / `test123`
- **Chirurgie:** `chirurgie` / `test123`
- **Direction:** `direction` / `test123`

## 🛠️ Installation Locale

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build
```

## 📦 Déploiement

### Netlify
Le projet est configuré pour un déploiement facile sur Netlify.

Build command: `npm run build`  
Publish directory: `dist`

### Supabase
Configuration de la base de données Supabase à venir pour remplacer localStorage.

## 📄 License

MIT

## 👨‍💻 Auteur

Développé pour l'Hôpital Braun Cinkassé
