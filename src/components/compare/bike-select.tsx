import type { Bike } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bikeLabel } from "@/lib/fit-engine";

export function BikeSelect({
  label,
  value,
  onChange,
  bikes,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bikes: Bike[];
}) {
  const empty = bikes.length === 0;
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="label-caps">{label}</p>
      <Select value={value} onValueChange={onChange} disabled={empty}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={empty ? "No bikes available" : "Select a bike"} />
        </SelectTrigger>
        <SelectContent>
          {bikes.map((bike) => (
            <SelectItem key={bike.id} value={bike.id}>
              {bikeLabel(bike)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
