// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TargetPosition } from "@/types/optimisation";

/**
 * Rider-input behaviour only.
 *
 * The production optimisation engine is spied on (not reimplemented) so the
 * test can assert which TargetPosition the UI hands it.
 */

const optimiseFleetSpy = vi.fn();

vi.mock("@/lib/optimisation/fleetOptimisationEngine", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/optimisation/fleetOptimisationEngine")
  >("@/lib/optimisation/fleetOptimisationEngine");
  return {
    ...actual,
    optimiseFleet: (input: Parameters<typeof actual.optimiseFleet>[0]) => {
      optimiseFleetSpy(input);
      return actual.optimiseFleet(input);
    },
  };
});

const { FitTargetForm } = await import("@/components/dashboard/fit-target-form");
void FitTargetForm;
const { optimiseFleet } = await import("@/lib/optimisation/fleetOptimisationEngine");
const { buildFleetRecommendations } = await import(
  "@/lib/recommendations/fleetRecommendations"
);
const { bikes } = await import("@/data/bikes");

// The route module renders the dashboard component; import it lazily so the
// mock above is applied first.
const routeModule = await import("@/routes/index");
const Dashboard = routeModule.Route.options.component as () => JSX.Element;

function lastTarget(): TargetPosition {
  const calls = optimiseFleetSpy.mock.calls;
  return calls[calls.length - 1]![0].target;
}

beforeEach(() => optimiseFleetSpy.mockClear());
afterEach(() => cleanup());

describe("Dashboard rider fit input", () => {
  it("initialises with the established 470 / 631 target and runs the production engine", async () => {
    render(<Dashboard />);

    expect(screen.getByLabelText(/handlebar x/i)).toHaveValue?.("470");
    expect((screen.getByLabelText(/handlebar x/i) as HTMLInputElement).value).toBe("470");
    expect((screen.getByLabelText(/handlebar y/i) as HTMLInputElement).value).toBe("631");

    await waitFor(() => expect(optimiseFleetSpy).toHaveBeenCalled());
    expect(lastTarget()).toEqual({ x: 470, y: 631 });
  });

  it("renders exactly the bikes the fleet result returned, in engine order", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(optimiseFleetSpy).toHaveBeenCalled());

    const view = buildFleetRecommendations(
      optimiseFleet({ target: { x: 470, y: 631 } }),
      bikes,
    );
    const first = view.recommendations[0]!;
    await screen.findByText(new RegExp(`1\\. ${first.bike!.brand}`, "i"));
    await screen.findByText(/unable to evaluate/i);
  });

  it("passes edited measurements to the optimisation pipeline", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await waitFor(() => expect(optimiseFleetSpy).toHaveBeenCalled());
    optimiseFleetSpy.mockClear();

    const x = screen.getByLabelText(/handlebar x/i);
    const y = screen.getByLabelText(/handlebar y/i);
    await user.clear(x);
    await user.type(x, "450");
    await user.clear(y);
    await user.type(y, "600");
    await user.click(screen.getByRole("button", { name: /find my bikes/i }));

    await waitFor(() => expect(optimiseFleetSpy).toHaveBeenCalled());
    expect(lastTarget()).toEqual({ x: 450, y: 600 });
  });

  it("rejects invalid input without running the optimisation and clears stale results", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await waitFor(() => expect(optimiseFleetSpy).toHaveBeenCalled());
    optimiseFleetSpy.mockClear();

    const x = screen.getByLabelText(/handlebar x/i);
    await user.clear(x);
    await user.type(x, "abc");
    await user.click(screen.getByRole("button", { name: /find my bikes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent?.(/number/i);
    expect(optimiseFleetSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/unable to evaluate/i)).toBeNull();
  });
});
