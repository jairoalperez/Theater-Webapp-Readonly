"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import ActorCard from "@/components/Actors/ActorCard";
import Papa from "papaparse";
import { Sleep } from "@/helpers/sleep";
import type { ActorShort } from "@/types/actorShort";


// === CSV paths (colócalos en /public/data/) ===
const ACTORS_CSV_URL = "/data/actors.csv";
const CHARACTERS_CSV_URL = "/data/characters.csv";

// Tipos según tus encabezados de CSV
type CsvActorRow = {
  ActorId: number | string;
  FirstName: string;
  LastName: string;
  DOB?: string | null;        // "YYYY-MM-DD"
  Gender?: string | null;
  FrontImage?: string | null;
  FullBodyImage?: string | null;
};

type CsvCharacterRow = {
  CharacterId: number | string;
  Name: string;
  Principal?: number | string | null; // 1 principal, 0 no principal
  ActorId?: number | string | null;   // puede venir vacío
  PlayId: number | string;
};

// Utilidades: traemos el CSV como texto (para detectar 404) y luego parseamos
async function fetchCsvText(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return await res.text();
}

function parseCsv<T = any>(csvText: string): T[] {
  const parsed = Papa.parse<T>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    // worker: true, // re-activa si el archivo crece
  });
  return parsed.data as T[];
}

function calcAge(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const ActorsList: React.FC = () => {
  const [actors, setActors] = React.useState<ActorShort[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Fetch CSVs como texto (detecta 404/403)
        const [actorsText, charactersText] = await Promise.all([
          fetchCsvText(ACTORS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
        ]);

        // 2) Parse
        const actorsRows = parseCsv<CsvActorRow>(actorsText);
        const charRows = parseCsv<CsvCharacterRow>(charactersText);

        // 3) Indexar personajes por ActorId
        const charsByActor = new Map<number, CsvCharacterRow[]>();
        for (const ch of charRows) {
          const aidRaw = ch.ActorId;
          if (aidRaw === null || aidRaw === undefined || aidRaw === "") continue;
          const aid = typeof aidRaw === "string" ? Number(aidRaw) : (aidRaw as number);
          if (!Number.isFinite(aid)) continue;
          const arr = charsByActor.get(aid) || [];
          arr.push(ch);
          charsByActor.set(aid, arr);
        }

        // 4) Mapear a ActorShort (lo que espera ActorCard)
        const mapped: ActorShort[] = actorsRows.map((r) => {
          const actorId = typeof r.ActorId === "string" ? Number(r.ActorId) : (r.ActorId as number);
          const list = charsByActor.get(actorId) || [];
          const principals = list.filter(x => String(x.Principal ?? "0") === "1").length;

          return {
            actorId,
            firstName: (r.FirstName ?? "").trim(),
            lastName: (r.LastName ?? "").trim(),
            gender: r.Gender ?? undefined,
            age: calcAge(r.DOB),
            frontImage: r.FrontImage || undefined,
            fullBodyImage: r.FullBodyImage || undefined,
            characters: list.length,
            principals,
          } as ActorShort;
        });

        if (cancelled) return;
        setActors(mapped);
        await Sleep(200); // cosmético
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load data");
        await Sleep(200);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center p-4")}>
          <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <LoaderPinwheelIcon isAnimating={true} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center p-4")}>
          <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <div className="text-foreground">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center pb-16">
      <div className={cn("mx-auto flex flex-col items-center")}>
        <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Actors</h1>
        <div className={cn("grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4")}>
          {actors.map((actor) => (
            <Link key={actor.actorId} href={`/actors/${actor.actorId}`}>
              <ActorCard actor={actor} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActorsList;
