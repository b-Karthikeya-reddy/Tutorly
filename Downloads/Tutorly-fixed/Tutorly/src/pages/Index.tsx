import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, BookOpen, ArrowRight, Star, Calendar, Search, MessageCircle } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Tutorly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/auth" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Star className="h-3.5 w-3.5 fill-primary" />
          Free peer tutoring for college students
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Find a Tutor.<br />
          <span className="text-primary">Book a Session.</span><br />
          Ace Your Classes.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Connect with fellow students who excel in your subjects. View their real-time availability
          and book free tutoring sessions instantly — no hassle, no cost.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth" className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors">
            Find a Tutor <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" className="flex items-center gap-2 rounded-xl border-2 border-border px-8 py-3.5 text-base font-semibold text-foreground hover:border-primary/40 transition-colors">
            Offer Tutoring <BookOpen className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "200+", label: "Active Tutors" },
            { value: "1,000+", label: "Sessions Booked" },
            { value: "4.8★", label: "Average Rating" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-foreground">Everything you need to succeed</h2>
          <p className="mt-3 text-muted-foreground">Tutorly makes finding academic help simple and fast</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { icon: Search, title: "Find by Subject", desc: "Search tutors by subject, rating, or availability. Find the perfect match for your academic needs.", color: "bg-blue-50 text-blue-600" },
            { icon: Calendar, title: "Real-Time Availability", desc: "See exactly when tutors are free. No back-and-forth — just pick a slot and book instantly.", color: "bg-primary/10 text-primary" },
            { icon: MessageCircle, title: "Direct Messaging", desc: "Chat with tutors before your session to discuss topics, share materials, and come prepared.", color: "bg-amber-50 text-amber-600" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-white p-8 hover:shadow-md transition-shadow">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">Get started in 3 simple steps</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "Create your profile", desc: "Sign up as a student or tutor. Add your subjects, bio, and availability in minutes." },
              { step: "02", title: "Find your tutor", desc: "Browse tutors by subject. Read their profiles, check ratings, and view open slots." },
              { step: "03", title: "Book & learn", desc: "Book a free session with one click. Get a confirmation and show up ready to learn." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-display text-xl font-bold text-white mb-4">
                  {s.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="rounded-3xl bg-primary px-8 py-16">
          <h2 className="font-display text-4xl font-bold text-white">Ready to ace your classes?</h2>
          <p className="mt-3 text-primary-foreground/80">Join hundreds of students already using Tutorly</p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary hover:bg-white/90 transition-colors">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">Tutorly</span>
          </div>
          <p className="text-sm text-muted-foreground">Connecting college students, one session at a time.</p>
        </div>
      </footer>
    </div>
  );
}