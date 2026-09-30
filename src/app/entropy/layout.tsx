"use client";

import { useEffect, useState } from "react";
import { handleSignIn } from "../actions/auth";

export default function EntropyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.isAuthenticated) setUnauth(true);
      })
      .catch(() => setUnauth(true));
  }, []);

  if (unauth) {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
          Get Entropy
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Generate certified entropy from quantum and hardware sources.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => handleSignIn()}
            className="brand-link cursor-pointer"
          >
            Log in
          </button>{" "}
          to request entropy.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
