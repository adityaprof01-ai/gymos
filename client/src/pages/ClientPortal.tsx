import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CalendarCheck, ChevronRight, Dumbbell, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { api, Attendance, GymMember, Membership } from "@/lib/supabase";

export default function ClientPortal() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [member, setMember] = useState<GymMember | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const members = await api<GymMember[]>("gym_members", `?user_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`);
        const current = members[0];
        if (!current) return;
        setMember(current);
        const [plans, visits] = await Promise.all([
          api<Membership[]>("memberships", `?member_id=eq.${encodeURIComponent(current.id)}&select=*&order=created_at.desc&limit=1`),
          api<Attendance[]>("attendance", `?member_id=eq.${encodeURIComponent(current.id)}&select=*&order=check_in.desc&limit=20`),
        ]);
        setMembership(plans[0] || null);
        setAttendance(visits);
      } catch (err) { setError(err instanceof Error ? err.message : "Unable to load your member data."); }
    })();
  }, [isAuthenticated, user]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#080a0e] text-lime-300"><Dumbbell className="animate-pulse"/></div>;
  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#080a0e] p-6 text-white"><div className="max-w-md text-center"><Dumbbell className="mx-auto text-lime-300"/><h1 className="mt-7 text-4xl font-semibold">Your training, in one place.</h1><p className="mt-4 text-sm leading-6 text-zinc-500">Sign in to view your membership and attendance history.</p><button onClick={() => navigate("/login")} className="mt-7 rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-black">Sign in to continue <ChevronRight className="ml-1 inline" size={15}/></button></div></main>;

  const displayName = member?.full_name || user?.name || "member";
  return <div className="min-h-screen bg-[#080a0e] text-white"><header className="border-b border-white/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><a href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-300 text-black"><Dumbbell size={18}/></span><b>GymOS<span className="text-lime-300">.</span></b></a><button onClick={() => void logout()} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><LogOut size={15}/> Sign out</button></div></header><main className="mx-auto max-w-5xl px-5 py-10"><p className="text-xs uppercase tracking-[.24em] text-lime-300">Member portal</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Keep your momentum, {displayName.split(" ")[0]}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Your membership and attendance are connected to the same GymOS database used by your gym.</p>{error && <p className="mt-5 rounded-2xl bg-red-400/10 p-4 text-sm text-red-300">{error}</p>}<div className="mt-9 grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><CalendarCheck className="text-lime-300" size={20}/><p className="mt-8 text-xs uppercase tracking-[.2em] text-zinc-600">Attendance</p><p className="mt-2 text-2xl font-semibold">{attendance.length}</p><p className="mt-1 text-xs text-zinc-500">Recent check-ins</p></div><div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><ShieldCheck className="text-sky-300" size={20}/><p className="mt-8 text-xs uppercase tracking-[.2em] text-zinc-600">Membership</p><p className="mt-2 text-2xl font-semibold">{membership?.status || "Not found"}</p><p className="mt-1 text-xs text-zinc-500">{membership ? `${membership.plan_name} · ends ${membership.end_date}` : "Contact your gym"}</p></div><div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><Sparkles className="text-amber-300" size={20}/><p className="mt-8 text-xs uppercase tracking-[.2em] text-zinc-600">Profile</p><p className="mt-2 text-lg font-semibold">{member?.status || "Active"}</p><p className="mt-1 text-xs text-zinc-500">Your GymOS member record</p></div></div><section className="mt-8 rounded-3xl border border-white/10 bg-white/[.035] p-6"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-zinc-600">Visit history</p><h2 className="mt-2 text-xl font-medium">Recent check-ins</h2></div><Dumbbell className="text-zinc-600" size={20}/></div><div className="mt-6 space-y-3">{attendance.slice(0,10).map(a=><div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3 text-sm"><span>{new Date(a.check_in).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}</span><span className="text-zinc-500">{a.method}</span></div>)}{!attendance.length && <div className="rounded-2xl border border-dashed border-white/15 p-7 text-sm text-zinc-500">No check-ins have been recorded yet.</div>}</div></section></main></div>;
}
