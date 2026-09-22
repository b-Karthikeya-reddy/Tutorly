import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { formatTimeRange12h } from "@/lib/formatTime";
import { Star, MapPin, BookOpen, Clock, ChevronLeft, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

interface TutorData {
  id: string;
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatDateLong = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function TutorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (id) { fetchTutor(); fetchSlots(); fetchReviews(); }
  }, [id]);

  const fetchTutor = async () => {
    setLoading(true);
    const { data: tp } = await supabase.from("tutor_profiles")
      .select("id, user_id, bio, subjects, qualifications, experience_years, university, major, avg_rating, total_reviews")
      .eq("user_id", id).maybeSingle();

    if (!tp) { setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles")
      .select("full_name").eq("user_id", id).maybeSingle();

    setTutor({ ...tp, full_name: profile?.full_name || "Tutor" });
    setLoading(false);
  };

  const fetchSlots = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("availability_slots")
      .select("id, slot_date, start_time, end_time")
      .eq("tutor_id", id)
      .eq("is_booked", false)
      .gte("slot_date", today)
      .order("slot_date").order("start_time");
    setSlots(data || []);
  };

  const fetchReviews = async () => {
    const { data: reviewData } = await supabase.from("reviews")
      .select("id, rating, comment, created_at, student_id")
      .eq("tutor_id", id)
      .order("created_at", { ascending: false });

    if (!reviewData?.length) return;

    const studentIds = [...new Set(reviewData.map((r) => r.student_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds);

    setReviews(reviewData.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
      student_name: profiles?.find((p) => p.user_id === r.student_id)?.full_name || "Student",
    })));
  };

  const bookSlot = async () => {
    if (!user || !selectedSlot || !bookingSubject.trim()) {
      toast.error("Please select a subject"); return;
    }
    setBooking(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        student_id: user.id,
        tutor_id: id,
        slot_id: selectedSlot.id,
        subject: bookingSubject.trim(),
        notes: bookingNotes.trim(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Booking request sent! 🎉");
      setShowModal(false);
      setSelectedSlot(null);
      setBookingSubject("");
      setBookingNotes("");
      await fetchSlots();
      setSelectedDate("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});
  const dates = Object.keys(slotsByDate).sort();

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tutor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-xl font-bold text-foreground">Tutor not found</p>
          <Link to="/tutors" className="mt-4 text-sm text-primary hover:underline">← Back to tutors</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to tutors
        </button>

        {/* Profile header */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-2xl font-bold text-white">
              {initials(tutor.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">{tutor.full_name}</h1>
                  {tutor.university && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {tutor.university}{tutor.major ? ` · ${tutor.major}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/messages/${tutor.user_id}`}
                    className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <MessageCircle className="h-4 w-4" /> Message
                  </Link>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {Number(tutor.avg_rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                   <span className="font-semibold text-foreground">{Number(tutor.avg_rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({tutor.total_reviews} reviews)</span>
                  </div>
                )}
                {tutor.experience_years > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {tutor.experience_years} yr{tutor.experience_years > 1 ? "s" : ""} experience
                  </div>
                )}
                {tutor.subjects?.length > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {tutor.subjects.length} subject{tutor.subjects.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {tutor.subjects?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tutor.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {tutor.bio && (
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tutor.bio}</p>
            </div>
          )}

          {tutor.qualifications && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Qualifications</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tutor.qualifications}</p>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-5">Book a Session</h2>
          {dates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-foreground">No available slots</p>
              <p className="text-sm text-muted-foreground mt-1">This tutor hasn't added availability yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Date selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map((date) => (
                  <button key={date} onClick={() => setSelectedDate(date === selectedDate ? null : date)}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-center transition-all ${
                      selectedDate === date
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white hover:border-primary/50 hover:bg-primary/5"
                    }`}>
                    <div className="text-xs font-medium opacity-80">{formatDate(date).split(",")[0]}</div>
                    <div className="text-sm font-semibold">{formatDate(date).split(",")[1]?.trim()}</div>
                  </button>
                ))}
              </div>

              {/* Time slots for selected date */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Available times for {formatDateLong(selectedDate)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(slotsByDate[selectedDate] || []).map((slot) => (
                      <button key={slot.id}
                        onClick={() => { setSelectedSlot(slot); setShowModal(true); }}
                        className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-all">
                        {formatTimeRange12h(slot.start_time, slot.end_time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selectedDate && (
                <p className="text-sm text-muted-foreground">← Select a date to see available times</p>
              )}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-foreground">Reviews</h2>
              {Number(tutor.avg_rating) > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(tutor.avg_rating)) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{Number(tutor.avg_rating).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({tutor.total_reviews})</span>
                </div>
              )}
            </div>
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-xs font-bold text-foreground">
                        {r.student_name[0]}
                      </div>
                      <span className="text-sm font-medium text-foreground">{r.student_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-foreground">Confirm Booking</h3>
              <button onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-muted p-4 mb-5 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tutor</span>
                <span className="font-medium text-foreground">{tutor.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{formatDateLong(selectedSlot.slot_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}</span>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Subject <span className="text-destructive">*</span></label>
                <select value={bookingSubject} onChange={(e) => setBookingSubject(e.target.value)}
                  className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background">
                  <option value="" disabled>Select a subject this tutor teaches</option>
                  {tutor?.subjects?.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="What topics do you need help with?"
                  rows={3}
                  className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={bookSlot} disabled={booking || !bookingSubject.trim()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {booking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}