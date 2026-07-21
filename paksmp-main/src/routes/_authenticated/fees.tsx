import { createFileRoute } from "@tanstack/react-router";
import { SchoolsRibbon } from "@/components/SchoolsRibbon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool, useSchools } from "@/lib/schools-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fees")({
  component: FeesPage,
  head: () => ({ meta: [{ title: "Fees — EduPRP" }] }),
});

type Fee = {
  id: string; school_id: string; student_id: string; amount: number;
  description: string; status: string; due_date: string; paid_date: string | null;
};
type Student = { id: string; first_name: string; last_name: string; class: string };

function FeesPage() {
  const { activeSchoolId } = useActiveSchool();
  const { data: schools = [] } = useSchools();
  const qc = useQueryClient();

  const { data: fees = [] } = useQuery({
    queryKey: ["fees", activeSchoolId],
    queryFn: async () => {
      let q = supabase.from("fees").select("*").order("due_date");
      if (activeSchoolId) q = q.eq("school_id", activeSchoolId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Fee[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-lite", activeSchoolId],
    queryFn: async () => {
      let q = supabase.from("students").select("id, first_name, last_name, class");
      if (activeSchoolId) q = q.eq("school_id", activeSchoolId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Student[];
    },
  });

  const collected = fees.filter(f => f.status === "paid").reduce((a, f) => a + Number(f.amount), 0);
  const pending = fees.filter(f => f.status !== "paid").reduce((a, f) => a + Number(f.amount), 0);

  async function markPaid(id: string) {
    const { error } = await supabase.from("fees").update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Fee marked as paid");
    qc.invalidateQueries({ queryKey: ["fees"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  }

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Wallet className="h-6 w-6" /> Fees & Accounts</h1>
          <p className="text-sm text-muted-foreground">Collected and pending fees {activeSchoolId ? "for this school" : "across all schools"}.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Collected</div><div className="text-2xl font-semibold text-success mt-1 font-display">{collected.toLocaleString()} PKR</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-semibold text-warning mt-1 font-display">{pending.toLocaleString()} PKR</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Invoices</div><div className="text-2xl font-semibold mt-1 font-display">{fees.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead><TableHead>Description</TableHead><TableHead>School</TableHead>
                  <TableHead>Due</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => {
                  const st = students.find(s => s.id === f.student_id);
                  const sch = schools.find(s => s.id === f.school_id);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{st ? `${st.first_name} ${st.last_name}` : "—"}<div className="text-xs text-muted-foreground">Class {st?.class ?? "—"}</div></TableCell>
                      <TableCell>{f.description}</TableCell>
                      <TableCell className="text-xs">{sch?.name}</TableCell>
                      <TableCell>{f.due_date}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${f.status === "paid" ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}>{f.status}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{Number(f.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {f.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(f.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
