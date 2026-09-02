import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { api, Attendance, Gym, GymMember, Membership, Payment } from "@/lib/supabase";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart3, Check, ChevronRight, Dumbbell, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, Users, X } from "lucide-react";

const nav = ["Overview", "Members", "Attendance", "Memberships", "Workouts"] as const;
type Tab = typeof nav[number];

type DashboardData = {
  gym: Gym | null;
  members: GymMember[];
  memberships: Membership[];
  payments: Payment[];
  attendance: Attendance[];
};

const emptyData: DashboardData = { gym: null, members: [], memberships: [], payments: [], attendance: [] };

function Landing() {
  const [, navigate] = useLocation();
  return <div className="min-h-screen bg-[#080a0e] text-white">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
      <a className="flex items-center gap-3" href="/"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-300 text-black"><Dumbbell size={20}/></span><span className="font-semibold tracking-tight">GymOS<span className="text-lime-300">.</span></span></a>
      <button onClick={() => navigate("/login")} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-lime-300 hover:text-white">Open workspace <ChevronRight className="ml-1 inline" size={15}/></button>
    </nav>
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-14 lg:px-8 lg:pt-24">
      <div className="grid items-end gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div><p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[.28em] text-lime-300"><span className="h-1.5 w-1.5 rounded-full bg-lime-300"/> The operating system for modern gyms</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-.05em] sm:text-7xl">Run the floor.<br/><span className="text-zinc-600">Know the business.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400">One calm workspace for member relationships, daily attendance, memberships, payments and training plans.</p>
          <button onClick={() => navigate("/login")} className="mt-9 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black hover:bg-lime-200">Start your workspace <ChevronRight className="ml-1 inline" size={16}/></button>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-[#10141a] p-4 shadow-2xl"><div className="rounded-2xl border border-white/10 bg-[#0b0e13] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-zinc-600">Owner workspace</p><p className="mt-2 text-lg font-medium">Live gym operations</p></div><span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs text-lime-300">Connected</span></div><div className="mt-7 grid grid-cols-3 gap-3">{[["Members","Real-time"],["Attendance","Today"],["Payments","Tracked"]].map(([a,b])=><div key={a} className="rounded-2xl bg-white/[.05] p-3"><p className="text-[10px] text-zinc-600">{a}</p><p className="mt-3 text-sm font-semibold">{b}</p></div>)}</div></div></div>
      </div>
    </main>
    <section className="border-t border-white/10"><div className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:grid-cols-3 lg:px-8"><Feature icon={<Users/>} title="Member-first" text="Profiles, memberships and contact details in one trusted record."/><Feature icon={<ShieldCheck/>} title="Secure by design" text="The workspace resolves access from the authenticated Supabase user."/><Feature icon={<BarChart3/>} title="Real data" text="Attendance, plans and payments are read directly from your existing database."/></div></section>
  </div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-3xl border border-white/10 p-5"><span className="text-lime-300">{icon}</span><h3 className="mt-8 font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></div>; }
function Metric({ label, value, detail, tone = "lime" }: { label: string; value: string; detail: string; tone?: "lime" | "blue" | "amber" }) { const colors = { lime: "text-lime-300", blue: "text-sky-300", amber: "text-amber-300" }; return <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5"><p className="text-[11px] uppercase tracking-[.22em] text-zinc-500">{label}</p><div className={`mt-5 text-3xl font-semibold tracking-tight ${colors[tone]}`}>{value}</div><p className="mt-2 text-xs text-zinc-500">{detail}</p></div>; }

async function resolveGym(userId: string): Promise<Gym | null> {
  const owned = await api<Gym[]>("gyms", `?owner_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.asc&limit=1`);
  if (owned[0]) return owned[0];
  const staff = await api<{ gym_id: string }[]>("gym_staff", `?user_id=eq.${encodeURIComponent(userId)}&select=gym_id&limit=1`);
  if (staff[0]) { const gyms = await api<Gym[]>("gyms", `?id=eq.${encodeURIComponent(staff[0].gym_id)}&select=*&limit=1`); return gyms[0] || null; }
  return null;
}

function Portal({ user, onLogout }: { user: { id: string; name: string; role: string }; onLogout: () => Promise<void> }) {
  const [active, setActive] = useState<Tab>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "", phone: "" });
  const [newGymName, setNewGymName] = useState("");
  const [creatingGym, setCreatingGym] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const gym = await resolveGym(user.id);
      if (!gym) { setData({ ...emptyData, gym: null }); return; }
      const [members, memberships, payments, attendance] = await Promise.all([
        api<GymMember[]>("gym_members", `?gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=created_at.desc`),
        api<Membership[]>("memberships", `?gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=created_at.desc`),
        api<Payment[]>("payments", `?gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=paid_at.desc`),
        api<Attendance[]>("attendance", `?gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=check_in.desc`),
      ]);
      setData({ gym, members, memberships, payments, attendance });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load your gym data."); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  const createGym = async () => {
    if (!newGymName.trim()) return;
    setCreatingGym(true); setError("");
    try {
      const rows = await api<Gym[]>("gyms", "", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: newGymName.trim(), owner_id: user.id }) });
      if (!rows[0]) throw new Error("Gym could not be created.");
      setNewGymName(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create gym."); }
    finally { setCreatingGym(false); }
  };

  const addMember = async () => {
    if (!data.gym || !newMember.name.trim()) return;
    setError("");
    try {
      await api("gym_members", "", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ gym_id: data.gym.id, full_name: newMember.name.trim(), email: newMember.email.trim() || null, phone: newMember.phone.trim() || null, qr_token: crypto.randomUUID(), status: "active" }) });
      setNewMember({ name: "", email: "", phone: "" }); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to add member."); }
  };

  const activeMembers = data.members.filter(m => m.status.toLowerCase() === "active").length;
  const activePlans = data.memberships.filter(m => m.status.toLowerCase() === "active").length;
  const paidRevenue = data.payments.filter(p => p.status.toLowerCase() === "paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const today = new Date(); const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()); const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayAttendance = data.attendance.filter(a => { const t = new Date(a.check_in).getTime(); return t >= start.getTime() && t < end.getTime(); }).length;
  const firstName = user.name.split(" ")[0] || "operator";

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#080a0e] text-lime-300"><Dumbbell className="animate-pulse"/></div>;
  if (!data.gym) return <div className="grid min-h-screen place-items-center bg-[#080a0e] p-6 text-white"><div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-black"><Dumbbell/></div><h1 className="mt-7 text-3xl font-semibold">Set up your gym.</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Your account is connected. Create the first gym workspace to start using GymOS.</p><input value={newGymName} onChange={e => setNewGymName(e.target.value)} placeholder="Gym name" className="mt-6 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-lime-300/60"/><button onClick={createGym} disabled={creatingGym || !newGymName.trim()} className="mt-3 w-full rounded-2xl bg-lime-300 px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-50">{creatingGym ? "Creating…" : "Create gym"}</button>{error && <p className="mt-4 text-sm text-red-300">{error}</p>}<button onClick={onLogout} className="mt-5 w-full text-sm text-zinc-500 hover:text-white">Sign out</button></div></div>;

  return <div className="min-h-screen bg-[#080a0e] text-white">
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-white/10 bg-[#0b0e13] p-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between"><a className="flex items-center gap-3" href="/"><span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-300 text-black"><Dumbbell size={18}/></span><b>GymOS<span className="text-lime-300">.</span></b></a><button onClick={() => setMobileOpen(false)} className="lg:hidden"><X size={18}/></button></div>
      <p className="mt-12 px-3 text-[10px] uppercase tracking-[.24em] text-zinc-600">{data.gym.name}</p><div className="mt-3 space-y-1">{nav.map(item => <button key={item} onClick={() => { setActive(item); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === item ? "bg-lime-300 text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><LayoutDashboard size={16}/>{item}</button>)}</div>
      <div className="absolute bottom-5 left-5 right-5"><button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/5 hover:text-white"><LogOut size={16}/> Sign out</button></div>
    </aside>
    <main className="lg:pl-72"><header className="flex h-20 items-center justify-between border-b border-white/10 px-5 lg:px-10"><button onClick={() => setMobileOpen(true)} className="lg:hidden"><Menu/></button><div><p className="text-[10px] uppercase tracking-[.23em] text-zinc-600">{active}</p><h1 className="mt-1 text-xl font-semibold">Good morning, {firstName}.</h1></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 sm:inline">{user.role}</span><div className="grid h-9 w-9 place-items-center rounded-full bg-lime-300 font-semibold text-black">{firstName[0]?.toUpperCase()}</div></div></header>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10">{error && <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {active === "Overview" && <><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-zinc-500">{today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Your gym at a glance.</h2></div><button onClick={() => setActive("Members")} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black">Add a member <ChevronRight className="ml-1 inline" size={15}/></button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Active members" value={String(activeMembers)} detail="Current active members"/><Metric label="Today's attendance" value={String(todayAttendance)} detail="Check-ins recorded today" tone="blue"/><Metric label="Collected revenue" value={`₹${paidRevenue.toLocaleString("en-IN")}`} detail="Paid transactions" tone="amber"/><Metric label="Active memberships" value={String(activePlans)} detail="Currently active plans"/></div><div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><div className="rounded-3xl border border-white/10 bg-white/[.035] p-6"><p className="text-xs uppercase tracking-[.2em] text-zinc-600">Member activity</p><h3 className="mt-2 text-lg font-medium">Your live database, at a glance.</h3><div className="mt-8 grid grid-cols-7 items-end gap-2">{Array.from({length: 7}, (_, i) => { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i)); const count = data.attendance.filter(a => { const t = new Date(a.check_in); return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate(); }).length; const height = Math.max(8, Math.min(100, count * 12)); return <div key={i} className="flex h-40 flex-col items-center justify-end gap-2"><div title={`${count} check-ins`} className="w-full rounded-t-lg bg-lime-300/70" style={{ height: `${height}%` }}/><span className="text-[10px] text-zinc-600">{d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0,1)}</span></div>; })}</div></div><div className="rounded-3xl border border-white/10 bg-lime-300 p-6 text-black"><Check size={20}/><p className="mt-8 text-xs uppercase tracking-[.2em] text-black/50">Workspace status</p><h3 className="mt-3 text-2xl font-semibold leading-tight">Supabase is your source of truth.</h3><p className="mt-3 text-sm leading-6 text-black/70">Members, attendance, memberships and payments shown here come from your existing GymOS database.</p></div></div></>}
        {active === "Members" && <MembersTab members={data.members} newMember={newMember} setNewMember={setNewMember} onAdd={addMember}/>} 
        {active === "Attendance" && <AttendanceTab attendance={data.attendance} members={data.members}/>} 
        {active === "Memberships" && <MembershipsTab memberships={data.memberships} members={data.members} payments={data.payments}/>} 
        {active === "Workouts" && <div><p className="text-sm text-zinc-500">Training library</p><h2 className="mt-2 text-3xl font-semibold">Workout plans</h2><div className="mt-7 rounded-3xl border border-dashed border-white/15 p-8 text-sm leading-6 text-zinc-500">Your current Supabase schema does not include a workout/workout-plan table, so GymOS is intentionally not showing fabricated plans. Once a workout table is added, this section can be connected to it.</div></div>}
      </section>
    </main>
  </div>;
}

function MembersTab({ members, newMember, setNewMember, onAdd }: { members: GymMember[]; newMember: {name:string;email:string;phone:string}; setNewMember: React.Dispatch<React.SetStateAction<{name:string;email:string;phone:string}>>; onAdd: () => Promise<void> }) { const rows = useMemo(() => members.slice(0, 50), [members]); return <div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-zinc-500">People directory</p><h2 className="mt-2 text-3xl font-semibold">Members</h2></div><div className="flex flex-wrap gap-2"><input value={newMember.name} onChange={e=>setNewMember(v=>({...v,name:e.target.value}))} placeholder="Name" className="w-40 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none"/><input value={newMember.phone} onChange={e=>setNewMember(v=>({...v,phone:e.target.value}))} placeholder="Phone" className="w-32 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none"/><button onClick={() => void onAdd()} disabled={!newMember.name.trim()} className="rounded-full bg-lime-300 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"><Plus className="mr-1 inline" size={15}/> Add</button></div></div><div className="mt-7 overflow-hidden rounded-3xl border border-white/10"><div className="hidden grid-cols-[1.5fr_1fr_120px] border-b border-white/10 px-5 py-4 text-[10px] uppercase tracking-[.2em] text-zinc-600 sm:grid"><span>Member</span><span>Contact</span><span>Status</span></div>{rows.length ? rows.map(m=><div key={m.id} className="grid gap-2 border-b border-white/5 px-5 py-4 text-sm sm:grid-cols-[1.5fr_1fr_120px] sm:items-center"><span className="font-medium">{m.full_name}</span><span className="text-zinc-500">{m.email || m.phone || "No contact"}</span><span className="text-lime-300">{m.status}</span></div>) : <p className="p-8 text-sm text-zinc-500">No members yet. Add your first member above.</p>}</div></div>; }
function AttendanceTab({ attendance, members }: { attendance: Attendance[]; members: GymMember[] }) { const names = new Map(members.map(m=>[m.id,m.full_name])); return <div><p className="text-sm text-zinc-500">Front-desk activity</p><h2 className="mt-2 text-3xl font-semibold">Attendance</h2><div className="mt-7 overflow-hidden rounded-3xl border border-white/10">{attendance.slice(0,50).map(a=><div key={a.id} className="grid gap-1 border-b border-white/5 px-5 py-4 sm:grid-cols-[1.5fr_1fr_120px]"><span className="font-medium">{names.get(a.member_id) || "Member"}</span><span className="text-zinc-500">{new Date(a.check_in).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}</span><span className="text-zinc-500">{a.method}</span></div>)}{!attendance.length && <p className="p-8 text-sm text-zinc-500">No attendance records yet.</p>}</div></div>; }
function MembershipsTab({ memberships, members, payments }: { memberships: Membership[]; members: GymMember[]; payments: Payment[] }) { const names = new Map(members.map(m=>[m.id,m.full_name])); return <div><p className="text-sm text-zinc-500">Plans and payments</p><h2 className="mt-2 text-3xl font-semibold">Memberships</h2><div className="mt-7 overflow-hidden rounded-3xl border border-white/10"><div className="grid grid-cols-[1.4fr_1fr_1fr_120px] border-b border-white/10 px-5 py-4 text-[10px] uppercase tracking-[.2em] text-zinc-600"><span>Member</span><span>Plan</span><span>Ends</span><span>Status</span></div>{memberships.slice(0,50).map(m=><div key={m.id} className="grid grid-cols-[1.4fr_1fr_1fr_120px] border-b border-white/5 px-5 py-4 text-sm"><span>{names.get(m.member_id) || "Member"}</span><span>{m.plan_name}</span><span className="text-zinc-500">{m.end_date}</span><span className="text-lime-300">{m.status}</span></div>)}{!memberships.length && <p className="p-8 text-sm text-zinc-500">No memberships yet.</p>}</div><div className="mt-8 rounded-3xl border border-white/10 p-6"><p className="text-xs uppercase tracking-[.2em] text-zinc-600">Payment history</p><div className="mt-4 space-y-3">{payments.slice(0,10).map(p=><div key={p.id} className="flex items-center justify-between border-b border-white/5 pb-3 text-sm"><span>{names.get(p.member_id) || "Member"}</span><span className="text-amber-300">₹{Number(p.amount).toLocaleString("en-IN")}</span></div>)}{!payments.length && <p className="text-sm text-zinc-500">No payments yet.</p>}</div></div></div>; }

export default function Home() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#080a0e] text-lime-300"><Dumbbell className="animate-pulse"/></div>;
  if (!isAuthenticated || !user) return <Landing/>;
  if (user.role === "member") return <div className="grid min-h-screen place-items-center bg-[#080a0e] p-6 text-white"><div className="text-center"><Dumbbell className="mx-auto text-lime-300"/><h1 className="mt-5 text-2xl font-semibold">Member portal</h1><p className="mt-2 text-sm text-zinc-500">Your member workspace is available at /client.</p><a href="/client" className="mt-5 inline-block rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black">Open portal</a></div></div>;
  return <Portal user={user} onLogout={logout}/>;
}
