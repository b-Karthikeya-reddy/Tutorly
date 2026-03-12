import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Star, MessageCircle, Calendar, Clock, ChevronLeft, BookOpen, Award, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TutorData {
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

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_name: string;
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sizes[size]} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function TutorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (id) { fetchTutor(); fetchSlots(); fetchReviews(); }
  }, [id]);

  const fetchTutor = async () => {
    const { data: tp } = await supabase
      .from("tutor_profiles")
      .select("user_id, bio, subjects, qualifications, experience_years, university, major, avg_rating, total_reviews")
      .eq("user_id", id)
      .maybeSingle();

    if (!tp) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("user_id", id).maybeSingle();

    setTutor({ ...tp, full_name: profile?.full_name || "Tutor" });
    setSelectedSubject(tp.subjects?.[0] || "");
    setLoading(false);
  };

  const fetchSlots = async () => {
    const { data } = await supabase
      .from("availability_slots")
      .select("id, slot_date, start_time, end_time")
      .eq("tutor_id", id)
      .eq("is_booked", false)
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date").order("start_time");
    setSlots(data || []);
  };

  const fetchReviews = async () => {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, student_id")
      .eq("tutor_id", id)
      .order("created_at", { ascending: false });

    if (!reviewData?.length) return;

    const studentIds = [...new Set(reviewData.map((r) => r.student_id))];
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", studentIds);

    setReviews(reviewData.map((r) => ({
      ...r,
      student_name: profiles?.find((p) => p.user_id === r.student_id)?.full_name || "Student",
    })));
  };

  const handleBook = async () => {
    if (!user || !selectedSlot || !selectedSubject) return;
    setBooking(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        student_id: user.id,
        tutor_id: id,
        slot_id: selectedSlot.id,
        subject: selectedSubject,
        notes,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Session booked! Waiting for tutor confirmation.");
      setShowConfirm(false);
      setSelectedSlot(null);
      setNotes("");
      fetchSlots();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </DashboardLayout>
  );

  if (!tutor) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-bold">Tutor not found</h2>
        <Link to="/tutors" className="mt-4 text-primary hover:underline">Back to tutors</Link>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to tutors
        </button>

        {/* Profile header */}
        <div className="rounded-2xl border border-border bg-white p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-3xl font-bold text-white">
              {initials(tutor.full_name)}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold text-foreground">{tutor.full_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {tutor.university && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> {tutor.university}
                  </span>
                )}
                {tutor.major && <span>{tutor.major}</span>}
                {tutor.experience_years > 0 && (
                  <span>{tutor.experience_years} yr{tutor.experience_years !== 1 ? "s" : ""} experience</span>
                )}
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                <StarDisplay rating={tutor.avg_rating} size="lg" />
                <span className="font-display font-bold text-foreground">
                  {tutor.avg_rating > 0 ? tutor.avg_rating.toFixed(1) : "New"}
                </span>
                {tutor.total_reviews > 0 && (
                  <span className="text-sm text-muted-foreground">({tutor.total_reviews} reviews)</span>
                )}
              </div>

              {/* Subjects */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tutor.subjects.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex sm:flex-col gap-3 shrink-0">
              <Link to={`/messages/${tutor.user_id}`}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <MessageCircle className="h-4 w-4" /> Message
              </Link>
              <a href="#book"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                <Calendar className="h-4 w-4" /> Book Session
              </a>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">{tutor.bio || "No bio provided yet."}</p>
              {tutor.qualifications && (
                <div className="mt-4 flex items-start gap-2">
                  <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{tutor.qualifications}</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-1">Reviews</h2>
              {tutor.avg_rating > 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-4xl font-bold text-foreground">{tutor.avg_rating.toFixed(1)}</span>
                  <div>
                    <StarDisplay rating={tutor.avg_rating} size="lg" />
                    <p className="text-sm text-muted-foreground mt-0.5">{tutor.total_reviews} reviews</p>
                  </div>
                </div>
              )}
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Star className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">No reviews yet — be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-display text-xs font-bold text-foreground">
                            {r.student_name[0]}
                          </div>
                          <span className="text-sm font-medium text-foreground">{r.student_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <StarDisplay rating={r.rating} size="sm" />
                      <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Booking */}
          <div id="book" className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Book a Session</h2>

              {slots.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No available slots right now.</p>
                  <Link to={`/messages/${tutor.user_id}`}
                    className="mt-3 inline-block text-sm text-primary hover:underline">
                    Message {tutor.full_name.split(" ")[0]} to request a time →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(slotsByDate).map(([date, daySlots]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {format(new Date(date), "EEEE, MMM d")}
                      </p>
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <button key={slot.id}
                            onClick={() => { setSelectedSlot(slot); setShowConfirm(true); }}
                            className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all hover:border-primary hover:bg-primary/5 ${selectedSlot?.id === slot.id ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground"}`}>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking confirm modal */}
        {showConfirm && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
              <h3 className="font-display text-xl font-bold text-foreground">Confirm Booking</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Session with {tutor.full_name} on{" "}
                <strong>{format(new Date(selectedSlot.slot_date), "MMM d, yyyy")}</strong> at{" "}
                <strong>{selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}</strong>
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    {tutor.subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="What topics do you need help with?"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={() => { setShowConfirm(false); setSelectedSlot(null); }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={handleBook} disabled={booking || !selectedSubject}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {booking ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}