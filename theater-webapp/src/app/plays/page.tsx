"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import { Sleep } from "@/helpers/sleep";
import PlayCard from "@/components/Plays/PlayCard";
import type { PlayShort } from "@/types/playShort";
import Papa from "papaparse";

// === CSV paths (placed in /public/data) ===
const PLAYS_CSV_URL = "/data/play.csv";        // singular as per your structure
const CHARACTERS_CSV_URL = "/data/characters.csv";

// Raw CSV types (headers must match your CSVs)
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
  // ...
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

type SortField = "name" | "characters";
type SortDir = "asc" | "desc";

const DEFAULT_SORT_FIELD: SortField = "name";
const DEFAULT_SORT_DIR: SortDir = "asc"; // alphabetical A->Z

const PlaysList: React.FC = () => {
  const [plays, setPlays] = React.useState<PlayShort[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [titleQuery, setTitleQuery] = React.useState<string>("");
  const [genre, setGenre] = React.useState<string>("ALL");
  const [format, setFormat] = React.useState<string>("ALL");

  // Sorting
  const [sortField, setSortField] = React.useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortDir, setSortDir] = React.useState<SortDir>(DEFAULT_SORT_DIR);

  // Collapsible panel
  const [panelOpen, setPanelOpen] = React.useState<boolean>(false);

  // Options
  const [genreOptions, setGenreOptions] = React.useState<string[]>([]);
  const [formatOptions, setFormatOptions] = React.useState<string[]>([]);

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

        // 3) Count characters by PlayId
        const charCountByPlay = new Map<number, number>();
        for (const ch of charRows) {
          const pid = toNum(ch.PlayId);
          if (!pid) continue;
          charCountByPlay.set(pid, (charCountByPlay.get(pid) ?? 0) + 1);
        }

        // 4) Map to PlayShort
        const mapped: PlayShort[] = playRows
          .filter((p) => toNum(p.PlayId)) // ensure valid PlayId
          .map((p) => {
            const playId = toNum(p.PlayId)!;
            return {
              playId,
              title: (p.Title ?? "").trim(),
              genre: (p.Genre ?? "").trim(),
              format: (p.Format ?? "").trim(),
              poster: p.Poster || undefined,
              characters: charCountByPlay.get(playId) ?? 0,
            } as PlayShort;
          });

        if (cancelled) return;

        // Build options
        const genres = Array.from(
          new Set(mapped.map((x) => x.genre).filter((g) => g && g.length > 0))
        ).sort((a, b) => a.localeCompare(b));
        const formats = Array.from(
          new Set(mapped.map((x) => x.format).filter((f) => f && f.length > 0))
        ).sort((a, b) => a.localeCompare(b));

        setPlays(mapped);
        setGenreOptions(genres);
        setFormatOptions(formats);

        await Sleep(150);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load plays");
        await Sleep(150);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter + sort
  const filteredAndSorted = React.useMemo(() => {
    const tq = titleQuery.trim().toLowerCase();

    const filtered = plays.filter((p) => {
      if (tq) {
        if (!p.title.toLowerCase().includes(tq)) return false;
      }
      if (genre !== "ALL") {
        if ((p.genre ?? "") !== genre) return false;
      }
      if (format !== "ALL") {
        if ((p.format ?? "") !== format) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.title.localeCompare(b.title);
        return (sortDir === "asc" ? 1 : -1) * cmp;
      }
      // sortField === "characters"
      if (a.characters === b.characters) {
        // tiebreakers: by name asc
        return a.title.localeCompare(b.title);
      }
      return (sortDir === "asc" ? 1 : -1) * (a.characters - b.characters);
    });

    return sorted;
  }, [plays, titleQuery, genre, format, sortField, sortDir]);

  return (
    <div className="flex justify-center pb-16">
      <div className={cn("mx-auto flex flex-col items-center w-full max-w-7xl px-4")}>
        <h1 className="text-4xl font-bold mx-auto mb-6 mt-8 text-foreground">Plays</h1>

        {/* Top bar: toggle + quick sorts */}
        <div className="w-full mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm hover:bg-accent/30 transition shadow-sm"
            aria-expanded={panelOpen}
            aria-controls="filters-panel"
          >
            {panelOpen ? "Hide Filters & Sort" : "Filters & Sort"}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Quick sort:</span>
            <button
              onClick={() => {
                setSortField("name");
                setSortDir("asc");
              }}
              className="text-xs rounded-lg border border-border/60 px-3 py-1 hover:bg-accent/30"
            >
              A → Z
            </button>
            <button
              onClick={() => {
                setSortField("characters");
                setSortDir("desc");
              }}
              className="text-xs rounded-lg border border-border/60 px-3 py-1 hover:bg-accent/30"
            >
              Characters ↓
            </button>
          </div>
        </div>

        {/* Collapsible panel */}
        {panelOpen && (
          <div
            id="filters-panel"
            className="w-full bg-card/60 border border-border/50 rounded-2xl p-4 mb-4 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              {/* Title search */}
              <div className="flex flex-col xl:col-span-2">
                <label className="text-sm text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  placeholder="Search by title…"
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Genre */}
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">All</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">All</option>
                  {formatOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground mb-1">Sort by</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="name">Name (A→Z)</option>
                  <option value="characters">Characters</option>
                </select>
              </div>

              {/* Direction */}
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground mb-1">Direction</label>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as SortDir)}
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setTitleQuery("");
                    setGenre("ALL");
                    setFormat("ALL");
                    setSortField(DEFAULT_SORT_FIELD);
                    setSortDir(DEFAULT_SORT_DIR);
                  }}
                  className="h-10 rounded-lg border border-border/60 bg-background px-4 text-sm hover:bg-accent/30 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-semibold">{filteredAndSorted.length}</span> of{" "}
              <span className="font-semibold">{plays.length}</span> plays
            </div>
          </div>
        )}

        {/* Grid */}
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
            {filteredAndSorted.map((play) => (
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
