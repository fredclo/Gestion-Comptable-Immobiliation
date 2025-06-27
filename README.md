# Gestion-Comptable-Immobiliation
Application de Gestion comptable des immobilisations avec amortissements

Architecture Technique

Backend (Flask + SQLite)

 /gestion-immobilisations-backend/
 ├── src/
 │ ├── main.py              # Application Flask principale
 │ ├── models/
 │ │ └── immobilisation.py # Modèles de données SQLite
 │ ├── routes/
 │ │ └── immobilisation.py # API REST endpoints
 │ ├── static/            # Frontend React compilé
 │ └── database.db            # Base de données SQLite



API REST Endpoints

  • GET /api/immobilisations - Liste des immobilisations
  • POST /api/immobilisations - Ajouter une immobilisation
  • PUT /api/immobilisations/{id} - Modifier une immobilisation
  • DELETE /api/immobilisations/{id} - Supprimer une immobilisation
  • GET /api/immobilisations/{id}/depreciation - Calcul d'amortissement
  • GET /api/comptes - Liste des comptes
  • GET /api/localisations - Liste des localisations
  • GET /api/familles - Liste des familles
  • GET /api/rapports/dotations - Rapport des dotations
  • GET /api/rapports/inventaire - Rapport d'inventaire


Base de Données SQLite

 -- Table des immobilisations
 CREATE TABLE immobilisation (
    id INTEGER PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    famille VARCHAR(10),
    localisation VARCHAR(10),
    date_acquisition DATE,
    valeur_origine DECIMAL(10,2),
    type_amortissement VARCHAR(20),
    duree INTEGER,
    taux_amortissement DECIMAL(5,2),
     amortissement_cumule DECIMAL(10,2),
     valeur_nette DECIMAL(10,2),
     statut VARCHAR(20);

-- Tables de référence
CREATE TABLE famille (...);
CREATE TABLE localisation (...);
CREATE TABLE compte (...);


Fonctionnalités Implémentées

Gestion Complète des Immobilisations

• Ajout d'immobilisations avec validation
• Modification des données existantes
• Suppression avec confirmation
• Consultation avec tri et filtrage


Calculs d'Amortissement Avancés

• Amortissement linéaire avec calculs précis
• Amortissement dégressif selon les règles fiscales
• Plans d'amortissement détaillés année par année
• Calculs automatiques des taux et dotations


Gestion des Données de Référence

• Comptes comptables avec numéros d'amortissement
• Localisations pour la géolocalisation des biens
• Familles d'immobilisations avec paramètres par défaut
• CRUD complet sur toutes les entités


Génération de Rapports

• État des dotations (CSV/PDF)
• État préparatoire CERFA (CSV/PDF)
• Inventaire des immobilisations (CSV/PDF)
• Mise en forme professionnelle pour les PDF
• Interface Utilisateur
  Sauvegarde et Maintenance

Fichier de Base de Données

  • Localisation : /src/database.db dans le projet backend
  • Sauvegarde : Copier simplement ce fichier
  • Restauration : Remplacer le fichier et redémarrer l'application


Évolutivité

  • Ajout de tables : Modifier models/immobilisation.py
  • Nouveaux endpoints : Ajouter dans routes/immobilisation.py
  • Interface : Modifier le frontend React
  • Rapports : Étendre les fonctions d'export




