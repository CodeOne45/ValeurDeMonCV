'use client';

import ResumeAnalyzerApp from './components/ResumeAnalyzerApp';
import { MdOutlineMoneyOff, MdRocketLaunch, MdSecurity, MdAutoGraph } from 'react-icons/md';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header - SaaS Style with more spacing */}
        <header className="mb-8 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-3 items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-md p-2.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="white"/>
                  <path d="M12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" fill="white"/>
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-800 tracking-tight">
                valeurDeMonCV
              </h1>
            </div>
            <div className="flex items-center bg-blue-600 text-white rounded-full px-4 py-2 shadow-md">
              <MdOutlineMoneyOff size={18} className="mr-2" />
              <span className="text-sm font-medium">100% Gratuit</span>
            </div>
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-4">
              Découvrez la <span className="text-blue-600">valeur réelle</span> de votre CV
            </h2>
            <p className="text-center text-gray-600 mb-8 text-lg">
              Obtenez une estimation de salaire personnalisée en quelques secondes
            </p>
            
            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center bg-white p-2 rounded-full shadow-sm border border-gray-100">
                <MdRocketLaunch className="text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Analyse rapide</span>
              </div>
              <div className="flex items-center bg-white p-2 rounded-full shadow-sm border border-gray-100">
                <MdSecurity className="text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Données sécurisées</span>
              </div>
              <div className="flex items-center bg-white p-2 rounded-full shadow-sm border border-gray-100">
                <MdAutoGraph className="text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">Précision élevée</span>
              </div>
            </div>
          </div>
        </section>
        
        <ResumeAnalyzerApp />
        
        {/* Modern SaaS Footer */}
        <footer className="mt-16 pt-8 border-t border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-3">valeurDeMonCV</h3>
              <p className="text-sm text-gray-600">
                Analysez votre CV et découvrez votre valeur sur le marché du travail avec notre outil alimenté par l'IA.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Comment ça marche</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>1. Téléchargez votre CV (format PDF)</li>
                <li>2. Personnalisez votre analyse</li>
                <li>3. Obtenez une estimation précise</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-3">À propos</h3>
              <p className="text-sm text-gray-600">
                Créé avec ❤️ par <a href='https://github.com/CodeOne45' target='_blank' rel="noopener noreferrer" className="text-blue-600 hover:underline">Aman KUMAR</a>
              </p>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 py-4 border-t border-blue-100">
            <p>© 2025 valeurDeMonCV - Tous droits réservés</p>
          </div>
        </footer>
      </div>
    </main>
  )
}