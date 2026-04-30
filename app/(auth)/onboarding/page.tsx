"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PREMIER_CLUBS } from "@/lib/utils/constants";

const step1Schema = z.object({
  username: z.string().min(3).max(24),
  displayName: z.string().min(1).max(64),
});

type Step1 = z.infer<typeof step1Schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [favoriteClub, setFavoriteClub] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { username: "", displayName: "" },
  });

  async function saveProfile(values: Step1) {
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: e } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username: values.username,
        display_name: values.displayName,
        favorite_club: favoriteClub,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function goClubNext() {
    if (!favoriteClub) {
      setError("Pick a club to continue.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function finishOnboarding() {
    const values = form.getValues();
    const ok = await form.trigger();
    if (!ok) return;
    await saveProfile(values);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Set up your profile
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Step {step + 1} of 3 — make PitchIQ yours
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="s0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <form
              onSubmit={form.handleSubmit(() => setStep(1))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...form.register("username")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" {...form.register("displayName")} />
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </motion.div>
        ) : null}

        {step === 1 ? (
          <motion.div
            key="s1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Choose your favorite Premier League club
            </p>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {PREMIER_CLUBS.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => {
                    setFavoriteClub(club.name);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition-transform hover:scale-[1.02]",
                    favoriteClub === club.name
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-glass-border)] bg-[var(--color-glass)] text-[var(--color-text-primary)]",
                  )}
                >
                  {club.name}
                </button>
              ))}
            </div>
            {error ? (
              <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="button" className="flex-1" onClick={goClubNext}>
                Continue
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div
            key="s2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              Create or join a league to start drafting
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/league/create" className={cn(buttonVariants(), "inline-flex justify-center")}>
                Create a league
              </Link>
              <Link
                href="/league/join"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex justify-center",
                )}
              >
                Join with invite code
              </Link>
            </div>
            {error ? (
              <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={loading}
                onClick={finishOnboarding}
              >
                Save & go to dashboard
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
