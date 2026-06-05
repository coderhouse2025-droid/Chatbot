# ⚛️ normaAR — Asistente IA sobre Normativa Nuclear Argentina

<img width="2752" height="1536" alt="Banner - Chatbot" src="https://github.com/user-attachments/assets/9afd8b8b-7842-42c5-a7f4-99b1744d33c4" />

[![Demo en vivo](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge)](https://chatbot-kappa-wheat-30.vercel.app)
[![RAG](https://img.shields.io/badge/Arquitectura-RAG-blueviolet?style=for-the-badge)](#arquitectura-rag)
[![LLaMA 3.3 70B](https://img.shields.io/badge/LLM-LLaMA_3.3_70B-orange?style=for-the-badge)](#3-llama-33-70b-vía-groq--no-gpt-4-no-claude)

>> Consultá legislación, normas ARN, protección radiológica y tratados internacionales en lenguaje natural.

🔗 **Demo:** https://norma-ar.vercel.app

---

## 📋 Índice

- [Descripción del producto](#-descripción-del-producto)
- [Caso de negocio](#-caso-de-negocio)
- [Decisiones técnicas y su justificación](#-decisiones-técnicas-y-su-justificación)
- [Arquitectura RAG](#-arquitectura-rag)
- [Pipeline de datos: de documentos oficiales a base de conocimiento indexada](#-pipeline-de-datos-de-documentos-oficiales-a-base-de-conocimiento-indexada)
- [¿Por qué este camino y no otro?](#-por-qué-este-camino-y-no-otro)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Variables de entorno](#️-variables-de-entorno)
- [Instalación local](#️-instalación-local)
- [Roadmap](#-roadmap)

---

## 📊 Descripción del producto

Este chatbot responde consultas técnicas y jurídicas sobre la normativa nuclear argentina: legislación vigente, normas de la ARN, protección radiológica, licencias, residuos radiactivos y tratados internacionales.

Las respuestas se generan combinando un modelo de lenguaje de última generación (LLaMA 3.3 70B) con búsqueda semántica sobre más de 70 documentos oficiales indexados — una arquitectura conocida como **RAG (Retrieval-Augmented Generation)**.

---

## 💼 Caso de negocio

### El problema que resuelve

La normativa nuclear argentina está distribuida en decenas de fuentes heterogéneas: leyes del Congreso, normas técnicas de la ARN con nomenclatura propia (AR X.X.X), decretos del Poder Ejecutivo, y tratados internacionales ratificados con instrumentos de implementación distintos. Un profesional del sector — físico, ingeniero nuclear, abogado especializado, inspector radiológico — puede tardar horas en localizar el artículo preciso que regula, por ejemplo, el transporte de material radiactivo Categoría II.

El dolor no es la falta de información: toda la normativa es pública. El problema es la **fragmentación y el costo de búsqueda**. Los documentos existen en PDF no estructurados, en páginas web del gobierno con navegación deficiente, y en algunos casos en formatos escaneados sin OCR.

### La propuesta de valor

- **Consulta en lenguaje natural**: el usuario pregunta como hablaría con un colega experto, no como usaría un buscador
- **Respuesta con fuente citada**: cada respuesta incluye el documento de origen, lo que permite verificación y uso profesional
- **Cobertura exhaustiva**: más de 70 documentos indexados que ningún profesional tendría memorizados simultáneamente
- **Dominio cerrado**: al estar restringido a documentación oficial argentina, el sistema no alucina ni mezcla normativas de otros países

### Usuarios objetivo

Inspectores de la ARN, personal de CNEA e INVAP, físicos médicos que trabajan bajo licencia, abogados especializados en derecho nuclear, estudiantes de física e ingeniería nuclear, y periodistas especializados en energía.

---

## 🧠 Decisiones técnicas y su justificación

### 1. React + Vite — no Next.js, no CRA

**¿Por qué React?**

El frontend de un chatbot es una SPA con un único estado central: el historial de mensajes. React es la elección natural para manejar ese estado reactivo y renderizar la lista de mensajes a medida que llegan. La alternativa más cercana sería Vue 3, igualmente válida; React se eligió por su ecosistema más amplio y la familiaridad del equipo.

**¿Por qué Vite y no Create React App?**

CRA fue deprecado oficialmente por el equipo de React en 2023. Vite es el estándar actual para nuevos proyectos: el servidor de desarrollo arranca en menos de 300ms (vs. varios segundos en CRA), el HMR es prácticamente instantáneo, y el build de producción usa Rollup, que genera bundles más pequeños. Para un proyecto que se despliega en Vercel, la velocidad del build impacta directamente en los tiempos de CI/CD.

**¿Por qué no Next.js?**

Next.js hubiera sido la elección correcta si la app necesitara SSR para SEO, rutas múltiples, o middleware de autenticación. Un chatbot de consulta técnica no tiene páginas que indexar en Google (el contenido es dinámico, generado en runtime). Next.js hubiera añadido complejidad sin valor para este caso.

---

### 2. Pinecone — no Chroma, no pgvector, no Weaviate

**¿Por qué una base de datos vectorial?**

La búsqueda semántica es el corazón de la arquitectura RAG. Cuando el usuario pregunta "¿qué dice la norma sobre dosis máxima en trabajadores?", el sistema necesita encontrar los fragmentos de texto más *semánticamente similares* a esa pregunta, no los que contienen exactamente esas palabras. Eso requiere comparar vectores de alta dimensión (embeddings) de forma eficiente — lo que hace una base de datos vectorial.

**¿Por qué Pinecone específicamente?**

| Opción | Tipo | Pros | Contras para este caso |
|--------|------|------|----------------------|
| **Pinecone** | Cloud managed | Sin infra, alta disponibilidad, tier gratuito generoso | Vendor externo |
| Chroma | Local / self-hosted | Open source, sin costo | Requiere servidor propio para producción |
| pgvector | Extensión PostgreSQL | Integra con BD existente | Necesita servidor PostgreSQL, más setup |
| Weaviate | Cloud / self-hosted | Muy potente, multimodal | Más complejo de configurar para este scope |

Para un proyecto desplegado en Vercel (serverless, sin estado persistente entre invocaciones), Pinecone es la única opción de las anteriores que no requiere gestionar una conexión a servidor propio. Las funciones serverless son stateless por definición — Pinecone resuelve el problema de persistencia de los vectores de forma nativa.

El tier gratuito de Pinecone soporta hasta 100.000 vectores y 1 índice, suficiente para los ~70 documentos indexados con chunking de 500 tokens.

---

### 3. LLaMA 3.3 70B vía Groq — no GPT-4, no Claude

**¿Por qué un LLM open-weights?**

LLaMA 3.3 70B es el modelo de lenguaje publicado por Meta con pesos abiertos. Esto significa que puede ejecutarse en infraestructura propia o de terceros sin depender de un único proveedor como OpenAI o Anthropic. Para un sistema de consulta sobre documentación oficial del Estado argentino, la independencia de proveedor es un criterio técnico relevante.

**¿Por qué Groq como proveedor de inferencia?**

Groq utiliza hardware especializado (LPU — Language Processing Unit) optimizado para inferencia de LLMs. La diferencia de velocidad es concreta: Groq entrega ~800 tokens/segundo con LLaMA 3.3 70B, versus ~30-50 tokens/segundo en GPU estándar. Para un chatbot donde la experiencia de usuario depende de la latencia percibida, esto es determinante.

Además, Groq ofrece un tier gratuito con 1.000 requests diarios y 100.000 tokens por minuto — suficiente para un MVP sin costo de infraestructura.

**¿Por qué no GPT-4?**

GPT-4 entregaría respuestas de igual o mayor calidad en muchos casos. La decisión en contra es de arquitectura y costo: GPT-4 Turbo cuesta ~$10/M tokens de input y ~$30/M de output. Con RAG, cada consulta envía al modelo el fragmento recuperado + la pregunta + el historial, lo que puede sumar fácilmente 2.000-3.000 tokens por request. A escala de uso real, el costo sería prohibitivo sin monetización. LLaMA 3.3 70B vía Groq tiene costo cero en el tier gratuito.

---

### 4. llama-text-embed-v2 (NVIDIA) — no text-embedding-ada-002, no OpenAI embeddings

**¿Qué son los embeddings y por qué importa el modelo?**

Un embedding es una representación numérica (vector) del significado semántico de un texto. El mismo modelo debe usarse para vectorizar los documentos al indexar Y para vectorizar la pregunta del usuario al buscar — de lo contrario, los vectores no son comparables.

**¿Por qué llama-text-embed-v2?**

Este modelo de NVIDIA, disponible vía API de Groq, tiene una ventana de contexto de 32.768 tokens y produce embeddings de 4.096 dimensiones. Esto es relevante para documentos legales y técnicos que pueden tener párrafos densos: un modelo con ventana pequeña truncaría los fragmentos al vectorizar.

Comparado con `text-embedding-ada-002` de OpenAI (8.192 tokens, 1.536 dimensiones), llama-text-embed-v2 ofrece mayor capacidad sin costo adicional al estar en el mismo proveedor (Groq) que el modelo de generación.

---

### 5. Vercel — no Netlify, no Railway, no VPS

**¿Por qué Vercel?**

La decisión se entiende desde la arquitectura: el frontend es React y el backend son funciones serverless en `/api`. Vercel es la plataforma que mejor integra este patrón — deployar ambas capas desde el mismo repositorio en un solo `git push`.

Las funciones en `/api` se convierten automáticamente en Vercel Serverless Functions con las variables de entorno disponibles en runtime. Esto evita la necesidad de gestionar un servidor Express o un contenedor Docker para los endpoints de la API.

El tier gratuito de Vercel cubre las necesidades del proyecto: deploys ilimitados, dominio propio gratuito, y 100GB de bandwidth mensual.

---

## 🏗️ Arquitectura RAG

RAG (Retrieval-Augmented Generation) es el patrón arquitectural que permite que el LLM responda con información específica que no estaba en su entrenamiento. El flujo completo:

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE DE INDEXACIÓN (offline, una sola vez)                     │
│                                                                 │
│  Documentos PDF/texto oficiales                                 │
│       ↓                                                         │
│  Limpieza y chunking (fragmentos de ~500 tokens con overlap)    │
│       ↓                                                         │
│  Modelo de embeddings (llama-text-embed-v2)                     │
│       ↓                                                         │
│  Vectores almacenados en Pinecone con metadata (fuente, página) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FASE DE CONSULTA (en tiempo real, por cada pregunta)           │
│                                                                 │
│  Pregunta del usuario                                           │
│       ↓                                                         │
│  Mismo modelo de embeddings vectoriza la pregunta               │
│       ↓                                                         │
│  Búsqueda semántica en Pinecone (top-K fragmentos similares)    │
│       ↓                                                         │
│  Construcción del prompt:                                       │
│  [Sistema] + [Contexto recuperado] + [Historial] + [Pregunta]   │
│       ↓                                                         │
│  LLaMA 3.3 70B vía Groq genera la respuesta                     │
│       ↓                                                         │
│  Respuesta con fuente citada al usuario (streaming)             │
└─────────────────────────────────────────────────────────────────┘
```

**¿Por qué RAG y no fine-tuning?**

El fine-tuning consiste en reentrenar el modelo con la documentación específica. Es costoso (GPU-hours), lento de iterar, y requiere repetirlo cada vez que se actualiza la normativa. RAG, en cambio, actualiza el conocimiento modificando solo la base de datos vectorial — agregar un nuevo decreto es indexarlo, no reentrenar el modelo.

Para documentación regulatoria que se actualiza periódicamente (la ARN emite normas nuevas), RAG es la arquitectura correcta.

---

## 🔄 Pipeline de datos: de documentos oficiales a base de conocimiento indexada

Este es el proceso más crítico del proyecto y el que más impacta la calidad de las respuestas. Se documenta en detalle cada transformación y su justificación.

### El dataset fuente: documentos oficiales con problemas reales

Los 70+ documentos indexados provienen de fuentes oficiales (argentina.gob.ar, ARN, CNEA) y presentan múltiples problemas de calidad:

---

#### Problema 1: PDFs escaneados sin texto seleccionable

Muchas normas ARN antiguas están publicadas como imágenes escaneadas. Un PDF de imagen no tiene texto — solo píxeles.

**Transformación aplicada:** OCR (Reconocimiento Óptico de Caracteres) previo a la indexación. Se procesaron con herramientas de OCR para extraer texto, con revisión manual de los fragmentos con mayor densidad técnica (fórmulas radiológicas, tablas de dosis).

**¿Por qué la revisión manual?** El OCR en documentos técnicos comete errores específicos: confunde `0` con `O`, `1` con `l`, y en terminología nuclear confunde siglas como `CNEA`, `OIEA`, `ARN`. Un error en una sigla puede hacer que el fragmento no sea recuperado ante una búsqueda semántica.

---

#### Problema 2: Estructura de los PDFs no respeta secciones lógicas

Un extractor de texto naïve convierte el PDF a texto plano de forma secuencial. En documentos con múltiples columnas, tablas, y notas al pie, el texto resultante mezcla columnas y rompe el flujo semántico.

**Ejemplo concreto:**

```
❌ Texto extraído sin procesamiento:
"Artículo 3 — Los titulares de licencia 2.3 Dosis equivalente
deberán mantener registros de 20 mSv anuales promediados
las dosis recibidas por..."    en 5 años consecutivos"

✅ Texto después de limpieza estructural:
"Artículo 3 — Los titulares de licencia deberán mantener
registros de las dosis recibidas por..."
```

**Transformación aplicada:** Detección y corrección de columnas entrelazadas mediante análisis de posición de bloques de texto en el PDF. Los elementos flotantes (notas al pie, tablas de referencia) se extraen por separado y se indexan como chunks independientes con metadata que los vincula al documento y sección de origen.

---

#### Problema 3: Chunking — el trade-off entre contexto y precisión

El chunking es la fragmentación del texto en unidades que el modelo de embeddings puede procesar. Es la decisión más técnica del pipeline y tiene impacto directo en la calidad de recuperación.

**¿Por qué no indexar el documento completo?**

Los modelos de embeddings comprimen todo el texto de un fragmento en un único vector. Un documento de 50 páginas comprimido en un vector pierde precisión: el vector captura el "tema general" del documento pero no puede recuperar con precisión una cláusula específica del artículo 12.

**¿Por qué no indexar por oración?**

Una oración aislada pierde el contexto que la hace comprensible. "El límite es de 20 mSv" sin saber que se refiere a dosis anual en trabajadores ocupacionalmente expuestos es información incompleta y potencialmente peligrosa de citar.

**Estrategia elegida: chunks de ~500 tokens con overlap de 100 tokens**

```
Documento:  [===Chunk1===][===Chunk2===][===Chunk3===]
Con overlap: [==Chunk1==][Chunk1|Chunk2][==Chunk2==][Chunk2|Chunk3][==Chunk3==]
```

El overlap garantiza que una idea que cruza el límite entre chunks no quede cortada en ninguno de los dos. 500 tokens es suficiente para incluir el artículo completo con su encabezado en la mayoría de las normas ARN.

---

#### Problema 4: Metadata — hacer el vector trazable

Cada vector almacenado en Pinecone tiene asociada metadata que permite citar la fuente en la respuesta:

```json
{
  "texto": "...(fragmento)...",
  "fuente": "Norma AR 3.1.3",
  "titulo": "Permisos Individuales para Operadores de Reactores de Investigación",
  "seccion": "Capítulo 3 — Requisitos de competencia",
  "pagina": 7,
  "fecha_vigencia": "2021-03-15"
}
```

**¿Por qué es crítica la metadata?**

Sin metadata, el chatbot podría dar una respuesta correcta sin poder decir de dónde viene. En contexto regulatorio, una respuesta sin fuente citada no tiene valor profesional — nadie puede basar una decisión técnica o legal en "el chatbot dijo que...". La cita de fuente es parte de la propuesta de valor del sistema.

---

#### Problema 5: Normalización terminológica

La normativa nuclear argentina usa siglas y términos técnicos con variaciones ortográficas entre documentos de distintas épocas:

| Variante encontrada | Término normalizado |
|--------------------|---------------------|
| `O.I.E.A.` / `OIEA` / `AIEA` | `OIEA` |
| `A.R.N.` / `ARN` / `Autoridad Regulatoria` | `ARN` |
| `C.N.E.A.` / `CNEA` | `CNEA` |
| `mSv` / `mSievert` / `milisievert` | `mSv` |
| `Bq` / `Becquerel` / `becquerel` | `Bq` |

**Transformación aplicada:** Diccionario de normalización aplicado en el pre-procesamiento. Las siglas en formato con puntos (`O.I.E.A.`) se unifican a su forma canónica antes de generar los embeddings. Esto garantiza que búsquedas con cualquier variante encuentren los mismos fragmentos.

---

## 🤔 ¿Por qué este camino y no otro?

### Alternativa descartada: chatbot con fine-tuning del modelo

Reentrenar un LLM con la normativa nuclear argentina hubiera producido un modelo que "conoce" la documentación intrínsecamente. El problema: el fine-tuning de un modelo de 70B parámetros requiere decenas de miles de dólares en cómputo GPU, y debe repetirse cada vez que la ARN emite una norma nueva. Con RAG, agregar un documento nuevo es indexarlo en Pinecone — proceso de minutos, costo de centavos.

### Alternativa descartada: búsqueda por palabras clave (BM25 / Elasticsearch)

Un motor de búsqueda textual clásico encuentra documentos que *contienen* las palabras de la búsqueda. Si el usuario pregunta "¿qué pasa si supero el límite de exposición anual?", una búsqueda textual no encontraría fragmentos que hablen de "consecuencias del incumplimiento de dosis máxima" porque no comparten vocabulario. La búsqueda semántica con embeddings captura la similitud de *significado*, no de palabras.

### Alternativa descartada: un único endpoint de chat con toda la documentación en el contexto

Algunos sistemas simples incluyen todos los documentos directamente en el prompt del LLM como contexto. Esto es técnicamente posible para documentos cortos, pero los 70+ documentos del corpus suman cientos de miles de tokens — un costo por request prohibitivo y una latencia de respuesta de decenas de segundos. El RAG resuelve esto recuperando solo los 3-5 fragmentos más relevantes para cada pregunta específica.

### Alternativa descartada: LangChain / LlamaIndex como framework de orquestación

LangChain y LlamaIndex son frameworks de alto nivel para construir pipelines RAG. Se descartaron por su complejidad de debugging: cuando algo falla en la recuperación o generación, las abstracciones de estos frameworks dificultan identificar en qué capa está el problema. La implementación directa de las llamadas a Pinecone y Groq, con lógica de RAG propia, es más código pero completamente transparente y controlable.

---

## 📁 Estructura del proyecto

```
/
├── src/
│   ├── components/
│   │   ├── Chat.jsx          # Componente principal: historial de mensajes
│   │   ├── Message.jsx       # Renderizado de mensaje individual con fuente citada
│   │   └── Input.jsx         # Input de pregunta con manejo de Enter
│   ├── hooks/
│   │   └── useChat.js        # Lógica de estado del chat y llamadas a /api/chat
│   ├── App.jsx
│   └── main.jsx
│
├── api/
│   └── chat.js               # Serverless function: RAG pipeline completo
│                             # 1. Vectoriza la pregunta
│                             # 2. Busca en Pinecone
│                             # 3. Construye el prompt con contexto
│                             # 4. Llama a Groq y hace streaming de la respuesta
│
├── index.html
├── vite.config.js            # Proxy /api → Vercel functions en desarrollo local
├── package.json
└── README.md
```

**¿Por qué toda la lógica RAG en una serverless function?**

La serverless function en `/api/chat.js` mantiene las API keys del lado del servidor — nunca expuestas al cliente. Si la lógica de llamada a Groq o Pinecone estuviera en el frontend, las keys serían visibles en el bundle JavaScript. Esto es un requisito de seguridad básico para cualquier sistema que use APIs de pago.

---

## 🔐 Base de conocimiento

El asistente tiene acceso a más de 70 documentos oficiales indexados:

- **Ley 24804** — Ley Nacional de la Actividad Nuclear
- **Normas ARN** — Serie completa (AR 0.x.x a AR 10.x.x)
- **Decretos reglamentarios** del Poder Ejecutivo
- **Tratados internacionales**: TNP, Tratado de Tlatelolco, CTBT
- **Documentación de CNEA e INVAP**
- **Acuerdos de salvaguardias OIEA / ABACC**

---

## ⚙️ Variables de entorno

```env
GROQ_API_KEY=          # API key de Groq (inferencia LLaMA + embeddings)
PINECONE_API_KEY=       # API key de Pinecone (base de datos vectorial)
```

Estas variables deben configurarse en el panel de Vercel (Settings → Environment Variables) y en un archivo `.env.local` para desarrollo local. **Nunca deben commitearse al repositorio.**

---

## 🛠️ Instalación local

```bash
git clone https://github.com/coderhouse2025-droid/Chatbot.git
cd Chatbot
npm install
```
---

## 🧩 Roadmap

| Prioridad | Mejora | Justificación |
|-----------|--------|---------------|
| Alta | 🔄 Pipeline de actualización automática | La ARN publica normas nuevas; el índice debe actualizarse sin intervención manual |
| Alta | 📊 Logging de consultas y evaluación de relevancia | Para medir si los fragmentos recuperados son los correctos y mejorar el chunking |
| Media | 🌐 Soporte multilingüe (inglés / portugués) | OIEA y ABACC operan en inglés; CNEA colabora con Brasil |
| Media | 📎 Cita con número de artículo exacto | Hoy se cita el documento y página; citar artículo específico requiere parsing estructurado del corpus |
| Baja | 🔐 Panel de administración para indexar documentos nuevos | Interfaz para agregar normas sin tocar código |

---

## 👨‍💻 Autor

**Juan Manuel Orellana**

---

## 📄 Licencia

Proyecto de uso académico e investigación. Documentación fuente disponible en [argentina.gob.ar](https://www.argentina.gob.ar) y [arn.gob.ar](https://www.arn.gob.ar).
