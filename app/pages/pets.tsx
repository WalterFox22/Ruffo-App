"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

type Pet = {
  id: string;
  client_id: string;
  name: string;
  species: "canino" | "felino" | "otro" | string;
  breed: string | null;
  behavior_notes: string | null;
  created_at: string;
};

type ClientWithPets = Client & { pets: Pet[] };

type PetFormErrors = {
  client_id?: string;
  name?: string;
  species?: string;
  breed?: string;
};

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function PetsPage() {
  const supabase = useMemo(() => supabaseClient(), []);

  const [rows, setRows] = useState<ClientWithPets[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [openPetModal, setOpenPetModal] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  const [petClientId, setPetClientId] = useState("");
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petBehaviorNotes, setPetBehaviorNotes] = useState("");
  const [petErrors, setPetErrors] = useState<PetFormErrors>({});

  async function loadData() {
    setLoading(true);
    setErrorMsg("");

    const [
      { data: clients, error: clientsError },
      { data: pets, error: petsError },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, phone, email, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("pets")
        .select(
          "id, client_id, name, species, breed, behavior_notes, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (clientsError || petsError) {
      setErrorMsg(
        clientsError?.message ||
          petsError?.message ||
          "No se pudo cargar la información.",
      );
      setRows([]);
      setLoading(false);
      return;
    }

    const petsByClient = (pets ?? []).reduce<Record<string, Pet[]>>(
      (acc, pet: Pet) => {
        if (!acc[pet.client_id]) acc[pet.client_id] = [];
        acc[pet.client_id].push(pet);
        return acc;
      },
      {},
    );

    const mapped: ClientWithPets[] = (clients ?? []).map((c: Client) => ({
      ...c,
      pets: petsByClient[c.id] ?? [],
    }));

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("clients-pets-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pets" },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((client) => {
      const clientMatch =
        client.full_name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.email ?? "").toLowerCase().includes(q);

      const petMatch = client.pets.some(
        (pet) =>
          pet.name.toLowerCase().includes(q) ||
          pet.species.toLowerCase().includes(q) ||
          (pet.breed ?? "").toLowerCase().includes(q),
      );

      return clientMatch || petMatch;
    });
  }, [rows, query]);

  function resetPetForm() {
    setPetClientId("");
    setPetName("");
    setPetSpecies("");
    setPetBreed("");
    setPetBehaviorNotes("");
    setPetErrors({});
  }

  function openPetForm(clientId?: string) {
    setPetErrors({});
    setPetClientId(clientId ?? "");
    setOpenPetModal(true);
  }

  function validatePetForm() {
    const errors: PetFormErrors = {};

    const cleanName = petName.trim();
    const cleanBreed = petBreed.trim();

    if (!petClientId) errors.client_id = "Debes seleccionar un cliente.";

    if (!cleanName) {
      errors.name = "El nombre es obligatorio.";
    } else if (!NAME_REGEX.test(cleanName)) {
      errors.name = "El nombre solo puede contener letras y espacios.";
    }

    if (!petSpecies.trim()) {
      errors.species = "La especie es obligatoria.";
    } else if (!["canino", "felino", "otro"].includes(petSpecies)) {
      errors.species = "La especie debe ser: canino, felino u otro.";
    }

    if (cleanBreed && !NAME_REGEX.test(cleanBreed)) {
      errors.breed = "La raza solo puede contener letras y espacios.";
    }

    setPetErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreatePet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validatePetForm()) return;

    setSavingPet(true);

    const { error } = await supabase.from("pets").insert({
      client_id: petClientId,
      name: petName.trim(),
      species: petSpecies,
      breed: petBreed.trim() || null,
      behavior_notes: petBehaviorNotes.trim() || null,
    });

    setSavingPet(false);

    if (error) {
      setPetErrors((prev) => ({ ...prev, name: error.message }));
      return;
    }

    setOpenPetModal(false);
    resetPetForm();
    await loadData();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          Detalle de clientes y mascotas
        </h1>
        <Button onClick={() => openPetForm()}>Añadir nueva mascota</Button>
      </div>

      <div className="flex w-full max-w-md items-center gap-2">
        <Input
          placeholder="Buscar cliente o mascota..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outline" aria-label="Buscar">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>

      {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      {loading ? (
        <div className="rounded-md border bg-white p-4 text-sm">
          Cargando información...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-md border bg-white p-4 text-sm text-gray-600">
          No hay clientes o mascotas registradas.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="w-full rounded-md border bg-white px-4"
        >
          {filteredRows.map((client) => (
            <AccordionItem key={client.id} value={client.id}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4 text-left">
                  <div>
                    <p className="font-medium">{client.full_name}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    Mascotas: {client.pets.length}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="space-y-3">
                  <div className="rounded-md border p-3 text-sm">
                    <p>
                      <strong>Telefono:</strong> {client.phone || "-"}
                    </p>
                    <p>
                      <strong>Correo:</strong> {client.email || "-"}
                    </p>
                    <p>
                      <strong>Fecha de registro:</strong>{" "}
                      {formatDate(client.created_at)}
                    </p>
                    <p>
                      <strong>Notas:</strong> {client.notes || "-"}
                    </p>
                  </div>

                  <h1 className="text-1xl font-semibold">
                    Detalle de mascotas
                  </h1>

                  <div className="overflow-x-auto rounded-md border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-left">
                        <tr>
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Especie</th>
                          <th className="px-4 py-3">Raza</th>
                          <th className="px-4 py-3">Notas de comportamiento</th>
                          <th className="px-4 py-3">Fecha de registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.pets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-gray-600">
                              Este cliente no tiene mascotas registradas.
                            </td>
                          </tr>
                        ) : (
                          client.pets.map((pet) => (
                            <tr key={pet.id} className="border-t">
                              <td className="px-4 py-3">{pet.name}</td>
                              <td className="px-4 py-3">{pet.species}</td>
                              <td className="px-4 py-3">{pet.breed || "-"}</td>
                              <td className="px-4 py-3">
                                {pet.behavior_notes || "-"}
                              </td>
                              <td className="px-4 py-3">
                                {formatDate(pet.created_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPetForm(client.id)}
                    >
                      Añadir nueva mascota
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {openPetModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Añadir nueva mascota</h2>
              <button
                type="button"
                onClick={() => setOpenPetModal(false)}
                className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Cliente *</label>
                <select
                  value={petClientId}
                  onChange={(e) => setPetClientId(e.target.value)}
                  className="w-full rounded-md border p-2 text-sm"
                  disabled={savingPet}
                >
                  <option value="">Seleccione un cliente</option>
                  {rows.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} - {c.phone}
                    </option>
                  ))}
                </select>
                {petErrors.client_id ? (
                  <p className="mt-1 text-xs text-red-600">
                    {petErrors.client_id}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm">Nombre *</label>
                <Input
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  disabled={savingPet}
                />
                {petErrors.name ? (
                  <p className="mt-1 text-xs text-red-600">{petErrors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm">Especie *</label>
                <select
                  value={petSpecies}
                  onChange={(e) => setPetSpecies(e.target.value)}
                  className="w-full rounded-md border p-2 text-sm"
                  disabled={savingPet}
                >
                  <option value="">Seleccione una especie</option>
                  <option value="canino">Canino</option>
                  <option value="felino">Felino</option>
                  <option value="otro">Otro</option>
                </select>
                {petErrors.species ? (
                  <p className="mt-1 text-xs text-red-600">
                    {petErrors.species}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm">Raza (opcional)</label>
                <Input
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  disabled={savingPet}
                />
                {petErrors.breed ? (
                  <p className="mt-1 text-xs text-red-600">{petErrors.breed}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Notas de comportamiento (opcional)
                </label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm"
                  rows={3}
                  value={petBehaviorNotes}
                  onChange={(e) => setPetBehaviorNotes(e.target.value)}
                  disabled={savingPet}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenPetModal(false)}
                  disabled={savingPet}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingPet}>
                  {savingPet ? "Guardando..." : "Guardar mascota"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
