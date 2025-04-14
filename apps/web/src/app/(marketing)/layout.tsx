import type { ReactNode } from 'react';

import Footer from './_components/footer';
import NavBar from './_components/nav-bar';

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="polka flex min-h-screen flex-col">
      <NavBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
