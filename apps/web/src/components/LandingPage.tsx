import { ArrowRight, CheckCircle, Database, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { onLaunch: () => void };

const FEATURES = [
  {
    icon: Zap,
    title: "Durable ingest workflow",
    description:
      "OpenWorkflow orchestrates every step — load, normalize, persist. Kill the worker mid-run and it resumes exactly where it stopped.",
  },
  {
    icon: Database,
    title: "Python normalization engine",
    description:
      "Canonicalizes messy store names, prices, dates, and quantities. Emits quality notes for every correction made.",
  },
  {
    icon: RefreshCw,
    title: "Crash-resume safety",
    description:
      "Idempotent database writes mean retrying a failed step never creates duplicate rows. The demo survives a hard kill.",
  },
];

const STEPS = [
  { step: "01", label: "Upload", description: "Trigger ingest with a messy retail CSV" },
  { step: "02", label: "Normalize", description: "Python engine canonicalizes and scores every row" },
  { step: "03", label: "Persist", description: "Raw + normalized rows land in Postgres via durable workflow" },
  { step: "04", label: "Observe", description: "Live dashboard shows KPIs, signals, and workflow events" },
];

const QUALITY_NOTES = [
  "normalized_store_name",
  "parsed_price_symbol",
  "fixed_date_format",
  "clamped_quantity",
  "deduped_row",
];

export function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen bg-[#EFF6FF] text-[#172957]">

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center">
            <span className="text-[#F7B160] font-black text-sm">D</span>
          </div>
          <span className="font-black text-lg tracking-tight">Digithon</span>
        </div>
        <Button
          onClick={onLaunch}
          className="bg-[#1E40AF] text-white hover:bg-[#172957] rounded-full font-bold"
        >
          Launch dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
        <Badge className="mb-6 bg-[#F7B160]/25 text-[#172957] border-[#F7B160]/50 font-bold uppercase tracking-widest">
          Hackathon MVP · June 2026
        </Badge>
        <h1 className="text-5xl sm:text-7xl font-black leading-[0.9] mb-6 tracking-tight">
          Messy CSV.<br />
          <span className="text-[#1E40AF]">Clean inventory.</span>
        </h1>
        <p className="text-xl text-[#172957]/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Drop in a chaotic retail export. Watch a durable Python-powered workflow normalize it,
          persist it, and surface operational insights — all with crash-resume safety.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onLaunch}
            className="bg-[#1E40AF] text-white hover:bg-[#172957] font-black rounded-full px-8 text-base shadow-lg shadow-[#1E40AF]/30"
          >
            Open dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <span className="text-sm text-[#172957]/40 font-medium">No login required</span>
        </div>

        {/* Quality note pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-12">
          {QUALITY_NOTES.map((note) => (
            <span
              key={note}
              className="text-xs font-mono bg-[#1E40AF]/8 text-[#1E40AF]/70 rounded-full px-3 py-1 border border-[#1E40AF]/15"
            >
              {note}
            </span>
          ))}
          <span className="text-xs font-mono bg-[#1E40AF]/8 text-[#1E40AF]/40 rounded-full px-3 py-1 border border-[#1E40AF]/15">
            + more
          </span>
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <p className="text-xs font-black uppercase tracking-widest text-[#3B82F6] mb-3 text-center">
          How it works
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-14">
          Four steps. One durable pipeline.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, label, description }) => (
            <div key={step} className="relative">
              <div className="text-6xl font-black text-[#14213d]/6 leading-none mb-2">{step}</div>
              <h3 className="text-lg font-black mb-1">{label}</h3>
              <p className="text-sm text-[#14213d]/55 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <p className="text-xs font-black uppercase tracking-widest text-[#3B82F6] mb-3 text-center">
          Under the hood
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-14">
          Production-shaped. Hackathon-scoped.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-[#14213d]/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E40AF]/12 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#1E40AF]" />
                </div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-sm text-[#14213d]/55 leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* Tech stack */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <p className="text-xs font-black uppercase tracking-widest text-[#172957]/40 mb-6 text-center">
          Stack
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {["FastAPI", "Pydantic", "OpenWorkflow", "Python", "PostgreSQL", "React", "React Query", "Zustand", "Tailwind CSS", "shadcn/ui"].map((tech) => (
            <span
              key={tech}
              className="text-sm font-bold bg-white border border-[#14213d]/12 rounded-full px-4 py-1.5 shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="bg-[#172957] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to see it in action?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Trigger an ingest, watch the worker normalize in real time, then kill it mid-run and watch it resume.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={onLaunch}
              className="bg-[#F7B160] text-[#172957] hover:bg-[#e5a050] font-black rounded-full px-8"
            >
              Launch dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/40">
            {["Durable workflow", "Idempotent retries", "Observable events", "No duplicate rows"].map((point) => (
              <span key={point} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-[#F7B160]" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
