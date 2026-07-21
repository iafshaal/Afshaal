import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are EduPRP Assistant, an AI helper embedded in a multi-school ERP management panel.
You help school administrators, directors, accountants and admission officers by:
- explaining how to use the panel (schools ribbon, students, staff, fees, payroll)
- summarizing common tasks (adding schools, enrolling students, tracking fees)
- giving concise, professional answers (max 4 short sentences unless asked for more)
- politely refusing anything unrelated to school management or the panel.
Never invent data about specific schools you weren't given.`;

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const body = (await request.json()) as { messages?: Msg[] };
        const messages = Array.isArray(body.messages) ? body.messages : [];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "system", content: SYSTEM }, ...messages],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          if (res.status === 429) return Response.json({ content: "I'm rate-limited right now. Try again in a moment." }, { status: 200 });
          if (res.status === 402) return Response.json({ content: "AI credits exhausted for this workspace. Please top up." }, { status: 200 });
          return new Response(text, { status: 500 });
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't produce a reply.";
        return Response.json({ content });
      },
    },
  },
});
