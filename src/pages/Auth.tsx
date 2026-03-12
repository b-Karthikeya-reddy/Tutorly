import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, BookOpen, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type AppRole = "student" | "tutor";

export default function Auth() {
  const { user, loading, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName, role);
        toast.success("Account created! Welcome to Tutorly 🎉");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-6">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h2 className="font-display text-4xl font-bold">Tutorly</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Connect with fellow students. Book free tutoring sessions. Ace your classes.
          </p>
          <div className="mt-12 space-y-4">
            {[
              "Browse 200+ student tutors",
              "Book sessions in seconds",
              "Chat directly with tutors",
              "Leave reviews after sessions",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-left">
                <div className="h-2 w-2 rounded-full bg-white/60 shrink-0" />
                <span className="text-primary-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">Tutorly</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignUp ? "Join Tutorly today — it's completely free" : "Sign in to your Tutorly account"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignUp && (
              <>
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Role selection */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        role === "student"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <GraduationCap className={`h-6 w-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${role === "student" ? "text-primary" : "text-muted-foreground"}`}>
                        Student
                      </span>
                      <span className="text-xs text-muted-foreground text-center">Looking for help</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("tutor")}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        role === "tutor"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <BookOpen className={`h-6 w-6 ${role === "tutor" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${role === "tutor" ? "text-primary" : "text-muted-foreground"}`}>
                        Tutor
                      </span>
                      <span className="text-xs text-muted-foreground text-center">Offering help</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Please wait...
                </span>
              ) : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}