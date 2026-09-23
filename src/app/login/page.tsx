"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        localStorage.setItem("tsp_auth", "1");
        router.push("/");
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setError("Unable to connect to security gateway.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a] text-zinc-100 selection:bg-zinc-800">
      
      {/* Background ambient glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-[380px] z-10 flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-2xl">
             <img src="/logo.png" alt="HireDesk" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Sign in to HireDesk</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Triple S Production · Private Gateway
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 rounded-xl px-4 py-3 outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 rounded-xl pl-4 pr-11 py-3 outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2">
                <span className="text-red-500">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-4">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}
