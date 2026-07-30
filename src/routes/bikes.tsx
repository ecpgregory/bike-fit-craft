import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Search, Plus, Database } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, EmptyState } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bikes, type BikeRecord } from "@/lib/bike-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bikes")({
  head: () => ({
    meta: [
      { title: "Bike Database — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Searchable, sortable database of road bike frame geometry: reach, stack, head tube, wheelbase and more.",
      },
      { property: "og:title", content: "Bike Database — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Searchable, sortable road bike frame geometry database.",
      },
    ],
  }),
  component: BikeDatabase,
});

type Column = {
  key: keyof BikeRecord;
  label: string;
  numeric?: boolean;
};

const columns: Column[] = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "year", label: "Year", numeric: true },
  { key: "size", label: "Size" },
  { key: "frameReach", label: "Frame Reach", numeric: true },
  { key: "frameStack", label: "Frame Stack", numeric: true },
  { key: "headTube", label: "Head Tube", numeric: true },
  { key: "wheelbase", label: "Wheelbase", numeric: true },
  { key: "frontCentre", label: "Front Centre", numeric: true },
  { key: "bbDrop", label: "BB Drop", numeric: true },
  { key: "tyreClearance", label: "Tyre Clearance", numeric: true },
  { key: "weight", label: "Weight", numeric: true },
  { key: "stem", label: "Stem", numeric: true },
  { key: "integratedCockpit", label: "Integrated Cockpit" },
  { key: "notes", label: "Notes" },
];

function BikeDatabase() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [size, setSize] = useState("all");
  const [sortKey, setSortKey] = useState<keyof BikeRecord>("brand");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const brands = useMemo(
    () => Array.from(new Set(bikes.map((b) => b.brand).filter(Boolean))).sort(),
    [],
  );
  const sizes = useMemo(
    () => Array.from(new Set(bikes.map((b) => b.size).filter(Boolean))).sort(),
    [],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = bikes.filter((b) => {
      const matchesQuery =
        !q ||
        [b.brand, b.model, b.size, b.notes].some((v) => (v ?? "").toLowerCase().includes(q));
      const matchesBrand = brand === "all" || b.brand === brand;
      const matchesSize = size === "all" || b.size === size;
      return matchesQuery && matchesBrand && matchesSize;
    });

    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, brand, size, sortKey, sortDir]);

  const toggleSort = (key: keyof BikeRecord) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <PageHeader
        title="Bike Database"
        description="Frame geometry library. Add frames to start ranking matches against your fit."
        action={
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            Add bike
          </Button>
        }
      />

      <Panel className="overflow-hidden" >
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand, model, size or notes"
              className="pl-9"
              aria-label="Search bikes"
            />
          </div>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by brand">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="sm:w-40" aria-label="Filter by size">
              <SelectValue placeholder="All sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              {sizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                        sortKey === col.key ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {col.label}
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-4">
                    <EmptyState
                      icon={<Database className="size-5" />}
                      title="No bikes in the database"
                      description="Geometry rows are intentionally empty. Add frames to enable sorting, filtering and match ranking."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((bike) => (
                  <TableRow key={bike.id}>
                    {columns.map((col) => {
                      const value = bike[col.key];
                      return (
                        <TableCell
                          key={col.key}
                          className={cn("whitespace-nowrap text-sm", col.numeric && "tabular font-mono")}
                        >
                          {value === null || value === undefined || value === ""
                            ? "—"
                            : typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : String(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "frame" : "frames"} · sorted by{" "}
          {columns.find((c) => c.key === sortKey)?.label} ({sortDir})
        </p>
      </Panel>
    </div>
  );
}
