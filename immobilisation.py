from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Famille(db.Model):
    __tablename__ = 'familles'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    libelle = db.Column(db.String(100), nullable=False)
    type_amortissement = db.Column(db.String(20), nullable=False, default='LINEAIRE')
    duree_annees = db.Column(db.Integer, nullable=False, default=5)
    duree_mois = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec les immobilisations
    immobilisations = db.relationship('Immobilisation', backref='famille_obj', lazy=True)
    
    def __repr__(self):
        return f'<Famille {self.code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'libelle': self.libelle,
            'typeAmortissement': self.type_amortissement,
            'dureeAnnees': self.duree_annees,
            'dureeMois': self.duree_mois
        }

class Localisation(db.Model):
    __tablename__ = 'localisations'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    libelle = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec les immobilisations
    immobilisations = db.relationship('Immobilisation', backref='localisation_obj', lazy=True)
    
    def __repr__(self):
        return f'<Localisation {self.code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'libelle': self.libelle
        }

class Compte(db.Model):
    __tablename__ = 'comptes'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    libelle = db.Column(db.String(100), nullable=False)
    compte_amortissement = db.Column(db.String(20), nullable=False)
    compte_dotation = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Compte {self.code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'libelle': self.libelle,
            'compteAmortissement': self.compte_amortissement,
            'compteDotation': self.compte_dotation
        }

class Immobilisation(db.Model):
    __tablename__ = 'immobilisations'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    libelle = db.Column(db.String(200), nullable=False)
    famille = db.Column(db.String(10), db.ForeignKey('familles.code'), nullable=False)
    localisation = db.Column(db.String(10), db.ForeignKey('localisations.code'), nullable=False)
    date_acquisition = db.Column(db.Date, nullable=False)
    valeur_origine = db.Column(db.Float, nullable=False)
    type_amortissement = db.Column(db.String(20), nullable=False, default='LINEAIRE')
    duree = db.Column(db.Integer, nullable=False, default=5)
    taux_amortissement = db.Column(db.Float, nullable=False)
    amortissement_cumule = db.Column(db.Float, nullable=False, default=0.0)
    valeur_nette = db.Column(db.Float, nullable=False)
    statut = db.Column(db.String(20), nullable=False, default='En cours')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Immobilisation {self.code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'libelle': self.libelle,
            'famille': self.famille,
            'localisation': self.localisation,
            'dateAcquisition': self.date_acquisition.isoformat() if self.date_acquisition else None,
            'valeurOrigine': self.valeur_origine,
            'typeAmortissement': self.type_amortissement,
            'duree': self.duree,
            'tauxAmortissement': self.taux_amortissement,
            'amortissementCumule': self.amortissement_cumule,
            'valeurNette': self.valeur_nette,
            'statut': self.statut
        }
    
    def calculate_depreciation_schedule(self):
        """Calcule le plan d'amortissement pour cette immobilisation"""
        from datetime import date
        import math
        
        schedule = []
        acquisition_date = self.date_acquisition
        current_date = date.today()
        years_elapsed = (current_date - acquisition_date).days / 365.25
        
        if self.type_amortissement == 'LINEAIRE':
            annual_depreciation = self.valeur_origine / self.duree
            for year in range(1, self.duree + 1):
                year_date = date(acquisition_date.year + year - 1, acquisition_date.month, acquisition_date.day)
                if year <= years_elapsed + 1:
                    if year <= years_elapsed:
                        depreciation = annual_depreciation
                    else:
                        # Prorata pour l'année en cours
                        days_in_year = (date(year_date.year + 1, year_date.month, year_date.day) - year_date).days
                        days_elapsed = (current_date - year_date).days
                        depreciation = annual_depreciation * max(0, min(1, days_elapsed / days_in_year))
                else:
                    depreciation = 0
                
                cumul = annual_depreciation * min(year, years_elapsed + 1)
                schedule.append({
                    'annee': acquisition_date.year + year - 1,
                    'dotation': round(depreciation, 2),
                    'cumul': round(cumul, 2),
                    'valeurNette': round(self.valeur_origine - cumul, 2)
                })
        
        elif self.type_amortissement == 'DEGRESSIF':
            taux_degressif = max(1/self.duree, 0.35)
            valeur_residuelle = self.valeur_origine
            cumul_amortissement = 0
            
            for year in range(1, self.duree + 1):
                dotation_degressive = valeur_residuelle * taux_degressif
                dotation_lineaire = valeur_residuelle / (self.duree - year + 1)
                dotation = max(dotation_degressive, dotation_lineaire)
                
                if year <= years_elapsed + 1:
                    if year <= years_elapsed:
                        actual_dotation = dotation
                    else:
                        # Prorata pour l'année en cours
                        year_date = date(acquisition_date.year + year - 1, acquisition_date.month, acquisition_date.day)
                        days_in_year = (date(year_date.year + 1, year_date.month, year_date.day) - year_date).days
                        days_elapsed = (current_date - year_date).days
                        actual_dotation = dotation * max(0, min(1, days_elapsed / days_in_year))
                    
                    cumul_amortissement += actual_dotation
                    valeur_residuelle -= actual_dotation
                else:
                    actual_dotation = 0
                
                schedule.append({
                    'annee': acquisition_date.year + year - 1,
                    'dotation': round(actual_dotation, 2),
                    'cumul': round(cumul_amortissement, 2),
                    'valeurNette': round(self.valeur_origine - cumul_amortissement, 2)
                })
        
        return schedule

