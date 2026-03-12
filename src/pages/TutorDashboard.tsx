import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Star, Calendar, Clock, Check, X, Trash2, Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TutorProfile {
  bio: string;
  subjects: string[];
  qualifications: string;
  experience_years: number;
  university: string;
  major: string;
}

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Booking {
  id: string;
  status: string;
  subject: string;
  slot: Slot;
  student_name: string;
  student_id: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_name: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    confirmed: "bg-green-50 text-green-600 border-green-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
    completed: "bg-blue-50 text-blue-600 border-blue-200",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TutorProfile>({ bio: "", subjects: [], qualifications: "", experience_years: 0, university: "", major: "" });
  const [subjectInput, setSubjectInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ date: "", start: "", end: "" });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [tab, setTab] = useState("bookings");
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (user) { fetchProfile(); fetchSlots(); fetchBookings(); fetchReviews(); fetchProfileName(); }
  }, [user]);

  const fetchProfileName = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    if (data) setProfileName(data.full_name);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("tutor_profiles")
      .select("bio, subjects, qualifications, experience_years, university, major")
      .eq("user_id", user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("tutor_profiles").update({
        bio: profile.bio, subjects: profile.subjects,
        qualifications: profile.qualifications, experience_years: profile.experience_years,
        university: profile.university, major: profile.major,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile saved!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !profile.subjects.includes(trimmed)) {
      setProfile({ ...profile, subjects: [...profile.subjects, trimmed] });
      setSubjectInput("");
    }
  };

  const removeSubject = (s: string) => setProfile({ ...profile, subjects: profile.subjects.filter((x) => x !== s) });

  const fetchSlots = async () => {
    if (!user) return;
    const { data } = await supabase.from("availability_slots")
      .select("id, slot_date, start_time, end_time, is_booked")
      .eq("tutor_id", user.id)
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date").order("start_time");
    setSlots(data || []);
  };

  const addSlot = async () => {
    if (!user || !newSlot.date || !newSlot.start || !newSlot.end) {
      toast.error("Please fill in all slot fields"); return;
    }
    try {
      const { error } = await supabase.from("availability_slots").insert({
        tutor_id: user.id, slot_date: newSlot.date, start_time: newSlot.start, end_time: newSlot.end,
      });
      if (error) throw error;
      toast.success("Slot added!");
      setNewSlot({ date: "", start: "", end: "" });
      fetchSlots();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    fetchSlots();
    toast.success("Slot removed");
  };

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase.from("bookings")
      .select("id, status, subject, slot_id, student_id")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false });

    if (!data?.length) return;

    const slotIds = data.map((b) => b.slot_id);
    const studentIds = [...new Set(data.map((b) => b.student_id))];

    const [slotsRes, profilesRes] = await Promise.all([
      supabase.from("availability_slots").select("id, slot_date, start_time, end_time, is_booked").in("id", slotIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
    ]);

    setBookings(data.map((b) => ({
      id: b.id, status: b.status, subject: b.subject || "General", student_id: b.student_id,
      slot: slotsRes.data?.find((s) => s.id === b.slot_id) || { id: "", slot_date: "", start_time: "", end_time: "", is_booked: false },
      student_name: profilesRes.data?.find((p) => p.user_id === b.student_id)?.full_name || "Student",
    })));
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data: reviewData } = await supabase.from("reviews")
      .select("id, rating, comment, created_at, student_id")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false });

    if (!reviewData?.length) return;

    const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
    setAvgRating(Math.round(avg * 10) / 10);

    const studentIds = [...new Set(reviewData.map((r) => r.student_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds);

    setReviews(reviewData.map((r) => ({
      ...r,
      student_name: profiles?.find((p) => p.user_id === r.student_id)?.full_name || "Student",
    })));
  };

  const updateBookingStatus = async (id: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Booking ${status}`);
      fetchBookings(); fetchSlots();
    } catch (err: any) { toast.error(err.message); }
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => b.status === "confirmed" && b.slot.slot_date === todayStr);
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const stats = [
    { label: "Total Sessions", value: bookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) + "★" : "New", icon: Star, color: "bg-amber-50 text-amber-600" },
    { label: "Students Helped", value: new Set(bookings.map((b) => b.student_id)).size, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Pending Requests", value: pendingBookings.length, icon: Clock, color: "bg-orange-50 text-orange-600" },
  ];

  const firstName = profileName.split(" ")[0];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Hey, {firstName || "there"} 👋</h1>
          <p className="mt-1 text-muted-foreground">Manage your tutoring sessions and profile</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-white p-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Today's schedule */}
        {todayBookings.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Today's Schedule</h2>
            <div className="space-y-3">
              {todayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                      {b.student_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{b.student_name}</p>
                      <p className="text-xs text-muted-foreground">{b.subject} · {b.slot.start_time?.slice(0, 5)} – {b.slot.end_time?.slice(0, 5)}</p>
                    </div>
                  </div>
                  <Link to={`/messages/${b.student_id}`}
                    className="text-xs text-primary hover:underline">Message →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit mb-6">
            {["bookings", "availability", "profile", "reviews"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
                {t === "bookings" && pendingBookings.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white">{pendingBookings.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Bookings tab */}
          {tab === "bookings" && (
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-16 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-foreground">No bookings yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Students will appear here once they book a session</p>
                </div>
              ) : bookings.map((b) => (
                <div key={b.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                        {b.student_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{b.student_name}</p>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.subject} · {b.slot.slot_date && format(new Date(b.slot.slot_date), "MMM d, yyyy")} · {b.slot.start_time?.slice(0, 5)} – {b.slot.end_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/messages/${b.student_id}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                        Message
                      </Link>
                      {b.status === "pending" && (
                        <>
                          <button onClick={() => updateBookingStatus(b.id, "confirmed")}
                            className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors">
                            <Check className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <button onClick={() => updateBookingStatus(b.id, "cancelled")}
                            className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors">
                            <X className="h-3.5 w-3.5" /> Decline
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && b.slot.slot_date && new Date(b.slot.slot_date) < now && (
                        <button onClick={() => updateBookingStatus(b.id, "completed")}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors">
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Availability tab */}
          {tab === "availability" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="font-display font-semibold text-foreground mb-4">Add New Slot</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <input type="date" value={newSlot.date}
                      onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                    <input type="time" value={newSlot.start}
                      onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                      className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">End Time</label>
                    <input type="time" value={newSlot.end}
                      onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                      className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addSlot}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                      <Plus className="h-4 w-4" /> Add Slot
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="font-display font-semibold text-foreground mb-4">Upcoming Slots</h3>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No slots yet. Add one above!</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">{format(new Date(slot.slot_date), "MMM d, yyyy")}</span>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                          {slot.is_booked && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-600">Booked</span>
                          )}
                        </div>
                        {!slot.is_booked && (
                          <button onClick={() => deleteSlot(slot.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile tab */}
          {tab === "profile" && (
            <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
              <h3 className="font-display font-semibold text-foreground">Edit Profile</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">University</label>
                  <input value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    placeholder="State University" className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Major</label>
                  <input value={profile.major} onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    placeholder="Computer Science" className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Experience (years)</label>
                  <input type="number" value={profile.experience_years || ""}
                    onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="2" className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell students about yourself, your teaching style, and how you can help..."
                  rows={4} className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Qualifications</label>
                <textarea value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })}
                  placeholder="Dean's List, Teaching Assistant, relevant achievements..."
                  rows={2} className="w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Subjects</label>
                <div className="flex gap-2">
                  <input value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                    placeholder="e.g. Calculus" className="flex-1 rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <button onClick={addSubject}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.subjects.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {s}
                      <button onClick={() => removeSubject(s)} className="hover:text-primary/60">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* Reviews tab */}
          {tab === "reviews" && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Student Reviews</h3>
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Reviews will appear after students complete sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-xs font-bold">
                            {r.student_name[0]}
                          </div>
                          <span className="text-sm font-medium text-foreground">{r.student_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}