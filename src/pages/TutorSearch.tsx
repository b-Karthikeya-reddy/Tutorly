import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Star, SlidersHorizontal, X } from "lucide-react";

interface Tutor {
  user_id: string;
  bio: string;
  subjects: string[];
  qualifications: string;
  experience_years: number;
  university: string;
  major: string;
  avg_rating: number;
  total_reviews: number;
  full_name: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

function TutorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-4/5 bg-muted rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 bg-muted rounded-full" />
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
      <div className="mt-4 h-10 w-full bg-muted rounded-xl" />
    </div>
  );
}

export default function TutorSearch() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("highest_rated");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchTutors(); }, []);

  const fetchTutors = async () => {
    setLoading(true);
    const { data: tutorProfiles } = await supabase
      .from("tutor_profiles")
      .select("user_id, bio, subjects, qualifications, experience_years, university, major, avg_rating, total_reviews");

    if (!tutorProfiles?.length) { setLoading(false); return; }

    const userIds = tutorProfiles.map((t) => t.user_id);
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", userIds);

    const merged: Tutor[] = tutorProfiles.map((t) => ({
      ...t,
      full_name: profiles?.find((p) => p.user_id === t.user_id)?.full_name || "Tutor",
    }));

    setTutors(merged);
    setLoading(false);
  };

  const allSubjects = [...new Set(tutors.flatMap((t) => t.subjects))].sort();

  const filtered = tutors
    .filter((t) => {
      const matchSearch = !search ||
        t.full_name.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        t.university.toLowerCase().includes(search.toLowerCase());
      const matchSubjects = selectedSubjects.length === 0 || selectedSubjects.every((s) => t.subjects.includes(s));
      const matchRating = t.avg_rating >= minRating;
      return matchSearch && matchSubjects && matchRating;
    })
    .sort((a, b) => {
      if (sortBy === "highest_rated") return b.avg_rating - a.avg_rating;
      if (sortBy === "most_reviews") return b.total_reviews - a.total_reviews;
      return 0;
    });

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]);
  };

  const clearFilters = () => { setSelectedSubjects([]); setMinRating(0); setSortBy("highest_rated"); setSearch(""); };
  const hasFilters = selectedSubjects.length > 0 || minRating > 0 || search;
  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Find a Tutor</h1>
          <p className="mt-1 text-muted-foreground">Browse {tutors.length} student tutors ready to help</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, subject, or university..."
              className="w-full rounded-xl border border-input bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="highest_rated">Highest Rated</option>
            <option value="most_reviews">Most Reviews</option>
            <option value="newest">Newest</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${showFilters ? "border-primary bg-primary/5 text-primary" : "border-input bg-white text-muted-foreground hover:text-foreground"}`}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {selectedSubjects.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">{selectedSubjects.length}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-2xl border border-border bg-white p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {allSubjects.map((subject) => (
                    <button key={subject} onClick={() => toggleSubject(subject)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedSubjects.includes(subject) ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Minimum Rating: {minRating > 0 ? `${minRating}★` : "Any"}</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${minRating === r ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"}`}>
                      {r === 0 ? "Any" : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <TutorCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">No tutors found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
            {hasFilters && <button onClick={clearFilters} className="mt-4 text-sm text-primary hover:underline">Clear all filters</button>}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Showing {filtered.length} tutor{filtered.length !== 1 ? "s" : ""}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tutor) => (
                <div key={tutor.user_id} className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-white">
                      {initials(tutor.full_name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">{tutor.full_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{tutor.university}</p>
                      <p className="text-xs text-muted-foreground truncate">{tutor.major}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <StarDisplay rating={tutor.avg_rating} />
                    <span className="text-sm font-medium text-foreground">{tutor.avg_rating > 0 ? tutor.avg_rating.toFixed(1) : "New"}</span>
                    {tutor.total_reviews > 0 && <span className="text-xs text-muted-foreground">({tutor.total_reviews} reviews)</span>}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{tutor.bio || "No bio yet"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tutor.subjects.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
                    ))}
                    {tutor.subjects.length > 3 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">+{tutor.subjects.length - 3} more</span>
                    )}
                  </div>
                  <Link to={`/tutors/${tutor.user_id}`}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    View Profile & Book
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}