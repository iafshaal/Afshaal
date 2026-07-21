import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your EduPRP assistant. Ask me about your schools, students, fees, or how to use the panel." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.content ?? "…" }]);
    } catch (e) {
      toast.error("AI assistant is unavailable right now.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-white shadow-glow hover:scale-105 transition-transform"
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-5 z-40 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-elegant transition-all",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">EduPRP Assistant</div>
            <div className="text-[11px] text-muted-foreground">Powered by AI</div>
          </div>
        </div>
        <div ref={scrollRef} className="h-80 overflow-y-auto p-3 space-y-2 text-sm">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="bg-muted text-foreground max-w-[85%] rounded-2xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); void send(); }}
          className="flex items-center gap-2 border-t border-border p-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your schools…"
            className="h-9"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="bg-gradient-primary" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
