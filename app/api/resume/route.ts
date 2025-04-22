import { Groq } from "groq-sdk";
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

// Définir l'interface pour les scores d'évaluation
interface CVScores {
  experience?: number;
  skills?: number;
  education?: number;
  soft_skills?: number;
  leadership?: number;
  achievements?: number;
  cv_clarity?: number;
  market_fit?: number;
  languages?: number;
  industry_knowledge?: number;
  [key: string]: number | undefined;
}

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  // Parse location data from the prompt
  let locationData = { country: "France", city: "", companyType: "", customCompany: "" };
  
  const locationMatch = prompt.match(/LOCATION: ({.*?})/);
  if (locationMatch && locationMatch[1]) {
    try {
      locationData = JSON.parse(locationMatch[1]);
    } catch (e) {
      console.error("Failed to parse location data:", e);
    }
  }

  // Standardize country names for better detection
  const countryMappings: { [key: string]: string } = {
    "etats unis": "États-Unis",
    "etats-unis": "États-Unis",
    "usa": "États-Unis",
    "united states": "États-Unis",
    "us": "États-Unis",
    "united kingdom": "Royaume-Uni",
    "uk": "Royaume-Uni",
    "england": "Royaume-Uni",
    "angleterre": "Royaume-Uni",
    "germany": "Allemagne",
    "deutschland": "Allemagne",
    "spain": "Espagne",
    "españa": "Espagne",
    "espana": "Espagne"
  };

  // Normalize the country name (lowercase for comparison)
  const normalizedCountry = locationData.country.toLowerCase();
  if (countryMappings[normalizedCountry]) {
    locationData.country = countryMappings[normalizedCountry];
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
  });

  // Define evaluation criteria for the CV
  const evaluationCriteria = [
    { id: "experience", name: "Expérience", description: "Années d'expérience professionnelle pertinente" },
    { id: "skills", name: "Compétences techniques", description: "Maîtrise des compétences techniques requises" },
    { id: "education", name: "Formation", description: "Niveau d'études et pertinence de la formation" },
    { id: "soft_skills", name: "Soft Skills", description: "Communication, travail d'équipe, etc." },
    { id: "leadership", name: "Leadership", description: "Capacité à diriger des équipes et prendre des initiatives" },
    { id: "achievements", name: "Accomplissements", description: "Réalisations et résultats quantifiables" },
    { id: "cv_clarity", name: "Clarté du CV", description: "Organisation et présentation du CV" },
    { id: "market_fit", name: "Adéquation au marché", description: "Correspondance avec les besoins du marché actuel" },
    { id: "languages", name: "Langues", description: "Maîtrise de langues étrangères" },
    { id: "industry_knowledge", name: "Connaissance du secteur", description: "Familiarité avec l'industrie visée" }
  ];

  // Determine language of the resume (default to French)
  const resumeText = prompt.split('LOCATION:')[0].trim();
  const languageDetectionPrompt = `Quelle est la langue principale dans laquelle ce CV est rédigé? Répondez seulement par le nom de la langue en minuscules (exemple: "français", "anglais", "espagnol", etc.):\n\n${resumeText.substring(0, 1000)}`;

  // Detect language first
  let resumeLanguage = "français"; // Default
  try {
    const langDetection = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: 'user', content: languageDetectionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });
    
    const detectedLang = langDetection.choices[0]?.message?.content?.toLowerCase().trim() || "français";
    resumeLanguage = detectedLang;
    
  } catch (error) {
    console.error("Error detecting language:", error);
  }

  // Analyze first with a separate call to get objective criteria scores
  const analysisPrompt = `
TÂCHE: Analyser le CV suivant pour évaluer objectivement les compétences du candidat. 
Pour chaque critère, attribue un score de 1 à 5, où:
1 = très faible (pratiquement absent)
2 = faible (en dessous de la moyenne)
3 = moyen (niveau attendu)
4 = bon (au-dessus de la moyenne)
5 = excellent (exceptionnel)

SOIS CRITIQUE ET OBJECTIF. N'hésite pas à donner des scores bas si le CV ne démontre pas clairement les compétences. Tes évaluations doivent être basées UNIQUEMENT sur ce qui est visible dans le CV.

Critères d'évaluation:
${evaluationCriteria.map(criterion => `- ${criterion.name}: ${criterion.description}`).join('\n')}

N'ajoute aucun commentaire ni justification, réponds UNIQUEMENT avec un objet JSON contenant les scores. Exemple de format:
{
  "experience": 3,
  "skills": 4,
  "education": 2,
  "soft_skills": 3,
  "leadership": 1,
  "achievements": 4,
  "cv_clarity": 3,
  "market_fit": 5,
  "languages": 2,
  "industry_knowledge": 3
}

CV À ANALYSER:
${resumeText}
`;

  // Get objective scores first
  const defaultScores: CVScores = {
    experience: 3,
    skills: 3,
    education: 3,
    soft_skills: 3,
    leadership: 3,
    achievements: 3,
    cv_clarity: 3,
    market_fit: 3,
    languages: 3,
    industry_knowledge: 3
  };
  
  let scores: CVScores = { ...defaultScores };
  
  try {
    const analysis = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.1,
      max_tokens: 500,
    });
    
    const analysisText = analysis.choices[0]?.message?.content || '';
    
    // Extract JSON from the response (it might be wrapped in code blocks or have text before/after)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedScores = JSON.parse(jsonMatch[0]) as CVScores;
        // Merge with default scores to ensure all properties exist
        scores = { ...defaultScores, ...parsedScores };
        //console.log("Extracted scores:", resumeLanguage);
      } catch (e) {
        console.error("Failed to parse scores:", e);
      }
    }
  } catch (error) {
    console.error("Error analyzing CV:", error);
  }

  // Generate additional location context
  let locationContext = "";
  
  locationContext = `
INFORMATIONS SUR LA LOCALISATION:
- Pays: ${locationData.country}
- Ville: ${locationData.city || "Non spécifiée"}
- Type d'entreprise: ${locationData.companyType || "Non spécifié"}
- Entreprise ciblée: ${locationData.customCompany || "Non spécifiée"}
`;

  // Use the objective scores in the main response
  const criteriaScoresText = `Les scores d'évaluation de ce CV, basés sur une analyse objective, sont:
${Object.entries(scores).map(([key, value]) => `- ${key}: ${value}/5`).join('\n')}`;

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{
      role: 'user',
      content: `CONTEXTE: Tu es un expert en recrutement et évaluation de CV en ${locationData.country}. Tu vas analyser le CV ci-dessous et donner une estimation réaliste du salaire annuel que cette personne peut demander, basée sur les données actuelles du marché.

${locationContext}

ANALYSE OBJECTIVE PRÉLIMINAIRE DU CV:
${criteriaScoresText}

CONSIGNES IMPORTANTES:
- SOIS CRITIQUE ET HONNÊTE dans ton évaluation. N'hésite pas à relever les points faibles.
- Tu dois IMPÉRATIVEMENT répondre en ${resumeLanguage || 'FRANÇAIS'}.
- Ton estimation salariale doit être précise et toujours exprimée avec la devise appropriée au pays (qui est dans INFORMATIONS SUR LA LOCALISATION) et avec un intervalle réduite (ex: 45000 - 50000€).
- Pour les pays, viles et type d'entreprise, assure-toi que les salaires correspondent aux standards géographique et entreprise.
- Fournis 4 points d'explication courts sur les facteurs clés contribuant à cette évaluation.
- Fournis 4 conseils sur comment la personne peut augmenter sa valeur sur le marché.
- Chaque point doit faire moins de 120 mots.
- Ton style doit être professionnel mais direct.
- Adresse-toi directement à la personne (tutoiement).
- Utilise les scores d'évaluation fournis dans l'analyse préliminaire, et NON les exemples de scores.

- LE FORMAT DE SORTIE EST CRUCIAL: Tu DOIS utiliser EXACTEMENT le format de sortie avec toutes les balises. Ne rajoute aucun texte avant, entre ou après les balises. 

-------
CV À ANALYSER:
${resumeText}
-------
FORMAT DE SORTIE (À SUIVRE EXACTEMENT):
<Estimated Worth>FOURCHETTE DE SALAIRE ANNUEL ICI AVEC SEULEMENT LA DEVISE APPROPRIÉE du pays (qui est dans INFORMATIONS SUR LA LOCALISATION ex: France alors --> 45000 - 50000€))</Estimated Worth>
<Overview>Bref résumé de l'analyse générale du CV en 2-3 phrases. Sois spécifique et critique. Adresse-toi directement à la personne (tutoiement)</Overview>
<Explanation>
   <ul>
      <li>premier facteur</li>
      <li>deuxième facteur</li>
      <li>troisième facteur</li>
      <li>quatrième facteur</li>
   </ul>
</Explanation>
<Improvements>
   <ul>
      <li>première amélioration</li>
      <li>deuxième amélioration</li>
      <li>troisième amélioration</li>
      <li>quatrième amélioration</li>
   </ul>
</Improvements>
<Criteria>
[
  {"name": "Expérience", "score": ${scores.experience}, "description": "Années d'expérience professionnelle pertinente"},
  {"name": "Compétences techniques", "score": ${scores.skills}, "description": "Maîtrise des compétences techniques requises"},
  {"name": "Formation", "score": ${scores.education}, "description": "Niveau d'études et pertinence de la formation"},
  {"name": "Soft Skills", "score": ${scores.soft_skills}, "description": "Communication, travail d'équipe, etc."},
  {"name": "Leadership", "score": ${scores.leadership}, "description": "Capacité à diriger des équipes et prendre des initiatives"},
  {"name": "Accomplissements", "score": ${scores.achievements}, "description": "Réalisations et résultats quantifiables"},
  {"name": "Clarté du CV", "score": ${scores.cv_clarity}, "description": "Organisation et présentation du CV"},
  {"name": "Adéquation au marché", "score": ${scores.market_fit}, "description": "Correspondance avec les besoins du marché actuel"},
  {"name": "Langues", "score": ${scores.languages}, "description": "Maîtrise de langues étrangères"},
  {"name": "Connaissance du secteur", "score": ${scores.industry_knowledge}, "description": "Familiarité avec l'industrie visée"}
]
</Criteria>`
    }],
    stream: true,
    temperature: 0.3,
    max_tokens: 1500,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(stream);
}