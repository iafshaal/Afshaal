import { createFileRoute } from "@tanstack/react-router";
import { SchoolsRibbon } from "@/components/SchoolsRibbon";
import { useSchools, type School } from "@/lib/schools-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Building2, Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { SchoolFormDialog } from "@/components/SchoolFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/schools")({
  component: SchoolsPage,
  head: () => ({ meta: [{ title: "Schools — EduPRP" }] }),
});

function SchoolsPage() {
  const { data: schools = [] } = useSchools();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const qc = useQueryClient();

  async function remove(id: string) {
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("School deleted");
    qc.invalidateQueries({ queryKey: ["schools"] });
  }

  return (
    <div>
      <SchoolsRibbon />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Schools</h1>
            <p className="text-sm text-muted-foreground">Manage every connected campus.</p>
          </div>
          <Button className="bg-gradient-primary shadow-elegant" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New school
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-primary text-white shadow-glow">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.code} · Est. {s.established_year ?? "—"}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-success/10 text-success">{s.status}</span>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {s.address ?? "—"}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {s.phone ?? "—"}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {s.email ?? "—"}</div>
                </div>
                <div className="mt-2 text-xs">Principal: <span className="font-medium">{s.principal_name ?? "—"}</span></div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This removes all its students, staff, fees, and salary records. Cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(s.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <SchoolFormDialog open={open} onOpenChange={setOpen} school={editing} />
    </div>
  );
}
