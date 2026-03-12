import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, BookOpen, Clock, CheckCircle, XCircle, Star, Calendar, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  status: string;
  subject: string;
  created_at: string;
  slot: { id: string; slot_date: string; start_time: string; end_time: string };
  tutor_id: string;
  tutor_name: string;
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [profileName, setProfileName] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (user) { fetchBookings(); fetchProfile(); }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    if (data) setProfileName(data.full_name);
  };

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, status, subject, created_at, slot_id, tutor_id")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (!data?.length) { setLoading(false); return; }

    const slotIds = data.map((b) => b.slot_id);
    const tutorIds = [...new Set(data.map((b) => b.tutor_id))];

    const [slotsRes, profilesRes] = await Promise.all([
      supabase.from("availability_slots").select("id, slot_date, start_time, end_time").in("id", slotIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", tutorIds),
    ]);

    const mapped: Booking[] = data.map((b) => ({
      id: b.id,
      status: b.status,
      subject: b.subject || "General",
      created_at: b.created_at,
      tutor_id: b.tutor_id,
      slot: slotsRes.data?.find((s) => s.id === b.slot_id) || { id: "", slot_date: "", start_time: "", end_time: "" },
      tutor_name: profilesRes.data?.find((p) => p.user_id === b.tutor_id)?.full_name || "Tutor",
    }));

    setBookings(mapped);
    setLoading(false);
  };

  const cancelBooking = async (id: string) => {
    setCancelling(id);
    try {
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.slot.slot_date) >= now);
  const past = bookings.filter((b) => b.status === "completed" || (["confirmed", "pending"].includes(b.status) && new Date(b.slot.slot_date) < now));
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const tabData = { all: bookings, upcoming, past, cancelled };
  const filtered = tabData[tab] || bookings;

  const stats = [
    { label: "Sessions Booked", value: bookings.length, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Upcoming", value: upcoming.length, icon: Calendar, color: "bg-primary/10 text-primary" },
    { label: "Completed", value: bookings.filter((b) => b.status === "completed").length, icon: CheckCircle, color: "bg-green-50 text-green-600" },
    { label: "Tutors Worked With", value: new Set(bookings.map((b) => b.tutor_id)).size, icon: Star, color: "bg-amber-50 text-amber-600" },
  ];

  const firstName = profileName.split(" ")[0];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Hey, {firstName || "there"} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">Track your tutoring sessions and find new tutors</p>
          </div>
          <Link to="/tutors"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors w-fit">
            <Search className="h-4 w-4" /> Find a Tutor
          </Link>
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

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((b) => (
                <div key={b.id} className="rounded-2xl border border-border bg-white p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                      {b.tutor_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{b.tutor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.subject} · {b.slot.slot_date && format(new Date(b.slot.slot_date), "MMM d")} · {b.slot.start_time?.slice(0, 5)} – {b.slot.end_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={b.status} />
                    <Link to={`/messages/${b.tutor_id}`}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All bookings */}
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">My Bookings</h2>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit mb-5">
            {["all", "upcoming", "past", "cancelled"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
                <span className="ml-1.5 text-xs opacity-60">
                  {tabData[t]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl border border-border bg-white animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">No bookings here</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "all" ? "Book your first session with a tutor!" : `No ${tab} bookings`}
              </p>
              {tab === "all" && (
                <Link to="/tutors" className="mt-4 text-sm text-primary hover:underline">Find a tutor →</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((b) => (
                <div key={b.id} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                        {b.tutor_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{b.tutor_name}</p>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.subject} · {b.slot.slot_date && format(new Date(b.slot.slot_date), "MMM d, yyyy")} · {b.slot.start_time?.slice(0, 5)} – {b.slot.end_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/tutors/${b.tutor_id}`}
                        className="text-xs text-primary hover:underline hidden sm:block">View Profile</Link>
                      <Link to={`/messages/${b.tutor_id}`}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" /> Message
                      </Link>
                      {["pending", "confirmed"].includes(b.status) && new Date(b.slot.slot_date) >= now && (
                        <button onClick={() => cancelBooking(b.id)} disabled={cancelling === b.id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" />
                          {cancelling === b.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}