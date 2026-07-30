# Bike Fit Finder

## Vision

Build the world's best consumer bike fit comparison platform.

The application should recommend the optimal bike and size for a rider based on their professional bike fit, not generic sizing charts.

The primary output is not a geometry comparison.

The primary output is:

> Can this bike reproduce my riding position?

---

# Guiding Principles

1. Rider-first architecture
2. Contact points over frame geometry
3. Transparent recommendations
4. Evidence-based fit confidence
5. Modular and maintainable code
6. Mobile-friendly design
7. Premium user experience

---

# Rider Profile

Current Rider

Current Bike

- Giant Defy Advanced 1 (2014)
- Size: M/L

Fit Coordinates

- Handlebar X: 470 mm
- Handlebar Y: 631 mm

Current Geometry

- Frame Stack: 586 mm
- Frame Reach: 381 mm

Cockpit

- Stem: 100 mm
- Spacers: 0 mm

Position

- Saddle Height: 916 mm
- Saddle Setback: 62 mm

Preferences

- Bike type: Race
- Priority: Excellent fit over absolute aerodynamics
- Location: Sydney
- Riding:
    - Road racing
    - Long rides
    - Half Ironman
    - Climbing

---

# Application Architecture

Rider Profile

↓

Bike Database

↓

Fit Engine

↓

Fit Result

↓

Comparison

↓

Recommendation

---

# Data Model

## Rider

Stores:

- Fit coordinates
- Preferences
- Budget
- Riding priorities

---

## Bike

One record per bike size.

Example

Specialized Tarmac SL8

52

54

56

58

Each size is independent.

---

## Fit Result

Generated.

Never permanently stored.

Contains

- Bike
- Size
- Predicted Handlebar X
- Predicted Handlebar Y
- Stem Recommendation
- Spacer Recommendation
- Fit Confidence
- Recommendation

---

# Development Roadmap

## Sprint 1 ✅

Project setup

Navigation

Dashboard

Bike Database

Rider Profile

---

## Sprint 2 ✅

Local bike database

Search

Filters

Comparison page

---

## Sprint 3

Build fitEngine.ts

Create reusable calculations

No scoring.

No UI changes.

---

## Sprint 4

Cockpit estimation

Estimate

- Handlebar X
- Handlebar Y

for every frame.

---

## Sprint 5

Fit Confidence

Calculate

- X error
- Y error
- Stem suitability
- Spacer suitability
- Manufacturer limits

Output

Fit Confidence

---

## Sprint 6

Bike Detail pages

Geometry

Fit

Ride characteristics

Pros

Cons

---

## Sprint 7

Comparison

Current bike

↓

Candidate bike

↓

Geometry

↓

Cockpit

↓

Recommendation

---

## Sprint 8

Advanced search

Filter by

- Stack
- Reach
- Tyre clearance
- Budget
- Weight
- Bike type

---

## Sprint 9

Marketplace analyser

Paste a listing URL

↓

Recommendation

---

## Sprint 10

Marketplace monitoring

Future feature

---

# Fit Engine

The Fit Engine is the core intellectual property.

Eventually

Bike

↓

Frame Geometry

↓

Cockpit Geometry

↓

Predicted Handlebar Position

↓

Compare to Rider

↓

Recommend Stem

↓

Recommend Spacers

↓

Fit Confidence

↓

Recommendation

---

# Development Rules

- One feature per sprint.
- No temporary code that will immediately be discarded.
- No calculations inside React components.
- Keep business logic inside reusable modules.
- Keep data separate from presentation.
- Keep interfaces strongly typed.
- Every bike size is its own record.
- Build for long-term maintainability.

---

# Future Ideas

- Australian marketplace integration
- Price history
- Bike valuation
- Saved bikes
- Multiple rider profiles
- Wheel database
- Tyre compatibility
- Bike weight estimator
- AI fit explanations
- Geometry visualisation
- PDF fit reports
