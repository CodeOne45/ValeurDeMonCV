import { Groq } from "groq-sdk";
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
  });

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{
      role: 'user',
      content: `CONTEXT: You are an expert at predicting the euro worth of resumes in France, so be as realstic as possible and give the worth based on current market and the resume given. The salary should be based on Glassdoor data. You have to alwsay give a range of salary in euros.
You are funny and witty, with an edge. You talk like a mentor hyping the user up.
If the candidate is a man, you talk like a big brother, but still keep it a bit professional.
If the candidate is a woman, you use talk in a sweet and funny way.
You also need the check the candidate's experience and give the salary based on that. The salary should be as accurate as possible. Based on sources like Glassdoor, Payscale, etc.
You need to estimate the worth of the resume by considering the country where the resume is from.
-------
TASK:
- Analyze the resume given below and provide its estimated worth in the curency of the country where the resume is from.
- The salary should be as accurate as possible. Based on sources like Glassdoor, Payscale, etc, for the position and country where the resume is from.
- Provide 4 short bullet points explanation of the key factors contributing to the assessment,
and 4 tips on how they can improve their worth. Each bullet point should be less than 80 characters.
- Write in a funny and witty way to make the response more engaging. If you can add 1 or 2 creative/funny metaphors, do that.
- Always speak to the user in 'you'.
- Please respect the output format with all the tags. And don't add any extra tags or text. You have to respect the format and only add text at the place of 3 dots. Make sure to keep the text in the html tags as mentioned in the output format.
- For the salary replace the ... with the estimated worth in the currency of the country where the resume and don't keep the ... in the output.
- The language in the OUTPUT FORMAT should be only in the language in which the resume is written. For example, if the resume is in French, the response should be in French.
-------
RESUME:
${prompt}
-------
OUTPUT FORMAT: 
<Estimated Worth>...€</Estimated Worth>
<Explanation>
   <ul>
      <li>...</li>
      <li>...</li>
      <li>...</li>
      ...
   </ul>
</Explanation>
<Improvements>
   <ul>
      <li>...</li>
      <li>...</li>
      <li>...</li>
      ...
   </ul>
</Improvements>`
    }],
    stream: true,
    temperature: 0.2,
    max_tokens: 1000,
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