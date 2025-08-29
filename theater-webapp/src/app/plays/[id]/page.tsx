"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import { Sleep } from "@/helpers/sleep";
import PlayProfile from "@/components/Plays/PlayProfile";
import PlayCharacterCard from "@/components/Characters/PlayCharacterCard";
import type { Play } from "@/types/play";
import type { PlayCharacter } from "@/types/playCharacter";
import Papa from "papaparse";

const PLAYS_CSV_URL = "/data/play.csv";        // singular
const CHARACTERS_CSV_URL = "/data/characters.csv";
const ACTORS_CSV_URL = "/data/actors.csv";

// Raw CSV types (poster/format lowercase as per your note)
type CsvPlayRow = {
  PlayId: number | string;
  Title: string;
  Genre?: string | null;
  Format?: string | null;  // lowercase
  Poster?: string | null;  // lowercase
  Description?: string | null;
};

type CsvCharacterRow = {
  CharacterId: number | string;
  Name: string;
  Description?: string | null;
  Age?: number | string | null;
  Gender?: string | null;
  Principal?: number | string | null;
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

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

const PlayPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const playId = typeof idParam === "string" ? Number(idParam) : Number(idParam?.[0]);

  const [play, setPlay] = React.useState<Play | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search state (character name OR actor name)
  const [query, setQuery] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!Number.isFinite(playId)) throw new Error("Invalid play id");

        const [playsText, charsText, actorsText] = await Promise.all([
          fetchCsvText(PLAYS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
          fetchCsvText(ACTORS_CSV_URL),
        ]);

        const plays = parseCsv<CsvPlayRow>(playsText);
        const chars = parseCsv<CsvCharacterRow>(charsText);
        const actors = parseCsv<CsvActorRow>(actorsText);

        const playRaw = plays.find((p) => toNum(p.PlayId) === playId);
        if (!playRaw) throw new Error(`Play ${playId} not found`);

        const actorById = new Map<number, CsvActorRow>();
        for (const a of actors) {
          const aid = toNum(a.ActorId);
          if (aid) actorById.set(aid, a);
        }

        const playCharacters: PlayCharacter[] = chars
          .filter((c) => toNum(c.PlayId) === playId)
          .map((c) => {
            const cid = toNum(c.CharacterId)!;
            const aid = toNum(c.ActorId);
            const a = aid ? actorById.get(aid) : undefined;

            return {
              characterId: cid,
              name: c.Name ?? "",
              image: c.Image || undefined,
              principal: String(c.Principal ?? "0") === "1",
              actor: a
                ? {
                    actorId: aid!,
                    firstName: (a.FirstName ?? "").trim(),
                    lastName: (a.LastName ?? "").trim(),
                    frontImage: a.FrontImage || undefined,
                  }
                : undefined,
            } as PlayCharacter;
          });

        const poster = (playRaw as any).Poster ?? (playRaw as any).Poster ?? null;
        const format = (playRaw as any).Format ?? (playRaw as any).Format ?? "";

        const mappedPlay: Play = {
          playId,
          title: (playRaw.Title ?? "").trim(),
          genre: playRaw.Genre ?? "",
          format,
          description: (playRaw as any).Description ?? "",
          poster,
          characters: playCharacters,
        };

        if (cancelled) return;
        setPlay(mappedPlay);
        await Sleep(200);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load play");
        await Sleep(200);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playId]);

  // Filter by query: matches character name OR actor full name
  const visibleCharacters = React.useMemo(() => {
    const list = play?.characters ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((c) => {
      const inCharacter = (c.name ?? "").toLowerCase().includes(q);
      const actorFull = c.actor
        ? `${c.actor.firstName ?? ""} ${c.actor.lastName ?? ""}`.trim().toLowerCase()
        : "";
      const inActor = actorFull.includes(q);
      return inCharacter || inActor;
    });
  }, [play, query]);

  return (
    <div className="flex justify-center pb-16">
      <div className={cn("mx-auto flex flex-col items-center w-full max-w-7xl px-4")}>
        {loading ? (
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <LoaderPinwheelIcon isAnimating={true} />
          </div>
        ) : error ? (
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <div className="text-foreground">{error}</div>
          </div>
        ) : (
          <div className="w-full">
            {/* Play header */}
            <div className="gap-4">{play && <PlayProfile play={play} />}</div>

            {/* Characters header + search (centered title, search below) */}
            <div className="flex flex-col items-center w-full mt-8 mb-2">
              <h1 className="text-4xl font-bold text-foreground text-center">Characters</h1>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by character or actor name…"
                className="mt-3 h-10 w-full max-w-xl rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Search characters by character or actor name"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Showing <span className="font-semibold">{visibleCharacters.length}</span> of{" "}
                <span className="font-semibold">{play?.characters?.length ?? 0}</span> characters
              </div>
            </div>

            {/* Grid */}
            <div className={cn("grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4")}>
              {visibleCharacters.map((character) => (
                <Link key={character?.characterId} href={`/characters/${character?.characterId}`}>
                  <PlayCharacterCard character={character} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayPage;
