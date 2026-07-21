import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { School } from "@/lib/schools-context";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  school?: School | null;
};

export function SchoolFormDialog({ open, onOpenChange, school }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [principal, setPrincipal] = useState("");
  const [year, setYear] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (school) {
      setName(school.name); setCode(school.code); setAddress(school.address ?? "");
      setPhone(school.phone ?? ""); setEmail(school.email ?? "");
      setPrincipal(school.principal_name ?? ""); setYear(school.established_year?.toString() ?? "");
    } else {
      setName(""); setCode(""); setAddress(""); setPhone(""); setEmail(""); setPrincipal(""); setYear("");
    }
  }, [school, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name, code, address: address || null, phone: phone || null,
      email: email || null, principal_name: principal || null,
      established_year: year ? Number(year) : null,
    };
    const { error } = school
      ? await supabase.from("schools").update(payload).eq("id", school.id)
      : await supabase.from("schools").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(school ? "School updated" : "School added");
    qc.invalidateQueries({ queryKey: ["schools"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{school ? "Edit school" : "Add a new school"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Code</Label><Input required value={code} onChange={(e) => setCode(e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Principal</Label><Input value={principal} onChange={(e) => setPrincipal(e.target.value)} /></div>
            <div><Label>Established year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-primary" disabled={loading}>{school ? "Save" : "Add school"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
