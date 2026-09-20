import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Send, MessageCircle, ChevronLeft, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  full_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<{ id: string; name: string } | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchConvo, setSearchConvo] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  useEffect(() => {
    if (userId && user) openConversation(userId);
  }, [userId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (activeUser && newMsg.sender_id === activeUser.id) {
          setMessages((prev) => [...prev, newMsg]);
        }
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeUser]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: allMessages } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, created_at, is_read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages?.length) return;

    // Get unique other users
    const otherUserIds = [...new Set(allMessages.map((m) =>
      m.sender_id === user.id ? m.receiver_id : m.sender_id
    ))];

    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", otherUserIds);

    const convos: Conversation[] = otherUserIds.map((otherId) => {
      const userMessages = allMessages.filter((m) =>
        (m.sender_id === user.id && m.receiver_id === otherId) ||
        (m.sender_id === otherId && m.receiver_id === user.id)
      );
      const last = userMessages[0];
      const unread = userMessages.filter((m) => m.sender_id === otherId && !m.is_read).length;
      return {
        user_id: otherId,
        full_name: profiles?.find((p) => p.user_id === otherId)?.full_name || "User",
        last_message: last?.content || "",
        last_message_time: last?.created_at || "",
        unread_count: unread,
      };
    });

    setConversations(convos);
  };

  const openConversation = async (otherId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    setShowSidebar(false);

    // Get name
    const { data: profile } = await supabase
      .from("profiles").select("full_name").eq("user_id", otherId).maybeSingle();
    setActiveUser({ id: otherId, name: profile?.full_name || "User" });

    // Fetch messages
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoadingMessages(false);

    // Mark as read
    await supabase.from("messages").update({ is_read: true })
      .eq("sender_id", otherId).eq("receiver_id", user.id).eq("is_read", false);

    fetchConversations();
    navigate(`/messages/${otherId}`, { replace: true });
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !activeUser) return;
    setSending(true);
    try {
      const { data, error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: activeUser.id,
        content: input.trim(),
      }).select().single();
      if (error) throw error;
      setMessages((prev) => [...prev, data]);
      setInput("");
      fetchConversations();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredConvos = conversations.filter((c) =>
    c.full_name.toLowerCase().includes(searchConvo.toLowerCase())
  );

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const timeAgo = (date: string) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
    catch { return ""; }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">Messages</h1>

        <div className="rounded-2xl border border-border bg-white overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className={`${showSidebar ? "flex" : "hidden"} md:flex w-full md:w-80 flex-col border-r border-border shrink-0`}>
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={searchConvo} onChange={(e) => setSearchConvo(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-input bg-muted pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto">
                {filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground text-sm">No conversations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Message a tutor from their profile</p>
                    <Link to="/tutors" className="mt-3 text-xs text-primary hover:underline">Find a tutor →</Link>
                  </div>
                ) : filteredConvos.map((convo) => (
                  <button key={convo.user_id} onClick={() => openConversation(convo.user_id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border/50 ${
                      activeUser?.id === convo.user_id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted"
                    }`}>
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                        {initials(convo.full_name)}
                      </div>
                      {convo.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white font-bold">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${convo.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                          {convo.full_name}
                        </p>
                        {convo.last_message_time && (
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {timeAgo(convo.last_message_time)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.last_message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat panel */}
            <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
              {!activeUser ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">Your Messages</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    Select a conversation or message a tutor from their profile page
                  </p>
                  <Link to="/tutors"
                    className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    Find a Tutor
                  </Link>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 shrink-0">
                    <button onClick={() => { setShowSidebar(true); setActiveUser(null); }}
                      className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white shrink-0">
                      {initials(activeUser.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{activeUser.name}</p>
                    </div>
                    <Link to={`/tutors/${activeUser.id}`}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                      View Profile
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, i) => {
                          const isMine = msg.sender_id === user?.id;
                          const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 5 * 60 * 1000;
                          return (
                            <div key={msg.id}>
                              {showTime && (
                                <div className="text-center my-2">
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 ${
                                  isMine
                                    ? "bg-primary text-white rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm"
                                }`}>
                                  <p className="text-sm leading-relaxed">{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder={`Message ${activeUser.name}...`}
                        className="flex-1 rounded-xl border border-input bg-muted px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button onClick={sendMessage} disabled={!input.trim() || sending}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}