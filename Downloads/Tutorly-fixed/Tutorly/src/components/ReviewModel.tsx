import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Star, X } from "lucide-react";
import { toast } from "sonner";

interface ReviewModalProps {
  bookingId: string;
  tutorId: string;
  tutorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ReviewModal({ bookingId, tutorId, tutorName, open, onOpenChange, onSuccess }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user || rating === 0 || comment.trim().length < 10) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        student_id: user.id,
        tutor_id: tutorId,
        rating,
        comment: comment.trim(),
      });
      if (error) throw error;
      toast.success("Review submitted! Thank you 🎉");
      onSuccess();
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (err: any) {
      if (err.message.includes("unique")) {
        toast.error("You've already reviewed this session");
      } else {
        toast.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold text-foreground">
            Rate your session
          </h3>
          <button onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          How was your session with <strong className="text-foreground">{tutorName}</strong>?
        </p>

        {/* Star rating */}
        <div className="mb-5">
          <p className="text-sm font-medium text-foreground mb-2">Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`h-8 w-8 transition-colors ${
                  s <= (hovered || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-200 text-gray-200"
                }`} />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label className="text-sm font-medium text-foreground">
            Comment <span className="text-muted-foreground font-normal">(min 10 characters)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience — was the tutor helpful, clear, and well-prepared?"
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
          />
          <p className={`text-xs mt-1 ${comment.length >= 10 ? "text-green-500" : "text-muted-foreground"}`}>
            {comment.length}/10 minimum characters
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || comment.trim().length < 10}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}