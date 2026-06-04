import { AuthGuard } from "@/components/auth/AuthGuard";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen safe-area-pt">
          <Header />
          <main
            id="main-content"
            className="flex-1 pb-[calc(var(--nav-height)+var(--safe-area-bottom))] lg:pb-8"
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
