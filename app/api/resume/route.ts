import { Groq } from "groq-sdk";
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

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
  
  // Response language will match the CV language
  //const responseLanguage = resumeLanguage;
  //const useEnglish = responseLanguage === "anglais";

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{
      role: 'user',
      content: `CONTEXTE: Tu es un expert en évaluation de CV et prédiction de valeur salariale en ${locationData.country || 'France'}. Tu vas analyser le CV ci-dessous et donner une estimation réaliste du salaire que cette personne peut demander, basée sur les données actuelles du marché.

${locationData.city ? `L'analyse est spécifiquement pour ${locationData.city}.` : ''} 
${locationData.companyType ? `Le type d'entreprise est ${locationData.companyType}.` : ''} 
${locationData.customCompany ? `L'entreprise spécifique visée est ${locationData.customCompany}.` : ''}

CONSIGNES IMPORTANTES:
- Tu dois IMPÉRATIVEMENT répondre en FRANÇAIS.
- Ton estimation salariale doit être précise et toujours exprimée en euros avec un intervalle (ex: 45 000€ - 55 000€).
- Ton analyse doit être basée sur des données comme Glassdoor, Payscale, etc. pour le poste et la localisation.
- Fournis 4 points d'explication courts sur les facteurs clés contribuant à cette évaluation.
- Fournis 4 conseils sur comment la personne peut augmenter sa valeur sur le marché.
- Chaque point doit faire moins de 80 caractères.
- Ton style doit être professionnel mais dynamique et encourageant.
- Adresse-toi directement à la personne (tutoiement).
- Évalue le CV selon les critères suivants (1 = très mauvais, 2 = mauvais, 3 = moyen, 4 = bon, 5 = très bon).

${evaluationCriteria.map(criterion => `- ${criterion.name}: Évalue ${criterion.description.toLowerCase()}`).join('\n')}

- IMPORTANT: Tu DOIS utiliser EXACTEMENT le format de sortie avec toutes les balises. Ne rajoute aucun texte avant, entre ou après les balises. La fourchette de salaire doit être dans la balise <Estimated Worth>, l'explication dans la balise <Explanation> avec des éléments <li>, les améliorations dans la balise <Improvements> avec des éléments <li>, et les critères dans la balise <Criteria> sous forme de tableau JSON.

-------
CV À ANALYSER:
${resumeText}
-------
FORMAT DE SORTIE (À SUIVRE EXACTEMENT):
<Estimated Worth>FOURCHETTE DE SALAIRE ICI</Estimated Worth>
<Overview>Bref résumé de l'analyse générale du CV en 2-3 phrases. Apporte des information pertinentes.Adresse-toi directement à la personne (tutoiement).</Overview>
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
  {"name": "Expérience", "score": 4, "description": "Années d'expérience professionnelle pertinente"},
  {"name": "Compétences techniques", "score": 4, "description": "Maîtrise des compétences techniques requises"},
  {"name": "Formation", "score": 4, "description": "Niveau d'études et pertinence de la formation"},
  {"name": "Soft Skills", "score": 3, "description": "Communication, travail d'équipe, etc."},
  {"name": "Leadership", "score": 3, "description": "Capacité à diriger des équipes et prendre des initiatives"},
  {"name": "Accomplissements", "score": 4, "description": "Réalisations et résultats quantifiables"},
  {"name": "Clarté du CV", "score": 3, "description": "Organisation et présentation du CV"},
  {"name": "Adéquation au marché", "score": 4, "description": "Correspondance avec les besoins du marché actuel"},
  {"name": "Langues", "score": 3, "description": "Maîtrise de langues étrangères"},
  {"name": "Connaissance du secteur", "score": 3, "description": "Familiarité avec l'industrie visée"}
]
</Criteria>`
    }],
    stream: true,
    temperature: 0.2,
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