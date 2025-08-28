"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import { Sleep } from "@/helpers/sleep";
import ActorProfile from "@/components/Actors/ActorProfile";
import ActorCharacterCard from "@/components/Characters/ActorCharacterCard";
import type { Actor } from "@/types/actor";
import type { actorCharacter } from "@/types/actorCharacter";
import Papa from "papaparse";

// === CSV paths (en /public/data) ===
const ACTORS_CSV_URL = "/data/actors.csv";
const CHARACTERS_CSV_URL = "/data/characters.csv";
const PLAYS_CSV_URL = "/data/play.csv"; // ojo: singular, según tu screenshot

// Tipos crudos según tus headers
type CsvActorRow = {
  ActorId: number | string;
  FirstName: string;
  LastName: string;
  DOB?: string | null;
  Gender?: string | null;
  SkinColor?: string | null;
  EyeColor?: string | null;
  HairColor?: string | null;
  FrontImage?: string | null;
  FullBodyImage?: string | null;
};

type CsvCharacterRow = {
  CharacterId: number | string;
  Name: string;
  Principal?: number | string | null; // 1 / 0
  Image?: string | null;
  ActorId?: number | string | null;
  PlayId: number | string;
};

type CsvPlayRow = {
  PlayId: number | string;
  Title: string;
  Genre?: string | null;
  Format?: string | null;
  Description?: string | null;
  Poster?: string | null;
  Script?: string | null;
};

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

const ActorPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const actorId = typeof idParam === "string" ? Number(idParam) : Number(idParam?.[0]);

  const [actor, setActor] = React.useState<Actor | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!Number.isFinite(actorId)) {
          throw new Error("Invalid actor id");
        }

        // 1) Cargar CSVs
        const [actorsText, charactersText, playsText] = await Promise.all([
          fetchCsvText(ACTORS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
          fetchCsvText(PLAYS_CSV_URL),
        ]);

        // 2) Parsear
        const actorsRows = parseCsv<CsvActorRow>(actorsText);
        const charRows = parseCsv<CsvCharacterRow>(charactersText);
        const playsRows = parseCsv<CsvPlayRow>(playsText);

        // 3) Buscar actor
        const raw = actorsRows.find((a) => {
          const aid = typeof a.ActorId === "string" ? Number(a.ActorId) : (a.ActorId as number);
          return aid === actorId;
        });
        if (!raw) throw new Error(`Actor ${actorId} not found`);

        // 4) Index de plays
        const playById = new Map<number, CsvPlayRow>();
        for (const p of playsRows) {
          const pid = typeof p.PlayId === "string" ? Number(p.PlayId) : (p.PlayId as number);
          if (Number.isFinite(pid)) playById.set(pid, p);
        }

        // 5) Personajes del actor
        const myCharsRaw = charRows.filter((c) => {
          const aidRaw = c.ActorId;
          if (aidRaw === null || aidRaw === undefined || aidRaw === "") return false;
          const aid = typeof aidRaw === "string" ? Number(aidRaw) : (aidRaw as number);
          return Number.isFinite(aid) && aid === actorId;
        });

        const myChars: actorCharacter[] = myCharsRaw.map((c) => {
          const cid = typeof c.CharacterId === "string" ? Number(c.CharacterId) : (c.CharacterId as number);
          const pid = typeof c.PlayId === "string" ? Number(c.PlayId) : (c.PlayId as number);
          const play = Number.isFinite(pid) ? playById.get(pid) : undefined;

          return {
            characterId: cid,
            name: c.Name ?? "",
            image: c.Image || null,
            principal: String(c.Principal ?? "0") === "1",
            playId: pid,
            playTitle: play?.Title ?? "",
            playFormat: play?.Format ?? "",
          };
        });

        // 6) Armar Actor (con los campos que usa ActorProfile)
        const actorObj: Actor = {
          actorId,
          firstName: (raw.FirstName ?? "").trim(),
          lastName: (raw.LastName ?? "").trim(),
          dob: raw.DOB ?? undefined,
          age: calcAge(raw.DOB),
          gender: raw.Gender ?? undefined,
          skinColor: raw.SkinColor ?? undefined,
          eyeColor: raw.EyeColor ?? undefined,
          hairColor: raw.HairColor ?? undefined,
          frontImage: raw.FrontImage || null,
          fullBodyImage: raw.FullBodyImage || null,
          characters: myChars,
          principals: myChars.filter((x) => x.principal).length, // por si lo usas
        };

        if (cancelled) return;
        setActor(actorObj);
        await Sleep(200);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load actor");
        await Sleep(200);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center p-4")}>
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
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <div className="text-foreground">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center")}>
          <div className="gap-4">{actor && <ActorProfile actor={actor} />}</div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center")}>
          <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Characters</h1>
          <div className={cn("grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4")}>
            {actor?.characters?.map((character) => (
              <Link key={character.characterId} href={`/characters/${character.characterId}`}>
                <ActorCharacterCard character={character} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorPage;
