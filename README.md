# Bike Fit Finder

Bike Fit Finder is a web application that helps cyclists identify which road bike frame and size best matches their professional bike fit.

Unlike traditional geometry comparison tools, Bike Fit Finder focuses on reproducing a rider's contact points (handlebar and saddle position) rather than relying solely on stack, reach or generic sizing charts.

The long-term goal is to create the most accurate consumer bike fit comparison platform available.

---

# Vision

The application should answer one simple question:

> **Can this bike reproduce my riding position?**

Rather than recommending a bike based on height, Bike Fit Finder evaluates whether a specific frame and size can achieve the rider's professional fit while remaining within sensible stem, spacer and cockpit limits.

---

# Current Status

The project is currently under active development.

Current completed features include:

- Rider Profile
- Dashboard
- Bike Database
- Bike Comparison framework
- Local geometry database
- Search and filtering

Upcoming features include:

- Fit Engine
- Cockpit estimation
- Fit Confidence calculation
- Bike detail pages
- Geometry visualisation
- Marketplace evaluation

---

# Project Documentation

Project documentation is maintained in the repository.

| File | Purpose |
|------|---------|
| `PROJECT_PLAN.md` | Overall vision, architecture and sprint roadmap |
| `PROMPT_HISTORY.md` | History of Lovable prompts |
| `CHANGELOG.md` | Project release history |
| `docs/DATA_MODEL.md` | Database structure |
| `docs/FIT_ENGINE.md` | Fit engine design |
| `docs/ROADMAP.md` | Development roadmap |
| `docs/GEOMETRY_NOTES.md` | Geometry data standards |

---

# Core Principles

The project follows several guiding principles:

- Rider-first architecture
- Contact points over frame geometry
- Transparent recommendations
- Evidence-based Fit Confidence
- Strong TypeScript typing
- Separation of data, business logic and UI
- One bike size per database record

---

# Technology Stack

Current stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lovable
- GitHub

Future additions:

- Supabase
- PostgreSQL
- Marketplace integrations

---

# Repository Structure

```
bike-fit-craft/

├── PROJECT_PLAN.md
├── PROMPT_HISTORY.md
├── CHANGELOG.md
├── README.md

├── docs/
│   ├── DATA_MODEL.md
│   ├── FIT_ENGINE.md
│   ├── ROADMAP.md
│   └── GEOMETRY_NOTES.md

├── data/
├── lib/
├── src/
├── components/
└── public/
```

---

# Development Workflow

GitHub is the source of truth for this project.

Documentation is maintained manually in GitHub.

Application development is performed using Lovable.

Major architectural decisions are documented before implementation.

---

# Running the Project Locally

Clone the repository:

```bash
git clone <repository-url>
cd bike-fit-craft
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Contributing

This is currently a private project.

Development follows the roadmap defined in `PROJECT_PLAN.md`.

New features should:

- satisfy a single sprint objective;
- keep business logic separate from UI components;
- avoid hardcoded geometry;
- remain reusable and strongly typed.

---

# Licence

Private repository.
All rights reserved.
