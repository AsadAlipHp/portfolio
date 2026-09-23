import content from "./content.json";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Project = { id: string; title: string; desc: string; tags: string; url: string; year: string };
type Job = { id: string; role: string; company: string; period: string; desc: string };
type Data = {
  name: string; title: string; tagline: string; about: string; email: string;
  location: string; linkedin: string; github: string; skills: string; stats: string; phone: string; skillGroups: string;
  projects: Project[]; jobs: Job[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const KEY = "portfolio-data-v4";

const DEFAULT = content as Data;

function useData() {
  const [data, setData] = useState<Data>(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return { ...DEFAULT, ...JSON.parse(raw) }; } catch {}
    return DEFAULT;
  });
  const dirty = useRef(false);
  useEffect(() => { if (dirty.current) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} } }, [data]);
  const set = (f: (p: Data) => Data) => { dirty.current = true; setData(f); };
  const reset = () => { dirty.current = false; try { localStorage.removeItem(KEY); } catch {} setData(DEFAULT); };
  return [data, set, reset] as const;
}

const ink = "bg-[#0e0f0c] text-[#ece8df]";
const accent = "text-[#ff5a36]";
const mono = "font-['JetBrains_Mono',ui-monospace,monospace]";
const serif = "font-['Fraunces',Georgia,serif]";
const sans = "font-['Instrument_Sans',system-ui,sans-serif]";


/* ---------------------------- ADMIN AUTH ---------------------------- */
const PWKEY = "portfolio-pw-v1";
const SESS = "portfolio-admin-ok";
const SALT = "bd090cf91a6166872ce7f1ec470f1d13";
const HASH = "ee54c2393d4be09a73403e3d200dc301980e3ce9211ba0c4999c1179161f35de";
const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
async function pbkdf2(pw: string, salt: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 200000, hash: "SHA-256" }, key, 256);
  return hex(new Uint8Array(bits));
}
const sessionOk = () => { try { return sessionStorage.getItem(SESS) === "1"; } catch { return false; } };

function Login({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fails = useRef(0);
  const submit = async () => {
    if (busy || !pw) return;
    setBusy(true); setErr("");
    try {
      let cur = { salt: SALT, hash: HASH };
      try { const raw = localStorage.getItem(PWKEY); if (raw) cur = JSON.parse(raw); } catch {}
      if ((await pbkdf2(pw, cur.salt)) === cur.hash) {
        try { sessionStorage.setItem(SESS, "1"); } catch {}
        onOk(); return;
      }
      fails.current += 1;
      await new Promise((r) => setTimeout(r, Math.min(fails.current * 1500, 10000)));
      setErr("Incorrect password.");
    } catch { setErr("Could not verify the password in this browser."); }
    setBusy(false);
  };
  return (
    <div className={`${ink} ${sans} flex min-h-screen items-end px-6 pb-20 md:px-12`}>
      <div className="w-full max-w-md">
        <p className={`${mono} mb-3 text-xs uppercase tracking-[0.3em] ${accent}`}>Restricted</p>
        <h1 className={`${serif} mb-8 text-5xl font-light`}>Admin access</h1>
        <input type="password" autoFocus value={pw} placeholder="Password" onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full border border-white/15 bg-transparent px-3 py-3 outline-none focus:border-[#ff5a36]" />
        {err && <p className={`${mono} mt-3 text-xs ${accent}`}>{err}</p>}
        <div className={`${mono} mt-6 flex gap-3 text-xs uppercase tracking-widest`}>
          <button onClick={submit} disabled={busy} className="bg-[#ff5a36] px-4 py-2 text-black disabled:opacity-50">{busy ? "Checking…" : "Unlock"}</button>
          <button onClick={onCancel} className="border border-white/25 px-4 py-2 hover:border-[#ff5a36] hover:text-[#ff5a36]">Back to site</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- MOTION HELPERS ---------------------------- */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return <div ref={ref} className={className} style={{ opacity: seen ? 1 : 0, transform: seen ? "none" : "translateY(40px)", transition: `opacity .9s ease ${delay}ms, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}ms` }}>{children}</div>;
}
function Counter({ text }: { text: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [v, setV] = useState(0);
  const m = text.trim().match(/^(\D*)([\d.,]+)(.*)$/);
  const to = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const dec = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  useEffect(() => {
    if (!seen || !m) return;
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const p = Math.min((t - t0) / 1800, 1); setV(to * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [seen]);
  if (!m) return <span>{text}</span>;
  return <span ref={ref}>{m[1]}{v.toFixed(dec)}{m[3]}</span>;
}
function Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = () => { const h = document.documentElement; const p = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1); if (ref.current) ref.current.style.transform = `scaleX(${p})`; };
    addEventListener("scroll", f, { passive: true }); f(); return () => removeEventListener("scroll", f);
  }, []);
  return <div ref={ref} className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left bg-[#ff5a36]" style={{ transform: "scaleX(0)" }} />;
}
function Glow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer:fine)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;
    const mv = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => { cx += (x - cx) * 0.1; cy += (y - cy) * 0.1; if (ref.current) ref.current.style.transform = `translate(${cx - 220}px,${cy - 220}px)`; raf = requestAnimationFrame(loop); };
    addEventListener("mousemove", mv); raf = requestAnimationFrame(loop);
    return () => { removeEventListener("mousemove", mv); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-0 h-[440px] w-[440px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle,rgba(255,90,54,.22),transparent 65%)" }} />;
}
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span ref={ref} className="inline-block transition-transform duration-300 ease-out"
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = ""; }}>{children}</span>
  );
}

/* ---------------------------- PUBLIC SITE ---------------------------- */
function Site({ d, onSecret }: { d: Data; onSecret: () => void }) {
  const taps = useRef<number[]>([]);
  const tap = () => { const n = Date.now(); taps.current = [...taps.current.filter((t) => n - t < 2000), n]; if (taps.current.length >= 5) { taps.current = []; onSecret(); } };
  const skills = d.skills.split(",").map((s) => s.trim()).filter(Boolean);
  const groups = d.skillGroups.split("\n").map((l) => { const i = l.indexOf("|"); return i < 0 ? ["", ""] : [l.slice(0, i), l.slice(i + 1)]; }).filter((g) => g[0].trim());
  const stats = d.stats.split("\n").map((l) => l.split("|")).filter((p) => p[0]?.trim());
  const navl = "relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[#ff5a36] after:transition-all after:duration-300 hover:text-[#ff5a36] hover:after:w-full";
  const row = (rev: boolean) => (
    <div className="overflow-hidden py-2">
      <div className={`${serif} flex w-max gap-10 text-4xl md:text-6xl hover:[animation-play-state:paused]`}
        style={{ animation: `${rev ? "marqr" : "marq"} 45s linear infinite`, ...(rev ? { WebkitTextStroke: "1px rgba(236,232,223,.45)", color: "transparent" } : {}) }}>
        {[...skills, ...skills, ...skills].map((s, i) => (<span key={i}>{s}<span className={`${accent} mx-5 text-2xl`}>✦</span></span>))}
      </div>
    </div>
  );
  return (
    <div className={`${ink} ${sans} relative min-h-screen overflow-x-clip`}>
      <Progress /><Glow />
      <div className="relative z-10">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0e0f0c]/80 px-6 py-4 backdrop-blur md:px-12 2xl:px-[max(3rem,calc((100vw-1680px)/2+3rem))]" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <span onClick={tap} className={`${mono} select-none text-sm`}>{d.name.toLowerCase().replace(/\s+/g, "_")}<span className={accent}>.dev</span></span>
          <nav className={`${mono} flex items-center gap-4 text-[10px] uppercase tracking-widest sm:gap-6 sm:text-xs`}>
            <a href="#skills" className={`${navl} hidden sm:inline`}>Skills</a><a href="#work" className={navl}>Work</a><a href="#path" className={navl}>Path</a><a href="#contact" className={navl}>Contact</a>
          </nav>
        </header>
        <div className="mx-auto max-w-[1680px]">

        <section className="relative grid gap-10 overflow-hidden px-6 pb-20 pt-20 md:grid-cols-12 md:px-12 md:pt-28">
          <div className="pointer-events-none absolute -right-24 top-0 h-[460px] w-[460px] rounded-full bg-[#ff5a36]/20 blur-[110px]" style={{ animation: "drift 16s ease-in-out infinite" }} />
          <div className="relative md:col-span-9">
            <p className={`${mono} mb-6 text-xs uppercase tracking-[0.3em] ${accent}`} style={{ animation: "fadeup .8s ease both" }}>
              <span style={{ animation: "blink 1.6s infinite" }}>●</span> Based in {d.location}
            </p>
            <h1 className={`${serif} text-[clamp(3rem,10vw,9rem)] font-light leading-[0.95] tracking-tight`} aria-label={d.name}>
              {d.name.split("").map((c, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                  <span className="inline-block" style={{ animation: `rise 1.1s cubic-bezier(.2,.8,.2,1) ${i * 70 + 150}ms both` }}>{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </h1>
            <p className={`${serif} mt-4 text-2xl italic text-white/60 md:text-4xl`} style={{ animation: "fadeup 1s ease .9s both" }}>{d.title}</p>
          </div>
          <p className="relative self-end text-lg leading-relaxed text-white/70 md:col-span-3" style={{ animation: "fadeup 1s ease 1.1s both" }}>{d.tagline}</p>
        </section>

        <div className="border-y border-white/10 py-4">{row(false)}{row(true)}</div>

        {stats.length > 0 && (
          <section className="grid grid-cols-2 gap-y-10 px-6 py-20 md:grid-cols-4 md:px-12">
            {stats.map((p, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className={`${serif} text-5xl font-light md:text-7xl`}><Counter text={p[0]} /></div>
                <div className={`${mono} mt-3 text-xs uppercase tracking-widest text-white/45`}>{p[1]}</div>
              </Reveal>
            ))}
          </section>
        )}

        <section className="grid gap-10 px-6 py-16 md:grid-cols-12 md:px-12">
          <h2 className={`${mono} text-xs uppercase tracking-[0.3em] text-white/40 md:col-span-3`}>01 — About</h2>
          <Reveal className="md:col-span-8"><p className={`${serif} text-2xl leading-snug md:text-4xl`}>{d.about}</p></Reveal>
        </section>

        <section id="skills" className="px-6 py-16 md:px-12">
          <h2 className={`${mono} mb-6 text-xs uppercase tracking-[0.3em] text-white/40`}>02 — Skills</h2>
          <div className="grid gap-x-12 md:grid-cols-2">
            {groups.map((g, i) => (
              <Reveal key={g[0]} delay={(i % 2) * 100}>
                <div className="border-t border-white/10 py-6">
                  <h3 className={`${mono} mb-3 text-xs uppercase tracking-widest ${accent}`}>{g[0]}</h3>
                  <div className="flex flex-wrap gap-2">
                    {g[1].split(",").map((x) => x.trim()).filter(Boolean).map((x) => (
                      <span key={x} className="border border-white/15 px-3 py-1 text-sm text-white/75 transition-colors hover:border-[#ff5a36] hover:text-[#ff5a36]">{x}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="work" className="px-6 py-12 md:px-12">
          <h2 className={`${mono} mb-6 text-xs uppercase tracking-[0.3em] text-white/40`}>03 — Selected work ({String(d.projects.length).padStart(2, "0")})</h2>
          {d.projects.map((p, i) => (
            <Reveal key={p.id} delay={80}>
              <a href={p.url.startsWith("http") ? p.url : undefined} target="_blank" rel="noreferrer"
                className="group relative grid items-baseline gap-2 overflow-hidden border-t border-white/10 py-8 md:grid-cols-12 md:px-4">
                <span className="absolute inset-0 origin-left scale-x-0 bg-[#ff5a36] transition-transform duration-500 ease-out group-hover:scale-x-100" />
                <span className={`${mono} relative text-xs text-white/40 transition-colors group-hover:text-black md:col-span-1`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={`${serif} relative text-3xl transition-all duration-500 group-hover:translate-x-3 group-hover:text-black md:col-span-5 md:text-5xl`}>{p.title}</span>
                <span className="relative text-white/60 transition-colors group-hover:text-black/80 md:col-span-4">{p.desc}<span className={`${mono} mt-2 block text-xs ${accent} group-hover:text-black`}>{p.tags}</span></span>
                <span className={`${mono} relative text-xs text-white/40 transition-colors group-hover:text-black md:col-span-2 md:text-right`}>{p.year}</span>
              </a>
            </Reveal>
          ))}
        </section>

        <section id="path" className="px-6 py-20 md:px-12">
          <h2 className={`${mono} mb-6 text-xs uppercase tracking-[0.3em] text-white/40`}>04 — Path</h2>
          {d.jobs.map((j, i) => (
            <Reveal key={j.id} delay={i % 3 * 90}>
              <div className="group grid gap-2 border-t border-white/10 py-6 transition-colors hover:border-[#ff5a36] md:grid-cols-12">
                <span className={`${mono} text-xs text-white/40 md:col-span-3`}>{j.period}</span>
                <div className="md:col-span-9">
                  <h3 className={`${serif} text-2xl transition-transform duration-500 group-hover:translate-x-2`}>{j.role} <span className="text-white/40">· {j.company}</span></h3>
                  <p className="mt-2 max-w-2xl text-white/60">{j.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        <footer id="contact" className="border-t border-white/10 px-6 py-28 md:px-12">
          <Reveal>
            <p className={`${mono} mb-4 text-xs uppercase tracking-[0.3em] ${accent}`}>Let's talk</p>
            <Magnetic>
              <a href={d.email ? `mailto:${d.email}` : d.linkedin} target={d.email ? undefined : "_blank"} rel="noreferrer"
                className={`${serif} break-all text-[clamp(1.8rem,6vw,5rem)] underline decoration-[#ff5a36] decoration-2 underline-offset-8 transition-colors hover:text-[#ff5a36]`}>
                {d.email || "Message me on LinkedIn ↗"}
              </a>
            </Magnetic>
            {d.phone && <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`} className={`${mono} mt-8 block text-sm text-white/70 hover:text-[#ff5a36]`}>{d.phone}</a>}
            <div className={`${mono} mt-8 flex gap-6 text-xs uppercase tracking-widest text-white/50`}>
              <a href={d.linkedin} target="_blank" rel="noreferrer" className={navl}>LinkedIn ↗</a>
              {d.github && <a href={d.github} target="_blank" rel="noreferrer" className={navl}>GitHub ↗</a>}
            </div>
          </Reveal>
        </footer>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- DASHBOARD ---------------------------- */
const inp = "w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ff5a36]";
function Field({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) {
  return (
    <label className="block">
      <span className={`${mono} mb-1 block text-[10px] uppercase tracking-widest text-white/40`}>{label}</span>
      {area ? <textarea rows={4} className={inp} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={inp} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function Dashboard({ d, set, reset, onExit }: { d: Data; set: (f: (p: Data) => Data) => void; reset: () => void; onExit: () => void }) {
  const [tab, setTab] = useState<"profile" | "projects" | "experience" | "data">("profile");
  const [npw, setNpw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const changePw = async () => {
    if (npw.length < 8) return setPwMsg("Use at least 8 characters.");
    try {
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      localStorage.setItem(PWKEY, JSON.stringify({ salt, hash: await pbkdf2(npw, salt) }));
      setNpw(""); setPwMsg("Password changed for this browser.");
    } catch { setPwMsg("Could not change the password here."); }
  };
  const up = <K extends keyof Data>(k: K) => (v: Data[K]) => set((p) => ({ ...p, [k]: v }));
  const upP = (id: string, k: keyof Project, v: string) =>
    set((p) => ({ ...p, projects: p.projects.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }));
  const upJ = (id: string, k: keyof Job, v: string) =>
    set((p) => ({ ...p, jobs: p.jobs.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }));
  const btn = "border border-white/25 px-3 py-1.5 text-xs uppercase tracking-widest hover:border-[#ff5a36] hover:text-[#ff5a36]";

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "content.json"; a.click();
  };
  const importJson = (f?: File) => f?.text().then((t) => { try { set(() => ({ ...DEFAULT, ...JSON.parse(t) })); } catch {} });

  const tabs = ["profile", "projects", "experience", "data"] as const;
  return (
    <div className={`${ink} ${sans} min-h-screen md:grid md:grid-cols-[220px_1fr]`}>
      <aside className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
        <p className={`${mono} mb-8 text-sm`}>admin<span className={accent}>/</span>console</p>
        <div className="flex flex-wrap gap-2 md:flex-col">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`${mono} px-3 py-2 text-left text-xs uppercase tracking-widest ${tab === t ? "bg-[#ff5a36] text-black" : "text-white/60 hover:text-white"}`}>{t}</button>
          ))}
        </div>
        <button onClick={onExit} className={`${btn} mt-8`}>Lock & exit</button>
      </aside>

      <main className="max-w-3xl space-y-5 p-6 md:p-10">
        {tab === "profile" && (<>
          <h2 className={`${serif} text-3xl`}>Profile</h2>
          <Field label="Name" value={d.name} onChange={up("name")} />
          <Field label="Title" value={d.title} onChange={up("title")} />
          <Field label="Tagline" value={d.tagline} onChange={up("tagline")} />
          <Field label="About" value={d.about} onChange={up("about")} area />
          <Field label="Skills (comma separated)" value={d.skills} onChange={up("skills")} area />
          <Field label="Skill groups (one per line: Group|item, item)" value={d.skillGroups} onChange={up("skillGroups")} area />
          <Field label="Stats (one per line: value|label)" value={d.stats} onChange={up("stats")} area />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email" value={d.email} onChange={up("email")} />
            <Field label="Phone" value={d.phone} onChange={up("phone")} />
            <Field label="Location" value={d.location} onChange={up("location")} />
            <Field label="LinkedIn URL" value={d.linkedin} onChange={up("linkedin")} />
            <Field label="GitHub URL" value={d.github} onChange={up("github")} />
          </div>
        </>)}

        {tab === "projects" && (<>
          <div className="flex items-center justify-between">
            <h2 className={`${serif} text-3xl`}>Projects</h2>
            <button className={btn} onClick={() => set((p) => ({ ...p, projects: [{ id: uid(), title: "New project", desc: "", tags: "", url: "#", year: String(new Date().getFullYear()) }, ...p.projects] }))}>+ Add project</button>
          </div>
          {d.projects.map((p) => (
            <div key={p.id} className="space-y-3 border border-white/10 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_100px]">
                <Field label="Title" value={p.title} onChange={(v) => upP(p.id, "title", v)} />
                <Field label="Year" value={p.year} onChange={(v) => upP(p.id, "year", v)} />
              </div>
              <Field label="Description" value={p.desc} onChange={(v) => upP(p.id, "desc", v)} area />
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Tags" value={p.tags} onChange={(v) => upP(p.id, "tags", v)} />
                <Field label="Link" value={p.url} onChange={(v) => upP(p.id, "url", v)} />
              </div>
              <button className={btn} onClick={() => set((s) => ({ ...s, projects: s.projects.filter((x) => x.id !== p.id) }))}>Delete</button>
            </div>
          ))}
        </>)}

        {tab === "experience" && (<>
          <div className="flex items-center justify-between">
            <h2 className={`${serif} text-3xl`}>Experience</h2>
            <button className={btn} onClick={() => set((p) => ({ ...p, jobs: [{ id: uid(), role: "Role", company: "Company", period: "Year — Year", desc: "" }, ...p.jobs] }))}>+ Add role</button>
          </div>
          {d.jobs.map((j) => (
            <div key={j.id} className="space-y-3 border border-white/10 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Role" value={j.role} onChange={(v) => upJ(j.id, "role", v)} />
                <Field label="Company" value={j.company} onChange={(v) => upJ(j.id, "company", v)} />
                <Field label="Period" value={j.period} onChange={(v) => upJ(j.id, "period", v)} />
              </div>
              <Field label="Description" value={j.desc} onChange={(v) => upJ(j.id, "desc", v)} area />
              <button className={btn} onClick={() => set((s) => ({ ...s, jobs: s.jobs.filter((x) => x.id !== j.id) }))}>Delete</button>
            </div>
          ))}
        </>)}

        {tab === "data" && (<>
          <h2 className={`${serif} text-3xl`}>Data</h2>
          <p className="text-sm text-white/60">Edits are kept as a draft in this browser only. To publish them: Export JSON, replace src/content.json in your GitHub repo with the exported file, and push — the site redeploys automatically.</p>
          <div className="flex flex-wrap gap-3">
            <button className={btn} onClick={exportJson}>Export JSON</button>
            <label className={`${btn} cursor-pointer`}>Import JSON<input type="file" accept="application/json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} /></label>
            <button className={btn} onClick={() => confirm("Discard local edits and return to the published content?") && reset()}>Reset</button>
          </div>
          <div className="space-y-3 border-t border-white/10 pt-6">
            <h3 className={`${serif} text-2xl`}>Change password</h3>
            <Field label="New password (min 8 characters)" value={npw} onChange={setNpw} />
            <button className={btn} onClick={changePw}>Update password</button>
            {pwMsg && <p className={`${mono} text-xs ${accent}`}>{pwMsg}</p>}
          </div>
        </>)}
      </main>
    </div>
  );
}

export default function App() {
  const [d, set, reset] = useData();
  const [ok, setOk] = useState(sessionOk);
  const [mode, setMode] = useState<"site" | "login" | "admin">(() => (location.hash === "#admin" ? (sessionOk() ? "admin" : "login") : "site"));
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.altKey && e.shiftKey && e.code === "KeyD") { e.preventDefault(); setMode(ok ? "admin" : "login"); } };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [ok]);
  if (mode === "admin" && ok)
    return <Dashboard d={d} set={set} reset={reset} onExit={() => { try { sessionStorage.removeItem(SESS); } catch {} setOk(false); setMode("site"); }} />;
  if (mode !== "site") return <Login onOk={() => { setOk(true); setMode("admin"); }} onCancel={() => setMode("site")} />;
  return <Site d={d} onSecret={() => setMode(ok ? "admin" : "login")} />;
}
