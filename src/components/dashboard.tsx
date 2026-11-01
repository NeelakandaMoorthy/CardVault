"use client";
import { useEffect, useMemo, useState } from "react";
import { Bell, CreditCard, LayoutDashboard, Plus, Search, Settings, Wallet, CircleDollarSign, AlertTriangle, CalendarDays, X, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ageingLabel, daysUntil, inr } from "@/lib/format";
import type { CardInput, CreditCard as Card } from "@/lib/types";

const emptyForm: CardInput = { card_name:"", bank_name:"", credit_limit:0, outstanding:0, statement_amount:0, minimum_due:0, amount_due:0, billing_day:1, due_day:15, due_date:new Date().toISOString().slice(0,10), notes:"" };
const demoCards: Card[] = [];
const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500";
const moneyFields: [keyof CardInput,string][] = [["credit_limit","Credit limit"],["outstanding","Current outstanding"],["statement_amount","Statement amount"],["minimum_due","Minimum amount due"],["amount_due","Total amount due"]];
export default function Dashboard() {
  const [cards,setCards] = useState<Card[]>(demoCards);
  const [loading,setLoading] = useState(true);
  const [configured,setConfigured] = useState(true);
  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing] = useState<string|null>(null);
  const [form,setForm] = useState<CardInput>(emptyForm);
  const [query,setQuery] = useState("");
  const [notice,setNotice] = useState("");
  const [userEmail,setUserEmail] = useState("");
  const [loginEmail,setLoginEmail] = useState("");
  const [signedIn,setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(async ({data}) => {
        if (!active) return;
        if (data.user) { setSignedIn(true); setUserEmail(data.user.email || ""); await loadCards(); }
        else setLoading(false);
      }).catch(() => { if(active) setLoading(false); });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSignedIn(!!session?.user); setUserEmail(session?.user?.email || "");
        if (session?.user) loadCards(); else { setCards([]); setLoading(false); }
      });
      return () => { active = false; listener.subscription.unsubscribe(); };
    } catch { setConfigured(false); setLoading(false); }
  }, []);

  async function loadCards() {
    try {
      const supabase = createClient();
      const {data,error} = await supabase.from("credit_cards").select("*").order("created_at",{ascending:false});
      if (error) throw error;
      setCards((data || []) as Card[]);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not load cards."); }
    finally { setLoading(false); }
  }
  async function signIn() {
    try {
      const supabase = createClient();
      const {error} = await supabase.auth.signInWithOtp({ email: loginEmail, options: { emailRedirectTo: window.location.origin } });
      if(error) throw error; setNotice("Magic sign-in link sent. Check your email.");
    } catch(e) { setNotice(e instanceof Error ? e.message : "Sign-in failed."); }
  }
  async function signOut() { const supabase=createClient(); await supabase.auth.signOut(); setSignedIn(false); setCards([]); }
  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(card:Card) { setEditing(card.id); const {id,user_id,created_at,...rest}=card; setForm(rest); setShowForm(true); }
  async function saveCard() {
    if (!form.card_name.trim() || !form.bank_name.trim()) { setNotice("Enter both card name and bank name."); return; }
    if (cards.length >= 16 && !editing) { setNotice("You can manage a maximum of 16 cards."); return; }
    try {
      const supabase=createClient();
      const payload={...form, credit_limit:Number(form.credit_limit), outstanding:Number(form.outstanding), statement_amount:Number(form.statement_amount), minimum_due:Number(form.minimum_due), amount_due:Number(form.amount_due), billing_day:Number(form.billing_day), due_day:Number(form.due_day)};
      const result=editing ? await supabase.from("credit_cards").update(payload).eq("id",editing) : await supabase.from("credit_cards").insert(payload);
      if(result.error) throw result.error;
      setShowForm(false); setNotice("Card details saved."); await loadCards();
    } catch(e) { setNotice(e instanceof Error ? e.message : "Could not save card."); }
  }
  async function deleteCard(id:string) {
    if(!confirm("Delete this card record? This cannot be undone.")) return;
    try { const {error}=await createClient().from("credit_cards").delete().eq("id",id); if(error) throw error; await loadCards(); setNotice("Card deleted."); }
    catch(e) { setNotice(e instanceof Error ? e.message : "Could not delete card."); }
  }
  const totals=useMemo(()=>cards.reduce((a,c)=>({limit:a.limit+c.credit_limit,outstanding:a.outstanding+c.outstanding,available:a.available+Math.max(0,c.credit_limit-c.outstanding),due:a.due+c.amount_due}),{limit:0,outstanding:0,available:0,due:0}),[cards]);
  const ageing=useMemo(()=>cards.reduce((a,c)=>{ const d=daysUntil(c.due_date); const key=d<0?"overdue":d===0?"today":d<=7?"week":d<=15?"fortnight":d<=30?"month":"later"; a[key]=(a[key]||0)+c.amount_due; return a; },{} as Record<string,number>),[cards]);
  const filtered=cards.filter(c=>`${c.card_name} ${c.bank_name}`.toLowerCase().includes(query.toLowerCase()));
  const stats=[{label:"Available credit",value:inr(totals.available),icon:Wallet,tone:"text-emerald-300",bg:"bg-emerald-400/10"},{label:"Total credit limit",value:inr(totals.limit),icon:CircleDollarSign,tone:"text-blue-300",bg:"bg-blue-400/10"},{label:"Outstanding",value:inr(totals.outstanding),icon:CreditCard,tone:"text-amber-300",bg:"bg-amber-400/10"},{label:"Total amount due",value:inr(totals.due),icon:CalendarDays,tone:"text-rose-300",bg:"bg-rose-400/10"}];
  if (!configured) return <main className="mx-auto max-w-lg p-6 pt-20"><Brand/><section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Connect your Supabase project</h2><p className="mt-2 text-sm text-slate-400">Copy .env.example to .env.local and add your project URL and anon key. Then run the SQL setup in supabase/schema.sql.</p></section></main>;
  if (!signedIn) return <main className="mx-auto max-w-lg px-5 pt-16"><Brand/><section className="mt-9 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300"><ShieldCheck/></div><h1 className="text-2xl font-semibold">Your cards, under control.</h1><p className="mt-2 text-sm leading-6 text-slate-400">Sign in with a private email link to access your credit card dashboard.</p><label className="mt-6 block text-sm text-slate-300">Email address</label><input className={`${inputClass} mt-2`} type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="you@example.com"/><button onClick={signIn} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500">Send secure sign-in link</button><p className="mt-4 text-xs text-slate-500">No card number, CVV, PIN or OTP is required or stored.</p>{notice&&<p className="mt-3 text-sm text-emerald-300">{notice}</p>}</section></main>;
  const ageingRows=[["Overdue","overdue","text-rose-300"],["Due today","today","text-amber-300"],["1–7 days","week","text-yellow-200"],["8–15 days","fortnight","text-sky-300"],["16–30 days","month","text-violet-300"],["31+ days","later","text-slate-300"]] as const;
  return <main className="min-h-screen">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0b1220] p-5 lg:block"><Brand/><nav className="mt-12 space-y-2"><NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active/><NavItem icon={<CreditCard size={18}/>} label="My cards"/><NavItem icon={<CalendarDays size={18}/>} label="Payment calendar"/><NavItem icon={<Bell size={18}/>} label="Alerts"/><NavItem icon={<Settings size={18}/>} label="Settings"/></nav><div className="absolute bottom-5 left-5 right-5"><div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="truncate text-xs text-slate-300">{userEmail}</p><button onClick={signOut} className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white"><LogOut size={14}/> Sign out</button></div></div></aside>
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:ml-64 lg:px-9">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[.2em] text-blue-300">Personal finance</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1><p className="mt-1 text-sm text-slate-400">Your 16-card command centre</p></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 sm:inline-flex"><ShieldCheck size={14} className="mr-1.5"/> Private account</span><button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-950/40 hover:bg-blue-500"><Plus size={17}/> Add card</button></div></header>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(s=><div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{s.label}</span><span className={`rounded-lg p-2 ${s.bg} ${s.tone}`}><s.icon size={18}/></span></div><p className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</p></div>)}</div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.9fr]"><section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Payment ageing</h2><p className="mt-1 text-xs text-slate-400">Amount due grouped by days to due date</p></div><AlertTriangle className="text-amber-300" size={19}/></div><div className="mt-5 space-y-4">{ageingRows.map(([label,key,color])=><div key={key} className="flex items-center justify-between gap-3"><span className="text-sm text-slate-300">{label}</span><span className={`text-sm font-semibold tabular-nums ${color}`}>{inr(ageing[key]||0)}</span></div>)}</div></section><section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="font-semibold">Quick summary</h2><p className="mt-1 text-xs text-slate-400">Your current card portfolio</p><div className="mt-5 flex items-end justify-between"><span className="text-sm text-slate-400">Cards added</span><span className="text-2xl font-semibold">{cards.length}<span className="text-sm text-slate-500"> / 16</span></span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{width:`${cards.length/16*100}%`}}/></div><div className="mt-5 flex items-center justify-between text-sm"><span className="text-slate-400">Credit utilisation</span><span className="font-semibold">{totals.limit?Math.round(totals.outstanding/totals.limit*100):0}%</span></div><p className="mt-4 text-xs leading-5 text-slate-500">Values are based on the latest manual updates you enter for each card.</p></section></div>
      <section className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">My credit cards</h2><p className="mt-1 text-xs text-slate-400">Manage each bank card individually</p></div><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-500"/><input className="w-56 rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search cards..."/></div></div>
        {loading?<p className="py-12 text-center text-sm text-slate-400">Loading your cards…</p>:filtered.length===0?<div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-12 text-center"><CreditCard size={30} className="mx-auto text-slate-600"/><h3 className="mt-3 font-medium">{cards.length?"No matching cards":"No cards added yet"}</h3><p className="mt-1 text-sm text-slate-500">Add your first card to populate the dashboard.</p><button onClick={openNew} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium">Add your first card</button></div>:<div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{filtered.map(c=><CardTile key={c.id} card={c} onEdit={()=>openEdit(c)} onDelete={()=>deleteCard(c.id)}/>)}</div>}
      </section>
      {notice&&<div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm shadow-2xl">{notice}<button onClick={()=>setNotice("")} className="ml-3 text-slate-400">✕</button></div>}
    </section>
    {showForm&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-700 bg-[#101827] p-5 sm:rounded-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{editing?"Edit card":"Add a credit card"}</h2><p className="mt-1 text-xs text-slate-400">Enter the latest figures from your bank statement.</p></div><button onClick={()=>setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X size={19}/></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Card name" value={form.card_name} onChange={v=>setForm({...form,card_name:v})} placeholder="e.g. Amazon Pay ICICI"/><Field label="Bank name" value={form.bank_name} onChange={v=>setForm({...form,bank_name:v})} placeholder="e.g. ICICI Bank"/>{moneyFields.map(([key,label])=><Field key={key} label={`${label} (₹)`} value={String(form[key])} type="number" onChange={v=>setForm({...form,[key]:Number(v)})}/>)}
      <Field label="Billing cycle date (day)" value={String(form.billing_day)} type="number" onChange={v=>setForm({...form,billing_day:Number(v)})}/><Field label="Standard due day (day)" value={String(form.due_day)} type="number" onChange={v=>setForm({...form,due_day:Number(v)})}/><Field label="Next actual payment due date" value={form.due_date} type="date" onChange={v=>setForm({...form,due_date:v})}/><div className="sm:col-span-2"><label className="mb-1.5 block text-xs text-slate-400">Notes (optional)</label><textarea className={inputClass} rows={2} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any reminder or card-specific note"/></div></div><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setShowForm(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm">Cancel</button><button onClick={saveCard} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500">Save card</button></div></div></div></div>}
  </main>;
}
function Brand(){return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><CreditCard size={21}/></div><div><p className="text-lg font-bold tracking-tight">CardVault</p><p className="text-[10px] tracking-[.18em] text-slate-500">CARD MANAGER</p></div></div>}
function NavItem({icon,label,active=false}:{icon:React.ReactNode,label:string,active?:boolean}){return <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active?"bg-blue-500/15 font-medium text-blue-300":"text-slate-400"}`}>{icon}{label}</div>}
function Field({label,value,onChange,type="text",placeholder=""}:{label:string,value:string,onChange:(v:string)=>void,type?:string,placeholder?:string}){return <div><label className="mb-1.5 block text-xs text-slate-400">{label}</label><input className={inputClass} type={type} value={value} min={type==="number"?0:undefined} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}
function CardTile({card,onEdit,onDelete}:{card:Card,onEdit:()=>void,onDelete:()=>void}){const days=daysUntil(card.due_date);const available=card.credit_limit-card.outstanding;const alert=days<0?"Overdue":days===0?"Due today":days<=7?"Due soon":ageingLabel(days);return <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-600"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-300"><CreditCard size={20}/></div><div><h3 className="font-semibold">{card.card_name}</h3><p className="text-xs text-slate-400">{card.bank_name}</p></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${days<0?"bg-rose-500/10 text-rose-300":days<=7?"bg-amber-500/10 text-amber-300":"bg-emerald-500/10 text-emerald-300"}`}>{alert}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Outstanding" value={inr(card.outstanding)}/><Metric label="Available" value={inr(available)}/><Metric label="Amount due" value={inr(card.amount_due)}/><Metric label="Due date" value={new Date(`${card.due_date}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}/></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{width:`${card.credit_limit?Math.min(100,card.outstanding/card.credit_limit*100):0}%`}}/></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>Credit utilisation</span><span>{card.credit_limit?Math.round(card.outstanding/card.credit_limit*100):0}%</span></div><div className="mt-4 flex justify-end gap-2 border-t border-slate-800 pt-3"><button onClick={onDelete} className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-rose-500/10 hover:text-rose-300">Delete</button><button onClick={onEdit} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700">Edit details</button></div></article>}
function Metric({label,value}:{label:string,value:string}){return <div><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums">{value}</p></div>}