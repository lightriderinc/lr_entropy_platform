"use client";

import SignInRequired from "@/components/auth/SignInRequired";
import { useEffect, useState } from "react";

export default function HistoryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => { if (!data?.isAuthenticated) setUnauth(true); })
      .catch(() => setUnauth(true));
  }, []);

  if (unauth) {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Activity History</h1>
        <p className="mb-6 text-sm text-gray-600">
          A record of the entropy you&apos;ve generated.
        </p>
        <SignInRequired target="activity history" />
      </div>
    );
  }

  return <>{children}</>;
}
