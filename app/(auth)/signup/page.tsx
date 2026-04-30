import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-[var(--color-text-muted)]">Loading sign-up…</div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
