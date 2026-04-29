import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Sos un asistente especializado en el marco normativo nuclear argentino. Respondés consultas con precisión técnica y jurídica en español rioplatense.

Tus áreas de conocimiento incluyen:
- Ley 24804 "Ley Nacional de la Actividad Nuclear" y sus decretos reglamentarios
- La Autoridad Regulatoria Nuclear (ARN): funciones, estructura orgánica, competencias regulatorias
- Normas ARN (serie de regulaciones técnicas emitidas por la ARN en distintas áreas)
- Protección radiológica: límites de dosis para trabajadores y público, zonas de exclusión
- Licencias y habilitaciones para instalaciones nucleares, radiactivas y para personal
- Gestión, tratamiento y disposición de residuos radiactivos
- Instalaciones nucleares: reactores Atucha I, Atucha II, Embalse, reactores de investigación
- Transporte de materiales radiactivos (normativa ARN, regulaciones OIEA/TS-R-1)
- Salvaguardias nucleares: ABACC, OIEA, Acuerdo Cuadripartito
- Tratados internacionales: TNP, Tratado de Tlatelolco, CTBT, NPT
- CNEA (Comisión Nacional de Energía Atómica): rol histórico, misión, proyectos
- INVAP: diseño, construcción y exportación de reactores nucleares
- Seguridad nuclear, física y radiológica
- Planes de emergencia nuclear y radiológica

Reglas:
1. Siempre respondé en español rioplatense
2. Citá números de ley, decreto o norma ARN cuando los conozcas con certeza
3. Si un dato es incierto o podría haber cambiado, indicalo explícitamente
4. Estructurá respuestas largas con subtítulos usando ###
5. Para respuestas cortas no uses estructura de títulos innecesaria
6. Sé preciso pero accesible; explicá términos técnicos cuando aparezcan`;

const TOPICS = [
  { label: "Marco legal", sub: "Leyes y Decretos principales", q: "¿Cuáles son las principales leyes que regulan la actividad nuclear en Argentina?" },
  { label: "Institución", sub: "Rol y funciones de la ARN", q: "¿Qué es la ARN, cuáles son sus funciones y cómo está estructurada?" },
  { label: "Licencias", sub: "Licencias y habilitaciones", q: "¿Cuáles son los requisitos para obtener una licencia nuclear en Argentina?" },
  { label: "Residuos", sub: "Gestión de residuos radiactivos", q: "¿Cómo se clasifican y gestionan los residuos radiactivos según la normativa argentina?" },
  { label: "Protección", sub: "Protección radiológica", q: "¿Qué establece la normativa sobre protección radiológica en Argentina?" },
  { label: "Instalaciones", sub: "Instalaciones nucleares", q: "¿Cuáles son las normas aplicables a instalaciones nucleares en Argentina?" },
  { label: "Internacional", sub: "Tratados y salvaguardias", q: "¿Qué tratados internacionales sobre no proliferación nuclear ha suscripto Argentina?" },
  { label: "Transporte", sub: "Transporte de material radiactivo", q: "¿Cómo se regula el transporte de materiales radiactivos en Argentina?" },
];

const CHIPS = [
  { text: "Ley 24804", q: "¿Qué establece la Ley 24804 de Actividad Nuclear?" },
  { text: "Límites de dosis", q: "¿Cuáles son los límites de dosis de radiación permitidos en Argentina?" },
  { text: "CNEA e INVAP", q: "¿Qué es la CNEA y cuál es su relación con la ARN?" },
  { text: "Tlatelolco", q: "¿Qué es el Tratado de Tlatelolco y cómo afecta a Argentina?" },
  { text: "Salvaguardias OIEA", q: "¿Cómo funciona el sistema de salvaguardias nucleares en Argentina con el OIEA?" },
];

function AtomIcon({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="19" cy="19" r="4.5" fill="#00c8e8" />
      <ellipse cx="19" cy="19" rx="17" ry="6.5" stroke="#00c8e8" strokeWidth="1.2" fill="none" transform="rotate(-35 19 19)" opacity=".45" />
      <ellipse cx="19" cy="19" rx="17" ry="6.5" stroke="#00c8e8" strokeWidth="1.2" fill="none" transform="rotate(35 19 19)" opacity=".45" />
      <ellipse cx="19" cy="19" rx="17" ry="6.5" stroke="#e8c84a" strokeWidth="1.1" fill="none" opacity=".3" />
      <circle cx="19" cy="12" r="2.2" fill="#e8c84a" opacity=".95" />
      <circle cx="27.5" cy="24" r="2.2" fill="#00c8e8" opacity=".95" />
      <circle cx="10.5" cy="24" r="2.2" fill="#00c8e8" opacity=".95" />
    </svg>
  );
}

function md2html(raw) {
  let t = raw
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  t = t
    .replace(/^###\s+(.+)$/gm, '<h3 style="color:#00c8e8;font-size:.78rem;font-weight:500;text-transform:uppercase;letter-spacing:.07em;margin:1rem 0 .35rem;font-family:DM Sans,sans-serif">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h3 style="color:#00c8e8;font-size:.78rem;font-weight:500;text-transform:uppercase;letter-spacing:.07em;margin:1rem 0 .35rem;font-family:DM Sans,sans-serif">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,200,232,.1);border:1px solid rgba(0,200,232,.2);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.82em;color:#00c8e8">$1</code>')
    .replace(/^[-*•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>[^\n]+\n?)+)/g, '<ul style="padding-left:1.25rem;margin:.45rem 0">$1</ul>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  t = "<p>" + t + "</p>";
  t = t.replace(/<p>(<h3)/g, "$1").replace(/(<\/h3>)<\/p>/g, "$1");
  t = t.replace(/<p>\s*<\/p>/g, "");
  return t;
}

function getTime() {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const msgsRef = useRef(null);
  const inpRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  const sendMsg = async (text) => {
    const t = (text || input).trim();
    if (!t || busy) return;
    setInput("");

    const userMsg = { role: "user", text: t, time: getTime() };
    const newHistory = [...history, { role: "user", content: t }];
    setMessages(prev => [...prev.filter(m => m.id !== "welcome"), userMsg]);
    setHistory(newHistory);
    setBusy(true);

    try {
      // ✅ Llama al proxy seguro en lugar de directamente a Anthropic
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sin respuesta.";
      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setMessages(prev => [...prev, { role: "assistant", html: md2html(reply), time: getTime() }]);
    } catch (e) {
      setHistory(prev => prev.slice(0, -1));
      setMessages(prev => [...prev, {
        role: "assistant",
        html: `<span style="color:#ff9090">⚠ ${e.message.replace(/</g,"&lt;")}</span>`,
        time: getTime(),
        isError: true,
      }]);
    } finally {
      setBusy(false);
      setTimeout(() => inpRef.current?.focus(), 50);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
    setSidebarOpen(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const showWelcome = messages.length === 0;

  return (
    <div style={{
      background: "#080f1e", color: "#eef4f8", fontFamily: "'DM Sans', sans-serif",
      fontWeight: 300, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontSize: 15,
    }}>
      {/* HEADER */}
      <header style={{
        background: "#0f1e36", borderBottom: "1px solid rgba(0,200,232,.18)",
        padding: "0 1.75rem", height: 68, display: "flex", alignItems: "center",
        gap: "1rem", flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
      }}>
        <AtomIcon />
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", fontWeight: 400, lineHeight: 1.2 }}>
          Normativa Nuclear Argentina
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "rgba(0,200,232,.08)", border: "1px solid rgba(0,200,232,.18)", borderRadius: 20, padding: "4px 12px", fontSize: ".7rem", color: "#00c8e8", letterSpacing: ".05em" }}>
          <span style={{ width: 7, height: 7, background: "#00c8e8", borderRadius: "50%", display: "inline-block", animation: "blink 2s infinite" }} />
          IA Activa
        </div>
        {/* Mobile sidebar toggle */}
        <button onClick={() => setSidebarOpen(v => !v)} style={{ display: "none", background: "transparent", border: "1px solid rgba(0,200,232,.18)", borderRadius: 6, color: "#00c8e8", padding: "6px 10px", cursor: "pointer", fontSize: ".7rem", marginLeft: 8 }} className="mob-menu">
          ☰
        </button>
      </header>

      {/* LAYOUT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 68px)" }}>
        {/* SIDEBAR */}
        <aside style={{
          width: 250, flexShrink: 0, background: "#0f1e36",
          borderRight: "1px solid rgba(238,244,248,.07)",
          overflowY: "auto", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "1.1rem 1rem", borderBottom: "1px solid rgba(238,244,248,.07)" }}>
            <div style={{ fontSize: ".62rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#0090ab", marginBottom: ".7rem", fontWeight: 500 }}>
              Temas frecuentes
            </div>
            {TOPICS.map((t) => (
              <button key={t.label} onClick={() => sendMsg(t.q)} style={{
                width: "100%", background: "transparent", border: "1px solid rgba(238,244,248,.07)",
                borderRadius: 6, color: "rgba(238,244,248,.65)", fontFamily: "'DM Sans', sans-serif",
                fontSize: ".79rem", fontWeight: 300, padding: "8px 10px", textAlign: "left",
                cursor: "pointer", marginBottom: 5, lineHeight: 1.35, transition: "all .18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,232,.07)"; e.currentTarget.style.borderColor = "#0090ab"; e.currentTarget.style.color = "#eef4f8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(238,244,248,.07)"; e.currentTarget.style.color = "rgba(238,244,248,.65)"; }}
              >
                <small style={{ display: "block", fontSize: ".61rem", color: "#00c8e8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2, fontWeight: 500 }}>{t.label}</small>
                {t.sub}
              </button>
            ))}
          </div>

          <div style={{ padding: "1.1rem 1rem", borderBottom: "1px solid rgba(238,244,248,.07)" }}>
            <div style={{ fontSize: ".62rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#0090ab", marginBottom: ".7rem", fontWeight: 500 }}>
              Fuente documental
            </div>
            <div style={{ background: "rgba(232,200,74,.07)", border: "1px solid rgba(232,200,74,.2)", borderRadius: 6, padding: "10px 11px", fontSize: ".75rem", color: "rgba(238,244,248,.65)", lineHeight: 1.6 }}>
              Documentación oficial en<br />
              <a href="https://drive.google.com/drive/folders/1dsVfa12Qm86_22WZEjK4xI_m3n2Q4Bmx" target="_blank" rel="noreferrer" style={{ color: "#e8c84a", textDecoration: "none", fontWeight: 500 }}>
                Google Drive → Carpeta ARN ↗
              </a>
              <br /><br />
              El asistente responde sobre el marco regulatorio de la ARN, legislación nuclear y normas técnicas vigentes en Argentina.
            </div>
          </div>

          <div style={{ padding: "1.1rem 1rem" }}>
            <div style={{ fontSize: ".62rem", letterSpacing: ".13em", textTransform: "uppercase", color: "#0090ab", marginBottom: ".7rem", fontWeight: 500 }}>
              Acciones
            </div>
            <button onClick={clearChat} style={{ width: "100%", background: "transparent", border: "1px solid rgba(238,244,248,.07)", borderRadius: 6, color: "rgba(238,244,248,.65)", fontFamily: "'DM Sans', sans-serif", fontSize: ".79rem", fontWeight: 300, padding: "8px 10px", textAlign: "left", cursor: "pointer", transition: "all .18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,232,.07)"; e.currentTarget.style.color = "#eef4f8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(238,244,248,.65)"; }}>
              🗑 &nbsp;Limpiar conversación
            </button>
          </div>
        </aside>

        {/* CHAT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "2rem 2.25rem 1rem", display: "flex", flexDirection: "column", gap: "1.4rem", scrollBehavior: "smooth" }}>

            {/* WELCOME */}
            {showWelcome && (
              <div style={{ maxWidth: 580, margin: "0.5rem auto", textAlign: "center" }}>
                <div style={{ margin: "0 auto 1.25rem", width: 70, height: 70 }}>
                  <svg viewBox="0 0 70 70" fill="none" width="70" height="70">
                    <circle cx="35" cy="35" r="7" fill="#00c8e8" />
                    <ellipse cx="35" cy="35" rx="31" ry="12" stroke="#00c8e8" strokeWidth="1.4" fill="none" transform="rotate(-40 35 35)" opacity=".38" />
                    <ellipse cx="35" cy="35" rx="31" ry="12" stroke="#00c8e8" strokeWidth="1.4" fill="none" transform="rotate(40 35 35)" opacity=".38" />
                    <ellipse cx="35" cy="35" rx="31" ry="12" stroke="#e8c84a" strokeWidth="1.3" fill="none" opacity=".28" />
                    <circle cx="35" cy="23" r="4" fill="#e8c84a" opacity=".9" />
                    <circle cx="52" cy="42" r="4" fill="#00c8e8" opacity=".9" />
                    <circle cx="18" cy="42" r="4" fill="#00c8e8" opacity=".9" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.65rem", fontWeight: 400, lineHeight: 1.3, marginBottom: ".65rem" }}>
                  Consultá el <em style={{ color: "#00c8e8", fontStyle: "italic" }}>Marco Normativo</em><br />Nuclear Argentino
                </h2>
                <p style={{ fontSize: ".85rem", color: "rgba(238,244,248,.65)", lineHeight: 1.75, marginBottom: "1.4rem" }}>
                  Hacé preguntas sobre legislación nuclear, normas ARN,<br />protección radiológica, licencias, residuos y tratados internacionales.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
                  {CHIPS.map(c => (
                    <button key={c.text} onClick={() => sendMsg(c.q)} style={{ background: "rgba(238,244,248,.1)", border: "1px solid rgba(0,200,232,.18)", borderRadius: 20, padding: "5px 14px", fontSize: ".76rem", color: "rgba(238,244,248,.65)", cursor: "pointer", transition: "all .18s", fontFamily: "'DM Sans', sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,232,.07)"; e.currentTarget.style.borderColor = "#00c8e8"; e.currentTarget.style.color = "#eef4f8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(238,244,248,.1)"; e.currentTarget.style.borderColor = "rgba(0,200,232,.18)"; e.currentTarget.style.color = "rgba(238,244,248,.65)"; }}>
                      {c.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", animation: "fadeUp .28s ease" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: msg.role === "user" ? ".67rem" : ".6rem", fontWeight: 500, marginTop: 2, background: msg.role === "user" ? "#1c3056" : "#0090ab", border: msg.role === "user" ? "1px solid rgba(0,200,232,.18)" : "none", color: "#eef4f8", letterSpacing: msg.role === "assistant" ? ".03em" : 0 }}>
                  {msg.role === "user" ? "Vos" : <AtomIcon size={28} />}
                </div>
                <div>
                  <div style={{ maxWidth: "80%", padding: "11px 15px", borderRadius: 10, fontSize: ".87rem", lineHeight: 1.72, background: msg.role === "user" ? "#1c3056" : "#152540", border: msg.role === "user" ? "1px solid rgba(0,200,232,.18)" : "1px solid rgba(238,244,248,.07)", borderTopRightRadius: msg.role === "user" ? 3 : 10, borderTopLeftRadius: msg.role === "assistant" ? 3 : 10, color: msg.role === "user" ? "#eef4f8" : "rgba(238,244,248,.65)", whiteSpace: msg.role === "user" ? "pre-wrap" : undefined }}>
                    {msg.role === "user"
                      ? msg.text
                      : <span dangerouslySetInnerHTML={{ __html: msg.html }} />}
                  </div>
                  <div style={{ fontSize: ".63rem", color: "rgba(238,244,248,.28)", marginTop: 3, textAlign: msg.role === "user" ? "right" : "left" }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {/* TYPING */}
            {busy && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 30, height: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}><AtomIcon size={28} /></div>
                <div style={{ background: "#152540", border: "1px solid rgba(238,244,248,.07)", borderRadius: 10, borderTopLeftRadius: 3, padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {[0, 0.18, 0.36].map((delay, i) => (
                      <span key={i} style={{ width: 7, height: 7, background: "#00c8e8", borderRadius: "50%", opacity: .6, display: "inline-block", animation: `jump 1.1s ${delay}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding: ".9rem 2.25rem 1.25rem", background: "#080f1e", borderTop: "1px solid rgba(238,244,248,.07)" }}>
            <div style={{ display: "flex", gap: 8, background: "#152540", border: "1px solid rgba(0,200,232,.18)", borderRadius: 10, padding: "7px 7px 7px 15px" }}>
              <textarea
                ref={inpRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Consultá sobre normativa nuclear argentina..."
                rows={1}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#eef4f8", fontFamily: "'DM Sans', sans-serif", fontSize: ".87rem", fontWeight: 300, resize: "none", height: 42, lineHeight: 1.5, padding: "6px 0" }}
              />
              <button
                onClick={() => sendMsg()}
                disabled={busy || !input.trim()}
                style={{ width: 38, height: 38, background: busy || !input.trim() ? "rgba(0,200,232,.2)" : "#00c8e8", border: "none", borderRadius: 6, cursor: busy || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end", transition: "all .18s" }}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M15.5 8.5L1.5 1.5l3.2 7-3.2 7 14-7z" fill="#08101e" stroke="#08101e" strokeWidth=".5" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div style={{ fontSize: ".66rem", color: "rgba(238,244,248,.22)", textAlign: "center", marginTop: 5 }}>
              Enter para enviar &nbsp;·&nbsp; Shift+Enter para nueva línea
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:none} }
        @keyframes jump { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-6px);opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,232,.18); border-radius: 3px; }
        textarea::placeholder { color: rgba(238,244,248,.28) !important; }
        p { margin-bottom: .55rem; }
        p:last-child { margin-bottom: 0; }
        strong { color: #eef4f8; font-weight: 500; }
      `}</style>
    </div>
  );
}
