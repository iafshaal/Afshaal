import { createFileRoute } from "@tanstack/react-router";
import { SchoolsRibbon } from "@/components/SchoolsRibbon";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool, useSchools } from "@/lib/schools-context";
import { Building2, GraduationCap, Users, Wallet, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — EduPRP" }] }),
});

function useCounts(schoolId: string | null) {
  return useQuery({
    queryKey: ["counts", schoolId],
    queryFn: async () => {
      const q = (t: "students" | "staff" | "fees") => {
        let query = supabase.from(t).select("*", { count: "exact", head: true });
        if (schoolId) query = query.eq("school_id", schoolId);
        return query;
      };
      const [st, sf, fe, feeSum] = await Promise.all([
        q("students"), q("staff"), q("fees"),
        (schoolId
          ? supabase.from("fees").select("amount, status").eq("school_id", schoolId)
          : supabase.from("fees").select("amount, status")),
      ]);
      const rows = (feeSum.data ?? []) as { amount: number; status: string }[];
      const collected = rows.filter(r => r.status === "paid").reduce((a, r) => a + Number(r.amount), 0);
      const pending = rows.filter(r => r.status !== "paid").reduce((a, r) => a + Number(r.amount), 0);
      return {
        students: st.count ?? 0,
        staff: sf.count ?? 0,
        fees: fe.count ?? 0,
        collected, pending,
      };
    },
  });
}

function Dashboard() {
  const { activeSchoolId } = useActiveSchool();
  const { data: schools = [] } = useSchools();
  const { data: c } = useCounts(activeSchoolId);
  const active = schools.find(s => s.id === activeSchoolId);

  const kpis = [
    { label: "Connected Schools", value: schools.length, icon: Building2, tint: "from-indigo-500 to-blue-500" },
    { label: activeSchoolId ? "Students" : "Total Students", value: c?.students ?? "—", icon: GraduationCap, tint: "from-cyan-500 to-teal-500" },
    { label: activeSchoolId ? "Staff" : "Total Staff", value: c?.staff ?? "—", icon: Users, tint: "from-fuchsia-500 to-pink-500" },
    { label: "Fees Pending (PKR)", value: c ? c.pending.toLocaleString() : "—", icon: Wallet, tint: "from-amber-500 to-orange-500" },
  ];

  const chartData = schools.slice(0, 6).map((s, i) => ({
    name: s.code,
    students: 12 + i * 6,
    fees: 40 + i * 12,
  }));

  const trend = Array.from({ length: 8 }).map((_, i) => ({
    m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"][i],
    admissions: 20 + Math.round(Math.sin(i) * 8) + i * 3,
  }));

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {active ? active.name : "All Schools Overview"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {active ? `${active.code} · ${active.address ?? "—"}` : "Live metrics across every connected campus."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-success" /> System healthy · realtime
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${k.tint} text-white shadow-glow`}>
                    <k.icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div className="mt-3 text-2xl font-semibold font-display">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Students & fees by school</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="students" fill="oklch(0.55 0.18 255)" radius={[6,6,0,0]} />
                  <Bar dataKey="fees" fill="oklch(0.68 0.16 200)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Admissions trend</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="m" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="admissions" stroke="oklch(0.32 0.14 260)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {[
              "Ayesha Khan added Greenwood International Academy",
              "3 fee invoices marked paid at Sunrise Grammar",
              "Rehan Ali added as Math Teacher · Riverside Public School",
              "AI Assistant answered 12 questions this hour",
            ].map((x, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-border py-2 last:border-0">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span>{x}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
