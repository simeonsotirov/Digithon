import { ArrowRight, CheckCircle, ShieldCheck, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { onLaunch: () => void };

const G = {
  black:  "#0A0900",
  brown:  "#3D2814",
  gold:   "#C9A84C",
  tan:    "#CAA884",
  amber:  "#E8A830",
  light:  "#FBBF77",
  cream:  "#FAF6EC",
  mid:    "#F0E8D4",
} as const;

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Know exactly what you have",
    description: "See accurate quantities, prices, and dates for every product and store - no manual cleaning required.",
  },
  {
    icon: ShieldCheck,
    title: "Never lose a record",
    description: "Even if processing is interrupted, the system picks up exactly where it stopped. Nothing is lost or duplicated.",
  },
  {
    icon: BarChart3,
    title: "Know when to reorder",
    description: "Automatic signals flag which products are running low so you can place orders before stock runs out.",
  },
];

const STEPS = [
  { n: "01", label: "Upload your file",  body: "Drop in your CSV or Excel export as-is - no cleanup needed beforehand." },
  { n: "02", label: "We read it",        body: "Store names, products, prices and dates are recognized automatically, even when inconsistently formatted." },
  { n: "03", label: "Data is saved",     body: "Everything is stored securely and can be reviewed or audited at any time." },
  { n: "04", label: "See the result",    body: "The dashboard shows a clear picture of your inventory - what is selling, what is low, what needs ordering." },
];

const STATS = [
  { value: "100%", label: "Automated cleanup" },
  { value: "0",    label: "Duplicate records"  },
  { value: "Live", label: "Real-time dashboard" },
  { value: "Any",  label: "CSV format accepted" },
];

export function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen" style={{ background: G.cream, color: G.black }}>

      {/* ── Sticky Nav ── */}
      <nav
        className="sticky top-0 z-20 border-b"
        style={{ background: G.cream, borderColor: G.mid }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base shadow"
              style={{ background: G.black, color: G.gold }}
            >
              Q
            </div>
            <div className="leading-none">
              <p className="font-black text-lg tracking-tight" style={{ color: G.black }}>Quant</p>
              <p className="text-xs font-semibold" style={{ color: G.tan }}>Digithon 2026</p>
            </div>
          </div>
          <Button
            onClick={onLaunch}
            className="rounded-lg font-bold px-5 h-10 shadow"
            style={{ background: G.gold, color: G.black }}
          >
            Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: G.black }}>
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <Badge
            className="mb-8 border font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full"
            style={{ background: "transparent", borderColor: G.gold, color: G.gold }}
          >
            Digithon Hackathon - June 2026
          </Badge>

          <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6 tracking-tight text-white">
            Chaotic data.<br />
            <span style={{ color: G.gold }}>Clear inventory.</span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium" style={{ color: G.tan }}>
            Upload your messy retail export as-is. We normalize it, store it, and surface exactly
            what you need to manage your inventory with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={onLaunch}
              className="font-black rounded-lg px-8 h-12 text-base shadow-lg"
              style={{ background: G.gold, color: G.black }}
            >
              Open dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={onLaunch}
              className="text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
              style={{ color: G.tan }}
            >
              See it live
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t" style={{ background: G.brown, borderColor: G.gold + "44" }}>
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black" style={{ color: G.gold }}>{value}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: G.tan }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: G.mid }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span
              className="text-xs font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border"
              style={{ color: G.brown, background: G.light + "55", borderColor: G.gold + "66" }}
            >
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: G.black }}>
              Four steps. Complete clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ n, label, body }) => (
              <div key={n}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 font-black text-sm shadow"
                  style={{ background: G.gold, color: G.black }}
                >
                  {n}
                </div>
                <h3 className="text-base font-black mb-2" style={{ color: G.black }}>{label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G.brown }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator style={{ background: G.gold + "44" }} />

      {/* ── Benefits ── */}
      <section style={{ background: G.cream }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span
              className="text-xs font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border"
              style={{ color: G.brown, background: G.light + "55", borderColor: G.gold + "66" }}
            >
              What you get
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-4" style={{ color: G.black }}>
              Less chaos. Better decisions.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ background: "white", border: `1.5px solid ${G.mid}` }}
              >
                <CardContent className="pt-6 pb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow"
                    style={{ background: G.black }}
                  >
                    <Icon className="h-6 w-6" style={{ color: G.gold }} />
                  </div>
                  <h3 className="font-black text-lg mb-2" style={{ color: G.black }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: G.brown }}>{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator style={{ background: G.gold + "44" }} />

      {/* ── CTA ── */}
      <section style={{ background: G.mid }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div
            className="rounded-2xl p-12 text-center border"
            style={{ background: G.black, borderColor: G.gold + "55" }}
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-3 text-white">
              Ready to see it work?
            </h2>
            <p className="mb-8 max-w-md mx-auto font-medium" style={{ color: G.tan }}>
              Upload a file, watch it normalize in real time, and see your inventory clearly.
            </p>
            <Button
              size="lg"
              onClick={onLaunch}
              className="font-black rounded-lg px-10 h-12 text-base shadow-lg"
              style={{ background: G.gold, color: G.black }}
            >
              Open dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm" style={{ color: G.tan }}>
              {["Accurate data", "No manual work", "Reorder signals", "Full history"].map((point) => (
                <span key={point} className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" style={{ color: G.gold }} />
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t" style={{ background: G.brown, borderColor: G.gold + "33" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm font-medium" style={{ color: G.tan }}>
          <span>Team <strong style={{ color: G.gold }}>Quant</strong> - Digithon 2026</span>
          <button
            onClick={onLaunch}
            className="font-bold transition-opacity hover:opacity-70"
            style={{ color: G.gold }}
          >
            Open dashboard &rarr;
          </button>
        </div>
      </footer>

    </div>
  );
}