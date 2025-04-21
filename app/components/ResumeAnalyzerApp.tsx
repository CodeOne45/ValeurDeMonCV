import React, { useState } from 'react';
import ResumeUploader from './ResumeUploader';
import ResumeWorth from './ResumeWorth';
import { useCompletion } from 'ai/react';
import { Loader2 } from "lucide-react";

type LocationData = {
  country: string;
  city: string;
  companyType: string;
  customCompany: string;
};

const ResumeAnalyzerApp = () => {
  const [showWorth, setShowWorth] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [locationData, setLocationData] = useState<LocationData>({
    country: 'France',
    city: '',
    companyType: '',
    customCompany: ''
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [debug, setDebug] = useState(false); // Ajouter un état pour le mode débogage
  const [fileSelected, setFileSelected] = useState(false);

  const { completion, isLoading, complete, error } = useCompletion({
    api: '/api/resume',
  });

  // Remove unused handleChange function
  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsentGiven(e.target.checked);
    if (e.target.checked) {
      setConsentError(false);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!consentGiven) {
      setConsentError(true);
      return;
    }

    if (!resumeText) {
      return;
    }

    setIsLoadingResume(true);
    const messageToSend = `RESUME: ${resumeText}\n\nLOCATION: ${JSON.stringify(locationData)}\n\n-------\n\n`;
    await complete(messageToSend);
    setShowWorth(true);
    setIsLoadingResume(false);
  };

  const reset = () => {
    setShowWorth(false);
    setResumeText('');
    setFileSelected(false);
    setIsLoadingResume(false);
  };

  // Liste des types d'entreprises disponibles
  const companyTypes = [
    'Startup',
    'PME',
    'Grand Groupe',
    'Secteur Public',
    'Cabinet de Conseil'
  ];
  
  const cities = {} as { [key: string]: string[] };

  // Handler pour le raccourci clavier Shift+D pour activer le mode débogage
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {!showWorth ? (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
            <h3 className="text-xl font-semibold text-blue-800">Analysez votre CV</h3>
            <p className="text-sm text-blue-600">Téléchargez votre CV et obtenez une estimation de salaire</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Location Selection */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4">Personnalisez votre analyse</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Pays (optionnel)</label>
                    <input
                      id="country"
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="Ex: France, Allemagne..."
                      value={locationData.country}
                      onChange={(e) => setLocationData({...locationData, country: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ville (optionnel)</label>
                    <input
                      id="city"
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="Ex: Paris, Lyon..."
                      value={locationData.city}
                      onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="companyType" className="block text-sm font-medium text-gray-700 mb-1">Type d'entreprise (optionnel)</label>
                    <select
                      id="companyType"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                      value={locationData.companyType}
                      onChange={(e) => setLocationData({...locationData, companyType: e.target.value})}
                    >
                      <option value="">Sélectionnez un type d'entreprise</option>
                      {companyTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="customCompany" className="block text-sm font-medium text-gray-700 mb-1">Entreprise spécifique (optionnel)</label>
                    <input
                      id="customCompany"
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="Ex: Google, BNP Paribas..."
                      value={locationData.customCompany}
                      onChange={(e) => setLocationData({...locationData, customCompany: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              {/* Resume Upload */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-800 mb-4">Téléchargez votre CV</h4>
                <ResumeUploader 
                  setIsLoading={setIsLoadingResume} 
                  setResumeText={setResumeText}
                  setFileSelected={setFileSelected}
                />
              </div>
              
              {/* Debug mode toggle (hidden unless Shift+D is pressed) */}
              <div className="hidden">
                <label className="flex items-center space-x-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={debug}
                    onChange={(e) => setDebug(e.target.checked)}
                    className="h-3 w-3"
                  />
                  <span>Mode débogage</span>
                </label>
              </div>
              
              {/* Consent checkbox */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <input
                    id="consent"
                    type="checkbox"
                    className={`h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 ${consentError ? 'border-red-500' : ''}`}
                    checked={consentGiven}
                    onChange={handleConsentChange}
                  />
                  <div>
                    <label 
                      htmlFor="consent" 
                      className={`font-medium ${consentError ? 'text-red-500' : 'text-gray-700'}`}
                    >
                      Je consens à ce que mes données soient transmises à un modèle d'IA pour traitement
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Mes données seront conservées uniquement pendant la durée du traitement (quelques minutes) et supprimées immédiatement après.
                    </p>
                  </div>
                </div>
                {consentError && (
                  <p className="text-red-500 text-xs mt-2 ml-8">
                    Veuillez donner votre consentement pour analyser votre CV
                  </p>
                )}
              </div>
              
              {/* Analyze Button */}
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isLoadingResume || isLoading || !fileSelected}
                  className={`px-6 py-3 rounded-md font-medium text-white 
                    ${fileSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}
                    transition-colors duration-200 flex items-center space-x-2`}
                >
                  {isLoadingResume || isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <span>Analyser mon CV</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <ResumeWorth 
            resumeWorth={completion} 
            locationData={locationData}
          />
          
          <div className="mt-8 text-center">
            <button 
              onClick={reset}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200"
            >
              Analyser un autre CV
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerApp;