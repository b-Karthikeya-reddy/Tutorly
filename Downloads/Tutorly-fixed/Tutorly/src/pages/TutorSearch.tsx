import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Star, Clock, BookOpen, Filter, X, Building2 } from "lucide-react";

interface Tutor {
  user_id: string;
  full_name: string;
  bio: string;
  subjects: string[];
  experience_years: number;
  university: string;
  major: string;
  avg_rating: number;
  total_reviews: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-6 w-14 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function TutorSearch() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "experience">("rating");
  const [userUniversity, setUserUniversity] = useState<string | null>(null);
  const [sameUniOnly, setSameUniOnly] = useState(true);

  useEffect(() => {
    if (user) fetchUserUniversity();
  }, [user]);

  useEffect(() => {
    fetchTutors();
  }, [userUniversity, sameUniOnly]);

  const fetchUserUniversity = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("university")
      .eq("user_id", user.id)
      .maybeSingle();
    setUserUniversity(data?.university || null);
  };

  const fetchTutors = async () => {
    setLoading(true);

    // Get all tutor profiles
    const { data: tutorProfiles } = await supabase
      .from("tutor_profiles")
      .select("user_id, bio, subjects, experience_years, university, major, avg_rating, total_reviews");

    if (!tutorProfiles?.length) { setLoading(false); return; }

    // Get profiles for names + university
    const userIds = tutorProfiles.map((t) => t.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, university")
      .in("user_id", userIds);

    let merged: Tutor[] = tutorProfiles.map((t) => {
      const profile = profiles?.find((p) => p.user_id === t.user_id);
      return {
        user_id: t.user_id,
        full_name: profile?.full_name || "Tutor",
        bio: t.bio || "",
        subjects: t.subjects || [],
        experience_years: t.experience_years || 0,
        university: profile?.university || t.university || "",
        major: t.major || "",
        avg_rating: t.avg_rating || 0,
        total_reviews: t.total_reviews || 0,
      };
    });

    // Filter to same university if enabled and user has a university
    if (sameUniOnly && userUniversity) {
      merged = merged.filter((t) =>
        t.university.toLowerCase().trim() === userUniversity.toLowerCase().trim()
      );
    }

    // Exclude current user from tutor list
    merged = merged.filter((t) => t.user_id !== user?.id);

    setTutors(merged);
    setLoading(false);
  };

  const allSubjects = [...new Set(tutors.flatMap((t) => t.subjects))].sort();

  const filtered = tutors
    .filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || t.full_name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)) ||
        t.bio.toLowerCase().includes(q) ||
        t.major.toLowerCase().includes(q);
      const matchesSubject = !subjectFilter || t.subjects.includes(subjectFilter);
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => sortBy === "rating"
      ? (b.avg_rating || 0) - (a.avg_rating || 0)
      : (b.experience_years || 0) - (a.experience_years || 0)
    );

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Find a Tutor</h1>
          {userUniversity ? (
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-muted-foreground text-sm">
                {sameUniOnly ? (
                  <>Showing tutors from <span className="font-medium text-foreground">{userUniversity}</span></>
                ) : (
                  "Showing all tutors"
                )}
              </p>
              <button
                onClick={() => setSameUniOnly(!sameUniOnly)}
                className="text-xs text-primary hover:underline ml-1">
                {sameUniOnly ? "Show all universities" : "Show my university only"}
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground mt-1">Browse peer tutors and book a session</p>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, subject, or major..."
              className="w-full rounded-xl border border-input bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-input bg-white pl-9 pr-8 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                <option value="">All Subjects</option>
                {allSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "rating" | "experience")}
              className="rounded-xl border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>

        {/* Active filters */}
        {(search || subjectFilter) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {search && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                "{search}"
                <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {subjectFilter && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {subjectFilter}
                <button onClick={() => setSubjectFilter("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={() => { setSearch(""); setSubjectFilter(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline">
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} tutor{filtered.length !== 1 ? "s" : ""} found
            {sameUniOnly && userUniversity ? ` at ${userUniversity}` : ""}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-20 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground">No tutors found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {sameUniOnly && userUniversity
                ? `No tutors from ${userUniversity} yet. `
                : "Try adjusting your search. "}
              {sameUniOnly && (
                <button onClick={() => setSameUniOnly(false)} className="text-primary hover:underline">
                  Show all universities?
                </button>
              )}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tutor) => (
              <Link key={tutor.user_id} to={`/tutors/${tutor.user_id}`}
                className="group rounded-2xl border border-border bg-white p-6 hover:border-primary/50 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-lg font-bold text-white group-hover:bg-primary/90 transition-colors">
                    {initials(tutor.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {tutor.full_name}
                    </h3>
                    {tutor.major && (
                      <p className="text-xs text-muted-foreground truncate">{tutor.major}</p>
                    )}
                    {tutor.university && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0" /> {tutor.university}
                      </p>
                    )}
                  </div>
                </div>

                {tutor.bio && (
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tutor.bio}</p>
                )}

                {tutor.subjects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tutor.subjects.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
                    ))}
                    {tutor.subjects.length > 4 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        +{tutor.subjects.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  {tutor.avg_rating > 0 ? (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">{Number(tutor.avg_rating).toFixed(1)}</span>
                      <span>({tutor.total_reviews})</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-muted-foreground/40" />
                      New tutor
                    </span>
                  )}
                  {tutor.experience_years > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {tutor.experience_years} yr{tutor.experience_years > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto text-primary font-medium">
                    <BookOpen className="h-3.5 w-3.5" />
                    View Profile
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}