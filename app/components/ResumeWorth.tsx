import React from 'react';
import { 
  BadgeCheck, 
  TrendingUp, 
  BriefcaseBusiness, 
  MapPin, 
  Building, 
  Star, 
  StarHalf,
  Award,
  MessageCircle
} from "lucide-react";

type LocationData = {
  country: string;
  city: string;
  companyType: string;
  customCompany: string;
}

interface ResumeWorthProps {
  resumeWorth: string;
  locationData: LocationData;
}

interface CriteriaScore {
  name: string;
  score: number;
  description: string;
}

const ResumeWorth: React.FC<ResumeWorthProps> = ({ resumeWorth, locationData }) => {
  // Extract data from the analysis result
  const estimatedWorthMatch = resumeWorth.match(/<Estimated Worth>([\s\S]*?)<\/Estimated Worth>/);
  let estimatedWorthValue = estimatedWorthMatch 
    ? estimatedWorthMatch[1].trim() 
    : resumeWorth.includes('Estimated Worth:') 
      ? resumeWorth.split('Estimated Worth:')[1].split('\n')[0].trim()
      : 'N/A';
      
  // Ensure the format is correct
  estimatedWorthValue = estimatedWorthValue.replace('...', '');
  /*if (!estimatedWorthValue.includes('€')) {
    estimatedWorthValue += ' €';
  } else if (estimatedWorthValue.startsWith('€')) {
    estimatedWorthValue = estimatedWorthValue.slice(1) + ' €';
  }*/

   // Extract overview section
   const overviewMatch = resumeWorth.match(/<Overview>([\s\S]*?)<\/Overview>/);
   const overview = overviewMatch ? overviewMatch[1].trim() : '';

  // Extract explanation and improvements sections
  const explanationMatch = resumeWorth.match(/<Explanation>([\s\S]*?)<\/Explanation>/);
  const improvementsMatch = resumeWorth.match(/<Improvements>([\s\S]*?)<\/Improvements>/);
  const criteriaMatch = resumeWorth.match(/<Criteria>([\s\S]*?)<\/Criteria>/);

  // Try to extract from alternative format if XML tags aren't found
  const explanation = explanationMatch 
    ? explanationMatch[1]
    : resumeWorth.includes('Explanation:') && resumeWorth.includes('Improvements:')
      ? resumeWorth.split('Explanation:')[1].split('Improvements:')[0]
      : '';
      
  const improvements = improvementsMatch 
    ? improvementsMatch[1]
    : resumeWorth.includes('Improvements:') && resumeWorth.includes('Criteria:')
      ? resumeWorth.split('Improvements:')[1].split('Criteria:')[0]
      : resumeWorth.includes('Improvements:')
        ? resumeWorth.split('Improvements:')[1]
        : '';

  // Extract criteria scores
  let criteria: CriteriaScore[] = [];
  if (criteriaMatch && criteriaMatch[1]) {
    try {
      criteria = JSON.parse(criteriaMatch[1]);
    } catch (e) {
      console.error('Failed to parse criteria:', e);
    }
  }

  // Try to parse JSON from alternative format if XML tags aren't found
  if (criteria.length === 0 && resumeWorth.includes('[') && resumeWorth.includes(']')) {
    try {
      const jsonStart = resumeWorth.lastIndexOf('[');
      const jsonEnd = resumeWorth.lastIndexOf(']') + 1;
      if (jsonStart > -1 && jsonEnd > jsonStart) {
        const jsonStr = resumeWorth.substring(jsonStart, jsonEnd);
        criteria = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error('Failed to parse criteria from alternative format:', e);
    }
  }

  // If no criteria were found, use default ones
  if (criteria.length === 0) {
    criteria = [
      { name: "Expérience", score: 3, description: "Années d'expérience professionnelle" },
      { name: "Compétences techniques", score: 3, description: "Maîtrise des compétences techniques" },
      { name: "Formation", score: 3, description: "Niveau d'études et pertinence" },
      { name: "Soft Skills", score: 3, description: "Communication, travail d'équipe, etc." },
      { name: "Leadership", score: 3, description: "Capacité à diriger des équipes" },
      { name: "Accomplissements", score: 3, description: "Réalisations et résultats" },
      { name: "Clarté du CV", score: 3, description: "Organisation et présentation du CV" },
      { name: "Adéquation au marché", score: 3, description: "Correspondance avec les besoins actuels" },
    ];
  }

  // Calculate overall score
  const calculateOverallScore = (criteria: CriteriaScore[]): number => {
    if (criteria.length === 0) return 3;
    const sum = criteria.reduce((acc, curr) => acc + curr.score, 0);
    return parseFloat((sum / criteria.length).toFixed(1));
  };

  const overallScore = calculateOverallScore(criteria);

  // Extract the list items
  const explanationMatchItems = explanation.match(/<li>(.+?)<\/li>/g) || [];
  const improvementMatchItems = improvements.match(/<li>(.+?)<\/li>/g) || [];
  
  // Convert to string arrays
  let explanationItems: string[] = [...explanationMatchItems];
  let improvementItems: string[] = [...improvementMatchItems];
  
  // If no <li> tags found, try to extract items in alternative format
  if (explanationItems.length === 0 && explanation.includes('- ')) {
    explanationItems = explanation.split('\n')
      .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      .map(line => `<li>${line.trim().substring(2)}</li>`);
  }
  
  if (improvementItems.length === 0 && improvements.includes('- ')) {
    improvementItems = improvements.split('\n')
      .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      .map(line => `<li>${line.trim().substring(2)}</li>`);
  }

  // Function to render stars based on score
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    return (
      <div className="flex flex-wrap">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400" />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <StarHalf className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400" />
        )}
        
        {/* Empty stars */}
        {Array.from({ length: 5 - (fullStars + (hasHalfStar ? 1 : 0)) }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 flex-shrink-0 text-gray-300" />
        ))}
      </div>
    );
  };

  // Score labels
  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.5) return "Bon";
    if (score >= 2.5) return "Moyen";
    if (score >= 1.5) return "À améliorer";
    return "Insuffisant";
  };

  // Get color class based on score
  const getScoreColorClass = (score: number): string => {
    if (score >= 4.5) return "bg-green-100 text-green-800";
    if (score >= 3.5) return "bg-blue-100 text-blue-800";
    if (score >= 2.5) return "bg-yellow-100 text-yellow-800";
    if (score >= 1.5) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Salary Banner - Now more prominent */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-8 text-white text-center">
        <p className="text-blue-100 mb-2 uppercase tracking-wide font-medium">Estimation salariale</p>
        <div className="text-4xl md:text-5xl font-bold mb-2">{estimatedWorthValue}</div>
        <p className="text-blue-100 text-sm">Basée sur votre profil et les tendances actuelles du marché</p>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
      {/* Overview Section */}
        {overview && (
          <div className="mb-8 bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h3 className="font-medium text-gray-800 flex items-center mb-3">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" /> Vue d'ensemble
            </h3>
            <p className="text-gray-700">{overview}</p>
          </div>
        )}
        {/* Overall Score Card */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-2" /> Score global
              </h3>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${getScoreColorClass(overallScore)}`}>
                {getScoreLabel(overallScore)}
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-gray-800 mr-2">{overallScore}</div>
              <div className="text-sm text-gray-500">/ 5</div>
              <div className="ml-auto">
                {renderStars(overallScore)}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Ce score représente la moyenne des 8 critères d'évaluation de votre CV
            </p>
          </div>
          
          {/* Location info - if provided */}
          {(locationData.country || locationData.city || locationData.companyType || locationData.customCompany) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex-1">
              <h3 className="font-medium text-gray-800 flex items-center mb-3">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" /> Localisation
              </h3>
              <div className="space-y-2 text-sm">
                {locationData.country && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pays:</span>
                    <span className="font-medium text-gray-800">{locationData.country}</span>
                  </div>
                )}
                {locationData.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ville:</span>
                    <span className="font-medium text-gray-800">{locationData.city}</span>
                  </div>
                )}
                {locationData.companyType && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type d'entreprise:</span>
                    <span className="font-medium text-gray-800">{locationData.companyType}</span>
                  </div>
                )}
                {locationData.customCompany && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Entreprise:</span>
                    <span className="font-medium text-gray-800">{locationData.customCompany}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Factors and Improvements */}
          <div>
            {/* Key Factors */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center pb-2 border-b border-gray-100">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" /> Points forts de votre CV
              </h4>
              
              {explanationItems.length > 0 ? (
                <ul className="space-y-3">
                  {explanationItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <BadgeCheck className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item.replace(/<\/?li>/g, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Aucun facteur clé disponible</p>
              )}
            </div>
            
            {/* Improvements */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center pb-2 border-b border-gray-100">
                <Building className="mr-2 h-5 w-5 text-blue-600" /> Comment améliorer votre CV
              </h4>
              
              {improvementItems.length > 0 ? (
                <ul className="space-y-3">
                  {improvementItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{item.replace(/<\/?li>/g, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Aucune amélioration disponible</p>
              )}
            </div>
          </div>
          
          {/* Right Column: Detailed Scores */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center pb-2 border-b border-gray-100">
                <BriefcaseBusiness className="mr-2 h-5 w-5 text-blue-600" /> Évaluation détaillée
              </h4>
              
              <div className="space-y-4">
                {criteria.slice(0, 8).map((criterion, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium text-gray-800">{criterion.name}</span>
                        <p className="text-xs text-gray-500">{criterion.description}</p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColorClass(criterion.score)}`}>
                        {criterion.score}/5
                      </div>
                    </div>
                    <div className="flex items-center">
                      {renderStars(criterion.score)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeWorth;