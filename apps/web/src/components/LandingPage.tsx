import { ArrowRight, CheckCircle, BarChart3, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { onLaunch: () => void };

const FEATURES = [
  {
    icon: BarChart3,
    title: "Flexible Layouts",
    body: "Automatic normalization of store names, products, prices and dates — even when inconsistently formatted.",
  },
  {
    icon: ShieldCheck,
    title: "Version History",
    body: "Every ingest run is stored with full audit trail. Revert, replay or compare any run with one click.",
  },
  {
    icon: TrendingUp,
    title: "One-Click Publish",
    body: "Reorder signals flag which products are running low so you can act before stock runs out.",
  },
  {
    icon: CheckCircle,
    title: "Live Preview",
    body: "The dashboard updates in real time. See desktop and mobile views as the data flows in.",
  },
  {
    icon: ShieldCheck,
    title: "Custom Branding",
    body: "Your store names are canonicalized and retained. Branded, structured, and ready to share.",
  },
  {
    icon: BarChart3,
    title: "Integrations",
    body: "Crash-safe durable workflow: if a worker is killed mid-run, it resumes from the last checkpoint.",
  },
];

export function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar (shadcnuikit.com navbar pattern) ── */}
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-primary font-black text-xs">Q</span>
            </div>
            <span className="font-bold text-foreground text-sm">Quant</span>
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">Digithon 2026</Badge>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={onLaunch} className="hover:text-foreground transition-colors">Dashboard</button>
            <button onClick={onLaunch} className="hover:text-foreground transition-colors">How it works</button>
          </nav>
          <Button onClick={onLaunch} size="sm" className="font-bold">
            Open dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ── Hero Section 1 (shadcnuikit FREE pattern) ── */}
      <section className="py-24 sm:py-32 border-b bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">

          {/* Announcement badge — matches shadcnuikit Hero 1 top badge */}
          <a
            href="#features"
            className="inline-flex items-center gap-2 mb-8 rounded-full border bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Digithon Hackathon 2026 · Built by Team Quant
            <ArrowRight className="h-3 w-3" />
          </a>

          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight text-foreground mb-6">
            Empower Your Inventory with{" "}
            <span className="text-primary">Innovative Tools</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload messy retail CSV exports as-is. We normalize every row, store it durably,
            and surface clear inventory decisions — automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onLaunch} className="font-bold px-8 h-12">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLaunch} className="font-bold px-8 h-12">
              Learn more
            </Button>
          </div>

        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "100%", label: "Automated cleanup" },
            { value: "0",    label: "Duplicate records"  },
            { value: "Live", label: "Real-time dashboard" },
            { value: "Any",  label: "CSV format accepted" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-black text-primary">{value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Section (shadcnuikit "Everything you need" pattern) ── */}
      <section id="features" className="py-20 bg-background border-b">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary mb-3">
              Complete solution
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
              Everything you need to ship faster.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From CSV upload to structured inventory insight — all in one durable, observable pipeline.
            </p>
          </div>

          {/* 6-card feature grid — shadcnuikit Feature Section 1 pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How it works — numbered steps ── */}
      <section className="py-20 bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              Four steps. Complete clarity.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "01", title: "Upload your file",  body: "Drop in your CSV or Excel export as-is — no cleanup needed." },
              { n: "02", title: "We read it",        body: "Store names, products, prices and dates recognized automatically." },
              { n: "03", title: "Data is saved",     body: "Everything stored durably, crash-safe, and fully auditable." },
              { n: "04", title: "See the result",    body: "Dashboard shows inventory, reorder signals and upcoming events." },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-foreground flex items-center justify-center font-black text-sm text-primary">
                  {n}
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefit cards ── */}
      <section className="py-20 bg-background border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              Less chaos. Better decisions.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Know exactly what you have", body: "Accurate quantities, prices, and dates for every product and store." },
              { icon: ShieldCheck, title: "Never lose a record", body: "Crash-safe: if a worker is killed mid-run it resumes from the last checkpoint." },
              { icon: BarChart3, title: "Know when to reorder", body: "Automatic signals flag which products are running low before stock runs out." },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="rounded-xl border shadow-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
              Ready to see it work?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Upload a file, watch it normalize in real time, and see your inventory clearly.
            </p>
            <Button size="lg" onClick={onLaunch} className="font-black px-10 h-12">
              Open dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
              {["Accurate data", "No manual work", "Reorder signals", "Full history"].map((point) => (
                <span key={point} className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>Team <strong className="text-foreground">Quant</strong> · Digithon 2026</span>
          <button onClick={onLaunch} className="font-bold text-foreground hover:text-primary transition-colors">
            Open dashboard &rarr;
          </button>
        </div>
      </footer>

    </div>
  );
}