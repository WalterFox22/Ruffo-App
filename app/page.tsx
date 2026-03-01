"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Completa email y contraseña.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-lg border p-5 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Iniciar Sesión</h1>

        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Input
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {errorMsg ? <p className="text-sm text-red-500">{errorMsg}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}