import { useSchools, useActiveSchool, type School } from "@/lib/schools-context";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SchoolFormDialog } from "@/components/SchoolFormDialog";

export function SchoolsRibbon() {
  const { data: schools = [], isLoading } = useSchools();
  const { activeSchoolId, setActiveSchoolId } = useActiveSchool();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur">
      <div className="flex items-center gap-3 overflow-x-auto px-4 py-3">
        <button
          onClick={() => setActiveSchoolId(null)}
          className={cn(
            "shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
            activeSchoolId === null
              ? "border-primary bg-gradient-primary text-primary-foreground shadow-elegant"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          All Schools
        </button>
        {isLoading && <div className="text-xs text-muted-foreground">Loading schools…</div>}
        {schools.map((s: School) => {
          const active = activeSchoolId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSchoolId(s.id)}
              className={cn(
                "group shrink-0 rounded-xl border p-3 text-left transition-all min-w-[210px]",
                active
                  ? "border-primary shadow-elegant bg-gradient-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-card"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn("grid h-8 w-8 place-items-center rounded-lg",
                  active ? "bg-white/15" : "bg-secondary")}>
                  <Building2 className={cn("h-4 w-4", active ? "text-white" : "text-primary")} />
                </div>
                {active && <Check className="h-4 w-4" />}
              </div>
              <div className="mt-2 truncate font-semibold text-sm">{s.name}</div>
              <div className={cn("text-[11px]", active ? "text-white/75" : "text-muted-foreground")}>
                {s.code} · {s.status}
              </div>
            </button>
          );
        })}
        <Button
          variant="outline"
          className="shrink-0 h-[70px] border-dashed"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add school
        </Button>
      </div>
      <SchoolFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
