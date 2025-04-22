import { Groq } from "groq-sdk";
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

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
      model: "llama3-8b-8192",
      messages: [{ role: 'user', content: languageDetectionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });
    
    const detectedLang = langDetection.choices[0]?.message?.content?.toLowerCase().trim() || "français";
    if (["français", "anglais", "english", "french"].includes(detectedLang)) {
      resumeLanguage = detectedLang === "english" ? "anglais" : (detectedLang === "french" ? "français" : detectedLang);
    }
  } catch (error) {
    console.error("Error detecting language:", error);
  }

  // Salaires par niveau d'expérience, position et secteur
  const salaryReferenceData = `
Salaires moyens en France (2025) par niveau d'expérience:
- Junior (0-2 ans): 35 000€ - 45 000€
- Intermédiaire (3-5 ans): 45 000€ - 65 000€
- Senior (6-9 ans): 65 000€ - 85 000€
- Expert (10+ ans): 85 000€ - 120 000€+

Par poste technique:
- Développeur Front-end Junior: 35 000€ - 45 000€
- Développeur Front-end Senior: 55 000€ - 70 000€
- Développeur Back-end Junior: 38 000€ - 48 000€
- Développeur Back-end Senior: 60 000€ - 80 000€
- Développeur Full-stack Junior: 40 000€ - 50 000€
- Développeur Full-stack Senior: 65 000€ - 85 000€
- DevOps Engineer: 55 000€ - 85 000€
- Data Scientist: 45 000€ - 90 000€
- Data Engineer: 50 000€ - 80 000€
- ML Engineer: 60 000€ - 95 000€
- Architecte logiciel: 75 000€ - 110 000€
- SRE: 65 000€ - 95 000€
- QA Engineer: 40 000€ - 70 000€

Par poste managérial:
- Chef de projet IT: 50 000€ - 75 000€
- Product Manager: 55 000€ - 90 000€
- Tech Lead: 70 000€ - 95 000€
- Engineering Manager: 80 000€ - 110 000€
- CTO: 90 000€ - 150 000€+

Par secteur:
- Banque/Finance: +10% à +25%
- Santé/Pharma: +5% à +15%
- E-commerce: 0% à +10%
- Secteur public: -15% à -30%
- ESN/Consulting: -5% à +10%
- Startup (early stage): -10% à -20% (mais souvent avec equity)
- Scale-up: 0% à +15%

Ajustements régionaux:
- Paris: Base de référence
- Lyon/Bordeaux/Toulouse: -5% à -15%
- Autres grandes villes: -10% à -20%
- Zones rurales: -15% à -30%
- Remote pour entreprises étrangères: +10% à +50%

Impact des compétences:
- Technologies à forte demande (AI/ML, blockchain, cybersécurité): +10% à +25%
- Technologies standard actuelles: Référence
- Technologies obsolètes: -10% à -30%

Impact des diplômes:
- Écoles d'ingénieurs prestigieuses: +5% à +15%
- Master universitaire: 0% à +5%
- Autodidacte avec preuves de compétence: -5% à 0%
- Bootcamp sans expérience significative: -10% à -15%

Impact des langues:
- Anglais courant: +5% à +15%, indispensable pour salaires >80k€
- Autres langues commerciales: +2% à +8% selon le contexte
`;

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
  // Get objective scores first
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
        //console.log("Extracted scores:", scores);
      } catch (e) {
        console.error("Failed to parse scores:", e);
      }
    }
  } catch (error) {
    console.error("Error analyzing CV:", error);
  }

  // Use the objective scores in the main response
  const criteriaScoresText = Object.keys(scores).length > 0 
    ? `Les scores d'évaluation de ce CV, basés sur une analyse objective, sont:
${Object.entries(scores).map(([key, value]) => `- ${key}: ${value}/5`).join('\n')}`
    : '';

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{
      role: 'user',
      content: `CONTEXTE: Tu es un expert en recrutement et évaluation de CV en ${locationData.country || 'France'}. Tu vas analyser le CV ci-dessous et donner une estimation réaliste du salaire que cette personne peut demander, basée sur les données actuelles du marché.

${locationData.city ? `L'analyse est spécifiquement pour ${locationData.city}.` : ''} 
${locationData.companyType ? `Le type d'entreprise est ${locationData.companyType}.` : ''} 
${locationData.customCompany ? `L'entreprise spécifique visée est ${locationData.customCompany}.` : ''}

ANALYSE OBJECTIVE PRÉLIMINAIRE DU CV:
${criteriaScoresText}

CONSIGNES IMPORTANTES:
- SOIS CRITIQUE ET HONNÊTE dans ton évaluation. N'hésite pas à relever les points faibles.
- Tu dois IMPÉRATIVEMENT répondre en FRANÇAIS.
- Ton estimation salariale doit être précise et toujours exprimée en euros avec un intervalle (ex: 45 000€ - 50 000€).
- Fournis 4 points d'explication courts sur les facteurs clés contribuant à cette évaluation.
- Fournis 4 conseils sur comment la personne peut augmenter sa valeur sur le marché.
- Chaque point doit faire moins de 80 caractères.
- Ton style doit être professionnel mais direct.
- Adresse-toi directement à la personne (tutoiement).
- Utilise les scores d'évaluation fournis dans l'analyse préliminaire, et NON les exemples de scores.

- LE FORMAT DE SORTIE EST CRUCIAL: Tu DOIS utiliser EXACTEMENT le format de sortie avec toutes les balises. Ne rajoute aucun texte avant, entre ou après les balises. 

-------
CV À ANALYSER:
${resumeText}
-------
FORMAT DE SORTIE (À SUIVRE EXACTEMENT):
<Estimated Worth>FOURCHETTE DE SALAIRE ICI</Estimated Worth>
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
  {"name": "Expérience", "score": ${scores.experience || '3'}, "description": "Années d'expérience professionnelle pertinente"},
  {"name": "Compétences techniques", "score": ${scores.skills || '3'}, "description": "Maîtrise des compétences techniques requises"},
  {"name": "Formation", "score": ${scores.education || '3'}, "description": "Niveau d'études et pertinence de la formation"},
  {"name": "Soft Skills", "score": ${scores.soft_skills || '3'}, "description": "Communication, travail d'équipe, etc."},
  {"name": "Leadership", "score": ${scores.leadership || '3'}, "description": "Capacité à diriger des équipes et prendre des initiatives"},
  {"name": "Accomplissements", "score": ${scores.achievements || '3'}, "description": "Réalisations et résultats quantifiables"},
  {"name": "Clarté du CV", "score": ${scores.cv_clarity || '3'}, "description": "Organisation et présentation du CV"},
  {"name": "Adéquation au marché", "score": ${scores.market_fit || '3'}, "description": "Correspondance avec les besoins du marché actuel"},
  {"name": "Langues", "score": ${scores.languages || '3'}, "description": "Maîtrise de langues étrangères"},
  {"name": "Connaissance du secteur", "score": ${scores.industry_knowledge || '3'}, "description": "Familiarité avec l'industrie visée"}
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