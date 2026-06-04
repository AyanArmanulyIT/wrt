import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "WRT — Work, Relax, Talk",
  description:
    "Школьная соцсеть с рейтингом классов. Общайся, создавай контент, соревнуйся классами и зарабатывай очки.",
  openGraph: {
    title: "WRT — Work, Relax, Talk",
    description:
      "Школьная соцсеть с рейтингом классов. Общайся, создавай контент, соревнуйся классами и зарабатывай очки.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}