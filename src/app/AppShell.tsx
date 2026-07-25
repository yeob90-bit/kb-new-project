import { Suspense, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <a className="skip-link" href="#main-content" data-testid="skip-link">
        본문으로 건너뛰기
      </a>
      <header className="app-topnav" data-testid="app-topnav">
        <Link to="/dashboard" className="app-topnav__brand">
          Renewal Navigator
        </Link>
        <nav aria-label="주요 메뉴" className="app-topnav__nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/showcase">Showcase</Link>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} data-testid="main-content">
        <Suspense
          fallback={
            <div className="empty-state" role="status" aria-live="polite">
              화면을 불러오는 중…
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </>
  );
}
