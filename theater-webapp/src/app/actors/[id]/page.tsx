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

// === CSV paths (in /public/data) ===
const ACTORS_CSV_URL = "/data/actors.csv";
const CHARACTERS_CSV_URL = "/data/characters.csv";
const PLAYS_CSV_URL = "/data/play.csv";

// Raw CSV types (must match your CSV headers)
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
  const actorId =
    typeof idParam === "string" ? Number(idParam) : Number(idParam?.[0]);

  const [actor, setActor] = React.useState<Actor | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // === UI: filters panel, query and format filter ===
  const [panelOpen, setPanelOpen] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>("");
  const [format, setFormat] = React.useState<string>("ALL");
  const [formatOptions, setFormatOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!Number.isFinite(actorId)) {
          throw new Error("Invalid actor id");
        }

        // 1) Load CSVs
        const [actorsText, charactersText, playsText] = await Promise.all([
          fetchCsvText(ACTORS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
          fetchCsvText(PLAYS_CSV_URL),
        ]);

        // 2) Parse
        const actorsRows = parseCsv<CsvActorRow>(actorsText);
        const charRows = parseCsv<CsvCharacterRow>(charactersText);
        const playsRows = parseCsv<CsvPlayRow>(playsText);

        // 3) Find actor
        const raw = actorsRows.find((a) => {
          const aid =
            typeof a.ActorId === "string"
              ? Number(a.ActorId)
              : (a.ActorId as number);
          return aid === actorId;
        });
        if (!raw) throw new Error(`Actor ${actorId} not found`);

        // 4) Build play index
        const playById = new Map<number, CsvPlayRow>();
        for (const p of playsRows) {
          const pid =
            typeof p.PlayId === "string"
              ? Number(p.PlayId)
              : (p.PlayId as number);
          if (Number.isFinite(pid)) playById.set(pid, p);
        }

        // 5) Characters for this actor
        const myCharsRaw = charRows.filter((c) => {
          const aidRaw = c.ActorId;
          if (aidRaw === null || aidRaw === undefined || aidRaw === "")
            return false;
          const aid =
            typeof aidRaw === "string" ? Number(aidRaw) : (aidRaw as number);
          return Number.isFinite(aid) && aid === actorId;
        });

        const myChars: actorCharacter[] = myCharsRaw.map((c) => {
          const cid =
            typeof c.CharacterId === "string"
              ? Number(c.CharacterId)
              : (c.CharacterId as number);
          const pid =
            typeof c.PlayId === "string"
              ? Number(c.PlayId)
              : (c.PlayId as number);
          const play = Number.isFinite(pid) ? playById.get(pid) : undefined;

          return {
            characterId: cid,
            name: c.Name ?? "",
            image: c.Image || undefined,
            principal: String(c.Principal ?? "0") === "1",
            playId: pid,
            playTitle: (play?.Title ?? "").trim(),
            playFormat: (play?.Format ?? "").trim(),
          };
        });

        // 6) Build Actor object
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
          frontImage: raw.FrontImage || undefined,
          fullBodyImage: raw.FullBodyImage || undefined,
          characters: myChars,
          principals: myChars.filter((x) => x.principal).length,
        };

        if (cancelled) return;

        // Distinct formats for filter
        const formats = Array.from(
          new Set(
            myChars
              .map((x) => (x.playFormat ?? "").trim())
              .filter((f) => f && f.length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));

        setActor(actorObj);
        setFormatOptions(formats);

        await Sleep(150);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load actor");
        await Sleep(150);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId]);

  // === Filter + fixed sort (principals first, then play title A→Z, then character name A→Z) ===
  const visibleChars = React.useMemo(() => {
    const list = actor?.characters ?? [];
    const q = query.trim().toLowerCase();

    const filtered = list.filter((c) => {
      if (q) {
        const inChar = (c.name ?? "").toLowerCase().includes(q);
        const inPlay = (c.playTitle ?? "").toLowerCase().includes(q);
        if (!inChar && !inPlay) return false;
      }
      if (format !== "ALL") {
        if ((c.playFormat ?? "") !== format) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      // principals first
      if (a.principal !== b.principal) return a.principal ? -1 : 1;

      // then by play title (alphabetical)
      const ptA = (a.playTitle ?? "").toLowerCase();
      const ptB = (b.playTitle ?? "").toLowerCase();
      const t = ptA.localeCompare(ptB);
      if (t !== 0) return t;

      // then by character name (alphabetical)
      return (a.name ?? "")
        .toLowerCase()
        .localeCompare((b.name ?? "").toLowerCase());
    });

    return sorted;
  }, [actor, query, format]);

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
      {/* Actor header */}
      <div className="flex justify-center">
        <div className={cn("mx-auto flex flex-col items-center")}>
          <div className="gap-4">{actor && <ActorProfile actor={actor} />}</div>
        </div>
      </div>

      {/* Characters section */}
      <div className="flex justify-center">
        <div
          className={cn(
            "mx-auto flex flex-col items-center w-full max-w-7xl px-4"
          )}
        >
          <div className="relative w-full mt-8 mb-2">
            <h1 className="text-4xl font-bold text-foreground text-center">
              Characters
            </h1>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm hover:bg-accent/30 transition shadow-sm"
              aria-expanded={panelOpen}
              aria-controls="filters-panel"
            >
              {panelOpen ? "Hide Filters" : "Filters"}
            </button>
          </div>

          {/* Collapsible filters panel */}
          {panelOpen && (
            <div
              id="filters-panel"
              className="w-full bg-card/60 border border-border/50 rounded-2xl p-4 mb-4 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                {/* Search (character or play) */}
                <div className="flex flex-col xl:col-span-3">
                  <label className="text-sm text-muted-foreground mb-1">
                    Search (character or play)
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Hamlet or Shakespeare"
                    className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Format filter */}
                <div className="flex flex-col">
                  <label className="text-sm text-muted-foreground mb-1">
                    Format
                  </label>
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

                {/* Actions */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setQuery("");
                      setFormat("ALL");
                    }}
                    className="h-10 rounded-lg border border-border/60 bg-background px-4 text-sm hover:bg-accent/30 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold">{visibleChars.length}</span> of{" "}
                <span className="font-semibold">
                  {actor?.characters?.length ?? 0}
                </span>{" "}
                characters
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4"
            )}
          >
            {visibleChars.map((character) => (
              <Link
                key={character.characterId}
                href={`/characters/${character.characterId}`}
              >
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
