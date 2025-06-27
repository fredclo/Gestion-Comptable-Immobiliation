import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Calculator, FileText, Download } from 'lucide-react'

// Configuration de l'API
const API_BASE_URL = 'http://localhost:5000/api'

// Fonctions utilitaires pour les appels API
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  
  return response.json()
}

function App() {
  const [activeTab, setActiveTab] = useState('immobilisations')
  const [immobilisations, setImmobilisations] = useState([])
  const [comptes, setComptes] = useState([])
  const [localisations, setLocalisations] = useState([])
  const [familles, setFamilles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // États pour les formulaires
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDepreciationDialog, setShowDepreciationDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [depreciationSchedule, setDepreciationSchedule] = useState([])

  // Charger les données au démarrage
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [immobilisationsData, comptesData, localisationsData, famillesData] = await Promise.all([
        apiCall('/immobilisations'),
        apiCall('/comptes'),
        apiCall('/localisations'),
        apiCall('/familles')
      ])
      
      setImmobilisations(immobilisationsData)
      setComptes(comptesData)
      setLocalisations(localisationsData)
      setFamilles(famillesData)
      setError(null)
    } catch (err) {
      setError('Erreur lors du chargement des données: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fonctions CRUD pour les immobilisations
  const addImmobilisation = async (data) => {
    try {
      const newItem = await apiCall('/immobilisations', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      setImmobilisations([...immobilisations, newItem])
      setShowAddDialog(false)
    } catch (err) {
      setError('Erreur lors de l\'ajout: ' + err.message)
    }
  }

  const updateImmobilisation = async (id, data) => {
    try {
      const updatedItem = await apiCall(`/immobilisations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      setImmobilisations(immobilisations.map(item => item.id === id ? updatedItem : item))
      setShowEditDialog(false)
    } catch (err) {
      setError('Erreur lors de la modification: ' + err.message)
    }
  }

  const deleteImmobilisation = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette immobilisation ?')) {
      try {
        await apiCall(`/immobilisations/${id}`, { method: 'DELETE' })
        setImmobilisations(immobilisations.filter(item => item.id !== id))
      } catch (err) {
        setError('Erreur lors de la suppression: ' + err.message)
      }
    }
  }

  const calculateDepreciation = async (id) => {
    try {
      const schedule = await apiCall(`/immobilisations/${id}/depreciation`)
      setDepreciationSchedule(schedule)
      setShowDepreciationDialog(true)
    } catch (err) {
      setError('Erreur lors du calcul: ' + err.message)
    }
  }

  // Fonctions CRUD génériques pour les autres entités
  const addEntity = async (entityType, data) => {
    try {
      const newItem = await apiCall(`/${entityType}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      switch (entityType) {
        case 'comptes':
          setComptes([...comptes, newItem])
          break
        case 'localisations':
          setLocalisations([...localisations, newItem])
          break
        case 'familles':
          setFamilles([...familles, newItem])
          break
      }
      setShowAddDialog(false)
    } catch (err) {
      setError('Erreur lors de l\'ajout: ' + err.message)
    }
  }

  const updateEntity = async (entityType, id, data) => {
    try {
      const updatedItem = await apiCall(`/${entityType}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      switch (entityType) {
        case 'comptes':
          setComptes(comptes.map(item => item.id === id ? updatedItem : item))
          break
        case 'localisations':
          setLocalisations(localisations.map(item => item.id === id ? updatedItem : item))
          break
        case 'familles':
          setFamilles(familles.map(item => item.id === id ? updatedItem : item))
          break
      }
      setShowEditDialog(false)
    } catch (err) {
      setError('Erreur lors de la modification: ' + err.message)
    }
  }

  const deleteEntity = async (entityType, id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        await apiCall(`/${entityType}/${id}`, { method: 'DELETE' })
        
        switch (entityType) {
          case 'comptes':
            setComptes(comptes.filter(item => item.id !== id))
            break
          case 'localisations':
            setLocalisations(localisations.filter(item => item.id !== id))
            break
          case 'familles':
            setFamilles(familles.filter(item => item.id !== id))
            break
        }
      } catch (err) {
        setError('Erreur lors de la suppression: ' + err.message)
      }
    }
  }

  // Fonctions d'export
  const exportToCSV = async (reportType) => {
    try {
      let data = []
      let filename = ''
      
      switch (reportType) {
        case 'dotations':
          data = await apiCall('/rapports/dotations')
          filename = 'etat_dotations.csv'
          break
        case 'inventaire':
          data = await apiCall('/rapports/inventaire')
          filename = 'inventaire_immobilisations.csv'
          break
        default:
          data = immobilisations
          filename = 'immobilisations.csv'
      }
      
      // Conversion en CSV
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(';'),
        ...data.map(row => headers.map(header => row[header] || '').join(';'))
      ].join('\n')
      
      // Téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } catch (err) {
      setError('Erreur lors de l\'export: ' + err.message)
    }
  }

  const exportToPDF = async (reportType) => {
    try {
      let data = []
      let title = ''
      
      switch (reportType) {
        case 'dotations':
          data = await apiCall('/rapports/dotations')
          title = 'ÉTAT DES DOTATIONS'
          break
        case 'inventaire':
          data = await apiCall('/rapports/inventaire')
          title = 'INVENTAIRE DES IMMOBILISATIONS'
          break
        default:
          data = immobilisations
          title = 'LISTE DES IMMOBILISATIONS'
      }
      
      // Création du contenu HTML pour l'impression
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; font-weight: bold; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Société Exemple - ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `
      
      // Ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open('', '_blank')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    } catch (err) {
      setError('Erreur lors de l\'export PDF: ' + err.message)
    }
  }

  // Composants de formulaire
  const ImmobilisationForm = ({ item, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(item || {
      code: '',
      libelle: '',
      famille: '',
      localisation: '',
      dateAcquisition: '',
      valeurOrigine: '',
      typeAmortissement: 'LINEAIRE',
      duree: '5'
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="libelle">Libellé</Label>
            <Input
              id="libelle"
              value={formData.libelle}
              onChange={(e) => setFormData({...formData, libelle: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="famille">Famille</Label>
            <Select value={formData.famille} onValueChange={(value) => setFormData({...formData, famille: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une famille" />
              </SelectTrigger>
              <SelectContent>
                {familles.map((famille) => (
                  <SelectItem key={famille.code} value={famille.code}>
                    {famille.code} - {famille.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="localisation">Localisation</Label>
            <Select value={formData.localisation} onValueChange={(value) => setFormData({...formData, localisation: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une localisation" />
              </SelectTrigger>
              <SelectContent>
                {localisations.map((localisation) => (
                  <SelectItem key={localisation.code} value={localisation.code}>
                    {localisation.code} - {localisation.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
            <Input
              id="dateAcquisition"
              type="date"
              value={formData.dateAcquisition}
              onChange={(e) => setFormData({...formData, dateAcquisition: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="valeurOrigine">Valeur d'origine</Label>
            <Input
              id="valeurOrigine"
              type="number"
              step="0.01"
              value={formData.valeurOrigine}
              onChange={(e) => setFormData({...formData, valeurOrigine: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="typeAmortissement">Type d'amortissement</Label>
            <Select value={formData.typeAmortissement} onValueChange={(value) => setFormData({...formData, typeAmortissement: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LINEAIRE">Linéaire</SelectItem>
                <SelectItem value="DEGRESSIF">Dégressif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="duree">Durée (années)</Label>
            <Input
              id="duree"
              type="number"
              value={formData.duree}
              onChange={(e) => setFormData({...formData, duree: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {item ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </form>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="font-bold">Erreur</h2>
            <p>{error}</p>
            <Button onClick={loadAllData} className="mt-4">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barre de titre */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <h1 className="text-lg font-semibold">Ciel Immobilisations - Dossier EXEMPLE (Société Exemple)</h1>
      </div>

      {/* Barre de menu */}
      <div className="bg-gray-200 border-b border-gray-300 px-4 py-1">
        <div className="flex space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                Dossier <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Nouveau</DropdownMenuItem>
              <DropdownMenuItem>Ouvrir</DropdownMenuItem>
              <DropdownMenuItem>Fermer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                Listes <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setActiveTab('immobilisations')}>Immobilisations</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('comptes')}>Comptes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('localisations')}>Localisations</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('familles')}>Familles</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                Éditions <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToPDF('dotations')}>État des dotations</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF('inventaire')}>Inventaire</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                Utilitaires <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={loadAllData}>Actualiser les données</DropdownMenuItem>
              <DropdownMenuItem>Sauvegarde</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="h-8">Options</Button>
          <Button variant="ghost" size="sm" className="h-8">Fenêtres</Button>
          <Button variant="ghost" size="sm" className="h-8">Internet</Button>
          <Button variant="ghost" size="sm" className="h-8">?</Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 bg-gray-100 border-r border-gray-300 min-h-screen">
          <div className="p-2">
            <h3 className="font-semibold text-sm mb-2">Listes</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('immobilisations')}
                className={`w-full text-left px-3 py-2 text-sm rounded ${
                  activeTab === 'immobilisations' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                📋 Immobilisations
              </button>
              <button
                onClick={() => setActiveTab('comptes')}
                className={`w-full text-left px-3 py-2 text-sm rounded ${
                  activeTab === 'comptes' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                💼 Comptes
              </button>
              <button
                onClick={() => setActiveTab('localisations')}
                className={`w-full text-left px-3 py-2 text-sm rounded ${
                  activeTab === 'localisations' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                📍 Localisations
              </button>
              <button
                onClick={() => setActiveTab('familles')}
                className={`w-full text-left px-3 py-2 text-sm rounded ${
                  activeTab === 'familles' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                👥 Familles
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4">
          {activeTab === 'immobilisations' && (
            <Card>
              <CardHeader className="bg-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Liste des comptes</CardTitle>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">Ajouter...</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter une immobilisation</DialogTitle>
                      </DialogHeader>
                      <ImmobilisationForm
                        onSubmit={addImmobilisation}
                        onCancel={() => setShowAddDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-orange-200">
                        <th className="border border-gray-400 px-2 py-1 text-left">Compte</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Libellé</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Famille</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Local</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Acquis</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Quantité</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Équipe</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Début</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Val. acquis</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Amort. fiscal</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Type</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Durée</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Taux</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Sortie</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {immobilisations.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-orange-100' : 'bg-white'}>
                          <td className="border border-gray-400 px-2 py-1">{item.code}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.libelle}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.famille}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.localisation}</td>
                          <td className="border border-gray-400 px-2 py-1">{new Date(item.dateAcquisition).toLocaleDateString('fr-FR')}</td>
                          <td className="border border-gray-400 px-2 py-1">1</td>
                          <td className="border border-gray-400 px-2 py-1">-</td>
                          <td className="border border-gray-400 px-2 py-1">{new Date(item.dateAcquisition).toLocaleDateString('fr-FR')}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.valeurOrigine.toFixed(2)}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.valeurOrigine.toFixed(2)}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.typeAmortissement.charAt(0)}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.duree}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.tauxAmortissement.toFixed(2)}</td>
                          <td className="border border-gray-400 px-2 py-1">{item.statut === 'En cours' ? 'non' : 'oui'}</td>
                          <td className="border border-gray-400 px-2 py-1">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCurrentItem(item)
                                  setShowEditDialog(true)
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteImmobilisation(item.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Supprimer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => calculateDepreciation(item.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Calculator className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section de génération de rapports */}
          <Card className="mt-6">
            <CardHeader className="bg-gray-200">
              <CardTitle className="text-sm">Génération de rapports</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-500 text-white p-4 rounded text-center">
                  <FileText className="mx-auto mb-2" size={32} />
                  <h3 className="font-semibold mb-2">État des dotations</h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToCSV('dotations')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToPDF('dotations')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="bg-green-500 text-white p-4 rounded text-center">
                  <FileText className="mx-auto mb-2" size={32} />
                  <h3 className="font-semibold mb-2">État préparatoire CERFA</h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToCSV('cerfa')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToPDF('cerfa')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="bg-purple-500 text-white p-4 rounded text-center">
                  <FileText className="mx-auto mb-2" size={32} />
                  <h3 className="font-semibold mb-2">Inventaire des immobilisations</h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToCSV('inventaire')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportToPDF('inventaire')}
                      className="flex-1"
                    >
                      <Download className="mr-1" size={16} />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Modifier l'immobilisation</DialogTitle>
          </DialogHeader>
          <ImmobilisationForm
            item={currentItem}
            onSubmit={(data) => updateImmobilisation(currentItem.id, data)}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDepreciationDialog} onOpenChange={setShowDepreciationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan d'amortissement</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Année</th>
                  <th className="border px-2 py-1">Dotation</th>
                  <th className="border px-2 py-1">Cumul</th>
                  <th className="border px-2 py-1">Valeur nette</th>
                </tr>
              </thead>
              <tbody>
                {depreciationSchedule.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border px-2 py-1">{row.annee}</td>
                    <td className="border px-2 py-1">{row.dotation.toFixed(2)} €</td>
                    <td className="border px-2 py-1">{row.cumul.toFixed(2)} €</td>
                    <td className="border px-2 py-1">{row.valeurNette.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App

