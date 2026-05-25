export type OllamaGenerateResponse = {
  response: string;
};

export async function ollamaGenerate(prompt: string) {
  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1:8b";

  const res = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Ollama request failed (${res.status})`);
  }

  return (await res.json()) as OllamaGenerateResponse;
}

