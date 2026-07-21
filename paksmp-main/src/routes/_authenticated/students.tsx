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
import { Plus, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
  head: () => ({ meta: [{ title: "Students — EduPRP" }] }),
});

type Student = {
  id: string; school_id: string; first_name: string; last_name: string;
  class: string; section: string | null; roll_no: string | null;
  parent_name: string | null; parent_phone: string | null; status: string;
};

function StudentsPage() {
  const { activeSchoolId } = useActiveSchool();
  const { data: schools = [] } = useSchools();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", activeSchoolId],
    queryFn: async () => {
      let q = supabase.from("students").select("*").order("created_at", { ascending: false });
      if (activeSchoolId) q = q.eq("school_id", activeSchoolId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Student[];
    },
  });

  const [form, setForm] = useState({
    school_id: activeSchoolId ?? "", first_name: "", last_name: "",
    class: "", section: "", roll_no: "", parent_name: "", parent_phone: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const school_id = form.school_id || activeSchoolId;
    if (!school_id) return toast.error("Pick a school");
    const { error } = await supabase.from("students").insert({ ...form, school_id });
    if (error) return toast.error(error.message);
    toast.success("Student enrolled");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["students"] });
  }

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2"><GraduationCap className="h-6 w-6" /> Students</h1>
            <p className="text-sm text-muted-foreground">Enrolled learners across {activeSchoolId ? "this school" : "all connected schools"}.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant"><Plus className="h-4 w-4 mr-1" /> Enroll student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enroll new student</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid gap-3">
                <div>
                  <Label>School</Label>
                  <Select value={form.school_id || activeSchoolId || ""} onValueChange={(v) => setForm({ ...form, school_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                    <SelectContent>
                      {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
                  <div><Label>Last name</Label><Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Class</Label><Input required value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
                  <div><Label>Section</Label><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div>
                  <div><Label>Roll no</Label><Input value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Parent name</Label><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></div>
                  <div><Label>Parent phone</Label><Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit" className="bg-gradient-primary">Enroll</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{students.length} enrolled student{students.length === 1 ? "" : "s"}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead>
                  <TableHead>Roll</TableHead><TableHead>School</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>}
                {students.map((s) => {
                  const school = schools.find(sc => sc.id === s.school_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                      <TableCell>{s.class}</TableCell>
                      <TableCell>{s.section ?? "—"}</TableCell>
                      <TableCell>{s.roll_no ?? "—"}</TableCell>
                      <TableCell className="text-xs">{school?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{s.parent_name ?? "—"}<div className="text-muted-foreground">{s.parent_phone ?? ""}</div></TableCell>
                      <TableCell><span className="text-[10px] uppercase px-2 py-1 rounded-full bg-success/10 text-success">{s.status}</span></TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && students.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No students yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
