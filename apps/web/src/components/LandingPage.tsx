import { ArrowRight, CheckCircle, ShieldCheck, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { onLaunch: () => void };

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Знаеш какво продаваш",
    description:
      "Виждаш точни количества, цени и дати за всеки продукт и магазин - без ръчно почистване на данни.",
  },
  {
    icon: ShieldCheck,
    title: "Никога не губиш данни",
    description:
      "Дори при прекъсване системата продължава от последната точка. Нито един ред не се губи или дублира.",
  },
  {
    icon: BarChart3,
    title: "Виждаш кога да поръчаш",
    description:
      "Автоматични сигнали показват кои продукти свършват и кога трябва да направиш нова поръчка.",
  },
];

const STEPS = [
  { step: "01", label: "Качи файла", description: "Качваш Excel или CSV от касовата система - в оригинален вид, без предварително почистване" },
  { step: "02", label: "Системата го чете", description: "Автоматично разпознаваме магазини, продукти, цени и дати - дори ако са записани по различен начин" },
  { step: "03", label: "Данните се запазват", description: "Всичко се съхранява сигурно и може да се провери по всяко време" },
  { step: "04", label: "Виждаш резултата", description: "Таблото показва ясна картина на склада - кое се продава, кое свършва, кое трябва да се поръча" },
];

export function LandingPage({ onLaunch }: Props) {
  return (
    <div className="min-h-screen bg-[#EFF6FF] text-[#172957]">

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center">
            <span className="text-[#F7B160] font-black text-sm">Q</span>
          </div>
          <span className="font-black text-lg tracking-tight">Quant</span>
          <span className="text-xs text-[#172957]/40 font-medium ml-1">@ Digithon</span>
        </div>
        <Button
          onClick={onLaunch}
          className="bg-[#1E40AF] text-white hover:bg-[#172957] rounded-full font-bold"
        >
          Виж таблото <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
        <Badge className="mb-6 bg-[#F7B160]/25 text-[#172957] border-[#F7B160]/50 font-bold uppercase tracking-widest">
          Digithon - юни 2026
        </Badge>
        <h1 className="text-5xl sm:text-7xl font-black leading-[0.9] mb-6 tracking-tight">
          Хаотични данни.<br />
          <span className="text-[#1E40AF]">Ясна картина.</span>
        </h1>
        <p className="text-xl text-[#172957]/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Качи файла от касовата система такъв, какъвто е. Ние го четем, почистваме и ти показваме
          точно какво е в склада, кое се продава и кога трябва да поръчаш.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onLaunch}
            className="bg-[#1E40AF] text-white hover:bg-[#172957] font-black rounded-full px-8 text-base shadow-lg shadow-[#1E40AF]/30"
          >
            Виж таблото <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <p className="text-xs font-black uppercase tracking-widest text-[#3B82F6] mb-3 text-center">
          Как работи
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-14">
          Четири стъпки. Пълна яснота.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, label, description }) => (
            <div key={step} className="relative">
              <div className="text-6xl font-black text-[#1E40AF]/8 leading-none mb-2">{step}</div>
              <h3 className="text-lg font-black mb-1">{label}</h3>
              <p className="text-sm text-[#172957]/55 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-6xl mx-auto" />

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <p className="text-xs font-black uppercase tracking-widest text-[#3B82F6] mb-3 text-center">
          Какво получаваш
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-14">
          По-малко хаос. По-добри решения.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-[#1E40AF]/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E40AF]/12 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#1E40AF]" />
                </div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-sm text-[#172957]/55 leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="bg-[#172957] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Готов да видиш как работи?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Качи файл, гледай как системата го обработва в реално време и виж резултата на таблото.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={onLaunch}
              className="bg-[#F7B160] text-[#172957] hover:bg-[#e5a050] font-black rounded-full px-8"
            >
              Виж таблото <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/40">
            {["Точни данни", "Без ръчна работа", "Сигнали за поръчка", "Пълна история"].map((point) => (
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
