export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, system } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
          { role: "system", content: system },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      return res.status(response.status).json({ error: { message: errMsg } });
    }

    const text = data.choices?.[0]?.message?.content || "Sin respuesta.";

    // Responder en formato compatible con lo que espera App.jsx
    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
