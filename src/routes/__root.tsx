import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { applyTextSize, readTextSize } from "@/components/layout/TextSizeToggle";
import { AuthProvider } from "@/components/auth/AuthProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-bone">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Pagină negăsită</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pagina pe care o cauți nu există sau a fost mutată.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground spring-hover"
          >
            Înapoi la introducere
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Santix — Explorator Anatomie Umană" },
      {
        name: "description",
        content:
          "Aplicație medicală interactivă pentru explorarea anatomiei umane în 3D. Bibliotecă anatomică și quiz-uri în limba română.",
      },
      { name: "author", content: "Santix" },
      { property: "og:title", content: "Santix — Explorator Anatomie Umană" },
      {
        property: "og:description",
        content:
          "Anatomie 3D interactivă, bibliotecă anatomică și teste rapide pentru studenți și pasionați de medicină.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  // Sub lg, Sidebar-ul devine drawer: butonul care îl deschide stă în Header,
  // panoul se randează lângă <main>, așa că starea trăiește aici, în comun.
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigarea către altă rută închide drawer-ul, ca utilizatorul să vadă pagina.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Apply the saved text-size preference on every page (the toggle lives in the
  // header, but the choice must persist across all routes, including landing).
  useEffect(() => {
    applyTextSize(readTextSize());
  }, []);

  return (
    <AuthProvider>
      {isLanding ? (
        <Outlet />
      ) : (
        <div className="flex h-screen w-full flex-col overflow-hidden">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          <div className="flex min-h-0 flex-1">
            <Sidebar mobileOpen={menuOpen} onCloseMobile={() => setMenuOpen(false)} />
            <main className="relative min-w-0 flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
