"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;

    try {
      if (mode === "magic") {
        const { error: e } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (e) throw e;
        setError(null);
        alert("Check your email for the magic link.");
        return;
      }
      if (!values.password) {
        setError("Password is required.");
        return;
      }
      const { error: e } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (e) throw e;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (e) setError(e.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Sign in to your PitchIQ account
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "password" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("password")}
        >
          Password
        </Button>
        <Button
          type="button"
          variant={mode === "magic" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("magic")}
        >
          Magic link
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
        </div>
        {mode === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {mode === "magic" ? "Send magic link" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-glass-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-muted)]">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-[var(--color-glass-border)]"
        onClick={signInWithGoogle}
        disabled={loading}
      >
        Google
      </Button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        No account?{" "}
        <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
