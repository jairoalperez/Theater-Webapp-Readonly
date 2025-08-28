"use client";

import React from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import { Sleep } from "@/helpers/sleep";
import CharacterProfile from "@/components/Characters/CharacterProfile";
import type { Character } from "@/types/character";
import Papa from "papaparse";

// === CSV paths (colócalos en /public/data) ===
const CHARACTERS_CSV_URL = "/data/characters.csv";
const ACTORS_CSV_URL = "/data/actors.csv";
const PLAYS_CSV_URL = "/data/play.csv"; // ojo: singular según tu estructura

// Raw CSV types (headers must match your CSVs)
type CsvCharacterRow = {
  CharacterId: number | string;
  Name: string;
  Description?: string | null;
  Age?: number | string | null;
  Gender?: string | null;
  Principal?: number | string | null; // 1 / 0
  Image?: string | null;
  ActorId?: number | string | null;
  PlayId: number | string;
};

type CsvActorRow = {
  ActorId: number | string;
  FirstName: string;
  LastName: string;
  FrontImage?: string | null;
  FullBodyImage?: string | null;
};

type CsvPlayRow = {
  PlayId: number | string;
  Title: string;
  Format?: string | null;
  Poster?: string | null;
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

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

const CharacterPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const characterId = typeof idParam === "string" ? Number(idParam) : Number(idParam?.[0]);

  const [character, setCharacter] = React.useState<Character | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!Number.isFinite(characterId)) {
          throw new Error("Invalid character id");
        }

        // 1) Fetch CSVs
        const [charsText, actorsText, playsText] = await Promise.all([
          fetchCsvText(CHARACTERS_CSV_URL),
          fetchCsvText(ACTORS_CSV_URL),
          fetchCsvText(PLAYS_CSV_URL),
        ]);

        // 2) Parse
        const chars = parseCsv<CsvCharacterRow>(charsText);
        const actors = parseCsv<CsvActorRow>(actorsText);
        const plays = parseCsv<CsvPlayRow>(playsText);

        // 3) Find character row
        const raw = chars.find((c) => {
          const cid = toNumber(c.CharacterId);
          return cid === characterId;
        });
        if (!raw) throw new Error(`Character ${characterId} not found`);

        // 4) Join with actor & play
        const actorId = toNumber(raw.ActorId);
        const playId = toNumber(raw.PlayId);

        const actorRaw = actorId
          ? actors.find((a) => toNumber(a.ActorId) === actorId)
          : undefined;

        const playRaw = playId
          ? plays.find((p) => toNumber(p.PlayId) === playId)
          : undefined;

        // 5) Map to Character (fields used by CharacterProfile)
        const mapped: Character = {
          characterId: characterId,
          name: raw.Name ?? "",
          description: raw.Description ?? undefined,
          age: toNumber(raw.Age),
          gender: raw.Gender ?? undefined,
          principal: String(raw.Principal ?? "0") === "1",
          image: raw.Image || null,
          // nested objects that your component reads:
          actor: actorRaw
            ? {
                actorId: actorId!,
                firstName: (actorRaw.FirstName ?? "").trim(),
                lastName: (actorRaw.LastName ?? "").trim(),
                frontImage: actorRaw.FrontImage || null,
              }
            : undefined,
          play: playRaw
            ? {
                playId: playId!,
                title: playRaw.Title ?? "",
                format: playRaw.Format ?? "",
                poster: playRaw.Poster || null,
              }
            : undefined,
        };

        if (cancelled) return;
        setCharacter(mapped);
        await Sleep(200);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load character");
        await Sleep(200);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

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
    <div>
      <div className="flex justify-center pb-16">
        <div className="mx-auto flex flex-col items-center">
          {character && <CharacterProfile character={character} />}
        </div>
      </div>
    </div>
  );
};

export default CharacterPage;
