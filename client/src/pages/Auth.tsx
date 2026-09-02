import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Dumbbell, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Auth() {
  const [, navigate] = useLocation();
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      if (mode === "signin") {
        await signIn(email, password);
        navigate("/");
      } else {
        const result = await signUp(email, password, name);
        if (result.needsEmailConfirmation) {
          setMessage("Account created. Check your email to verify your account, then sign in.");
          setMode("signin");
          setPassword("");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#080a0e] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full">
          <button onClick={() => navigate("/")} className="mb-10 flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
            <ArrowLeft size={16} /> Back to GymOS
          </button>

          <div className="mb-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime-300 text-black">
              <Dumbbell size={24} />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back." : "Create your workspace."}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {mode === "signin" ? "Sign in to continue to your gym." : "Start managing your gym with GymOS."}
            </p>
          </div>

          <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[.035] p-6 shadow-2xl shadow-black/20 sm:p-8">
            {mode === "signup" && (
              <label className="mb-4 block">
                <span className="mb-2 block text-xs uppercase tracking-[.18em] text-zinc-500">Full name</span>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-lime-300/60" placeholder="Your name" />
              </label>
            )}
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-[.18em] text-zinc-500">Email</span>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required autoComplete="email" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-lime-300/60" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[.18em] text-zinc-500">Password</span>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required autoComplete={mode === "signin" ? "current-password" : "new-password"} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-lime-300/60" placeholder="At least 6 characters" />
            </label>

            {message && <p className="mt-4 rounded-2xl bg-lime-300/10 p-3 text-sm leading-5 text-lime-300">{message}</p>}
            {error && <p className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm leading-5 text-red-300">{error}</p>}

            <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {mode === "signin" ? "New to GymOS?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="font-medium text-lime-300 hover:text-lime-200">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
