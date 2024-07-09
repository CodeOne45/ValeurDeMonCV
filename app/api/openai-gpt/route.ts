import { Groq } from "groq-sdk";
import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { apiKey, messages } = await req.json();
  const groq = new Groq({
    apiKey
  });

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `CONTEXT: You are an expert at predicting the euro worth of resumes in Europe.
-------
TASK: 
- You will receive a resume from a user as a test input.
- Analyze the resume and provide an estimated worth in US dollars
- Provide 4 short bullet points explanation of the key factors contributing to the assessment,
and 4 tips on how they can improve their worth. Each bullet point should be less than 1 line.
-------
OUTPUT FORMAT: 
<Estimated Worth>€...</Estimated Worth>
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
      },
      ...messages,
    ],
    model: "llama3-8b-8192",
    stream: true,
    temperature: 1,
  });

  console.log('response', response);

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