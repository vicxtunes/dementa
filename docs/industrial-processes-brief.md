# Build Brief: "Industrial Processes — 8 Day Sprint" Study App

Give this whole file to Claude Code as the spec. It has everything needed to build, seed, and deploy the app end to end: goals, tech stack, design tokens, database schema, full curriculum content, page-by-page requirements, and acceptance criteria.

## 1. What this app is

A study app for Senior Two (O-Level) Chemistry students revising 11 industrial processes from a teacher's notes, over an 8-day sprint. Students get an 8-day plan, content pages with flashcards, and auto-graded quizzes. A teacher account can see the whole class's progress. This is for a real class — it needs accounts and persistence, not a local-only demo.

## 2. Tech stack

- **Next.js 14 (App Router, TypeScript)**
- **Supabase**: Postgres (data), Auth (email/password), Row Level Security (access control)
- **Tailwind CSS** for styling
- **@supabase/ssr** for auth session handling across Server/Client Components and middleware
- No separate backend server — Supabase is the entire backend.
- Deploy target: Vercel (free tier) + Supabase (free tier).

## 3. Design direction

Ground the UI in the subject matter: this is exam revision for teenagers, not a generic SaaS dashboard. Avoid the common AI-generated defaults (cream background + terracotta accent, rounded-card kit with soft shadows everywhere, ALL-CAPS eyebrow labels, arrow-suffixed buttons).

**Tokens to use:**
- Colors: `ink` #16241F (near-black bottle-green, primary text), `paper` #E9EDEA (pale sage-grey background, not cream), `flame` #1F7A6C (teal accent — primary interactive color, used for links/progress/correct answers), `amber` #F2A93B (secondary accent — used sparingly, e.g. hazard/side-effect markers), `rust` #B23A2E (used only for incorrect/error states, never decorative)
- Type: **Source Serif 4** for headings and process titles (textbook feel), **IBM Plex Sans** for UI and body text
- Layout: the 8-day plan is a genuine sequence, so it's fine to number it (a vertical rail/stepper on the dashboard). Everything else uses hairline borders (`border-ink/15`) instead of card shadows — no `rounded-2xl` + `shadow-md` SaaS-card look.
- Motion: keep it minimal — hover/focus state changes only, respect `prefers-reduced-motion`.
- Accessibility: visible keyboard focus rings, responsive down to mobile, sufficient contrast.

## 4. Data model & Row Level Security

Run this in the Supabase SQL editor to create the schema (also save it as `supabase/schema.sql` in the repo):

```sql
-- ============================================================
-- JOSELO Chemistry Revision App — Supabase schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  class_code text not null default 'S2-CHEM',
  streak_days int not null default 0,
  last_active date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view profiles in their class"
on profiles for select
using (
  class_code = (select class_code from profiles where id = auth.uid())
);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

create policy "Users can insert their own profile"
on profiles for insert
with check (auth.uid() = id);

-- 2. Processes (the 11 industrial processes, mapped to an 8-day plan)
create table processes (
  id text primary key,            -- slug, e.g. 'oxygen'
  day int not null,               -- which of the 8 days this belongs to
  title text not null,
  raw_materials text[] not null default '{}',
  steps text[] not null default '{}',
  equations text[] default '{}',
  side_effects jsonb not null default '[]',  -- [{issue, effect, mitigation}]
  social_benefits text[] not null default '{}',
  flashcards jsonb not null default '[]'      -- [{front, back}]
);

alter table processes enable row level security;
create policy "Everyone can read processes"
on processes for select
using (true);

-- 3. Quiz questions per process
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  process_id text references processes(id) on delete cascade,
  question text not null,
  options text[] not null,
  correct_index int not null,
  explanation text
);

alter table quiz_questions enable row level security;
create policy "Everyone can read quiz questions"
on quiz_questions for select
using (true);

-- 4. Quiz attempts (per student, per process)
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  process_id text references processes(id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz default now()
);

alter table quiz_attempts enable row level security;

create policy "Users can read their own attempts"
on quiz_attempts for select
using (auth.uid() = user_id);

create policy "Teachers can read attempts in their class"
on quiz_attempts for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = quiz_attempts.user_id)
  )
);

create policy "Users can insert their own attempts"
on quiz_attempts for insert
with check (auth.uid() = user_id);

-- 5. Progress (has a student opened/completed a day's content?)
create table progress (
  user_id uuid references profiles(id) on delete cascade,
  process_id text references processes(id) on delete cascade,
  content_viewed boolean not null default false,
  quiz_passed boolean not null default false,
  updated_at timestamptz default now(),
  primary key (user_id, process_id)
);

alter table progress enable row level security;

create policy "Users can manage their own progress"
on progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Teachers can read class progress"
on progress for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role = 'teacher'
    and p.class_code = (select class_code from profiles where id = progress.user_id)
  )
);

-- ============================================================
-- Helpful view for the teacher dashboard: one row per student
-- ============================================================
create or replace view class_overview as
select
  p.id as user_id,
  p.full_name,
  p.class_code,
  p.streak_days,
  count(distinct case when pr.quiz_passed then pr.process_id end) as processes_mastered,
  (select count(*) from processes) as total_processes,
  coalesce(avg(qa.score::float / nullif(qa.total, 0)), 0) as avg_score
from profiles p
left join progress pr on pr.user_id = p.id
left join quiz_attempts qa on qa.user_id = p.id
where p.role = 'student'
group by p.id, p.full_name, p.class_code, p.streak_days;
```

## 5. Roles & auth flow

- Sign-up form collects: full name, email, password, **class code** (free text, default `S2-CHEM`), and a role radio (**student** / **teacher**).
- On sign-up, after `supabase.auth.signUp`, insert a row into `profiles` with that data (id = the new auth user's id).
- Login form is just email + password.
- Use `@supabase/ssr`'s `createBrowserClient` in Client Components and `createServerClient` in Server Components/Route Handlers, with a `middleware.ts` that refreshes the session on every request and redirects unauthenticated users away from `/dashboard`, `/day/*`, `/quiz/*`, and `/teacher` to `/login`.
- `/teacher` additionally checks `profile.role === 'teacher'` server-side and redirects students to `/dashboard`.

## 6. Pages / routes

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` if logged in, else `/login` |
| `/login` | Combined login/sign-up form (client component) |
| `/dashboard` | The 8-day rail: each day shows its process(es), a completion state (not started / in progress / mastered), and an overall progress bar (X of 11 processes mastered). Teachers see a link to `/teacher`. |
| `/day/[day]` | For days 1–7: full content for that day's process(es) — raw materials, numbered steps, equations, side effects & mitigations, social benefits, and a flashcard deck (flip-card UI, prev/next). A "Mark notes as read" button upserts `progress.content_viewed = true`. A "Take the quiz" link goes to `/quiz/[processId]`. For day 8: a review hub linking to every process's quiz for a full mock run. |
| `/quiz/[processId]` | One question at a time, four options, locks after first pick, shows correct answer + explanation before advancing. At the end: score, pass/fail against an 80% threshold, per-question review with explanations, "Retake quiz" and "Back to dashboard" buttons. On completion, insert a row into `quiz_attempts` and upsert `progress` (`quiz_passed = score/total >= 0.8`, `content_viewed = true`). |
| `/teacher` | Table of every student in the teacher's class code: name, processes mastered / total, average quiz score, streak days. Powered by a `class_overview` SQL view (see schema) filtered by `class_code`. |

## 7. The 8-day plan

| Day | Focus |
|---|---|
| 1 | Oxygen |
| 2 | Sulphuric Acid & Ethanol |
| 3 | Detergents & Iron |
| 4 | Copper & Aluminium |
| 5 | Cement |
| 6 | Ammonium Nitrate Fertilizer |
| 7 | Biogas & Sodium Hydroxide/Chlorine |
| 8 | Full Mock Exam & Review |

## 8. Curriculum content (seed data)

This is the full content for all 11 processes — steps, equations, side effects, social benefits, flashcards, and quiz questions with answers. Model this as a single TypeScript module, e.g. `lib/data/curriculum.ts`, exporting a `processes` array typed roughly as:

```ts
type SideEffect = { issue: string; effect: string; mitigation: string };
type Flashcard = { front: string; back: string };
type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };
type ProcessEntry = {
  id: string; day: number; title: string;
  rawMaterials: string[]; steps: string[]; equations: string[];
  sideEffects: SideEffect[]; socialBenefits: string[];
  flashcards: Flashcard[]; quiz: QuizQuestion[];
};
```

Then write a small script (`scripts/generate-seed.mjs`) that transpiles this file and emits `supabase/seed.sql` (INSERT statements into `processes` and `quiz_questions`), so editing the TS file is the single source of truth and the SQL is regenerated, never hand-edited.

Here is the full content, process by process:

### 1. Manufacture of Oxygen  `(id: "oxygen", day: 1)`

**Raw materials:** Air, Concentrated sodium hydroxide, Silica

**Steps:**

1. Air is passed through an air filter to remove dust and smoke particles.
2. Air is passed through concentrated sodium hydroxide solution to remove carbon dioxide.
3. Air is passed through silica to absorb water vapour.
4. CO2 and water vapour are removed before liquefaction because they would solidify and block the apparatus.
5. The remaining air is compressed at 200 atmospheres and cooled to about -200°C to form liquid air.
6. Liquid air is fractionally distilled in a fractionating column.
7. Nitrogen boils off first (b.p. -196°C), leaving oxygen (b.p. -183°C) behind.
8. Pure oxygen is stored under pressure in steel cylinders.

**Equations:**

- `2NaOH(aq) + CO2(g) → Na2CO3(aq) + H2O(l)`

**Side effects & mitigation:**

- Issue: Explosion of oxygen cylinders due to high pressure. Effect: Can ignite nearby materials, causing injury and fire outbreaks. Mitigation: Regular maintenance and monitoring of cylinders; store in cool areas.
- Issue: Exposure to liquid oxygen. Effect: Severe skin/eye irritation, burns, loss of vision, cancer. Mitigation: Post hazard warnings; communicate safety info to workers; submerge affected skin in warm water.

**Social benefits:**

- Employment opportunities → improved income → better standards of living
- Increased government revenue from taxes → improved infrastructure (roads, schools, hospitals)
- Development of small-scale businesses around the plant
- Availability of oxygen for patients → saves lives

**Flashcards:**

1. Front: "Why are CO2 and water vapour removed before air is liquefied?" → Back: "Because they would solidify and block the apparatus."
2. Front: "Which gas boils off first during fractional distillation of liquid air, and why?" → Back: "Nitrogen, because it has a lower boiling point (-196°C) than oxygen (-183°C)."
3. Front: "What removes CO2 from air in this process?" → Back: "Concentrated sodium hydroxide solution."
4. Front: "What absorbs water vapour from the air?" → Back: "Silica."
5. Front: "At what pressure and temperature is air liquefied?" → Back: "200 atmospheres, cooled to about -200°C."

**Quiz questions:**

1. Why must carbon dioxide be removed from air before liquefaction?
   - A. It reacts with nitrogen
   - B. It would solidify and block the apparatus  ← correct
   - C. It lowers the boiling point of oxygen
   - D. It is flammable
   - Explanation: CO2 (and water vapour) solidify at the very low temperatures used and would block the plant.

2. What is the correct order in which nitrogen and oxygen separate during fractional distillation of liquid air?
   - A. Oxygen boils off first, then nitrogen
   - B. Nitrogen boils off first, then oxygen  ← correct
   - C. Both boil off at the same time
   - D. Neither boils; they are filtered
   - Explanation: Nitrogen has a lower boiling point (-196°C) than oxygen (-183°C), so it boils off first.

3. Which substance is used to remove carbon dioxide from air in this process?
   - A. Silica
   - B. Concentrated sodium hydroxide  ← correct
   - C. Calcium oxide
   - D. Sodium chloride
   - Explanation: 2NaOH(aq) + CO2(g) → Na2CO3(aq) + H2O(l).

4. A major danger during storage of manufactured oxygen is:
   - A. Explosion of cylinders due to high pressure  ← correct
   - B. Oxygen turning into ozone spontaneously
   - C. Oxygen reacting with the steel cylinder
   - D. Oxygen leaking as a liquid at room temperature
   - Explanation: High-pressure storage risks explosion; mitigated by regular maintenance and monitoring.


---

### 2. Manufacture of Sulphuric Acid (Contact Process)  `(id: "sulphuric-acid", day: 2)`

**Raw materials:** Dry sulphur dioxide, Dry oxygen, Vanadium(V) oxide catalyst, Water

**Steps:**

1. Dry SO2 and dry O2, free from impurities, are heated to about 450°C at low pressure (~1 atmosphere) in a combustion cylinder with a V2O5 catalyst, forming sulphur trioxide.
2. Sulphur trioxide is dissolved in concentrated sulphuric acid to form a fuming liquid called oleum.
3. Oleum is added to a regulated volume of distilled water to form 98% concentrated sulphuric acid.

**Equations:**

- `2SO2(g) + O2(g) ⇌ 2SO3(g)  [V2O5 catalyst, ~450°C]`

**Side effects & mitigation:**

- Issue: Hot surface burns from combustion cylinders. Effect: Wounds and pain to workers. Mitigation: Proper use of personal protective equipment (PPE).
- Issue: Poisonous waste gas fumes. Effect: Respiratory complications when inhaled. Mitigation: Fit catalytic converters in exhaust pipes.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2 in the air, contributing to global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment opportunities → increased income → improved standards of living
- Government revenue → roads → facilitates trade
- Government revenue → schools → better, cheaper education

**Flashcards:**

1. Front: "What catalyst is used in the Contact Process?" → Back: "Vanadium(V) oxide, V2O5."
2. Front: "What is oleum?" → Back: "A fuming liquid formed when SO3 is dissolved in concentrated sulphuric acid."
3. Front: "At roughly what temperature is SO2 oxidised to SO3?" → Back: "About 450°C."
4. Front: "How is 98% concentrated sulphuric acid finally obtained?" → Back: "By adding oleum to a regulated volume of distilled water."

**Quiz questions:**

1. Which catalyst is used to convert sulphur dioxide to sulphur trioxide?
   - A. Iron
   - B. Vanadium(V) oxide  ← correct
   - C. Platinum
   - D. Manganese(IV) oxide
   - Explanation: V2O5 is the catalyst used in the Contact Process at around 450°C.

2. Why is SO3 dissolved in concentrated sulphuric acid rather than water directly?
   - A. Dissolving SO3 directly in water causes a violent, uncontrollable reaction  ← correct
   - B. Water does not dissolve SO3 at all
   - C. It produces a coloured product
   - D. It is cheaper
   - Explanation: SO3 is instead absorbed to form oleum, which is then carefully diluted with water.

3. How is poisonous waste gas from this process typically mitigated?
   - A. Releasing it at night
   - B. Fitting catalytic converters in exhaust pipes  ← correct
   - C. Diluting it with fresh air only
   - D. Storing it underground
   - Explanation: Catalytic converters reduce harmful gases before they reach the atmosphere.


---

### 2. Manufacture of Ethanol  `(id: "ethanol", day: 2)`

**Raw materials:** Starch-containing substance, Malt (diastase enzyme), Yeast (maltase, zymase enzymes)

**Steps:**

1. The starch-containing substance is crushed to extract starch.
2. Malt is added to the starch; diastase in malt catalyses hydrolysis of starch to maltose.
3. Yeast is added to the maltose after about 5 days at room temperature.
4. Maltase in yeast catalyses hydrolysis of maltose to glucose.
5. Zymase in yeast catalyses breakdown of glucose to crude ethanol and carbon dioxide.
6. Crude ethanol is converted to pure ethanol by fractional distillation.

**Equations:**

- `(C6H10O5)n + nH2O → nC12H22O11 (starch → maltose, diastase)`
- `C12H22O11 + H2O → 2C6H12O6 (maltose → glucose, maltase)`
- `C6H12O6 → 2C2H5OH + 2CO2 (glucose → ethanol, zymase)`

**Side effects & mitigation:**

- Issue: Hot surface burns from the distillation tank. Effect: Wounds and pain to workers. Mitigation: Proper use of PPE.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, contributing to global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment opportunities → increased income → improved standards of living
- Government revenue → roads, schools, hospitals

**Flashcards:**

1. Front: "What enzyme in malt converts starch to maltose?" → Back: "Diastase."
2. Front: "What enzyme in yeast converts maltose to glucose?" → Back: "Maltase."
3. Front: "What enzyme in yeast breaks down glucose to ethanol?" → Back: "Zymase."
4. Front: "How is crude ethanol purified?" → Back: "By fractional distillation."

**Quiz questions:**

1. Which enzyme catalyses the hydrolysis of starch to maltose?
   - A. Zymase
   - B. Diastase  ← correct
   - C. Maltase
   - D. Amylase-2
   - Explanation: Diastase, present in malt, hydrolyses starch to maltose.

2. Zymase catalyses the conversion of:
   - A. Starch to maltose
   - B. Maltose to glucose
   - C. Glucose to ethanol and carbon dioxide  ← correct
   - D. Ethanol to acetic acid
   - Explanation: Zymase in yeast breaks glucose down into ethanol and CO2 (fermentation).

3. How is pure ethanol obtained from the fermentation mixture?
   - A. Filtration
   - B. Fractional distillation  ← correct
   - C. Precipitation
   - D. Electrolysis
   - Explanation: Fractional distillation separates ethanol from water and other impurities by boiling point.


---

### 3. Manufacture of Detergent (Soap)  `(id: "detergents", day: 3)`

**Raw materials:** Vegetable oil, Concentrated sodium hydroxide, Sodium chloride (brine)

**Steps:**

1. Vegetable oil and concentrated sodium hydroxide are boiled together, with stirring, until no more reaction occurs, in a stainless-steel boiler.
2. The soap solution is cooled; concentrated sodium chloride solution is added to precipitate the soap (salting out).
3. Soap floats and is skimmed off; perfumes and dyes may be added.
4. It is purified by re-boiling in water and re-precipitating with brine.
5. Soap is baked into desired bars and stored.

**Equations:**

- `Fat/Oil + 3NaOH → Glycerol + 3 Soap (saponification)`

**Side effects & mitigation:**

- Issue: Hot surface burns during heating. Effect: Wounds and pain to workers. Mitigation: Proper use of PPE.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads, schools, hospitals

**Flashcards:**

1. Front: "What process converts oil + NaOH into soap?" → Back: "Saponification."
2. Front: "What is added to soap solution to precipitate the soap?" → Back: "Concentrated sodium chloride solution (brine) — 'salting out'."
3. Front: "What is the by-product of saponification, alongside soap?" → Back: "Glycerol."

**Quiz questions:**

1. The reaction between vegetable oil and concentrated sodium hydroxide to form soap is called:
   - A. Esterification
   - B. Saponification  ← correct
   - C. Neutralisation
   - D. Fermentation
   - Explanation: Saponification produces soap and glycerol.

2. What is added to the cooled soap solution to precipitate the soap out?
   - A. Distilled water
   - B. Concentrated sodium chloride solution  ← correct
   - C. Dilute sulphuric acid
   - D. Silica
   - Explanation: Brine (concentrated NaCl solution) 'salts out' the soap so it floats and can be skimmed off.

3. What is the by-product of soap manufacture, besides soap itself?
   - A. Glycerol  ← correct
   - B. Ammonia
   - C. Oleum
   - D. Cryolite
   - Explanation: Saponification of fats/oils with NaOH produces soap and glycerol.


---

### 3. Extraction of Iron (Blast Furnace)  `(id: "iron", day: 3)`

**Raw materials:** Coke, Haematite (iron ore), Limestone, Hot air

**Steps:**

1. Coke, haematite and limestone are fed into a blast furnace from the top; hot air enters from the bottom.
2. Coke is oxidised by hot air to carbon dioxide.
3. Carbon dioxide is reduced by unreacted coke to carbon monoxide.
4. Carbon monoxide reduces haematite to molten iron, releasing carbon dioxide.
5. Limestone decomposes to calcium oxide and carbon dioxide.
6. Calcium oxide reacts with silicon dioxide impurity to form calcium silicate (slag), which is tapped off.

**Equations:**

- `2C(s) + O2(g) → 2CO(g)`
- `Fe2O3(s) + 3CO(g) → 2Fe(l) + 3CO2(g)`
- `CaCO3(s) → CaO(s) + CO2(g)`
- `CaO(s) + SiO2(s) → CaSiO3(l) (slag)`

**Side effects & mitigation:**

- Issue: Hot surface burns during the process. Effect: Wounds and pain to workers. Mitigation: Proper use of PPE.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads, schools, hospitals

**Flashcards:**

1. Front: "What reduces haematite to molten iron in the blast furnace?" → Back: "Carbon monoxide."
2. Front: "What is the role of limestone in iron extraction?" → Back: "It decomposes to CaO, which reacts with silica impurity to form slag (calcium silicate), removing it."
3. Front: "What is the main iron ore mentioned in this process?" → Back: "Haematite."

**Quiz questions:**

1. What reduces iron(III) oxide to molten iron in the blast furnace?
   - A. Coke directly
   - B. Carbon monoxide  ← correct
   - C. Hot air
   - D. Limestone
   - Explanation: Fe2O3(s) + 3CO(g) → 2Fe(l) + 3CO2(g).

2. Why is limestone added to the blast furnace?
   - A. To provide the iron itself
   - B. To react with silica impurity and form slag  ← correct
   - C. To cool the furnace
   - D. To act as the fuel
   - Explanation: CaO from decomposed limestone reacts with SiO2 to form calcium silicate (slag), removing the impurity.

3. What is produced when coke is oxidised by hot air at the bottom of the furnace?
   - A. Carbon monoxide directly
   - B. Carbon dioxide  ← correct
   - C. Calcium oxide
   - D. Silicon dioxide
   - Explanation: Coke is first oxidised to CO2, which is then reduced by more coke to CO.


---

### 4. Extraction of Copper  `(id: "copper", day: 4)`

**Raw materials:** Copper pyrites, Silicon dioxide, Air

**Steps:**

1. Copper pyrites are crushed and concentrated by froth flotation.
2. The concentrated ore is dried and roasted in air to form copper(I) sulphide, iron(II) oxide, and sulphur dioxide gas.
3. Silicon dioxide is added; it reacts with iron(II) oxide to form iron(II) silicate, removing the iron oxide as slag.
4. The remaining copper(I) sulphide is heated in a controlled air supply to form impure copper.
5. Impure copper is purified by electrolysis in an electrolytic cell to form pure copper.

**Equations:**

- `FeO + SiO2 → FeSiO3 (slag)`

**Side effects & mitigation:**

- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.
- Issue: Toxic sulphur dioxide released to the atmosphere. Effect: Respiratory complications. Mitigation: Fit scrubbers in exhaust pipes to neutralise acidic gases.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads, schools, hospitals

**Flashcards:**

1. Front: "How is copper pyrites first concentrated?" → Back: "By froth flotation."
2. Front: "What removes iron(II) oxide during copper extraction?" → Back: "Silicon dioxide, forming iron(II) silicate slag."
3. Front: "How is impure copper finally purified?" → Back: "By electrolysis in an electrolytic cell."

**Quiz questions:**

1. What method is used to concentrate copper pyrites before roasting?
   - A. Fractional distillation
   - B. Froth flotation  ← correct
   - C. Electrolysis
   - D. Filtration
   - Explanation: Froth flotation separates the valuable ore from waste rock.

2. What is added to remove iron(II) oxide during roasting?
   - A. Limestone
   - B. Silicon dioxide  ← correct
   - C. Sodium hydroxide
   - D. Cryolite
   - Explanation: SiO2 reacts with FeO to form iron(II) silicate slag, which is removed.

3. How is impure copper converted into pure copper?
   - A. Roasting again
   - B. Electrolysis  ← correct
   - C. Froth flotation
   - D. Distillation
   - Explanation: Electrolytic refining deposits pure copper at the cathode.

4. A key toxic gas released during copper extraction, requiring scrubbers, is:
   - A. Carbon monoxide
   - B. Sulphur dioxide  ← correct
   - C. Ammonia
   - D. Chlorine
   - Explanation: SO2 from roasting causes respiratory problems and acid rain if unmitigated.


---

### 4. Extraction of Aluminium  `(id: "aluminium", day: 4)`

**Raw materials:** Bauxite, Sodium hydroxide, Cryolite

**Steps:**

1. Bauxite is roasted in air to drive off water, then crushed into fine powder.
2. It is concentrated with hot sodium hydroxide solution (Bayer's process) to form aluminium hydroxide.
3. Aluminium hydroxide is heated to form pure aluminium oxide (alumina).
4. Aluminium oxide is dissolved in molten cryolite to lower its melting point to about 800°C.
5. The molten mixture is electrolysed between graphite electrodes.
6. At the cathode, aluminium ions are reduced and discharged as molten aluminium metal.
7. At the anode, oxide ions are oxidised and released as oxygen gas.

**Equations:**

- `Al2O3(s) + 2OH-(aq) → 2AlO2-(aq) + H2O(l)`
- `Cathode: Al3+(l) + 3e- → Al(s)`
- `Anode: 2O2-(l) → O2(g) + 4e-`

**Side effects & mitigation:**

- Issue: Hot surface burns during the process. Effect: Wounds and pain to workers. Mitigation: Proper use of PPE.
- Issue: Poisonous waste gas fumes. Effect: Respiratory disorders. Mitigation: Fit catalytic converters in exhaust pipes.

**Social benefits:**

- Employment opportunities → increased income → improved standards of living

**Flashcards:**

1. Front: "What is the principal ore of aluminium?" → Back: "Bauxite."
2. Front: "Why is aluminium oxide dissolved in molten cryolite?" → Back: "To lower its melting point from ~2000°C to about 800°C, saving energy."
3. Front: "What happens at the cathode during aluminium electrolysis?" → Back: "Al3+ ions gain electrons and are deposited as molten aluminium metal."
4. Front: "What happens at the anode during aluminium electrolysis?" → Back: "O2- ions lose electrons and are released as oxygen gas."
5. Front: "What electrodes are used in aluminium electrolysis?" → Back: "Graphite electrodes."

**Quiz questions:**

1. What is the principal ore from which aluminium is extracted?
   - A. Haematite
   - B. Bauxite  ← correct
   - C. Copper pyrites
   - D. Galena
   - Explanation: Bauxite is purified via the Bayer process to obtain pure aluminium oxide.

2. Why is aluminium oxide dissolved in molten cryolite before electrolysis?
   - A. To make it conduct electricity for the first time
   - B. To lower its melting point and save energy  ← correct
   - C. To remove iron impurities
   - D. To increase its density
   - Explanation: Pure Al2O3 melts around 2000°C; dissolving it in cryolite lowers this to about 800°C.

3. During electrolysis of molten aluminium oxide, what happens at the cathode?
   - A. Oxygen gas is released
   - B. Aluminium ions are reduced to aluminium metal  ← correct
   - C. Cryolite is decomposed
   - D. Graphite is deposited
   - Explanation: Al3+(l) + 3e- → Al(s) — reduction occurs at the cathode.

4. What gas is produced at the anode during aluminium extraction?
   - A. Hydrogen
   - B. Chlorine
   - C. Oxygen  ← correct
   - D. Carbon dioxide only
   - Explanation: 2O2-(l) → O2(g) + 4e- at the anode.


---

### 5. Manufacture of Cement  `(id: "cement", day: 5)`

**Raw materials:** Limestone, Clay, Water, Gypsum

**Steps:**

1. Limestone and clay are crushed and milled into fine powder.
2. The powder is mixed with water and fed into a rotating cylinder, heated to about 1500°C.
3. Limestone decomposes to calcium oxide and carbon dioxide.
4. Calcium oxide reacts with aluminium oxide and silicon dioxide in clay to form lumps of calcium aluminate and calcium silicate.
5. The lumps are crushed to form cement as a fine powder.
6. Gypsum is added during grinding to moderate the reaction between cement and water.
7. Cement is packed in bags for use.

**Equations:**

- `CaCO3(s) → CaO(s) + CO2(g)`

**Side effects & mitigation:**

- Issue: Toxic gases and dust released to the atmosphere. Effect: Respiratory complications. Mitigation: Fit scrubbers in exhaust pipes to neutralise toxic gases.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.
- Issue: Hot surface burns from combustion process. Effect: Wounds and pain to workers. Mitigation: Proper use of PPE.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads, schools, hospitals

**Flashcards:**

1. Front: "What is added during grinding to moderate cement's reaction with water?" → Back: "Gypsum."
2. Front: "At roughly what temperature is the limestone/clay mixture heated?" → Back: "About 1500°C."
3. Front: "What does limestone decompose into when heated?" → Back: "Calcium oxide and carbon dioxide."

**Quiz questions:**

1. Why is gypsum added during the grinding of cement clinker?
   - A. To colour the cement
   - B. To moderate the reaction between cement and water  ← correct
   - C. To increase the melting point
   - D. To act as a catalyst
   - Explanation: Gypsum controls the setting time of cement when mixed with water.

2. The main raw materials for cement manufacture are:
   - A. Bauxite and cryolite
   - B. Limestone and clay  ← correct
   - C. Copper pyrites and silica
   - D. Haematite and coke
   - Explanation: Limestone and clay are crushed, milled, and heated together to form cement clinker.


---

### 6. Manufacture of Ammonium Nitrate Fertilizer  `(id: "ammonium-nitrate", day: 6)`

**Raw materials:** Nitrogen (from air), Hydrogen (from natural gas), Iron catalyst, Platinum catalyst, Ammonia

**Steps:**

1. Nitrogen from air and hydrogen from natural gas are compressed and passed over heated iron catalyst to form ammonia.
2. Ammonia is mixed with excess oxygen, purified, and passed over a platinum catalyst at 700°C, oxidising it to nitrogen monoxide and water.
3. The gases are cooled and mixed with more air to form nitrogen dioxide.
4. Nitrogen dioxide is absorbed in hot water with excess oxygen to form nitric acid in the absorption tower.
5. Nitric acid is reacted with concentrated ammonia to form ammonium nitrate.
6. The product is evaporated to dryness to obtain pure ammonium nitrate.

**Equations:**

- `N2(g) + 3H2(g) ⇌ 2NH3(g) [Fe catalyst]`
- `4NH3(g) + 5O2(g) → 4NO(g) + 6H2O(g) [Pt catalyst, 700°C]`
- `NH3 + HNO3 → NH4NO3`

**Side effects & mitigation:**

- Issue: Toxic acidic gases released to the atmosphere. Effect: Acid rain, lowering soil pH and reducing crop yields. Mitigation: Fit catalytic converters to convert nitrogen oxides to nitrogen.
- Issue: Toxic gases released to the atmosphere. Effect: Respiratory complications. Mitigation: Fit scrubbers in exhaust pipes.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads → facilitates trade

**Flashcards:**

1. Front: "What catalyst is used to make ammonia from nitrogen and hydrogen?" → Back: "Heated iron catalyst."
2. Front: "What catalyst oxidises ammonia to nitrogen monoxide?" → Back: "Platinum, at about 700°C."
3. Front: "What acid is formed when nitrogen dioxide is absorbed in hot water and oxygen?" → Back: "Nitric acid."
4. Front: "What is formed when nitric acid reacts with ammonia?" → Back: "Ammonium nitrate."

**Quiz questions:**

1. Which catalyst is used to combine nitrogen and hydrogen into ammonia?
   - A. Platinum
   - B. Vanadium(V) oxide
   - C. Iron  ← correct
   - D. Nickel
   - Explanation: N2 + 3H2 ⇌ 2NH3 over a heated iron catalyst.

2. At which stage is a platinum catalyst used in this process?
   - A. Combining nitrogen and hydrogen
   - B. Oxidising ammonia to nitrogen monoxide  ← correct
   - C. Forming ammonium nitrate
   - D. Evaporating the final product
   - Explanation: 4NH3 + 5O2 → 4NO + 6H2O, over platinum at ~700°C.

3. What is the final product of reacting nitric acid with ammonia?
   - A. Sodium nitrate
   - B. Ammonium nitrate  ← correct
   - C. Ammonium sulphate
   - D. Urea
   - Explanation: NH3 + HNO3 → NH4NO3, evaporated to dryness to obtain the pure fertilizer.


---

### 7. Manufacture of Biogas  `(id: "biogas", day: 7)`

**Raw materials:** Organic waste, Water, Anaerobic bacteria

**Steps:**

1. Organic wastes are put into a tank and mixed with a little water.
2. The tank is covered to prevent aerial oxidation.
3. The tank and contents are kept at room temperature for about 2 weeks.
4. Anaerobic bacteria break down the organic matter to produce biogas.
5. The biogas is compressed and collected in gas cylinders for storage via pipes.

**Side effects & mitigation:**

- Issue: Explosion of biogas cylinders due to high pressure. Effect: Can ignite other materials and cause fire. Mitigation: Keep cylinders in cool areas.
- Issue: Air pollution by waste gases (hydrogen sulphide, ammonia) from leaks. Effect: Stomach and respiratory disorders. Mitigation: Regular maintenance and monitoring of cylinders.
- Issue: Leakage of hydrogen sulphide. Effect: Contributes to acid rain, crumbling buildings. Mitigation: Regular maintenance and monitoring of cylinders.

**Social benefits:**

- Employment → increased income → improved standards of living
- Gas used for lighting and cooking fuel → improved living standards

**Flashcards:**

1. Front: "What breaks down organic matter to produce biogas?" → Back: "Anaerobic bacteria."
2. Front: "Why is the biogas tank covered?" → Back: "To prevent aerial (air) oxidation."
3. Front: "Roughly how long does the biogas tank need to sit at room temperature?" → Back: "About 2 weeks."
4. Front: "Name two toxic gases that can leak from biogas systems." → Back: "Hydrogen sulphide and ammonia."

**Quiz questions:**

1. What organisms break down organic waste to produce biogas?
   - A. Aerobic fungi
   - B. Anaerobic bacteria  ← correct
   - C. Yeast
   - D. Algae
   - Explanation: Anaerobic bacteria decompose organic matter in the absence of air to produce biogas.

2. Why is the biogas digester tank kept covered?
   - A. To keep it warm only
   - B. To prevent aerial oxidation  ← correct
   - C. To speed up combustion
   - D. To let sunlight in
   - Explanation: Covering prevents air from entering, maintaining the anaerobic conditions bacteria need.

3. A toxic gas that can leak from biogas systems and contribute to acid rain is:
   - A. Nitrogen
   - B. Hydrogen sulphide  ← correct
   - C. Argon
   - D. Oxygen
   - Explanation: Hydrogen sulphide leakage can cause acid rain and crumbling of buildings.


---

### 7. Manufacture of Sodium Hydroxide and Chlorine  `(id: "naoh-chlorine", day: 7)`

**Raw materials:** Brine (concentrated sodium chloride solution), Mercury (cathode), Graphite (anode)

**Steps:**

1. Brine is electrolysed in an electrolytic cell with a mercury cathode and graphite anode.
2. Chloride ions move to the anode, are discharged, and lose electrons to form chlorine gas (due to high concentration).
3. Chlorine gas is dried, liquefied, and stored in tightly closed tanks.
4. Sodium and hydrogen ions move to the cathode; sodium ions are discharged, gaining electrons to form sodium metal.
5. Sodium metal dissolves in mercury to form sodium amalgam.
6. Sodium amalgam reacts with water to form sodium hydroxide solution, hydrogen, and mercury (mercury is recycled to the cathode).
7. The sodium hydroxide solution is evaporated to dryness, then cooled to form solid sodium hydroxide.

**Equations:**

- `At anode: 2Cl-(aq) → Cl2(g) + 2e-`
- `At cathode: Na+ + e- → Na (with Hg) → sodium amalgam`
- `2Na(Hg) + 2H2O → 2NaOH(aq) + H2(g) + 2Hg`

**Side effects & mitigation:**

- Issue: Mercury poisoning. Effect: Damage to nervous system, kidneys, liver, immune system; cancer risk. Mitigation: Post hazard warning information in working areas.
- Issue: Toxic acidic gases released to the atmosphere. Effect: Acid rain, lowering soil pH. Mitigation: Fit catalytic converters.
- Issue: Destruction of vegetation for plant construction. Effect: Increased CO2, global warming. Mitigation: Plant fast-growing, fast-maturing trees.

**Social benefits:**

- Employment → increased income → improved standards of living
- Government revenue → roads → facilitates trade

**Flashcards:**

1. Front: "What are the cathode and anode materials in this electrolytic cell?" → Back: "Mercury cathode, graphite anode."
2. Front: "What forms at the anode during brine electrolysis?" → Back: "Chlorine gas."
3. Front: "What does sodium form when it dissolves in mercury?" → Back: "Sodium amalgam."
4. Front: "What does sodium amalgam produce when reacted with water?" → Back: "Sodium hydroxide solution, hydrogen gas, and mercury (recycled)."
5. Front: "What is the major health hazard specific to this process?" → Back: "Mercury poisoning."

**Quiz questions:**

1. In the mercury-cathode cell for brine electrolysis, what forms at the graphite anode?
   - A. Hydrogen gas
   - B. Chlorine gas  ← correct
   - C. Sodium metal
   - D. Oxygen gas
   - Explanation: Chloride ions are discharged at the anode: 2Cl- → Cl2 + 2e-.

2. What does sodium form when it dissolves into the mercury cathode?
   - A. Sodium hydroxide directly
   - B. Sodium amalgam  ← correct
   - C. Sodium chloride
   - D. Sodium oxide
   - Explanation: Sodium metal dissolves in mercury to form sodium amalgam, later reacted with water.

3. The major specific health hazard of this process, requiring hazard warnings, is:
   - A. Sulphur dioxide poisoning
   - B. Mercury poisoning  ← correct
   - C. Radiation exposure
   - D. Carbon monoxide poisoning
   - Explanation: Mercury exposure can damage the nervous system, kidneys, liver, and immune system.

4. What three products form when sodium amalgam reacts with water?
   - A. Sodium hydroxide, hydrogen, and mercury  ← correct
   - B. Sodium chloride, oxygen, and mercury
   - C. Sodium oxide, chlorine, and water
   - D. Sodium carbonate, hydrogen, and graphite
   - Explanation: 2Na(Hg) + 2H2O → 2NaOH(aq) + H2(g) + 2Hg, with mercury recycled to the cathode.


---

## 9. Build & acceptance checklist

Give Claude Code this as the definition of done:

- [ ] `npm run build` completes with no type errors
- [ ] Sign-up creates an auth user AND a matching `profiles` row; role and class code are stored correctly
- [ ] A student cannot see `/teacher`; a teacher can, and only sees students sharing their class code
- [ ] All 8 days render at `/day/1` through `/day/8`; days 1–7 show the correct process(es) per the table above; day 8 links to all 11 quizzes
- [ ] Flashcards flip and cycle through prev/next without page reload
- [ ] Completing a quiz inserts a `quiz_attempts` row and correctly upserts `progress` (mastered only at ≥80%)
- [ ] Dashboard progress bar and per-day status update immediately after a quiz is completed (via `router.refresh()` or equivalent)
- [ ] Teacher table reflects a new student's progress after they complete a quiz
- [ ] RLS policies prevent one student from reading another student's `quiz_attempts` or `progress` rows directly via the Supabase client
- [ ] Responsive on mobile; visible focus states; respects `prefers-reduced-motion`
- [ ] README explains: creating the Supabase project, running `schema.sql` then `seed.sql`, setting env vars, running locally, and deploying to Vercel