"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseClient } from "@/lib/supabase/client";

type Client = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

type ClientRow = Client & {
  pets_count: number;
  status: "Con mascotas" | "Sin mascotas";
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ClientsPage() {
  const supabase = useMemo(() => supabaseClient(), []);

  const [rows, setRows] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function loadClients() {
    setLoading(true);
    setErrorMsg("");

    const [{ data: clients, error: clientsError }, { data: pets, error: petsError }] = await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, phone, email, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("pets").select("client_id"),
    ]);

    if (clientsError || petsError) {
      setErrorMsg(clientsError?.message || petsError?.message || "No se pudieron cargar los clientes.");
      setRows([]);
      setLoading(false);
      return;
    }

    const countByClient = (pets ?? []).reduce<Record<string, number>>((acc, pet: { client_id: string }) => {
      acc[pet.client_id] = (acc[pet.client_id] ?? 0) + 1;
      return acc;
    }, {});

    const mapped: ClientRow[] = (clients ?? []).map((c: Client) => {
      const petsCount = countByClient[c.id] ?? 0;
      return {
        ...c,
        pets_count: petsCount,
        status: petsCount > 0 ? "Con mascotas" : "Sin mascotas",
      };
    });

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  async function handleCreateClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg("Nombre completo y teléfono son obligatorios.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("clients").insert({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setOpenModal(false);
    setFullName("");
    setPhone("");
    setEmail("");
    setNotes("");

    await loadClients();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes Registrados</h1>

        <Button onClick={() => setOpenModal(true)}>Añadir Cliente</Button>
      </div>

      <div className="flex w-full max-w-md items-center gap-2">
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outline" aria-label="Buscar">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>

      {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <div className="overflow-x-auto rounded-md border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cantidad de mascotas</th>
              <th className="px-4 py-3">Fecha de registro</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4" colSpan={6}>
                  Cargando clientes...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-600" colSpan={6}>
                  No existen usuarios registrados.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">{row.full_name}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.pets_count}</td>
                  <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${row.id}/pets/new`}
                      className="inline-block rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Añadir mascota
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Añadir Cliente</h2>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Nombre completo *</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: María Pérez"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Teléfono *</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 0999999999"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: cliente@mail.com"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Notas</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas del cliente..."
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}