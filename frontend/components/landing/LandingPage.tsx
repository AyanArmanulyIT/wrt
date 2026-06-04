"use client";

import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Лента постов",
    desc: "Делитесь мыслями, новостями и мемами с одноклассниками. Комментируйте и ставьте лайки.",
  },
  {
    icon: Trophy,
    title: "Class Clash",
    desc: "Соревнование классов за звание «Класс недели». Зарабатывайте очки за активность и побеждайте.",
  },
  {
    icon: Users,
    title: "Профили и рейтинг",
    desc: "Следите за своей статистикой, зарабатывайте баллы и поднимайтесь в топе класса.",
  },
  {
    icon: Sparkles,
    title: "Уведомления",
    desc: "Мгновенно узнавайте о лайках, комментариях и смене лидера Class Clash.",
  },
];

const SCREENSHOTS = [
  {
    label: "Лента",
    desc: "Читайте и создавайте посты",
    icon: MessageSquare,
  },
  {
    label: "Class Clash",
    desc: "Рейтинг классов",
    icon: Trophy,
  },
  {
    label: "Профиль",
    desc: "Ваша статистика",
    icon: Users,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Zap className="h-6 w-6 text-accent" />
            <span>WRT</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Войти
            </Link>
            <Link href="/register">
              <Button size="sm">Регистрация</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Gradient glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 pt-24 pb-28 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Beta — присоединяйся первым</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Work, Relax,
              <br />
              <span className="text-accent">Talk</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Школьная социальная сеть с уникальной системой соревнования классов.
              Создавай посты, общайся, зарабатывай очки для своего класса и
              становись лучшим!
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base">
                  Присоединиться
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="text-base">
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Всё, что нужно школьникам
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              WRT объединяет удобную ленту, систему лайков и комментариев, а
              также соревновательный режим между классами.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="border-border/60 hover:border-accent/30 transition-colors group"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== SCREENSHOTS / PREVIEW ===== */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Посмотри, как это работает
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Простой и современный интерфейс, созданный для удобства
                школьников.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {SCREENSHOTS.map((s) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center hover:border-accent/30 transition-colors"
                >
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 text-accent">
                    <s.icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>

                  {/* Decorative dots */}
                  <div className="mt-6 flex justify-center gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-accent/20"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== BETA ACCESS ===== */}
        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-10 sm:p-14">
            <Zap className="mx-auto h-10 w-10 text-accent mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Beta-доступ
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              WRT находится в открытой бете. Создавай аккаунт, выбирай свою
              школу и начинай зарабатывать очки для класса прямо сейчас!
            </p>

            <div className="mt-10">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base px-10">
                  Получить доступ
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">
                Бесплатно. Только для школьников.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-accent" />
            <span>WRT — Work, Relax, Talk</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} WRT. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}