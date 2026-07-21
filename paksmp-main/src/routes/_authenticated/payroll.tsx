import { createFileRoute } from "@tanstack/react-router";
import { SchoolsRibbon } from "@/components/SchoolsRibbon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool, useSchools } from "@/lib/schools-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payroll")({
  component: PayrollPage,
  head: () => ({ meta: [{ title: "Payroll — EduPRP" }] }),
});

type Staff = { id: string; school_id: string; first_name: string; last_name: string; designation: string; salary: number };
type Payment = { id: string; staff_id: string; amount: number; pay_month: string; paid_date: string; status: string };

function PayrollPage() {
  const { activeSchoolId } = useActiveSchool();
  const { data: schools = [] } = useSchools();
  const qc = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-payroll", activeSchoolId],
    queryFn: async () => {
      let q = supabase.from("staff").select("id, school_id, first_name, last_name, designation, salary");
      if (activeSchoolId) q = q.eq("school_id", activeSchoolId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Staff[];
    },
  });

  const staffIds = staff.map(s => s.id);
  const { data: payments = [] } = useQuery({
    queryKey: ["salary-payments", staffIds.join(",")],
    enabled: staffIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_payments").select("*").in("staff_id", staffIds).order("paid_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  async function runPayroll() {
    if (staff.length === 0) return toast.error("No staff to pay");
    const month = new Date();
    month.setDate(1);
    const rows = staff.map(s => ({
      staff_id: s.id,
      amount: Number(s.salary),
      pay_month: month.toISOString().slice(0, 10),
      status: "paid",
    }));
    const { error } = await supabase.from("salary_payments").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Payroll processed for ${rows.length} staff`);
    qc.invalidateQueries({ queryKey: ["salary-payments"] });
  }

  const totalMonthly = staff.reduce((a, s) => a + Number(s.salary), 0);

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Briefcase className="h-6 w-6" /> Payroll</h1>
            <p className="text-sm text-muted-foreground">Monthly salary statements. Process the whole batch in one click.</p>
          </div>
          <Button className="bg-gradient-primary shadow-elegant" onClick={runPayroll}>
            <Zap className="h-4 w-4 mr-1" /> Run this month's payroll
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Staff on payroll</div><div className="text-2xl font-semibold mt-1 font-display">{staff.length}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Monthly commitment</div><div className="text-2xl font-semibold mt-1 font-display">{totalMonthly.toLocaleString()} PKR</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Payments processed</div><div className="text-2xl font-semibold mt-1 font-display">{payments.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Salary statements</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead><TableHead>Designation</TableHead><TableHead>School</TableHead>
                  <TableHead>Base salary</TableHead><TableHead>Last paid</TableHead><TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(s => {
                  const school = schools.find(sc => sc.id === s.school_id);
                  const last = payments.find(p => p.staff_id === s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                      <TableCell>{s.designation}</TableCell>
                      <TableCell className="text-xs">{school?.name ?? "—"}</TableCell>
                      <TableCell className="font-mono">{Number(s.salary).toLocaleString()}</TableCell>
                      <TableCell>{last?.paid_date ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${last ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {last ? "Paid" : "Pending"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {staff.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No staff to display.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
