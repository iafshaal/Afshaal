import { createFileRoute } from "@tanstack/react-router";
import { SchoolsRibbon } from "@/components/SchoolsRibbon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSchool, useSchools } from "@/lib/schools-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPage,
  head: () => ({ meta: [{ title: "Staff — EduPRP" }] }),
});

type Staff = {
  id: string; school_id: string; first_name: string; last_name: string;
  designation: string; department: string | null; email: string | null;
  phone: string | null; salary: number; status: string;
};

function StaffPage() {
  const { activeSchoolId } = useActiveSchool();
  const { data: schools = [] } = useSchools();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff", activeSchoolId],
    queryFn: async () => {
      let q = supabase.from("staff").select("*").order("created_at", { ascending: false });
      if (activeSchoolId) q = q.eq("school_id", activeSchoolId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Staff[];
    },
  });

  const [form, setForm] = useState({
    school_id: activeSchoolId ?? "", first_name: "", last_name: "",
    designation: "", department: "", email: "", phone: "", salary: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      ...form,
      school_id: form.school_id || activeSchoolId,
      salary: Number(form.salary) || 0,
    };
    if (!payload.school_id) return toast.error("Pick a school");
    const { error } = await supabase.from("staff").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Staff added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["staff"] });
  }

  const totalSalary = staff.reduce((a, s) => a + Number(s.salary), 0);

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6" /> Staff</h1>
            <p className="text-sm text-muted-foreground">
              {staff.length} member{staff.length === 1 ? "" : "s"} · Monthly payroll {totalSalary.toLocaleString()} PKR
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary shadow-elegant"><Plus className="h-4 w-4 mr-1" /> Add staff</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add staff member</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid gap-3">
                <div>
                  <Label>School</Label>
                  <Select value={form.school_id || activeSchoolId || ""} onValueChange={(v) => setForm({ ...form, school_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                    <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
                  <div><Label>Last name</Label><Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Designation</Label><Input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                  <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Salary</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit" className="bg-gradient-primary">Add</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Directory</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead>
                  <TableHead>School</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>}
                {staff.map((s) => {
                  const school = schools.find(sc => sc.id === s.school_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                      <TableCell>{s.designation}</TableCell>
                      <TableCell>{s.department ?? "—"}</TableCell>
                      <TableCell className="text-xs">{school?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{s.email ?? "—"}<div className="text-muted-foreground">{s.phone ?? ""}</div></TableCell>
                      <TableCell className="text-right font-mono">{Number(s.salary).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && staff.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No staff yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
