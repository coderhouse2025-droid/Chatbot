# ⚛️ Chatbot — Normativa Nuclear Argentina

Asistente conversacional especializado en el marco regulatorio nuclear argentino, impulsado por inteligencia artificial con acceso a documentación oficial indexada.

---

## 🚀 Demo

🔗 [chatbot-kappa-wheat-30.vercel.app](https://chatbot-kappa-wheat-30.vercel.app)

---

## 📋 Descripción

Este chatbot responde consultas técnicas y jurídicas sobre la normativa nuclear argentina, incluyendo legislación vigente, normas de la ARN, protección radiológica, licencias, residuos radiactivos y tratados internacionales.

Las respuestas se generan combinando un modelo de lenguaje de última generación con búsqueda semántica sobre documentación oficial indexada.

---

## 🧠 Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Deploy | Vercel |
| Modelo de lenguaje | LLaMA 3.3 70B vía Groq |
| Base de conocimiento | Pinecone (RAG) |
| Embeddings | llama-text-embed-v2 (NVIDIA) |

---

## 📚 Base de conocimiento

El asistente tiene acceso a más de 70 documentos oficiales indexados, incluyendo:

- Ley 24804 — Ley Nacional de la Actividad Nuclear
- Normas ARN (serie completa)
- Decretos reglamentarios
- Tratados internacionales (TNP, Tlatelolco, CTBT)
- Documentación de CNEA e INVAP
- Acuerdos de salvaguardias OIEA / ABACC

---

## 🏗️ Arquitectura

```
Usuario
   ↓
React (Vercel)
   ↓
/api/chat  ← serverless function
   ↓              ↓
Pinecone       Groq API
(búsqueda    (generación de
semántica)     respuesta)
```

---

## ⚙️ Variables de entorno

Para ejecutar el proyecto localmente o en producción se requieren las siguientes variables:

```
GROQ_API_KEY=...
PINECONE_API_KEY=...
```

---

## 📄 Licencia

Proyecto de uso interno. Documentación fuente disponible en [argentina.gob.ar](https://www.argentina.gob.ar).
