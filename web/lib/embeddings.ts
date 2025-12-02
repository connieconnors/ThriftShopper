const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

export async function generateEmbedding(text: string): Promise<number[]> {
  const token = process.env.HUGGINGFACE_INFERENCE_TOKEN;

  if (!token) {
    throw new Error("HUGGINGFACE_INFERENCE_TOKEN is not set in environment variables");
  }

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const embedding = await response.json();
  return embedding as number[];
}

// Batch version for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const token = process.env.HUGGINGFACE_INFERENCE_TOKEN;

  if (!token) {
    throw new Error("HUGGINGFACE_INFERENCE_TOKEN is not set in environment variables");
  }

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: texts,
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }

  const embeddings = await response.json();
  return embeddings as number[][];
}

