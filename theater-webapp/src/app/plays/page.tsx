"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import { Sleep } from "@/helpers/sleep";
import PlayCard from "@/components/Plays/PlayCard";
import type { PlayShort } from "@/types/playShort";
import Papa from "papaparse";

// === CSV paths (en /public/data) ===
const PLAYS_CSV_URL = "/data/play.csv";        // ojo: singular según tu estructura
const CHARACTERS_CSV_URL = "/data/characters.csv";

// Raw CSV types (encabezados deben coincidir con tus CSVs)
type CsvPlayRow = {
  PlayId: number | string;
  Title: string;
  Genre?: string | null;
  Format?: string | null;
  Description?: string | null;
  Poster?: string | null;
  Script?: string | null;
};

type CsvCharacterRow = {
  CharacterId: number | string;
  PlayId: number | string;
  Principal?: number | string | null;
  // otros campos opcionales...
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
  const fatal = parsed.errors?.find((e) => e.fatal);
  if (fatal) throw new Error(`CSV parse error: ${fatal.message}`);
  return parsed.data as T[];
}

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

const PlaysList: React.FC = () => {
  const [plays, setPlays] = React.useState<PlayShort[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Fetch CSVs
        const [playsText, charsText] = await Promise.all([
          fetchCsvText(PLAYS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
        ]);

        // 2) Parse
        const playRows = parseCsv<CsvPlayRow>(playsText);
        const charRows = parseCsv<CsvCharacterRow>(charsText);

        // 3) Conteo de personajes por PlayId
        const charCountByPlay = new Map<number, number>();
        for (const ch of charRows) {
          const pid = toNum(ch.PlayId);
          if (!pid) continue;
          charCountByPlay.set(pid, (charCountByPlay.get(pid) ?? 0) + 1);
        }

        // 4) Map a PlayShort
        const mapped: PlayShort[] = playRows.map((p) => {
          const playId = toNum(p.PlayId)!;
          return {
            playId,
            title: (p.Title ?? "").trim(),
            genre: p.Genre ?? "",
            format: p.Format ?? "",
            poster: p.Poster || null,
            characters: charCountByPlay.get(playId) ?? 0,
          } as PlayShort;
        });

        if (cancelled) return;
        setPlays(mapped);
        await Sleep(200);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load plays");
        await Sleep(200);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex justify-center pb-16">
      <div className={cn("mx-auto flex flex-col items-center")}>
        <h1 className="text-4xl font-bold mx-auto mb-8 mt-8 text-foreground">Plays</h1>

        {loading ? (
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <LoaderPinwheelIcon isAnimating={true} />
          </div>
        ) : error ? (
          <div className="h-56 w-full object-cover object-end flex items-center justify-center">
            <div className="text-foreground">{error}</div>
          </div>
        ) : (
          <div className={cn("grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4")}>
            {plays.map((play) => (
              <Link key={play.playId} href={`/plays/${play.playId}`}>
                <PlayCard play={play} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaysList;
