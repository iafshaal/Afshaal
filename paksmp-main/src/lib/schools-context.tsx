import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type School = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  principal_name: string | null;
  status: string;
  established_year: number | null;
};

export function useSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("*").order("created_at");
      if (error) throw error;
      return data as School[];
    },
  });
}

type Ctx = { activeSchoolId: string | null; setActiveSchoolId: (id: string | null) => void };
const SchoolCtx = createContext<Ctx>({ activeSchoolId: null, setActiveSchoolId: () => {} });

export function ActiveSchoolProvider({ children }: { children: ReactNode }) {
  const [activeSchoolId, setActive] = useState<string | null>(null);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("active_school_id") : null;
    if (stored) setActive(stored);
  }, []);
  function setActiveSchoolId(id: string | null) {
    setActive(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("active_school_id", id);
      else localStorage.removeItem("active_school_id");
    }
  }
  return <SchoolCtx.Provider value={{ activeSchoolId, setActiveSchoolId }}>{children}</SchoolCtx.Provider>;
}

export const useActiveSchool = () => useContext(SchoolCtx);
