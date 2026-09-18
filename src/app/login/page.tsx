"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Btn } from "@/components/ui";

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
      // Secure server-side Supabase verification request
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.session) {
          // Set session on the client-side supabase instance
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020202]">
      
      {/* Premium Micro-Animations & Dynamic Glowing Layouts */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes driftGlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.15); opacity: 0.25; }
        }
        @keyframes driftGlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-30px, 40px) scale(0.9); opacity: 0.2; }
        }
        @keyframes subtlePan {
          0% { background-position: 0px 0px; }
          100% { background-position: 24px 24px; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(255,255,255,0.04); box-shadow: 0 0 30px rgba(0,0,0,0.8); }
          50% { border-color: rgba(255,255,255,0.14); box-shadow: 0 0 45px rgba(255,255,255,0.05); }
        }
        @keyframes meshDrift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .anim-drift-1 {
          animation: driftGlow1 14s ease-in-out infinite;
        }
        .anim-drift-2 {
          animation: driftGlow2 18s ease-in-out infinite alternate;
        }
        .grid-animated {
          animation: subtlePan 18s linear infinite;
        }
        .cool-form-card {
          position: relative;
          background: rgba(8, 8, 8, 0.72) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          animation: borderGlow 6s ease-in-out infinite;
          overflow: hidden;
        }
        .cool-form-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0.015) 100%);
          background-size: 200% 200%;
          animation: meshDrift 8s ease infinite;
          opacity: 0.9;
        }
        .anim-stagger-logo { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards; opacity: 0; }
        .anim-stagger-header { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards; opacity: 0; }
        .anim-stagger-email { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards; opacity: 0; }
        .anim-stagger-pass { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards; opacity: 0; }
        .anim-stagger-btn { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.32s forwards; opacity: 0; }
        .anim-stagger-demo { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.40s forwards; opacity: 0; }
      `}</style>

      {/* Background Interactive Panning Matrix */}
      <div className="absolute inset-0 grid-animated pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.02) 1.2px, transparent 0)",
          backgroundSize: "24px 24px",
          opacity: 0.8
        }} />
      
      {/* Drifting Ambient Background Glowing Meshes */}
      <div className="absolute top-[8%] left-[22%] w-[450px] h-[450px] rounded-full bg-white/[0.035] blur-[130px] pointer-events-none anim-drift-1" />
      <div className="absolute bottom-[12%] right-[22%] w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[160px] pointer-events-none anim-drift-2" />

      {/* Main Centered Container */}
      <div className="w-full max-w-[390px] z-10 flex flex-col gap-6">
        
        {/* Company Header Block: Logo at Left Side of the Name */}
        <div className="flex flex-col items-center gap-1.5 anim-stagger-logo">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-black transition-transform hover:rotate-12 duration-300">
              <img src="/logo.png" alt="HireDesk Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-none">HireDesk</h1>
          </div>
          <p className="text-[16px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Triple S Production · Private Gateway
          </p>
        </div>

        {/* Translucent Glassmorphic Form Card with Pulsing Glowing Border & drifting interior mesh */}
        <div className="p-8 rounded-3xl cool-form-card" 
          style={{ 
            backdropFilter: "blur(24px)",
          }}>
          
          {/* Subtle horizontal highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          
          <div className="mb-6 anim-stagger-header">
            <h2 className="text-lg font-bold text-zinc-200">Welcome Back, Admin</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium leading-relaxed">
              Verify your staffing node credentials securely via Supabase Auth.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Work Email Field */}
            <div className="anim-stagger-email">
              <label className="block text-[16px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@triplesproduction.com"
                className="w-full rounded-xl text-sm px-4 py-3.5 outline-none transition-all placeholder:text-zinc-700 bg-zinc-950/40 border border-white/5 text-white focus:border-white/20 focus:bg-zinc-900/40"
              />
            </div>

            {/* Password Field */}
            <div className="anim-stagger-pass">
              <label className="block text-[16px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl text-sm pl-4 pr-12 py-3.5 outline-none transition-all placeholder:text-zinc-700 bg-zinc-950/40 border border-white/5 text-white focus:border-white/20 focus:bg-zinc-900/40"
                />
                <Btn
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Btn>
              </div>
            </div>

            {error && (
              <div className="flex flex-col gap-3">
                <div className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ color: "#ff5a5a", background: "rgba(255,90,90,0.06)", border: "1px solid rgba(255,90,90,0.15)" }}>
                  {error}
                </div>
                
                {/* Premium Troubleshooting Helper panel */}
                <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 text-[15px] leading-relaxed text-zinc-400 flex flex-col gap-3.5 max-h-[220px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-bold text-zinc-200 uppercase tracking-widest text-[9px]">Supabase Gateway Assistance</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  
                  <div className="flex flex-col gap-2.5 text-left">
                    <div>
                      <span className="text-white font-semibold block mb-0.5">Option A: Disable Email Confirmation (Simplest)</span>
                      <p className="text-zinc-500">
                        In your Supabase Dashboard, go to <span className="text-zinc-300">Authentication → Providers → Email</span> and turn OFF <span className="text-zinc-300">"Confirm email"</span>. Then retry logging in!
                      </p>
                    </div>

                    <div>
                      <span className="text-white font-semibold block mb-0.5">Option B: Run Direct SQL Seed (Instant)</span>
                      <p className="text-zinc-500 mb-1.5">
                        Paste this query into your <span className="text-zinc-300">Supabase SQL Editor</span> and click <span className="text-zinc-300">Run</span> to instantly seed & confirm the admin user:
                      </p>
                      <div className="relative">
                        <pre className="p-2 rounded bg-black text-[9px] font-mono text-zinc-400 overflow-x-auto max-h-[100px] select-all border border-white/5">
                          {`CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@triplesproduction.com';
  
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@triplesproduction.com',
      crypt('TSP@2024', gen_salt('bf')),
      now(), null, null,
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(), now(),
      '', '', '', ''
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('TSP@2024', gen_salt('bf')),
        email_confirmed_at = now()
    WHERE id = user_id;
  END IF;
END $$;`}
                        </pre>
                        <Btn
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@triplesproduction.com';
  
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@triplesproduction.com',
      crypt('TSP@2024', gen_salt('bf')),
      now(), null, null,
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(), now(),
      '', '', '', ''
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('TSP@2024', gen_salt('bf')),
        email_confirmed_at = now()
    WHERE id = user_id;
  END IF;
END $$;`);
                            alert("SQL query copied to clipboard!");
                          }}
                          className="absolute right-2 top-2 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[8px] text-zinc-300 font-bold uppercase transition-colors"
                        >
                          Copy
                        </Btn>
                      </div>
                    </div>

                    <div>
                      <span className="text-white font-semibold block mb-0.5">Option C: Add Service Role Key</span>
                      <p className="text-zinc-500">
                        Add <span className="font-mono text-zinc-300">SUPABASE_SERVICE_ROLE_KEY</span> to <span className="font-mono text-zinc-300">.env.local</span> to allow automatic admin provisioning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="anim-stagger-btn">
              <Btn
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3.5 rounded-xl transition-all duration-300 mt-2 disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Authorize session →"
                )}
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
