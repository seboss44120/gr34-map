import { useState, useEffect, useRef, useCallback } from "react";
import {
  supabase, saveStates, loadStates,
  saveEntry, deleteEntry, loadEntries,
  createShare, loadShare,
} from "./supabase";

const W = 900, H = 640;

/* ── GR34 ─────────────────────────────────────────────────── */
const SEGMENTS = [
  { id:"s1",  name:"Mont-Saint-Michel → Saint-Malo",                   km:"88 km",   kmVal:88,  pts:[[822,158],[778,138],[745,152]] },
  { id:"s2",  name:"Saint-Malo → Cap Fréhel",                          km:"~87 km",  kmVal:87,  pts:[[745,152],[712,145],[683,129],[650,147]] },
  { id:"s3",  name:"Cap Fréhel → Saint-Brieuc",                        km:"~86 km",  kmVal:86,  pts:[[650,147],[622,160],[588,193]] },
  { id:"s4",  name:"Saint-Brieuc → Paimpol",                           km:"~100 km", kmVal:100, pts:[[588,193],[564,155],[510,103]] },
  { id:"s5",  name:"Paimpol → Perros-Guirec (Côte de Granit Rose)",    km:"~112 km", kmVal:112, pts:[[510,103],[460,107],[420,96]] },
  { id:"s6",  name:"Perros-Guirec → Morlaix",                          km:"~126 km", kmVal:126, pts:[[420,96],[395,112],[370,145],[305,175]] },
  { id:"s7",  name:"Morlaix → Roscoff",                                km:"49 km",   kmVal:49,  pts:[[305,175],[286,147],[268,130]] },
  { id:"s8",  name:"Roscoff → Le Conquet (Pays des Abers)",            km:"~200 km", kmVal:200, pts:[[268,130],[213,147],[165,163],[88,242]] },
  { id:"s9",  name:"Le Conquet → Camaret-sur-Mer (Rade de Brest)",     km:"~130 km", kmVal:130, pts:[[88,242],[88,261],[112,263],[162,268],[208,263],[160,270],[128,268]] },
  { id:"s10", name:"Camaret → Douarnenez (Presqu'île de Crozon)",      km:"~150 km", kmVal:150, pts:[[128,268],[110,288],[133,310],[154,300],[192,330]] },
  { id:"s11", name:"Douarnenez → Quimper (via Pointe du Raz)",         km:"~170 km", kmVal:170, pts:[[192,330],[136,356],[96,344],[125,388],[162,395],[243,368]] },
  { id:"s12", name:"Quimper → Lorient",                                km:"~110 km", kmVal:110, pts:[[243,368],[236,407],[283,415],[323,420],[408,443]] },
  { id:"s13", name:"Lorient → Vannes (Golfe du Morbihan)",             km:"~324 km", kmVal:324, pts:[[408,443],[413,494],[453,530],[468,494],[490,470],[550,467]] },
  { id:"s14", name:"Vannes → La Baule (Pénestin, Guérande, Croisic)",  km:"~359 km", kmVal:359, pts:[[550,467],[545,505],[580,537],[580,565],[595,582],[633,589]] },
  { id:"s15", name:"La Baule → Saint-Nazaire",                         km:"~35 km",  kmVal:35,  pts:[[633,589],[653,594],[673,589]] },
];
const DETOURS = [
  { id:"brehat", name:"Île de Bréhat", from:[510,103], to:[510,67],  km:"~13 km à pied", kmVal:13 },
  { id:"batz",   name:"Île de Batz",   from:[268,130], to:[254,108], km:"~12 km à pied", kmVal:12 },
];
const ALL_ITEMS = [...SEGMENTS, ...DETOURS];
const TOTAL_KM  = ALL_ITEMS.reduce((s,x)=>s+x.kmVal,0);

const LABELS = [
  [822,158,"Mont-Saint-Michel",16,"end",true],[745,152,"Saint-Malo",-12,"middle",true],
  [683,129,"Cap Fréhel",-10,"middle",false],[588,193,"Saint-Brieuc",15,"middle",true],
  [510,103,"Paimpol",-12,"middle",true],[460,107,"Tréguier",15,"middle",false],
  [420,96,"Perros-Guirec",-12,"middle",true],[370,145,"Lannion",15,"middle",false],
  [305,175,"Morlaix",15,"middle",true],[268,130,"Roscoff",-12,"start",true],
  [213,147,"Brignogan",15,"middle",false],[88,242,"Le Conquet",15,"start",true],
  [128,268,"Camaret-sur-Mer",-12,"end",true],[110,288,"Pte de Pen-Hir",15,"end",false],
  [96,344,"Pte du Raz",-12,"end",true],[192,330,"Douarnenez",-12,"start",true],
  [243,368,"Quimper",-12,"start",true],[283,415,"Concarneau",15,"middle",false],
  [408,443,"Lorient",15,"start",true],[453,530,"Quiberon",15,"middle",false],
  [550,467,"Vannes",-12,"middle",true],[580,565,"Guérande",15,"start",false],
  [633,589,"La Baule",15,"middle",true],[673,589,"Saint-Nazaire",-12,"middle",true],
];
const OCEAN_LABELS = [[500,62,"LA MANCHE"],[60,430,"A T L A N T I Q U E"]];

/* ── Traversée Bretonne ──────────────────────────────────── */
const TB_SEGMENTS = [
  { id:"tb1",  name:"Nantes → Cordemais",                    km:"48 km", kmVal:48,  pts:[[820,610],[795,600],[770,585]] },
  { id:"tb2",  name:"Cordemais → Saint-Nazaire",             km:"42 km", kmVal:42,  pts:[[770,585],[720,582],[673,589]] },
  { id:"tb3",  name:"Saint-Nazaire → Guérande",              km:"30 km", kmVal:30,  pts:[[673,589],[636,574],[614,560]] },
  { id:"tb4",  name:"Guérande → Saint-Molf",                 km:"33 km", kmVal:33,  pts:[[614,560],[600,545],[585,528]] },
  { id:"tb5",  name:"Saint-Molf → Pénestin",                 km:"23 km", kmVal:23,  pts:[[585,528],[572,519],[558,510]] },
  { id:"tb6",  name:"Pénestin → La Roche-Bernard",           km:"27 km", kmVal:27,  pts:[[558,510],[578,500],[600,490]] },
  { id:"tb7",  name:"La Roche-Bernard → Redon",              km:"38 km", kmVal:38,  pts:[[600,490],[618,472],[640,450]] },
  { id:"tb8",  name:"Redon → Guipry-Messac",                 km:"41 km", kmVal:41,  pts:[[640,450],[662,420],[688,390]] },
  { id:"tb9",  name:"Guipry-Messac → Rennes",                km:"48 km", kmVal:48,  pts:[[688,390],[700,362],[718,330]] },
  { id:"tb10", name:"Rennes → Hédé-Bazouges",                km:"43 km", kmVal:43,  pts:[[718,330],[710,296],[702,262]] },
  { id:"tb11", name:"Hédé-Bazouges → Dinan",                 km:"35 km", kmVal:35,  pts:[[702,262],[698,236],[694,210]] },
  { id:"tb12", name:"Dinan → Dinard / Saint-Malo",           km:"28 km", kmVal:28,  pts:[[694,210],[715,190],[738,168],[745,152]] },
  { id:"tb13", name:"Saint-Malo → Le Vivier-sur-Mer",        km:"39 km", kmVal:39,  pts:[[745,152],[763,155],[784,162]] },
  { id:"tb14", name:"Le Vivier-sur-Mer → Mont-Saint-Michel", km:"28 km", kmVal:28,  pts:[[784,162],[803,160],[822,158]] },
];
const TB_TOTAL_KM = TB_SEGMENTS.reduce((s,x)=>s+x.kmVal,0);
const TB_LABELS = [
  [820,610,"Nantes",14,"end",true],[640,450,"Redon",-12,"middle",true],
  [718,330,"Rennes",-12,"middle",true],[694,210,"Dinan",14,"end",true],
];

const C    = { done:"#16a34a", todo:"#ea580c", default:"#94a3b8", island:"#2563eb" };
const TB_C = { done:"#7c3aed", todo:"#0891b2", default:"#b8a88a" };
const stateIcon = s => s==="done"?"✅":s==="todo"?"🎯":"◯";

const initStates = items => Object.fromEntries(items.map(x=>[x.id,"default"]));
const lsGet = (k,fb) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb }catch{ return fb } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)) }catch{} };

/* ── Hook largeur fenêtre (responsive) ─────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(()=>{
    const h=()=>setW(window.innerWidth);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return w;
}

/* ── StatBox ─────────────────────────────────────────────── */
function StatBox({ color, icon, label, km, pct }) {
  return (
    <div style={{
      flex:"1 1 100px", background:"white",
      border:`1.5px solid ${color}33`, borderLeft:`4px solid ${color}`,
      borderRadius:10, padding:"9px 10px", textAlign:"center",
    }}>
      <div style={{fontSize:20,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:18,fontWeight:"bold",color,marginTop:4,fontFamily:"Georgia,serif"}}>
        {km.toLocaleString("fr-FR")} <span style={{fontSize:11}}>km</span>
      </div>
      <div style={{fontSize:10,color:"#64748b",marginTop:2,fontFamily:"Segoe UI,sans-serif"}}>
        {label}{pct>0&&pct<100&&<span style={{color,marginLeft:4,fontWeight:"bold"}}>({pct}%)</span>}
      </div>
    </div>
  );
}

/* ── Auth Banner ─────────────────────────────────────────── */
function AuthBanner({ session, syncStatus }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  const sendLink = async () => {
    if (!email) return;
    setLoading(true);
    const redirectTo = window.location.hostname === 'localhost'
      ? window.location.href
      : 'https://seboss44120.github.io/gr34-map/'
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setSent(true); setLoading(false);
  };

  const logout = () => supabase.auth.signOut();

  const syncColor = syncStatus==="ok"?"#16a34a":syncStatus==="saving"?"#f59e0b":"#94a3b8";
  const syncLabel = syncStatus==="ok"?"✓ Synchronisé":syncStatus==="saving"?"↑ Sauvegarde…":"○ Local";

  if (session) return (
    <div style={{
      background:"white", borderRadius:10, padding:"8px 14px", marginBottom:10,
      display:"flex", justifyContent:"space-between", alignItems:"center",
      border:"1px solid #dde8f0", boxShadow:"0 1px 4px rgba(15,45,78,0.07)",
      fontFamily:"Segoe UI,sans-serif", fontSize:12, flexWrap:"wrap", gap:8,
    }}>
      <span style={{color:"#5a7a9a"}}>
        ☁️ Connecté · <b style={{color:"#0f2d4e"}}>{session.user.email}</b>
      </span>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <span style={{color:syncColor,fontWeight:"bold"}}>{syncLabel}</span>
        <button onClick={logout} style={{
          padding:"3px 10px",borderRadius:6,border:"1px solid #dde8f0",
          background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#64748b",
        }}>Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div style={{
      background:"#fffbeb", borderRadius:10, padding:"8px 14px", marginBottom:10,
      border:"1px solid #fde68a", fontFamily:"Segoe UI,sans-serif", fontSize:12,
    }}>
      {!open ? (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <span style={{color:"#92400e"}}>💾 Données locales uniquement · Connectez-vous pour la sauvegarde cloud</span>
          <button onClick={()=>setOpen(true)} style={{
            padding:"4px 12px",borderRadius:7,border:"none",background:"#0f2d4e",
            color:"white",cursor:"pointer",fontSize:12,fontWeight:"bold",
          }}>Se connecter</button>
        </div>
      ) : sent ? (
        <span style={{color:"#065f46",fontWeight:"bold"}}>
          ✉️ Lien envoyé à <b>{email}</b> — vérifiez votre boîte mail puis revenez ici.
        </span>
      ) : (
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:"#92400e"}}>📧 Email :</span>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendLink()}
            placeholder="votre@email.com"
            style={{padding:"4px 10px",borderRadius:7,border:"1.5px solid #fde68a",
              fontSize:12,flex:1,minWidth:180,outline:"none"}}/>
          <button onClick={sendLink} disabled={loading||!email} style={{
            padding:"4px 14px",borderRadius:7,border:"none",background:"#0f2d4e",
            color:"white",cursor:"pointer",fontSize:12,fontWeight:"bold",whiteSpace:"nowrap",
          }}>{loading?"…":"Envoyer le lien"}</button>
          <button onClick={()=>setOpen(false)} style={{
            padding:"4px 8px",borderRadius:7,border:"1px solid #fde68a",
            background:"transparent",cursor:"pointer",fontSize:12,color:"#92400e",
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Modal générique ─────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,
    }} onClick={onClose}>
      <div style={{
        background:"white",borderRadius:16,padding:"24px",maxWidth:440,width:"100%",
        boxShadow:"0 8px 40px rgba(0,0,0,0.2)",
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16,color:"#0f2d4e",fontFamily:"Georgia,serif"}}>{title}</h3>
          <button onClick={onClose} style={{
            border:"none",background:"none",fontSize:18,cursor:"pointer",color:"#94a3b8",lineHeight:1,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Créer un partage ────────────────────────────────────── */
function ShareCreateModal({ session, type, payload, label, onClose }) {
  const [code, setCode]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  const generate = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const c = await createShare(session.user.id, type, payload);
      setCode(c);
    } catch(e) { alert("Erreur : "+e.message); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  return (
    <Modal title={`🔗 Partager — ${label}`} onClose={onClose}>
      {!session && (
        <p style={{color:"#92400e",fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>
          Vous devez être connecté pour créer un partage.
        </p>
      )}
      {session && !code && (
        <>
          <p style={{fontSize:13,color:"#475569",fontFamily:"Segoe UI,sans-serif",marginTop:0}}>
            Un code de 8 caractères sera généré. Toute personne ayant ce code pourra
            consulter ce contenu en lecture seule (valable 90 jours).
          </p>
          <button onClick={generate} disabled={loading} style={{
            width:"100%",padding:"10px",borderRadius:10,border:"none",
            background:"#0f2d4e",color:"white",cursor:"pointer",fontSize:14,fontWeight:"bold",
            fontFamily:"Segoe UI,sans-serif",
          }}>{loading?"Génération…":"Générer le code"}</button>
        </>
      )}
      {code && (
        <div style={{textAlign:"center"}}>
          <div style={{
            fontFamily:"monospace",fontSize:32,fontWeight:"bold",letterSpacing:6,
            color:"#0f2d4e",background:"#f0f7ff",borderRadius:12,padding:"16px",
            marginBottom:12,border:"2px dashed #a8c4dc",
          }}>{code}</div>
          <button onClick={copy} style={{
            padding:"8px 20px",borderRadius:8,border:"none",
            background: copied?"#16a34a":"#0f2d4e",color:"white",cursor:"pointer",
            fontSize:13,fontWeight:"bold",fontFamily:"Segoe UI,sans-serif",
          }}>{copied?"✓ Copié !":"Copier le code"}</button>
          <p style={{fontSize:11,color:"#94a3b8",marginTop:12,fontFamily:"Segoe UI,sans-serif"}}>
            Partagez ce code avec vos proches. Les photos ne sont pas incluses dans les partages.
          </p>
        </div>
      )}
    </Modal>
  );
}

/* ── Voir un partage ─────────────────────────────────────── */
function ShareViewModal({ onClose }) {
  const [code, setCode]     = useState("");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");

  const load = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr(""); setData(null);
    const result = await loadShare(code);
    if (!result) setErr("Code introuvable ou expiré.");
    else setData(result);
    setLoading(false);
  };

  const SHARE_LABELS = {
    "gr34-carte":"🗺️ Carte GR34","tb-carte":"🗺️ Carte Traversée Bretonne",
    "gr34-roadbook":"📔 Roadbook GR34","tb-roadbook":"🚴 Roadbook Vélo","entry":"📍 Étape",
  };

  return (
    <Modal title="🔍 Voir un partage" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&load()}
          placeholder="Ex: AB3C5DEF" maxLength={8}
          style={{
            flex:1,padding:"8px 12px",borderRadius:8,border:"1.5px solid #dde8f0",
            fontSize:16,fontFamily:"monospace",letterSpacing:3,textAlign:"center",outline:"none",
          }}/>
        <button onClick={load} disabled={loading||!code.trim()} style={{
          padding:"8px 16px",borderRadius:8,border:"none",background:"#0f2d4e",
          color:"white",cursor:"pointer",fontSize:13,fontWeight:"bold",
        }}>{loading?"…":"Voir"}</button>
      </div>
      {err && <p style={{color:"#be123c",fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>{err}</p>}
      {data && (
        <div>
          <div style={{fontSize:12,color:"#5a7a9a",fontFamily:"Segoe UI,sans-serif",marginBottom:12}}>
            {SHARE_LABELS[data.share_type]||data.share_type} · Partagé le {new Date(data.created_at).toLocaleDateString("fr-FR")}
          </div>
          <SharedContent type={data.share_type} payload={data.payload}/>
        </div>
      )}
    </Modal>
  );
}

function SharedContent({ type, payload }) {
  const s = { fontSize:12,fontFamily:"Segoe UI,sans-serif",color:"#334155",padding:"4px 0",borderBottom:"1px solid #f1f5f9" };
  if (type==="gr34-carte"||type==="tb-carte") {
    const segs = type==="gr34-carte" ? ALL_ITEMS : TB_SEGMENTS;
    const states = payload.states||{};
    return (
      <div style={{maxHeight:300,overflowY:"auto"}}>
        {segs.map(seg=>(
          <div key={seg.id} style={{...s,display:"flex",justifyContent:"space-between"}}>
            <span>{stateIcon(states[seg.id]||"default")} {seg.name}</span>
            <span style={{color:"#94a3b8"}}>{seg.km}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type==="gr34-roadbook"||type==="tb-roadbook") {
    const entries = payload.entries||[];
    if (!entries.length) return <p style={{color:"#94a3b8",fontSize:12}}>Aucune étape enregistrée.</p>;
    return (
      <div style={{maxHeight:300,overflowY:"auto"}}>
        {entries.map((e,i)=>(
          <div key={i} style={{...s}}>
            <div style={{fontWeight:"bold",color:"#0f2d4e"}}>{e.depart} → {e.arrivee}</div>
            <div style={{color:"#94a3b8"}}>{e.date} · {e.km} km {e.duree&&`· ${e.duree}`}</div>
            {e.notes&&<div style={{marginTop:2,fontStyle:"italic"}}>{e.notes.slice(0,120)}{e.notes.length>120?"…":""}</div>}
          </div>
        ))}
      </div>
    );
  }
  if (type==="entry") {
    const e = payload;
    return (
      <div>
        <div style={{fontSize:16,fontWeight:"bold",color:"#0f2d4e",fontFamily:"Georgia,serif",marginBottom:8}}>
          {e.depart} → {e.arrivee}
        </div>
        <div style={{fontSize:12,color:"#5a7a9a",fontFamily:"Segoe UI,sans-serif",marginBottom:8}}>
          {e.date} · {e.km} km {e.duree&&`· ${e.duree}`}
        </div>
        {e.notes&&<div style={{fontSize:13,color:"#334155",fontFamily:"Segoe UI,sans-serif",whiteSpace:"pre-wrap"}}>{e.notes}</div>}
      </div>
    );
  }
  return null;
}

/* ══════════════ ROADBOOK ══════════════ */
const EMPTY_ENTRY = { id:null,date:"",depart:"",arrivee:"",km:"",duree:"",notes:"",photos:[] };

function formatDate(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function RoadbookEntry({ entry, onEdit, onDelete, onView, onShare, kmIcon }) {
  return (
    <div onClick={()=>onView(entry)} style={{
      background:"white",borderRadius:12,padding:"14px 16px",
      boxShadow:"0 2px 10px rgba(15,45,78,0.09)",border:"1px solid #dde8f0",
      cursor:"pointer",transition:"box-shadow 0.15s,transform 0.1s",display:"flex",gap:12,alignItems:"flex-start",
    }}
    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px rgba(15,45,78,0.18)";e.currentTarget.style.transform="translateY(-1px)"}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 10px rgba(15,45,78,0.09)";e.currentTarget.style.transform="none"}}>
      <div style={{
        width:60,height:60,borderRadius:8,flexShrink:0,overflow:"hidden",
        background:entry.photos?.length?"transparent":"#e8eff8",
        border:"1.5px solid #dde8f0",display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {entry.photos?.length
          ? <img src={entry.photos[0]} alt="étape" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:22}}>📍</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11,color:"#5a7a9a",fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>
              📅 {formatDate(entry.date)}{entry.km&&<span style={{marginLeft:6}}>· {kmIcon} {entry.km} km</span>}
              {entry.duree&&<span style={{marginLeft:6}}>· ⏱ {entry.duree}</span>}
            </div>
            <div style={{fontSize:13,fontWeight:"bold",color:"#0f2d4e",fontFamily:"Georgia,serif",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {entry.depart||"—"} → {entry.arrivee||"—"}
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>onShare(entry)} title="Partager" style={{
              padding:"3px 7px",borderRadius:6,border:"1px solid #dde8f0",
              background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#3d5a78",
            }}>🔗</button>
            <button onClick={()=>onEdit(entry)} style={{
              padding:"3px 7px",borderRadius:6,border:"1px solid #dde8f0",
              background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#3d5a78",
            }}>✏️</button>
            <button onClick={()=>onDelete(entry.id)} style={{
              padding:"3px 7px",borderRadius:6,border:"1px solid #fecdd3",
              background:"#fff1f2",cursor:"pointer",fontSize:11,color:"#be123c",
            }}>🗑</button>
          </div>
        </div>
        {entry.notes&&<div style={{fontSize:11,color:"#475569",marginTop:4,fontFamily:"Segoe UI,sans-serif",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.notes}</div>}
        {entry.photos?.length>1&&<div style={{fontSize:10,color:"#5a7a9a",marginTop:3}}>📷 {entry.photos.length} photos</div>}
      </div>
    </div>
  );
}

function EntryForm({ initial, onSave, onCancel, kmIcon, isMobile }) {
  const [form, setForm]       = useState({...EMPTY_ENTRY,...initial});
  const [saving, setSaving]   = useState(false);
  const fileRef               = useRef();
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handlePhoto = e => {
    Array.from(e.target.files).forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev => setForm(p=>({...p,photos:[...(p.photos||[]),ev.target.result]}));
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const lbl = { fontSize:12,fontWeight:"bold",color:"#0f2d4e",fontFamily:"Segoe UI,sans-serif",marginBottom:4,display:"block" };
  const inp = { width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid #dde8f0",
    fontSize:13,fontFamily:"Segoe UI,sans-serif",color:"#1e293f",background:"#f8fbfe",
    outline:"none",boxSizing:"border-box" };

  return (
    <div style={{background:"white",borderRadius:14,padding:"18px 20px",
      boxShadow:"0 4px 24px rgba(15,45,78,0.14)",border:"1px solid #dde8f0",marginBottom:14}}>
      <h3 style={{margin:"0 0 14px",fontSize:15,color:"#0f2d4e",fontFamily:"Georgia,serif"}}>
        {form.id?"✏️ Modifier":"➕ Nouvelle étape"}
      </h3>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
        <div><label style={lbl}>📅 Date</label>
          <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/></div>
        <div><label style={lbl}>{kmIcon} Distance (km)</label>
          <input type="text" placeholder="ex: 48" value={form.km} onChange={e=>set("km",e.target.value)} style={inp}/></div>
        <div><label style={lbl}>📍 Départ</label>
          <input type="text" placeholder="ex: Nantes" value={form.depart} onChange={e=>set("depart",e.target.value)} style={inp}/></div>
        <div><label style={lbl}>🏁 Arrivée</label>
          <input type="text" placeholder="ex: Redon" value={form.arrivee} onChange={e=>set("arrivee",e.target.value)} style={inp}/></div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={lbl}>⏱ Durée</label>
        <input type="text" placeholder="ex: 3h30" value={form.duree} onChange={e=>set("duree",e.target.value)} style={inp}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lbl}>📝 Notes</label>
        <textarea placeholder="Météo, difficultés, coups de cœur…" value={form.notes}
          onChange={e=>set("notes",e.target.value)} rows={3}
          style={{...inp,resize:"vertical",lineHeight:1.5}}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lbl}>📷 Photos</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>
          {(form.photos||[]).map((src,i)=>(
            <div key={i} style={{position:"relative",width:72,height:72}}>
              <img src={src} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:"1.5px solid #dde8f0"}}/>
              <button onClick={()=>setForm(p=>({...p,photos:p.photos.filter((_,j)=>j!==i)}))}
                style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",
                  border:"none",background:"#be123c",color:"white",fontSize:10,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          ))}
          <button onClick={()=>fileRef.current.click()} style={{
            width:72,height:72,borderRadius:8,border:"2px dashed #a8c4dc",
            background:"#f0f7ff",cursor:"pointer",fontSize:20,color:"#5a7a9a",
            display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{display:"none"}}/>
        <div style={{fontSize:10,color:"#94a3b8",fontFamily:"Segoe UI,sans-serif"}}>
          Photos uploadées sur Supabase Storage (si connecté) ou gardées localement
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"7px 16px",borderRadius:8,border:"1.5px solid #dde8f0",
          background:"#f8fbfe",cursor:"pointer",fontSize:13,color:"#3d5a78",fontFamily:"Segoe UI,sans-serif"}}>Annuler</button>
        <button onClick={handleSave} disabled={saving||(!form.date&&!form.depart&&!form.arrivee)} style={{
          padding:"7px 20px",borderRadius:8,border:"none",background:"#0f2d4e",cursor:"pointer",
          fontSize:13,color:"white",fontFamily:"Segoe UI,sans-serif",fontWeight:"bold",
          opacity:saving?0.7:1}}>
          {saving?"⏳ Sauvegarde…":"💾 Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function EntryDetail({ entry, onClose, onEdit, onShare, kmIcon }) {
  return (
    <div style={{background:"white",borderRadius:14,padding:"18px 20px",
      boxShadow:"0 4px 24px rgba(15,45,78,0.14)",border:"1px solid #dde8f0",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:11,color:"#5a7a9a",fontFamily:"Segoe UI,sans-serif",marginBottom:4}}>
            📅 {formatDate(entry.date)}{entry.km&&<span style={{marginLeft:8}}>{kmIcon} {entry.km} km</span>}
            {entry.duree&&<span style={{marginLeft:8}}>⏱ {entry.duree}</span>}
          </div>
          <h2 style={{margin:0,fontSize:18,color:"#0f2d4e",fontFamily:"Georgia,serif"}}>
            {entry.depart||"—"} → {entry.arrivee||"—"}
          </h2>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onShare(entry)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #dde8f0",
            background:"#f8fbfe",cursor:"pointer",fontSize:12,color:"#3d5a78"}}>🔗 Partager</button>
          <button onClick={()=>onEdit(entry)} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #dde8f0",
            background:"#f8fbfe",cursor:"pointer",fontSize:12,color:"#3d5a78"}}>✏️</button>
          <button onClick={onClose} style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #dde8f0",
            background:"#f8fbfe",cursor:"pointer",fontSize:12,color:"#3d5a78"}}>✕</button>
        </div>
      </div>
      {entry.notes&&<div style={{background:"#f8fbfe",borderRadius:10,padding:"12px 14px",
        border:"1px solid #e2eaf4",marginBottom:14,fontSize:13,color:"#334155",
        fontFamily:"Segoe UI,sans-serif",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{entry.notes}</div>}
      {entry.photos?.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:"bold",color:"#0f2d4e",marginBottom:8,fontFamily:"Segoe UI,sans-serif"}}>
            📷 Photos ({entry.photos.length})
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {entry.photos.map((src,i)=>(
              <img key={i} src={src} alt={`photo ${i+1}`} onClick={()=>window.open(src,"_blank")}
                style={{height:140,borderRadius:10,border:"1.5px solid #dde8f0",objectFit:"cover",cursor:"pointer"}}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Roadbook (GR34 ou TB) ───────────────────────────────── */
function Roadbook({ storageKey, routeType, headerTitle, headerIcon, emptyIcon, kmIcon, accentColor, session, isMobile, onShareRoadbook }) {
  const [entries, setEntries] = useState(()=>lsGet(storageKey,[]));
  const [mode, setMode]       = useState("list");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [shareEntry, setShareEntry] = useState(null);
  const [syncing, setSyncing] = useState(false);

  /* Charge depuis Supabase quand session disponible */
  useEffect(()=>{
    if (!session) return;
    (async()=>{
      setSyncing(true);
      const cloud = await loadEntries(session.user.id, routeType);
      if (cloud.length>0) {
        setEntries(cloud);
        lsSet(storageKey, cloud);
      } else {
        // Première connexion : migrer le localStorage
        const local = lsGet(storageKey, []);
        for (const e of local) await saveEntry(session.user.id, routeType, e).catch(()=>{});
      }
      setSyncing(false);
    })();
  }, [session?.user?.id]);

  const persist = async (updated) => {
    setEntries(updated);
    lsSet(storageKey, updated);
    if (session) {
      for (const e of updated) {
        const urls = await saveEntry(session.user.id, routeType, e).catch(()=>null);
        if (urls) { e.photos = urls; }
      }
    }
  };

  const handleSave = async (form) => {
    const entry = form.id ? form : {...form, id: Date.now().toString()};
    // Upload photos si session
    if (session) {
      const urls = await saveEntry(session.user.id, routeType, entry).catch(()=>null);
      if (urls) entry.photos = urls;
    }
    const updated = (form.id
      ? entries.map(e=>e.id===form.id?entry:e)
      : [...entries, entry]
    ).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    setEntries(updated);
    lsSet(storageKey, updated);
    setMode("list"); setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette étape ?")) return;
    if (session) await deleteEntry(session.user.id, routeType, id).catch(()=>{});
    const updated = entries.filter(e=>e.id!==id);
    setEntries(updated); lsSet(storageKey, updated);
    if (viewing?.id===id) { setViewing(null); setMode("list"); }
  };

  const totalKm = entries.reduce((s,e)=>s+(parseFloat(e.km)||0),0);

  return (
    <div>
      {shareEntry && (
        <ShareCreateModal session={session} type="entry"
          payload={{...shareEntry, photos:[]}}
          label={`${shareEntry.depart} → ${shareEntry.arrivee}`}
          onClose={()=>setShareEntry(null)}/>
      )}

      <div style={{background:"white",borderRadius:14,padding:"14px 18px",
        boxShadow:"0 2px 10px rgba(15,45,78,0.10)",border:"1px solid #dde8f0",
        marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:10,letterSpacing:3,color:"#5a7a9a",textTransform:"uppercase",fontFamily:"Segoe UI,sans-serif"}}>
            Mon carnet de route {syncing&&<span style={{color:"#f59e0b"}}>↑</span>}
          </div>
          <div style={{fontSize:17,fontWeight:"bold",color:"#0f2d4e",fontFamily:"Georgia,serif",marginTop:2}}>
            {headerIcon} {headerTitle}
          </div>
          {entries.length>0&&<div style={{fontSize:11,color:"#5a7a9a",marginTop:3,fontFamily:"Segoe UI,sans-serif"}}>
            {entries.length} étape{entries.length>1?"s":""} · {totalKm.toLocaleString("fr-FR")} km
          </div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          {entries.length>0&&<button onClick={()=>onShareRoadbook(entries)} style={{
            padding:"8px 14px",borderRadius:9,border:"1.5px solid #dde8f0",
            background:"#f8fbfe",cursor:"pointer",fontSize:12,color:"#3d5a78",fontFamily:"Segoe UI,sans-serif",
          }}>🔗 Partager</button>}
          <button onClick={()=>{setEditing(null);setMode("form");setViewing(null)}} style={{
            padding:"8px 16px",borderRadius:9,border:"none",background:accentColor||"#0f2d4e",
            color:"white",cursor:"pointer",fontSize:13,fontWeight:"bold",fontFamily:"Segoe UI,sans-serif",
          }}>➕ Étape</button>
        </div>
      </div>

      {mode==="form"&&<EntryForm initial={editing||EMPTY_ENTRY} onSave={handleSave}
        onCancel={()=>{setMode("list");setEditing(null)}} kmIcon={kmIcon} isMobile={isMobile}/>}
      {mode==="detail"&&viewing&&(
        <EntryDetail entry={entries.find(e=>e.id===viewing.id)||viewing}
          onClose={()=>{setMode("list");setViewing(null)}}
          onEdit={e=>{setEditing(e);setMode("form");setViewing(null)}}
          onShare={e=>setShareEntry(e)}
          kmIcon={kmIcon}/>
      )}

      {entries.length===0&&mode==="list"&&(
        <div style={{textAlign:"center",padding:"44px 20px",background:"white",borderRadius:14,
          border:"1px dashed #a8c4dc",color:"#94a3b8",fontFamily:"Segoe UI,sans-serif"}}>
          <div style={{fontSize:44,marginBottom:10}}>{emptyIcon}</div>
          <div style={{fontSize:15,fontWeight:"bold",color:"#5a7a9a",marginBottom:4}}>Roadbook vide</div>
          <div style={{fontSize:12}}>Cliquez sur "Étape" pour commencer !</div>
        </div>
      )}
      {entries.length>0&&mode==="list"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {entries.map(e=>(
            <RoadbookEntry key={e.id} entry={e}
              onEdit={en=>{setEditing(en);setMode("form");setViewing(null)}}
              onDelete={handleDelete}
              onView={en=>{setViewing(en);setMode("detail")}}
              onShare={en=>setShareEntry(en)}
              kmIcon={kmIcon}/>
          ))}
        </div>
      )}
      <p style={{textAlign:"center",fontSize:10,color:"#94a3b8",marginTop:12,fontFamily:"Segoe UI,sans-serif"}}>
        {session?"☁️ Données synchronisées avec Supabase · Photos sur Storage":"💾 Données locales uniquement · Connectez-vous pour la sync cloud"}
      </p>
    </div>
  );
}

/* ══════════════ COMPOSANT PRINCIPAL ══════════════ */
export default function GR34Map() {
  const width   = useWindowWidth();
  const isMobile = width < 600;
  const [tab, setTab]   = useState("carte");
  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local");
  const saveTimer = useRef(null);

  /* Auth */
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);

  /* États GR34 */
  const [states, setStates] = useState(()=>lsGet("gr34-states", initStates(ALL_ITEMS)));
  /* États TB */
  const [tbStates, setTbStates] = useState(()=>lsGet("tb-states", initStates(TB_SEGMENTS)));
  const [hovered, setHovered] = useState(null);

  /* Sync états depuis Supabase au login */
  useEffect(()=>{
    if (!session) return;
    const uid = session.user.id;
    Promise.all([loadStates(uid,"gr34"), loadStates(uid,"tb")]).then(([gr34,tb])=>{
      if (gr34) { setStates(gr34); lsSet("gr34-states",gr34); }
      else saveStates(uid,"gr34",states);
      if (tb)   { setTbStates(tb); lsSet("tb-states",tb); }
      else saveStates(uid,"tb",tbStates);
    });
  },[session?.user?.id]);

  /* Sauvegarde debouncée des états */
  const debounceSave = useCallback((routeType, val)=>{
    if (!session) return;
    setSyncStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{
      saveStates(session.user.id, routeType, val).then(()=>setSyncStatus("ok"));
    }, 1500);
  },[session]);

  const cycle = id => setStates(p=>{
    const next={...p,[id]:p[id]==="default"?"done":p[id]==="done"?"todo":"default"};
    lsSet("gr34-states",next); debounceSave("gr34",next); return next;
  });
  const cycleTB = id => setTbStates(p=>{
    const next={...p,[id]:p[id]==="default"?"done":p[id]==="done"?"todo":"default"};
    lsSet("tb-states",next); debounceSave("tb",next); return next;
  });
  const resetAll = ()=>{
    const s=initStates(ALL_ITEMS); setStates(s); lsSet("gr34-states",s); debounceSave("gr34",s);
  };
  const resetTB = ()=>{
    const s=initStates(TB_SEGMENTS); setTbStates(s); lsSet("tb-states",s); debounceSave("tb",s);
  };

  const col   = (id,island=false)=>{ const s=states[id]; return s==="done"?C.done:s==="todo"?C.todo:island?C.island:C.default; };
  const colTB = id=>{ const s=tbStates[id]; return s==="done"?TB_C.done:s==="todo"?TB_C.todo:TB_C.default; };
  const ptsStr = pts=>pts.map(p=>p.join(",")).join(" ");

  const doneKm=ALL_ITEMS.filter(x=>states[x.id]==="done").reduce((s,x)=>s+x.kmVal,0);
  const todoKm=ALL_ITEMS.filter(x=>states[x.id]==="todo").reduce((s,x)=>s+x.kmVal,0);
  const restKm=TOTAL_KM-doneKm-todoKm;
  const donePct=Math.round(doneKm/TOTAL_KM*100), todoPct=Math.round(todoKm/TOTAL_KM*100), restPct=100-donePct-todoPct;

  const tbDoneKm=TB_SEGMENTS.filter(x=>tbStates[x.id]==="done").reduce((s,x)=>s+x.kmVal,0);
  const tbTodoKm=TB_SEGMENTS.filter(x=>tbStates[x.id]==="todo").reduce((s,x)=>s+x.kmVal,0);
  const tbRestKm=TB_TOTAL_KM-tbDoneKm-tbTodoKm;
  const tbDonePct=Math.round(tbDoneKm/TB_TOTAL_KM*100), tbTodoPct=Math.round(tbTodoKm/TB_TOTAL_KM*100), tbRestPct=100-tbDonePct-tbTodoPct;

  const hovInfo = hovered ? (ALL_ITEMS.find(x=>x.id===hovered)||TB_SEGMENTS.find(x=>x.id===hovered)) : null;
  const hovIsTB = hovered?.startsWith("tb");

  /* Partages */
  const [shareModal, setShareModal] = useState(null);
  const [viewShare, setViewShare]   = useState(false);

  const openShare = (type, payload, label) => setShareModal({type,payload,label});
  const shareGR34Carte = () => openShare("gr34-carte",{states},"Carte GR34");
  const shareTBCarte   = () => openShare("tb-carte",{states:tbStates},"Carte Traversée Bretonne");
  const shareRoadbook  = (routeType, entries) =>
    openShare(`${routeType}-roadbook`,{entries:entries.map(e=>({...e,photos:[]}))},
      routeType==="gr34"?"Roadbook GR34":"Roadbook Vélo");

  /* Onglets */
  const tabBtn = (key, icon, label) => (
    <button onClick={()=>setTab(key)} style={{
      padding:isMobile?"8px 12px":"10px 18px",
      borderRadius:10,border:"none",
      background:tab===key?"#0f2d4e":"white",
      color:tab===key?"white":"#5a7a9a",
      cursor:"pointer",fontSize:isMobile?12:13,
      fontWeight:tab===key?"bold":"normal",
      fontFamily:"Georgia,serif",
      boxShadow:tab===key?"0 2px 8px rgba(15,45,78,0.2)":"0 1px 3px rgba(15,45,78,0.07)",
      transition:"all 0.15s",whiteSpace:"nowrap",
    }}>{icon} {label}</button>
  );

  /* Barre de progression */
  const ProgressBar = ({donePct,todoPct,restPct,doneC,todoC}) => (
    <div style={{height:20,borderRadius:10,overflow:"hidden",display:"flex",
      background:"#e2e8f0",border:"1px solid #cbd5e1",marginBottom:12}}>
      {donePct>0&&<div style={{width:`${donePct}%`,background:doneC,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {donePct>=8&&<span style={{fontSize:10,color:"white",fontWeight:"bold"}}>{donePct}%</span>}</div>}
      {todoPct>0&&<div style={{width:`${todoPct}%`,background:todoC,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {todoPct>=8&&<span style={{fontSize:10,color:"white",fontWeight:"bold"}}>{todoPct}%</span>}</div>}
      {restPct>0&&<div style={{width:`${restPct}%`,background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {restPct>=12&&<span style={{fontSize:10,color:"#94a3b8",fontWeight:"bold"}}>{restPct}%</span>}</div>}
    </div>
  );

  return (
    <div style={{fontFamily:"Georgia,serif",background:"#e8eff8",minHeight:"100vh",padding:isMobile?"10px 6px":"14px 10px"}}>
      <div style={{maxWidth:920,margin:"0 auto"}}>

        {/* En-tête */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:10,letterSpacing:4,color:"#5a7a9a",textTransform:"uppercase",marginBottom:3}}>
            Bretagne · Randonnée & Vélo
          </div>
          <h1 style={{margin:0,fontSize:isMobile?20:26,fontWeight:"bold",color:"#0f2d4e",letterSpacing:1}}>
            GR 34 · Traversée Bretonne
          </h1>
        </div>

        <AuthBanner session={session} syncStatus={syncStatus}/>

        {/* Onglets + Voir partage */}
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          {tabBtn("carte","🗺️","Carte")}
          {tabBtn("roadbook","📔",isMobile?"GR34":"Roadbook GR34")}
          {tabBtn("roadbook-velo","🚴",isMobile?"Vélo":"Roadbook Vélo")}
          <button onClick={()=>setViewShare(true)} style={{
            padding:isMobile?"8px 10px":"8px 14px",borderRadius:10,border:"1.5px solid #a8c4dc",
            background:"white",color:"#5a7a9a",cursor:"pointer",fontSize:isMobile?11:12,
            fontFamily:"Segoe UI,sans-serif",whiteSpace:"nowrap",
          }}>🔍 Voir un partage</button>
        </div>

        {/* Modals */}
        {shareModal&&(
          <ShareCreateModal session={session} type={shareModal.type}
            payload={shareModal.payload} label={shareModal.label}
            onClose={()=>setShareModal(null)}/>
        )}
        {viewShare&&<ShareViewModal onClose={()=>setViewShare(false)}/>}

        {/* ══ CARTE ══ */}
        {tab==="carte"&&(<>
          <p style={{margin:"0 0 6px",fontSize:11,color:"#5a7a9a",fontFamily:"Segoe UI,sans-serif",textAlign:"center"}}>
            Cliquez sur un tronçon · <span style={{color:C.done,fontWeight:"bold"}}>vert = réalisé</span> · <span style={{color:C.todo,fontWeight:"bold"}}>orange = à faire</span> · 3 clics = reset
          </p>
          <div style={{textAlign:"center",height:20,marginBottom:6,fontSize:12,fontWeight:"bold",
            fontFamily:"Segoe UI,sans-serif",color:hovIsTB?TB_C.done:"#0f2d4e"}}>
            {hovInfo
              ? `${hovIsTB?"🚴":"🥾"} ${hovInfo.name}  ·  ${hovInfo.km}`
              : <span style={{color:"#94a3b8",fontWeight:"normal"}}>Survolez un tronçon</span>}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block",borderRadius:16,
            border:"2px solid #a8c4dc",boxShadow:"0 4px 24px rgba(15,45,78,0.18)"}}>
            <defs>
              <linearGradient id="ocean" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" stopColor="#b8d8ed"/><stop offset="100%" stopColor="#cce4f4"/>
              </linearGradient>
              <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/></filter>
            </defs>
            <rect width={W} height={H} fill="url(#ocean)" rx={14}/>
            {[140,220,310,400,490,570].map(y=>(
              <line key={y} x1={40} y1={y} x2={860} y2={y} stroke="#a8c8e0" strokeWidth={0.5} opacity={0.5} strokeDasharray="4,8"/>
            ))}
            {OCEAN_LABELS.map(([x,y,t])=>(
              <text key={t} x={x} y={y} textAnchor="middle" fontSize={10} letterSpacing={3}
                fill="#7baac8" opacity={0.7} fontFamily="Georgia,serif" fontStyle="italic">{t}</text>
            ))}
            <g transform="translate(856,68)">
              <circle r={25} fill="white" fillOpacity={0.88} stroke="#a8c4dc" strokeWidth={1.5}/>
              <polygon points="0,-19 4,0 0,-7 -4,0" fill="#0f2d4e"/>
              <polygon points="0,19 3,0 0,7 -3,0" fill="#94a3b8"/>
              <line x1={0} y1={-19} x2={0} y2={19} stroke="#0f2d4e" strokeWidth={0.5}/>
              <line x1={-19} y1={0} x2={19} y2={0} stroke="#0f2d4e" strokeWidth={0.5}/>
              <text x={0} y={-28} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#0f2d4e" fontFamily="Georgia,serif">N</text>
            </g>

            {/* TB (sous GR34) */}
            {TB_SEGMENTS.map(seg=>(
              <g key={seg.id}>
                <polyline points={ptsStr(seg.pts)} fill="none" stroke="transparent" strokeWidth={22}
                  style={{cursor:"pointer"}} onClick={()=>cycleTB(seg.id)}
                  onMouseEnter={()=>setHovered(seg.id)} onMouseLeave={()=>setHovered(null)}/>
                {hovered===seg.id&&<polyline points={ptsStr(seg.pts)} fill="none" stroke={colTB(seg.id)}
                  strokeWidth={11} opacity={0.25} strokeLinecap="round" style={{pointerEvents:"none"}}/>}
                <polyline points={ptsStr(seg.pts)} fill="none" stroke={colTB(seg.id)}
                  strokeWidth={hovered===seg.id?6:4} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="10,6" style={{pointerEvents:"none",transition:"stroke 0.15s,stroke-width 0.1s"}}/>
              </g>
            ))}

            {/* GR34 */}
            {SEGMENTS.map(seg=>(
              <g key={seg.id}>
                <polyline points={ptsStr(seg.pts)} fill="none" stroke="transparent" strokeWidth={26}
                  style={{cursor:"pointer"}} onClick={()=>cycle(seg.id)}
                  onMouseEnter={()=>setHovered(seg.id)} onMouseLeave={()=>setHovered(null)}/>
                {hovered===seg.id&&<polyline points={ptsStr(seg.pts)} fill="none" stroke={col(seg.id)}
                  strokeWidth={13} opacity={0.2} strokeLinecap="round" style={{pointerEvents:"none"}}/>}
                <polyline points={ptsStr(seg.pts)} fill="none" stroke={col(seg.id)}
                  strokeWidth={hovered===seg.id?8:5} strokeLinecap="round" strokeLinejoin="round"
                  style={{pointerEvents:"none",transition:"stroke 0.15s,stroke-width 0.1s"}}/>
              </g>
            ))}

            {DETOURS.map(det=>(
              <g key={det.id}>
                <line x1={det.from[0]} y1={det.from[1]} x2={det.to[0]} y2={det.to[1]}
                  stroke="transparent" strokeWidth={18} style={{cursor:"pointer"}}
                  onClick={()=>cycle(det.id)} onMouseEnter={()=>setHovered(det.id)} onMouseLeave={()=>setHovered(null)}/>
                <line x1={det.from[0]} y1={det.from[1]} x2={det.to[0]} y2={det.to[1]}
                  stroke={col(det.id,true)} strokeWidth={hovered===det.id?5:3} strokeDasharray="7,5" style={{pointerEvents:"none"}}/>
                <circle cx={det.to[0]} cy={det.to[1]} r={11} fill={col(det.id,true)} stroke="white" strokeWidth={2.5}
                  filter="url(#shadow)" style={{cursor:"pointer"}} onClick={()=>cycle(det.id)}
                  onMouseEnter={()=>setHovered(det.id)} onMouseLeave={()=>setHovered(null)}/>
                <text x={det.to[0]} y={det.to[1]+4} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold" style={{pointerEvents:"none"}}>île</text>
                <text x={det.to[0]} y={det.to[1]-16} textAnchor="middle" fontSize={8} fill={col(det.id,true)}
                  fontStyle="italic" fontFamily="Georgia,serif" style={{pointerEvents:"none"}}>{det.name}</text>
              </g>
            ))}

            {LABELS.map(([x,y,label,dy,anchor,bold],i)=>(
              <g key={i} style={{pointerEvents:"none"}}>
                <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight={bold?"bold":"normal"}
                  fill="white" stroke="white" strokeWidth={3} strokeLinejoin="round"
                  fontFamily={bold?"Georgia,serif":"Segoe UI,sans-serif"} paintOrder="stroke">{label}</text>
                <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight={bold?"bold":"normal"}
                  fill={bold?"#0f2d4e":"#3d5a78"} fontFamily={bold?"Georgia,serif":"Segoe UI,sans-serif"}>{label}</text>
                <circle cx={x} cy={y} r={bold?5:3.5} fill={bold?"#0f2d4e":"#5a7a9a"} stroke="white" strokeWidth={1.5}/>
              </g>
            ))}

            {TB_LABELS.map(([x,y,label,dy,anchor,bold],i)=>(
              <g key={`tl${i}`} style={{pointerEvents:"none"}}>
                <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight="bold"
                  fill="white" stroke="white" strokeWidth={3} fontFamily="Georgia,serif" paintOrder="stroke">{label}</text>
                <text x={x} y={y+dy} textAnchor={anchor} fontSize={bold?10.5:8.5} fontWeight="bold"
                  fill={TB_C.done} fontFamily="Georgia,serif">{label}</text>
                <circle cx={x} cy={y} r={5} fill={TB_C.done} stroke="white" strokeWidth={1.5}/>
              </g>
            ))}

            <g transform="translate(20,600)" style={{pointerEvents:"none"}}>
              <rect x={0} y={-14} width={200} height={32} rx={6} fill="white" fillOpacity={0.82} stroke="#a8c4dc" strokeWidth={1}/>
              <line x1={8} y1={0} x2={30} y2={0} stroke={C.done} strokeWidth={4} strokeLinecap="round"/>
              <text x={35} y={4} fontSize={9} fill="#0f2d4e" fontFamily="Segoe UI,sans-serif">GR34 (pédestre)</text>
              <line x1={110} y1={0} x2={132} y2={0} stroke={TB_C.done} strokeWidth={3} strokeLinecap="round" strokeDasharray="6,4"/>
              <text x={137} y={4} fontSize={9} fill={TB_C.done} fontFamily="Segoe UI,sans-serif">Traversée Bretonne</text>
            </g>
            <rect x={8} y={8} width={W-16} height={H-16} rx={10} fill="none" stroke="#a8c4dc" strokeWidth={1} opacity={0.6}/>
          </svg>

          {/* Stats GR34 */}
          <div style={{marginTop:12,background:"white",borderRadius:14,padding:"12px 14px",
            boxShadow:"0 2px 10px rgba(15,45,78,0.10)",border:"1px solid #dde8f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:10,fontFamily:"Segoe UI,sans-serif",flexWrap:"wrap",gap:6}}>
              <span style={{fontSize:12,fontWeight:"bold",color:"#0f2d4e"}}>🥾 Suivi GR34 — Sentier des Douaniers</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={shareGR34Carte} style={{padding:"3px 10px",borderRadius:7,border:"1.5px solid #dde8f0",
                  background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#3d5a78",fontFamily:"Segoe UI,sans-serif"}}>🔗 Partager</button>
                <button onClick={resetAll} style={{padding:"3px 10px",borderRadius:7,border:"1.5px solid #a8c4dc",
                  background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#3d5a78",fontFamily:"Segoe UI,sans-serif"}}>Réinitialiser</button>
              </div>
            </div>
            <ProgressBar donePct={donePct} todoPct={todoPct} restPct={restPct} doneC={C.done} todoC={C.todo}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <StatBox color={C.done}  icon="✅" label="Réalisé"    km={doneKm} pct={donePct}/>
              <StatBox color={C.todo}  icon="🎯" label="À faire"    km={todoKm} pct={todoPct}/>
              <StatBox color="#94a3b8" icon="◯"  label="Non défini" km={restKm} pct={restPct}/>
              <StatBox color="#0f2d4e" icon="📍" label="Total GR34"  km={TOTAL_KM} pct={100}/>
            </div>
          </div>

          {/* Stats TB */}
          <div style={{marginTop:8,background:"white",borderRadius:14,padding:"12px 14px",
            boxShadow:"0 2px 10px rgba(15,45,78,0.10)",border:`1px solid ${TB_C.done}44`,borderLeft:`4px solid ${TB_C.done}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:10,fontFamily:"Segoe UI,sans-serif",flexWrap:"wrap",gap:6}}>
              <span style={{fontSize:12,fontWeight:"bold",color:TB_C.done}}>🚴 Traversée Bretonne — Nantes → Mont-Saint-Michel</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={shareTBCarte} style={{padding:"3px 10px",borderRadius:7,border:`1.5px solid ${TB_C.done}55`,
                  background:"#f8fbfe",cursor:"pointer",fontSize:11,color:TB_C.done,fontFamily:"Segoe UI,sans-serif"}}>🔗 Partager</button>
                <button onClick={resetTB} style={{padding:"3px 10px",borderRadius:7,border:"1.5px solid #a8c4dc",
                  background:"#f8fbfe",cursor:"pointer",fontSize:11,color:"#3d5a78",fontFamily:"Segoe UI,sans-serif"}}>Réinitialiser</button>
              </div>
            </div>
            <ProgressBar donePct={tbDonePct} todoPct={tbTodoPct} restPct={tbRestPct} doneC={TB_C.done} todoC={TB_C.todo}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <StatBox color={TB_C.done} icon="✅" label="Réalisé"      km={tbDoneKm} pct={tbDonePct}/>
              <StatBox color={TB_C.todo} icon="🎯" label="À faire"      km={tbTodoKm} pct={tbTodoPct}/>
              <StatBox color="#b8a88a"   icon="◯"  label="Non défini"   km={tbRestKm} pct={tbRestPct}/>
              <StatBox color={TB_C.done} icon="🚴" label={`Total · ${TB_SEGMENTS.length} étapes`} km={TB_TOTAL_KM} pct={100}/>
            </div>
          </div>

          {/* Listes tronçons */}
          <div style={{marginTop:8,display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?160:255}px,1fr))`,gap:4,fontFamily:"Segoe UI,sans-serif"}}>
            {SEGMENTS.map(seg=>(
              <div key={seg.id} onClick={()=>cycle(seg.id)} style={{
                padding:"6px 8px",borderRadius:8,cursor:"pointer",
                borderLeft:`4px solid ${col(seg.id)}`,
                background:states[seg.id]==="done"?"#f0fdf4":states[seg.id]==="todo"?"#fff7ed":"white",
                fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"center",
                boxShadow:"0 1px 4px rgba(15,45,78,0.07)"}}>
                <span style={{color:"#1e293f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {stateIcon(states[seg.id])} {seg.name}</span>
                <span style={{color:col(seg.id),marginLeft:6,whiteSpace:"nowrap",fontSize:10,fontWeight:"bold"}}>{seg.km}</span>
              </div>
            ))}
            {DETOURS.map(det=>(
              <div key={det.id} onClick={()=>cycle(det.id)} style={{
                padding:"6px 8px",borderRadius:8,cursor:"pointer",
                borderLeft:`4px dashed ${col(det.id,true)}`,
                background:states[det.id]==="done"?"#f0fdf4":states[det.id]==="todo"?"#fff7ed":"#eff6ff",
                fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"center",
                boxShadow:"0 1px 4px rgba(15,45,78,0.07)"}}>
                <span style={{color:"#1e40af"}}>🚢 {det.name}</span>
                <span style={{color:col(det.id,true),marginLeft:6,whiteSpace:"nowrap",fontSize:10,fontWeight:"bold"}}>{det.km}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:6,display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?160:255}px,1fr))`,gap:4,fontFamily:"Segoe UI,sans-serif"}}>
            {TB_SEGMENTS.map(seg=>(
              <div key={seg.id} onClick={()=>cycleTB(seg.id)} style={{
                padding:"6px 8px",borderRadius:8,cursor:"pointer",
                borderLeft:`4px dashed ${colTB(seg.id)}`,
                background:tbStates[seg.id]==="done"?"#f5f3ff":tbStates[seg.id]==="todo"?"#ecfeff":"white",
                fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"center",
                boxShadow:"0 1px 4px rgba(15,45,78,0.07)"}}>
                <span style={{color:colTB(seg.id),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  🚴 {stateIcon(tbStates[seg.id])} {seg.name}</span>
                <span style={{color:colTB(seg.id),marginLeft:6,whiteSpace:"nowrap",fontSize:10,fontWeight:"bold"}}>{seg.km}</span>
              </div>
            ))}
          </div>

          <p style={{textAlign:"center",fontSize:10,color:"#94a3b8",marginTop:10,marginBottom:0,fontFamily:"Segoe UI,sans-serif"}}>
            Carte schématique · GR34 : 2 126 km + 25 km îles · Traversée Bretonne : {TB_TOTAL_KM} km
          </p>
        </>)}

        {/* ══ ROADBOOK GR34 ══ */}
        {tab==="roadbook"&&(
          <Roadbook storageKey="gr34-roadbook" routeType="gr34"
            headerTitle="Roadbook GR34" headerIcon="📔" emptyIcon="🥾" kmIcon="🥾"
            accentColor="#0f2d4e" session={session} isMobile={isMobile}
            onShareRoadbook={entries=>shareRoadbook("gr34",entries)}/>
        )}

        {/* ══ ROADBOOK VÉLO ══ */}
        {tab==="roadbook-velo"&&(
          <Roadbook storageKey="tb-roadbook" routeType="tb"
            headerTitle="Roadbook Vélo — Traversée Bretonne" headerIcon="🚴" emptyIcon="🚴" kmIcon="🚴"
            accentColor={TB_C.done} session={session} isMobile={isMobile}
            onShareRoadbook={entries=>shareRoadbook("tb",entries)}/>
        )}

      </div>
    </div>
  );
}
