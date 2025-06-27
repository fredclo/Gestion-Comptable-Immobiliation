import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.immobilisation import db
from src.routes.immobilisation import immobilisation_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Activer CORS pour permettre les requêtes du frontend
CORS(app)

# Enregistrer les blueprints
app.register_blueprint(immobilisation_bp, url_prefix='/api')

# Configuration de la base de données SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialiser la base de données et ajouter des données d'exemple
def init_database():
    """Initialise la base de données avec des données d'exemple"""
    from src.models.immobilisation import Famille, Localisation, Compte, Immobilisation
    from datetime import date
    
    # Créer les tables
    db.create_all()
    
    # Vérifier si des données existent déjà
    if Famille.query.first() is None:
        # Ajouter des familles d'exemple
        familles = [
            Famille(code='BI', libelle='BUREAUTIQUE INFORMATIQUE', type_amortissement='LINEAIRE', duree_annees=3, duree_mois=0),
            Famille(code='IT', libelle='INSTALLATIONS TECHNIQUES', type_amortissement='LINEAIRE', duree_annees=10, duree_mois=0),
            Famille(code='MI', libelle='MATERIEL INDUSTRIEL', type_amortissement='DEGRESSIF', duree_annees=5, duree_mois=0),
            Famille(code='MOB', libelle='MOBILIER', type_amortissement='LINEAIRE', duree_annees=10, duree_mois=0),
            Famille(code='TER', libelle='TERRAINS', type_amortissement='AUCUN', duree_annees=0, duree_mois=0),
            Famille(code='VEH', libelle='VEHICULES', type_amortissement='LINEAIRE', duree_annees=4, duree_mois=0)
        ]
        
        for famille in familles:
            db.session.add(famille)
        
        # Ajouter des localisations d'exemple
        localisations = [
            Localisation(code='AP', libelle='AGENCE PARIS'),
            Localisation(code='SS', libelle='SIEGE SOCIAL'),
            Localisation(code='U1', libelle='USINE 1')
        ]
        
        for localisation in localisations:
            db.session.add(localisation)
        
        # Ajouter des comptes d'exemple
        comptes = [
            Compte(code='201000', libelle='FRAIS DE TABLISSEMENT', compte_amortissement='281000', compte_dotation='687201'),
            Compte(code='213100', libelle='FRAIS DE CONSTITUTION', compte_amortissement='281100', compte_dotation='687201'),
            Compte(code='215400', libelle='MATERIEL INDUSTRIEL', compte_amortissement='281540', compte_dotation='681540')
        ]
        
        for compte in comptes:
            db.session.add(compte)
        
        # Ajouter des immobilisations d'exemple
        immobilisations = [
            Immobilisation(
                code='CHF02',
                libelle='FAUTEUILS DE DIRECTION',
                famille='MOB',
                localisation='SS',
                date_acquisition=date(1999, 1, 1),
                valeur_origine=446.68,
                type_amortissement='LINEAIRE',
                duree=3,
                taux_amortissement=33.33,
                amortissement_cumule=446.68,
                valeur_nette=0.00,
                statut='Amorti'
            ),
            Immobilisation(
                code='215400',
                libelle='MATERIEL INDUSTRIEL',
                famille='MI',
                localisation='U1',
                date_acquisition=date(2020, 3, 15),
                valeur_origine=15000.00,
                type_amortissement='DEGRESSIF',
                duree=5,
                taux_amortissement=35.00,
                amortissement_cumule=8750.00,
                valeur_nette=6250.00,
                statut='En cours'
            ),
            Immobilisation(
                code='218200',
                libelle='MATERIEL DE TRANSPORT',
                famille='VEH',
                localisation='AP',
                date_acquisition=date(2021, 6, 10),
                valeur_origine=25000.00,
                type_amortissement='LINEAIRE',
                duree=4,
                taux_amortissement=25.00,
                amortissement_cumule=18750.00,
                valeur_nette=6250.00,
                statut='En cours'
            )
        ]
        
        for immobilisation in immobilisations:
            db.session.add(immobilisation)
        
        db.session.commit()
        print("Base de données initialisée avec des données d'exemple")

with app.app_context():
    init_database()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

