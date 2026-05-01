export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, system } = req.body;
    const ultimaPregunta = messages[messages.length - 1]?.content || "";

    // ── 1. Buscar contexto relevante en Pinecone ──────────────────
    const pineconeRes = await fetch(
      "https://normativa-nuclear-ku9bass.svc.aped-4627-b74a.pinecone.io/records/namespaces/default/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": process.env.PINECONE_API_KEY,
          "X-Pinecone-API-Version": "2025-10",
        },
        body: JSON.stringify({
          query: {
            inputs: { text: ultimaPregunta },
            top_k: 5,
          },
          fields: ["text", "source"],
        }),
      }
    );

    let contexto = "";
    if (pineconeRes.ok) {
      const pineconeData = await pineconeRes.json();
      const resultados = pineconeData.result?.hits || [];
      if (resultados.length > 0) {
        contexto = resultados
          .map((r) => `[${r.fields?.source || "doc"}]\n${r.fields?.text || ""}`)
          .join("\n\n---\n\n");
      }
    }

    // ── 2. Armar system prompt con contexto ───────────────────────
    const systemConContexto = contexto
      ? `${system}\n\n## Fragmentos relevantes de la documentación oficial:\n\n${contexto}\n\nUsá estos fragmentos como base para tu respuesta cuando sean pertinentes. Citá la fuente entre corchetes.`
      : system;

    // ── 3. Llamar a Groq ──────────────────────────────────────────
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemConContexto },
          ...messages,
        ],
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      const errMsg = groqData?.error?.message || `HTTP ${groqRes.status}`;
      return res.status(groqRes.status).json({ error: { message: errMsg } });
    }

    const text = groqData.choices?.[0]?.message?.content || "Sin respuesta.";

    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
