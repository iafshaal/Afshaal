import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, Bot, Users, Wallet, Building2, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-gradient-hero">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-white shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">EduPRP</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button className="bg-gradient-primary shadow-elegant">Get started</Button></Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Multi-tenant ERP · Cloud-native · AI-powered
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Run <span className="text-gradient">20+ schools</span> from a single, professional panel.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Admissions, students, staff, fees, payroll and AI assistance — every campus under one
            secure, role-based dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="bg-gradient-primary shadow-elegant">Open the panel</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">Create account</Button></Link>
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, title: "Schools ribbon", desc: "Switch between campuses in one click. Add, edit or archive." },
            { icon: Users, title: "Students & staff", desc: "Full directory, admissions and enrollment per school." },
            { icon: Wallet, title: "Fees & payroll", desc: "Track invoices, dues and salary statements." },
            { icon: Bot, title: "AI assistant", desc: "Ask questions in natural language — get answers instantly." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: "Real-time metrics", desc: "Enrollment, dues, staff and payroll counters across every school." },
            { icon: ShieldCheck, title: "Role-based access", desc: "Super Admin, Administrator, Director, Accountant, Admission Officer." },
            { icon: Sparkles, title: "Built for scale", desc: "Cloud database, row-level security, and modular architecture." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card/60 p-6 glass">
              <f.icon className="h-6 w-6 text-accent" />
              <h4 className="mt-3 font-semibold">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EduPRP · Built for education operators.
      </footer>
    </div>
  );
}
