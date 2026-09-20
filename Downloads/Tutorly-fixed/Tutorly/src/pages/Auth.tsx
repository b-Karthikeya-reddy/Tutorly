import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "tutor";
type Mode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (mode === "signup" && !fullName.trim()) { toast.error("Please enter your full name"); return; }
    if (mode === "signup" && !university.trim()) { toast.error("Please enter your university"); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role, university } },
        });
        if (error) throw error;

        // Update profiles with university
        if (data.user) {
          await supabase.from("profiles").update({ university: university.trim() }).eq("user_id", data.user.id);
        }

        toast.success("Account created! Welcome to Tutorly 🎉");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white">Tutorly</span>
        </Link>

        <div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Learn from peers who've been in your shoes
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Connect with top students at your university who know your professors, your exams, and exactly what it takes to succeed.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { emoji: "🎓", text: "Tutors from your own university" },
              { emoji: "📅", text: "Book sessions that fit your schedule" },
              { emoji: "💬", text: "Message tutors directly" },
              { emoji: "⭐", text: "Read verified student reviews" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-white/80 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2025 Tutorly. Free peer tutoring platform.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Tutorly</span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to your account" : "Join your university's tutoring community"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${mode === m ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <>
                {/* Role selector */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["student", "tutor"] as Role[]).map((r) => (
                      <button key={r} onClick={() => setRole(r)}
                        className={`rounded-xl border-2 p-4 text-center transition-all ${role === r ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <div className="text-2xl mb-1">{r === "student" ? "📚" : "🎓"}</div>
                        <div className={`text-sm font-semibold capitalize ${role === r ? "text-primary" : "text-foreground"}`}>{r}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r === "student" ? "Find tutors" : "Teach peers"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">University</label>
                  <input value={university} onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Texas at Austin"
                    className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <p className="text-xs text-muted-foreground">You'll only see tutors from your university</p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-input px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium hover:underline">
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}