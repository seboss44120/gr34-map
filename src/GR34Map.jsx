import { useState, useRef } from "react";

const W = 900;
const H = 640;

const SEGMENTS = [
  { id:"s1",  name:"Mont-Saint-Michel → Saint-Malo",                   km:"88 km",    kmVal: 88,
    pts:[[822,158],[778,138],[745,152]] },
  { id:"s2",  name:"Saint-Malo → Cap Fréhel",                          km:"~87 km",   kmVal: 87,
    pts:[[745,152],[712,145],[683,129],[650,147]] },
  { id:"s3",  name:"Cap Fréhel → Saint-Brieuc",                        km:"~86 km",   kmVal: 86,
    pts:[[650,147],[622,160],[588,193]] },
  { id:"s4",  name:"Saint-Brieuc → Paimpol",                           km:"~100 km",  kmVal:100,
    pts:[[588,193],[564,155],[510,103]] },
  { id:"s5",  name:"Paimpol → Perros-Guirec  (Côte de Granit Rose)",   km:"~112 km",  kmVal:112,
    pts:[[510,103],[460,107],[420,96]] },
  { id:"s6",  name:"Perros-Guirec → Morlaix",                          km:"~126 km",  kmVal:126,
    pts:[[420,96],[395,112],[370,145],[305,175]] },
  { id:"s7",  name:"Morlaix → Roscoff",                                km:"49 km",    kmVal: 49,
    pts:[[305,175],[286,147],[268,130]] },
  { id:"s8",  name:"Roscoff → Le Conquet  (Pays des Abers)",           km:"~200 km",  kmVal:200,
    pts:[[268,130],[213,147],[165,163],[88,242]] },
  { id:"s9",  name:"Le Conquet → Camaret-sur-Mer  (Rade de Brest)",    km:"~130 km",  kmVal:130,
    pts:[[88,242],[88,261],[112,263],[162,268],[208,263],[160,270],[128,268]] },
  { id:"s10", name:"Camaret → Douarnenez  (Presqu'île de Crozon)",     km:"~150 km",  kmVal:150,
    pts:[[128,268],[110,288],[133,310],[154,300],[192,330]] },
  { id:"s11", name:"Douarnenez → Quimper  (via Pointe du Raz)",        km:"~170 km",  kmVal:170,
    pts:[[192,330],[136,356],[96,344],[125,388],[162,395],[243,368]] },
  { id:"s12", name:"Quimper → Lorient",                                km:"~110 km",  kmVal:110,
    pts:[[243,368],[236,407],[283,415],[323,420],[408,443]] },
  { id:"s13", name:"Lorient → Vannes  (Golfe du Morbihan)",            km:"~324 km",  kmVal:324,
    pts:[[408,443],[413,494],[453,530],[468,494],[490,470],[550,467]] },
  { id:"s14", name:"Vannes → La Baule  (Pénestin, Guérande, Croisic)", km:"~359 km",  kmVal:359,
    pts:[[550,467],[545,505],[580,537],[580,565],[595,582],[633,589]] },
  { id:"s15", name:"La Baule → Saint-Nazaire",                         km:"~35 km",   kmVal: 35,
    pts:[[633,589],[653,594],[673,589]] },
];

const DETOURS = [
  { id:"brehat", name:"Île de Bréhat",  from:[510,103], to:[510,67],  km:"~13 km à pied", kmVal:13 },
  { id:"batz",   name:"Île de Batz",    from:[268,130], to:[254,108], km:"~12 km à pied", kmVal:12 },
];

const ALL_ITEMS  = [...SEGMENTS, ...DETOURS];
const TOTAL_KM   = ALL_ITEMS.reduce((s,x) => s + x.kmVal, 0);

const LABELS = [
  [822,158,"Mont-Saint-Michel", 16,"end",   true ],
  [745,152,"Saint-Malo",       -12,"middle",true ],
  [683,129,"Cap Fréhel",       -10,"middle",false],
  [588,193,"Saint-Brieuc",      15,"middle",true ],
  [510,103,"Paimpol",          -12,"middle",true ],
  [460,107,"Tréguier",          15,"middle",false],
  [420, 96,"Perros-Guirec",    -12,"middle",true ],
  [370,145,"Lannion",           15,"middle",false],
  [305,175,"Morlaix",           15,"middle",true ],
  [268,130,"Roscoff",          -12,"start", true ],
  [213,147,"Brignogan",         15,"middle",false],
  [ 88,242,"Le Conquet",        15,"start", true ],
  [128,268,"Camaret-sur-Mer",  -12,"end",   true ],
  [110,288,"Pte de Pen-Hir",    15,"end",   false],
  [ 96,344,"Pte du Raz",       -12,"end",   true ],
  [192,330,"Douarnenez",       -12,"start", true ],
  [243,368,"Quimper",          -12,"start", true ],
  [283,415,"Concarneau",        15,"middle",false],
  [408,443,"Lorient",           15,"start", true ],
  [453,530,"Quiberon",          15,"middle",false],
  [550,467,"Vannes",           -12,"middle",true ],
  [580,565,"Guérande",          15,"start", false],
  [633,589,"La Baule",          15,"middle",true ],
  [673,589,"Saint-Nazaire",    -12,"middle",true ],
];

const OCEAN_LABELS = [
  [500, 62,"LA MANCHE"],
  [ 60,430,"A T L A N T I Q U E"],
];

const C = { done:"#16a34a", todo:"#ea580c", default:"#94a3b8", island:"#2563eb" };
const stateIcon = s => s==="done" ? "✅" : s==="todo" ? "🎯" : "◯";

/* ── Boîte stat ── */
function StatBox({ color, icon, label, km, pct }) {
  return (
    <div style={{
      flex:"1 1 110px",
      background:"white",
      border:`1.5px solid ${color}33`,
      borderLeft:`4px solid ${color}`,
      borderRadius:10,
      padding:"9px 10px",
      textAlign:"center",
      boxShadow:"0 1px 4px rgba(15,45,78,0.07)",
    }}>
      <div style={{ fontSize:20, lineHeight:1 }}>{icon}</div>
      <div style={{
        fontSize:19, fontWeight:"bold", color,
        marginTop:4, fontFamily:"'Georgia',serif",
        letterSpacing:-0.5,
      }}>
        {km.toLocaleString("fr-FR")} <span style={{fontSize:12}}>km</span>
      </div>
      <div style={{ fontSize:10.5, color:"#64748b", marginTop:2, fontFamily:"'Segoe UI',sans-serif" }}>
        {label}
        {pct > 0 && pct < 100 && (
          <span style={{ color, marginLeft:4, fontWeight:"bold" }}>({pct}%)</span>
        )}
      </div>
    </div>
  );
}

/* ══════════════ ROADBOOK ══════════════ */

const EMPTY_ENTRY = { id:null, date:"", depart:"", arrivee:"", km:"", duree:"", notes:"", photos:[] };

function formatDate(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function RoadbookEntry({ entry, onEdit, onDelete, onView }) {
  return (
    <div
      onClick={() => onView(entry)}
      style={{
        background:"white",
        borderRadius:12,
        padding:"14px 16px",
        boxShadow:"0 2px 10px rgba(15,45,78,0.09)",
        border:"1px solid #dde8f0",
        cursor:"pointer",
        transition:"box-shadow 0.15s, transform 0.1s",
        display:"flex",
        gap:12,
        alignItems:"flex-start",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 18px rgba(15,45,78,0.18)"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="0 2px 10px rgba(15,45,78,0.09)"; e.currentTarget.style.transform="none"; }}
    >
      {/* Thumbnail photo */}
      <div style={{
        width:64, height:64, borderRadius:8, flexShrink:0,
        background: entry.photos && entry.photos.length > 0 ? "transparent" : "#e8eff8",
        border:"1.5px solid #dde8f0",
        overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {entry.photos && entry.photos.length > 0
          ? <img src={entry.photos[0]} alt="étape" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:24}}>📍</span>
        }
      </div>

      {/* Contenu */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div>
            <div style={{ fontSize:11, color:"#5a7a9a", fontFamily:"'Segoe UI',sans-serif", marginBottom:2 }}>
              📅 {formatDate(entry.date)}
              {entry.km && <span style={{marginLeft:8}}>· 🥾 {entry.km} km</span>}
              {entry.duree && <span style={{marginLeft:8}}>· ⏱ {entry.duree}</span>}
            </div>
            <div style={{ fontSize:14, fontWeight:"bold", color:"#0f2d4e", fontFamily:"'Georgia',serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {entry.depart || "—"} → {entry.arrivee || "—"}
            </div>
          </div>
          <div style={{ display:"flex", gap:4, flexShrink:0 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(entry)} style={{
              padding:"4px 8px", borderRadius:6, border:"1px solid #dde8f0",
              background:"#f8fbfe", cursor:"pointer", fontSize:12, color:"#3d5a78",
            }}>✏️</button>
            <button onClick={() => onDelete(entry.id)} style={{
              padding:"4px 8px", borderRadius:6, border:"1px solid #fecdd3",
              background:"#fff1f2", cursor:"pointer", fontSize:12, color:"#be123c",
            }}>🗑</button>
          </div>
        </div>
        {entry.notes && (
          <div style={{ fontSize:12, color:"#475569", marginTop:5, fontFamily:"'Segoe UI',sans-serif",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {entry.notes}
          </div>
        )}
        {entry.photos && entry.photos.length > 1 && (
          <div style={{ fontSize:10.5, color:"#5a7a9a", marginTop:4 }}>📷 {entry.photos.length} photos</div>
        )}
      </div>
    </div>
  );
}

function EntryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_ENTRY, ...initial });
  const fileRef = useRef();

  const set = (k,v) => setForm(p => ({ ...p, [k]:v }));

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(p => ({ ...p, photos: [...(p.photos||[]), ev.target.result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (i) => {
    setForm(p => ({ ...p, photos: p.photos.filter((_,idx) => idx !== i) }));
  };

  const labelStyle = { fontSize:12, fontWeight:"bold", color:"#0f2d4e", fontFamily:"'Segoe UI',sans-serif", marginBottom:4, display:"block" };
  const inputStyle = {
    width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #dde8f0",
    fontSize:13, fontFamily:"'Segoe UI',sans-serif", color:"#1e293f",
    background:"#f8fbfe", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{
      background:"white", borderRadius:14, padding:"20px 22px",
      boxShadow:"0 4px 24px rgba(15,45,78,0.14)", border:"1px solid #dde8f0",
      marginBottom:16,
    }}>
      <h3 style={{ margin:"0 0 16px", fontSize:16, color:"#0f2d4e", fontFamily:"'Georgia',serif" }}>
        {form.id ? "✏️ Modifier l'étape" : "➕ Nouvelle étape"}
      </h3>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <label style={labelStyle}>📅 Date</label>
          <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={labelStyle}>🥾 Distance (km)</label>
          <input type="text" placeholder="ex: 18" value={form.km} onChange={e=>set("km",e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={labelStyle}>📍 Départ</label>
          <input type="text" placeholder="ex: Saint-Malo" value={form.depart} onChange={e=>set("depart",e.target.value)} style={inputStyle}/>
        </div>
        <div>
          <label style={labelStyle}>🏁 Arrivée</label>
          <input type="text" placeholder="ex: Cap Fréhel" value={form.arrivee} onChange={e=>set("arrivee",e.target.value)} style={inputStyle}/>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={labelStyle}>⏱ Durée</label>
        <input type="text" placeholder="ex: 6h30" value={form.duree} onChange={e=>set("duree",e.target.value)} style={inputStyle}/>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>📝 Notes & impressions</label>
        <textarea
          placeholder="Météo, difficultés, coups de cœur, hébergement..."
          value={form.notes}
          onChange={e=>set("notes",e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize:"vertical", lineHeight:1.5 }}
        />
      </div>

      {/* Photos */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>📷 Photos</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
          {(form.photos||[]).map((src,i) => (
            <div key={i} style={{ position:"relative", width:80, height:80 }}>
              <img src={src} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1.5px solid #dde8f0" }}/>
              <button
                onClick={() => removePhoto(i)}
                style={{
                  position:"absolute", top:-6, right:-6, width:20, height:20,
                  borderRadius:"50%", border:"none", background:"#be123c",
                  color:"white", fontSize:11, cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", lineHeight:1,
                }}
              >×</button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current.click()}
            style={{
              width:80, height:80, borderRadius:8, border:"2px dashed #a8c4dc",
              background:"#f0f7ff", cursor:"pointer", fontSize:22, color:"#5a7a9a",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >+</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display:"none" }}/>
        <div style={{ fontSize:10.5, color:"#94a3b8", fontFamily:"'Segoe UI',sans-serif" }}>
          Photos stockées localement dans votre navigateur (aucun serveur)
        </div>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{
          padding:"8px 18px", borderRadius:8, border:"1.5px solid #dde8f0",
          background:"#f8fbfe", cursor:"pointer", fontSize:13, color:"#3d5a78",
          fontFamily:"'Segoe UI',sans-serif",
        }}>Annuler</button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.date && !form.depart && !form.arrivee}
          style={{
            padding:"8px 22px", borderRadius:8, border:"none",
            background:"#0f2d4e", cursor:"pointer", fontSize:13, color:"white",
            fontFamily:"'Segoe UI',sans-serif", fontWeight:"bold",
          }}
        >💾 Enregistrer</button>
      </div>
    </div>
  );
}

function EntryDetail({ entry, onClose, onEdit }) {
  return (
    <div style={{
      background:"white", borderRadius:14, padding:"20px 22px",
      boxShadow:"0 4px 24px rgba(15,45,78,0.14)", border:"1px solid #dde8f0",
      marginBottom:16,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, color:"#5a7a9a", fontFamily:"'Segoe UI',sans-serif", marginBottom:4 }}>
            📅 {formatDate(entry.date)}
            {entry.km && <span style={{marginLeft:10}}>🥾 {entry.km} km</span>}
            {entry.duree && <span style={{marginLeft:10}}>⏱ {entry.duree}</span>}
          </div>
          <h2 style={{ margin:0, fontSize:20, color:"#0f2d4e", fontFamily:"'Georgia',serif" }}>
            {entry.depart || "—"} → {entry.arrivee || "—"}
          </h2>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onEdit(entry)} style={{
            padding:"6px 12px", borderRadius:8, border:"1.5px solid #dde8f0",
            background:"#f8fbfe", cursor:"pointer", fontSize:13, color:"#3d5a78",
          }}>✏️ Modifier</button>
          <button onClick={onClose} style={{
            padding:"6px 12px", borderRadius:8, border:"1.5px solid #dde8f0",
            background:"#f8fbfe", cursor:"pointer", fontSize:13, color:"#3d5a78",
          }}>✕ Fermer</button>
        </div>
      </div>

      {entry.notes && (
        <div style={{
          background:"#f8fbfe", borderRadius:10, padding:"12px 14px",
          border:"1px solid #e2eaf4", marginBottom:16,
          fontSize:14, color:"#334155", fontFamily:"'Segoe UI',sans-serif",
          lineHeight:1.7, whiteSpace:"pre-wrap",
        }}>
          {entry.notes}
        </div>
      )}

      {entry.photos && entry.photos.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:"bold", color:"#0f2d4e", marginBottom:8, fontFamily:"'Segoe UI',sans-serif" }}>
            📷 Photos ({entry.photos.length})
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {entry.photos.map((src,i) => (
              <img key={i} src={src} alt={`photo ${i+1}`} style={{
                height:160, borderRadius:10, border:"1.5px solid #dde8f0",
                objectFit:"cover", cursor:"pointer",
              }}
              onClick={() => window.open(src, "_blank")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Roadbook() {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem("gr34-roadbook");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });
  const [mode, setMode] = useState("list"); // list | form | detail
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const save = (updated) => {
    try { localStorage.setItem("gr34-roadbook", JSON.stringify(updated)); } catch(e) {}
    setEntries(updated);
  };

  const handleSave = (form) => {
    if (!form.id) {
      const newEntry = { ...form, id: Date.now().toString() };
      const updated = [...entries, newEntry].sort((a,b) => (a.date||"").localeCompare(b.date||""));
      save(updated);
    } else {
      const updated = entries.map(e => e.id === form.id ? form : e)
        .sort((a,b) => (a.date||"").localeCompare(b.date||""));
      save(updated);
    }
    setMode("list");
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm("Supprimer cette étape ?")) return;
    const updated = entries.filter(e => e.id !== id);
    save(updated);
    if (viewing && viewing.id === id) { setViewing(null); setMode("list"); }
  };

  const handleEdit = (entry) => {
    setEditing(entry);
    setMode("form");
    setViewing(null);
  };

  const handleView = (entry) => {
    setViewing(entry);
    setMode("detail");
  };

  const handleNew = () => {
    setEditing(null);
    setMode("form");
    setViewing(null);
  };

  const totalKmMarche = entries.reduce((s,e) => s + (parseFloat(e.km)||0), 0);

  return (
    <div>
      {/* Header Roadbook */}
      <div style={{
        background:"white", borderRadius:14, padding:"16px 20px",
        boxShadow:"0 2px 10px rgba(15,45,78,0.10)", border:"1px solid #dde8f0",
        marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:3, color:"#5a7a9a", textTransform:"uppercase", fontFamily:"'Segoe UI',sans-serif" }}>
            Mon carnet de route
          </div>
          <div style={{ fontSize:18, fontWeight:"bold", color:"#0f2d4e", fontFamily:"'Georgia',serif", marginTop:2 }}>
            📔 Roadbook GR34
          </div>
          {entries.length > 0 && (
            <div style={{ fontSize:12, color:"#5a7a9a", marginTop:4, fontFamily:"'Segoe UI',sans-serif" }}>
              {entries.length} étape{entries.length>1?"s":""} · {totalKmMarche.toLocaleString("fr-FR")} km parcourus
            </div>
          )}
        </div>
        <button
          onClick={handleNew}
          style={{
            padding:"10px 18px", borderRadius:10, border:"none",
            background:"#0f2d4e", color:"white", cursor:"pointer",
            fontSize:13, fontWeight:"bold", fontFamily:"'Segoe UI',sans-serif",
            boxShadow:"0 2px 8px rgba(15,45,78,0.2)",
          }}
        >
          ➕ Nouvelle étape
        </button>
      </div>

      {/* Formulaire ou détail */}
      {mode === "form" && (
        <EntryForm
          initial={editing || EMPTY_ENTRY}
          onSave={handleSave}
          onCancel={() => { setMode("list"); setEditing(null); }}
        />
      )}
      {mode === "detail" && viewing && (
        <EntryDetail
          entry={entries.find(e=>e.id===viewing.id)||viewing}
          onClose={() => { setMode("list"); setViewing(null); }}
          onEdit={handleEdit}
        />
      )}

      {/* Liste des étapes */}
      {entries.length === 0 && mode === "list" && (
        <div style={{
          textAlign:"center", padding:"48px 20px",
          background:"white", borderRadius:14, border:"1px dashed #a8c4dc",
          color:"#94a3b8", fontFamily:"'Segoe UI',sans-serif",
        }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🥾</div>
          <div style={{ fontSize:16, fontWeight:"bold", color:"#5a7a9a", marginBottom:6 }}>
            Votre roadbook est vide
          </div>
          <div style={{ fontSize:13 }}>Cliquez sur "Nouvelle étape" pour commencer à documenter votre aventure !</div>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {entries.map(entry => (
            <RoadbookEntry
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <p style={{ textAlign:"center", fontSize:10.5, color:"#94a3b8", marginTop:14, fontFamily:"'Segoe UI',sans-serif" }}>
        Données stockées localement dans votre navigateur · Aucune donnée envoyée sur un serveur
      </p>
    </div>
  );
}

/* ══════════════ COMPOSANT PRINCIPAL ══════════════ */
export default function GR34Map() {
  const [tab, setTab] = useState("carte"); // "carte" | "roadbook"

  const [states, setStates] = useState(() => {
    try {
      const saved = localStorage.getItem("gr34-states");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    const s = {};
    ALL_ITEMS.forEach(x => s[x.id] = "default");
    return s;
  });
  const [hovered, setHovered] = useState(null);

  const cycle = id => setStates(p => {
    const next = {
      ...p,
      [id]: p[id]==="default" ? "done" : p[id]==="done" ? "todo" : "default"
    };
    try { localStorage.setItem("gr34-states", JSON.stringify(next)); } catch(e) {}
    return next;
  });

  const resetAll = () => {
    const s = Object.fromEntries(Object.keys(states).map(k=>[k,"default"]));
    try { localStorage.setItem("gr34-states", JSON.stringify(s)); } catch(e) {}
    setStates(s);
  };

  const col = (id, island=false) => {
    const s = states[id];
    return s==="done" ? C.done : s==="todo" ? C.todo : island ? C.island : C.default;
  };
  const ptsStr = pts => pts.map(p=>p.join(",")).join(" ");

  const doneKm = ALL_ITEMS.filter(x=>states[x.id]==="done").reduce((s,x)=>s+x.kmVal,0);
  const todoKm = ALL_ITEMS.filter(x=>states[x.id]==="todo").reduce((s,x)=>s+x.kmVal,0);
  const restKm = TOTAL_KM - doneKm - todoKm;
  const donePct = Math.round((doneKm / TOTAL_KM) * 100);
  const todoPct = Math.round((todoKm / TOTAL_KM) * 100);
  const restPct = 100 - donePct - todoPct;

  const hovInfo = hovered ? ALL_ITEMS.find(x=>x.id===hovered) : null;

  /* ── Onglets ── */
  const tabBtn = (key, icon, label) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding:"10px 24px", borderRadius:10, border:"none",
        background: tab===key ? "#0f2d4e" : "white",
        color: tab===key ? "white" : "#5a7a9a",
        cursor:"pointer", fontSize:14, fontWeight: tab===key ? "bold" : "normal",
        fontFamily:"'Georgia',serif",
        boxShadow: tab===key ? "0 2px 8px rgba(15,45,78,0.2)" : "0 1px 3px rgba(15,45,78,0.07)",
        transition:"all 0.15s",
        letterSpacing:0.3,
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:"#e8eff8", minHeight:"100vh", padding:"14px 10px" }}>
      <div style={{ maxWidth:920, margin:"0 auto" }}>

        {/* En-tête */}
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <div style={{ fontSize:11, letterSpacing:4, color:"#5a7a9a", textTransform:"uppercase", marginBottom:4 }}>
            Sentier des Douaniers · Bretagne
          </div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:"bold", color:"#0f2d4e", letterSpacing:1 }}>
            GR 34
          </h1>
        </div>

        {/* Navigation onglets */}
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
          {tabBtn("carte",    "🗺️", "Carte")}
          {tabBtn("roadbook", "📔", "Roadbook")}
        </div>

        {/* ══ ONGLET CARTE ══ */}
        {tab === "carte" && (
          <>
            <p style={{ margin:"0 0 8px", fontSize:12, color:"#5a7a9a", fontFamily:"'Segoe UI',sans-serif", textAlign:"center" }}>
              Cliquez sur un tronçon ·{" "}
              <span style={{color:C.done,fontWeight:"bold"}}>vert = réalisé</span> ·{" "}
              <span style={{color:C.todo,fontWeight:"bold"}}>orange = à faire</span>
              {" "}· 3 clics = reset
            </p>

            {/* Info survol */}
            <div style={{ textAlign:"center", height:22, marginBottom:6, fontSize:13, color:"#0f2d4e", fontWeight:"bold", fontFamily:"'Segoe UI',sans-serif" }}>
              {hovInfo
                ? `${hovInfo.name}  ·  ${hovInfo.km}`
                : <span style={{color:"#94a3b8"}}>Survolez un tronçon pour voir le détail</span>
              }
            </div>

            {/* SVG */}
            <svg viewBox={`0 0 ${W} ${H}`}
              style={{ width:"100%", display:"block", borderRadius:16, border:"2px solid #a8c4dc", boxShadow:"0 4px 24px rgba(15,45,78,0.18)" }}>
              <defs>
                <linearGradient id="ocean" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0%" stopColor="#b8d8ed"/>
                  <stop offset="100%" stopColor="#cce4f4"/>
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/>
                </filter>
              </defs>
              <rect width={W} height={H} fill="url(#ocean)" rx={14}/>
              {[140,220,310,400,490,570].map(y=>(
                <line key={y} x1={40} y1={y} x2={860} y2={y} stroke="#a8c8e0" strokeWidth={0.5} opacity={0.5} strokeDasharray="4,8"/>
              ))}
              {OCEAN_LABELS.map(([x,y,txt])=>(
                <text key={txt} x={x} y={y} textAnchor="middle" fontSize={10} letterSpacing={3} fill="#7baac8" opacity={0.7} fontFamily="Georgia,serif" fontStyle="italic">{txt}</text>
              ))}
              <g transform="translate(856,68)">
                <circle r={25} fill="white" fillOpacity={0.88} stroke="#a8c4dc" strokeWidth={1.5}/>
                <polygon points="0,-19 4,0 0,-7 -4,0" fill="#0f2d4e"/>
                <polygon points="0,19 3,0 0,7 -3,0" fill="#94a3b8"/>
                <line x1={0} y1={-19} x2={0} y2={19} stroke="#0f2d4e" strokeWidth={0.5}/>
                <line x1={-19} y1={0} x2={19} y2={0} stroke="#0f2d4e" strokeWidth={0.5}/>
                <text x={0} y={-28} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#0f2d4e" fontFamily="Georgia,serif">N</text>
              </g>

              {SEGMENTS.map(seg => (
                <g key={seg.id}>
                  <polyline points={ptsStr(seg.pts)} fill="none" stroke="transparent" strokeWidth={26} style={{cursor:"pointer"}}
                    onClick={()=>cycle(seg.id)} onMouseEnter={()=>setHovered(seg.id)} onMouseLeave={()=>setHovered(null)}/>
                  {hovered===seg.id && (
                    <polyline points={ptsStr(seg.pts)} fill="none" stroke={col(seg.id)} strokeWidth={13} opacity={0.2}
                      strokeLinecap="round" strokeLinejoin="round" style={{pointerEvents:"none"}}/>
                  )}
                  <polyline points={ptsStr(seg.pts)} fill="none" stroke={col(seg.id)}
                    strokeWidth={hovered===seg.id ? 8 : 5} strokeLinecap="round" strokeLinejoin="round"
                    style={{pointerEvents:"none", transition:"stroke 0.15s, stroke-width 0.1s"}}/>
                </g>
              ))}

              {DETOURS.map(det => (
                <g key={det.id}>
                  <line x1={det.from[0]} y1={det.from[1]} x2={det.to[0]} y2={det.to[1]}
                    stroke="transparent" strokeWidth={18} style={{cursor:"pointer"}}
                    onClick={()=>cycle(det.id)} onMouseEnter={()=>setHovered(det.id)} onMouseLeave={()=>setHovered(null)}/>
                  <line x1={det.from[0]} y1={det.from[1]} x2={det.to[0]} y2={det.to[1]}
                    stroke={col(det.id,true)} strokeWidth={hovered===det.id ? 5 : 3}
                    strokeDasharray="7,5" style={{pointerEvents:"none", transition:"stroke-width 0.1s"}}/>
                  <circle cx={det.to[0]} cy={det.to[1]} r={11} fill={col(det.id,true)} stroke="white" strokeWidth={2.5}
                    filter="url(#shadow)" style={{cursor:"pointer"}}
                    onClick={()=>cycle(det.id)} onMouseEnter={()=>setHovered(det.id)} onMouseLeave={()=>setHovered(null)}/>
                  <text x={det.to[0]} y={det.to[1]+4} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold" style={{pointerEvents:"none"}}>île</text>
                  <text x={det.to[0]} y={det.to[1]-16} textAnchor="middle" fontSize={8.5} fill={col(det.id,true)} fontStyle="italic" fontFamily="Georgia,serif" style={{pointerEvents:"none"}}>{det.name}</text>
                </g>
              ))}

              {LABELS.map(([x,y,label,dy,anchor,bold],i)=>(
                <g key={i} style={{pointerEvents:"none"}}>
                  <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight={bold?"bold":"normal"}
                    fill="white" stroke="white" strokeWidth={3} strokeLinejoin="round"
                    fontFamily={bold?"Georgia,serif":"'Segoe UI',sans-serif"} paintOrder="stroke">{label}</text>
                  <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight={bold?"bold":"normal"}
                    fill={bold?"#0f2d4e":"#3d5a78"} fontFamily={bold?"Georgia,serif":"'Segoe UI',sans-serif"}>{label}</text>
                  <circle cx={x} cy={y} r={bold?5:3.5} fill={bold?"#0f2d4e":"#5a7a9a"} stroke="white" strokeWidth={1.5}/>
                </g>
              ))}
              <rect x={8} y={8} width={W-16} height={H-16} rx={10} fill="none" stroke="#a8c4dc" strokeWidth={1} opacity={0.6}/>
            </svg>

            {/* Suivi kilométrique */}
            <div style={{
              marginTop:14, background:"white", borderRadius:14,
              padding:"14px 16px", boxShadow:"0 2px 10px rgba(15,45,78,0.10)",
              border:"1px solid #dde8f0",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, fontFamily:"'Segoe UI',sans-serif" }}>
                <span style={{ fontSize:13, fontWeight:"bold", color:"#0f2d4e" }}>
                  📊 Suivi kilométrique — GR34 complet
                </span>
                <button onClick={resetAll} style={{
                  padding:"4px 14px", borderRadius:7,
                  border:"1.5px solid #a8c4dc", background:"#f8fbfe",
                  cursor:"pointer", fontSize:12, color:"#3d5a78",
                  fontFamily:"'Segoe UI',sans-serif",
                }}>Tout réinitialiser</button>
              </div>

              <div style={{
                height:22, borderRadius:11, overflow:"hidden", display:"flex",
                background:"#e2e8f0", border:"1px solid #cbd5e1",
                boxShadow:"inset 0 1px 3px rgba(0,0,0,0.08)", marginBottom:14,
              }}>
                {donePct > 0 && (
                  <div style={{ width:`${donePct}%`, background:C.done, transition:"width 0.4s ease",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {donePct >= 7 && <span style={{fontSize:11,color:"white",fontWeight:"bold"}}>{donePct}%</span>}
                  </div>
                )}
                {todoPct > 0 && (
                  <div style={{ width:`${todoPct}%`, background:C.todo, transition:"width 0.4s ease",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {todoPct >= 7 && <span style={{fontSize:11,color:"white",fontWeight:"bold"}}>{todoPct}%</span>}
                  </div>
                )}
                {restPct > 0 && (
                  <div style={{ width:`${restPct}%`, background:"#e2e8f0", transition:"width 0.4s ease",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {restPct >= 10 && <span style={{fontSize:11,color:"#94a3b8",fontWeight:"bold"}}>{restPct}%</span>}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <StatBox color={C.done}  icon="✅" label="Réalisé"          km={doneKm} pct={donePct} />
                <StatBox color={C.todo}  icon="🎯" label="À faire"          km={todoKm} pct={todoPct} />
                <StatBox color="#94a3b8" icon="◯"  label="Non défini"       km={restKm} pct={restPct} />
                <StatBox color="#0f2d4e" icon="📍" label="Total GR34 + îles" km={TOTAL_KM} pct={100} />
              </div>
            </div>

            {/* Liste des tronçons */}
            <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))", gap:5, fontFamily:"'Segoe UI',sans-serif" }}>
              {SEGMENTS.map(seg=>(
                <div key={seg.id} onClick={()=>cycle(seg.id)} style={{
                  padding:"7px 10px", borderRadius:8, cursor:"pointer",
                  borderLeft:`4px solid ${col(seg.id)}`,
                  background: states[seg.id]==="done"?"#f0fdf4":states[seg.id]==="todo"?"#fff7ed":"white",
                  fontSize:12, display:"flex", justifyContent:"space-between", alignItems:"center",
                  boxShadow:"0 1px 4px rgba(15,45,78,0.08)", transition:"background 0.15s",
                }}>
                  <span style={{color:"#1e293f"}}>{stateIcon(states[seg.id])} {seg.name}</span>
                  <span style={{ color:states[seg.id]==="done"?C.done:states[seg.id]==="todo"?C.todo:"#94a3b8", marginLeft:8, whiteSpace:"nowrap", fontSize:11, fontWeight:"bold" }}>
                    {seg.km}
                  </span>
                </div>
              ))}
              {DETOURS.map(det=>(
                <div key={det.id} onClick={()=>cycle(det.id)} style={{
                  padding:"7px 10px", borderRadius:8, cursor:"pointer",
                  borderLeft:`4px dashed ${col(det.id,true)}`,
                  background: states[det.id]==="done"?"#f0fdf4":states[det.id]==="todo"?"#fff7ed":"#eff6ff",
                  fontSize:12, display:"flex", justifyContent:"space-between", alignItems:"center",
                  boxShadow:"0 1px 4px rgba(15,45,78,0.08)", transition:"background 0.15s",
                }}>
                  <span style={{color:"#1e40af"}}>🚢 {det.name} — traversée + tour</span>
                  <span style={{ color:states[det.id]==="done"?C.done:states[det.id]==="todo"?C.todo:C.island, marginLeft:8, whiteSpace:"nowrap", fontSize:11, fontWeight:"bold" }}>
                    {det.km}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ textAlign:"center", fontSize:10.5, color:"#94a3b8", marginTop:12, marginBottom:0, fontFamily:"'Segoe UI',sans-serif" }}>
              Carte schématique · distances indicatives · GR34 continental : 2 126 km · avec îles : 2 151 km
            </p>
          </>
        )}

        {/* ══ ONGLET ROADBOOK ══ */}
        {tab === "roadbook" && <Roadbook />}

      </div>
    </div>
  );
}
