"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoaderPinwheelIcon } from "@/components/ui/loader-pinwheel";
import ActorCard from "@/components/Actors/ActorCard";
import Papa from "papaparse";
import { Sleep } from "@/helpers/sleep";
import type { ActorShort } from "@/types/actorShort";

// === CSV paths (place them under /public/data/) ===
const ACTORS_CSV_URL = "/data/actors.csv";
const CHARACTERS_CSV_URL = "/data/characters.csv";

// CSV types based on your headers
type CsvActorRow = {
  ActorId: number | string;
  FirstName: string;
  LastName: string;
  DOB?: string | null; // "YYYY-MM-DD"
  Gender?: string | null;
  FrontImage?: string | null;
  FullBodyImage?: string | null;
};

type CsvCharacterRow = {
  CharacterId: number | string;
  Name: string;
  Principal?: number | string | null; // 1 principal, 0 non-principal
  ActorId?: number | string | null; // could be empty
  PlayId: number | string;
};

// Utils: fetch CSV as text (so we can detect 404)
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

type SortField = "characters" | "principals" | "name";
type SortDir = "asc" | "desc";

const DEFAULT_SORT_FIELD: SortField = "characters";
const DEFAULT_SORT_DIR: SortDir = "desc"; // show most characters first by default

const ActorsList: React.FC = () => {
  const [actors, setActors] = React.useState<ActorShort[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // === Filters state ===
  const [searchName, setSearchName] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("ALL");

  // === Sorting state ===
  const [sortField, setSortField] = React.useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortDir, setSortDir] = React.useState<SortDir>(DEFAULT_SORT_DIR);

  // Toggle filters panel
  const [panelOpen, setPanelOpen] = React.useState<boolean>(false);

  // Distinct genders present in dataset (derived after load)
  const [genderOptions, setGenderOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Fetch CSVs as text
        const [actorsText, charactersText] = await Promise.all([
          fetchCsvText(ACTORS_CSV_URL),
          fetchCsvText(CHARACTERS_CSV_URL),
        ]);

        // 2) Parse
        const actorsRows = parseCsv<CsvActorRow>(actorsText);
        const charRows = parseCsv<CsvCharacterRow>(charactersText);

        // 3) Index characters by ActorId
        const charsByActor = new Map<number, CsvCharacterRow[]>();
        for (const ch of charRows) {
          const aidRaw = ch.ActorId;
          if (aidRaw === null || aidRaw === undefined || aidRaw === "") continue;
          const aid =
            typeof aidRaw === "string" ? Number(aidRaw) : (aidRaw as number);
          if (!Number.isFinite(aid)) continue;
          const arr = charsByActor.get(aid) || [];
          arr.push(ch);
          charsByActor.set(aid, arr);
        }

        // 4) Map to ActorShort (what ActorCard expects)
        const mapped: ActorShort[] = actorsRows.map((r) => {
          const actorId =
            typeof r.ActorId === "string" ? Number(r.ActorId) : (r.ActorId as number);
          const list = charsByActor.get(actorId) || [];
          const principals = list.filter(
            (x) => String(x.Principal ?? "0") === "1"
          ).length;

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

        // Build gender options from mapped data
        const genders = Array.from(
          new Set(
            mapped
              .map((a) => (a.gender ?? "").trim())
              .filter((g) => g && g.length > 0)
          )
        ).sort();

        setActors(mapped);
        setGenderOptions(genders);
        await Sleep(120); // small cosmetic delay
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load data");
        await Sleep(120);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // === Filter + sort pipeline ===
  const filteredAndSorted = React.useMemo(() => {
    // 1) Filter
    const nameQuery = searchName.trim().toLowerCase();
    const filtered = actors.filter((a) => {
      if (nameQuery) {
        const full = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        const first = (a.firstName ?? "").toLowerCase();
        const last = (a.lastName ?? "").toLowerCase();
        if (
          !full.includes(nameQuery) &&
          !first.includes(nameQuery) &&
          !last.includes(nameQuery)
        ) {
          return false;
        }
      }
      if (gender !== "ALL") {
        const g = (a.gender ?? "").trim();
        if (g !== gender) return false;
      }
      return true;
    });

    // 2) Sort
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      if (sortField === "characters") {
        if (a.characters === b.characters) {
          // tiebreaker by principals desc, then name asc
          if (a.principals !== b.principals) {
            return (a.principals - b.principals) * -1;
          }
          const an = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
          const bn = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
          return an.localeCompare(bn);
        }
        return (a.characters - b.characters) * dir;
      }

      if (sortField === "principals") {
        if (a.principals === b.principals) {
          // tiebreaker by characters desc, then name asc
          if (a.characters !== b.characters) {
            return (a.characters - b.characters) * -1;
          }
          const an = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
          const bn = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
          return an.localeCompare(bn);
        }
        return (a.principals - b.principals) * dir;
      }

      // sortField === "name"
      const an = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
      const bn = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
      return an.localeCompare(bn) * (sortDir === "asc" ? 1 : -1);
    });

    return sorted;
  }, [actors, searchName, gender, sortField, sortDir]);

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
      <div className={cn("mx-auto flex flex-col items-center w-full max-w-7xl px-4")}>
        <h1 className="text-4xl font-bold mx-auto mb-6 mt-8 text-foreground">Actors</h1>

        {/* === Top bar: controls summary + toggle === */}
        <div className="w-full mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm hover:bg-accent/30 transition shadow-sm"
            aria-expanded={panelOpen}
            aria-controls="filters-panel"
          >
            {panelOpen ? "Hide Filters & Sort" : "Filters & Sort"}
          </button>

          {/* Quick sort pills for convenience */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Quick sort:</span>
            <button
              onClick={() => {
                setSortField("characters");
                setSortDir("desc");
              }}
              className="text-xs rounded-lg border border-border/60 px-3 py-1 hover:bg-accent/30"
            >
              Characters ↓
            </button>
            <button
              onClick={() => {
                setSortField("principals");
                setSortDir("desc");
              }}
              className="text-xs rounded-lg border border-border/60 px-3 py-1 hover:bg-accent/30"
            >
              Principals ↓
            </button>
          </div>
        </div>

        {/* === Collapsible Filters Panel === */}
        {panelOpen && (
          <div
            id="filters-panel"
            className="w-full bg-card/60 border border-border/50 rounded-2xl p-4 mb-4 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              {/* Name */}
              <div className="flex flex-col xl:col-span-2">
                <label className="text-sm text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search by first/last name…"
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-10 rounded-lg border border-border/60 bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">All</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
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
                  <option value="characters">Characters</option>
                  <option value="principals">Principals</option>
                  <option value="name">Name</option>
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
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSearchName("");
                    setGender("ALL");
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
              <span className="font-semibold">{actors.length}</span> actors
            </div>
          </div>
        )}

        {/* === Grid === */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4")}>
          {filteredAndSorted.map((actor) => (
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
