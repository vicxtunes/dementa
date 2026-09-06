/**
 * Seeds the AITEL Joint Mock 2025 — Chemistry Paper 1 as a real assessment,
 * transcribed from docs/sample-papers/AITEL UCE CHEMISTRY 1 2025.pdf.
 * Idempotent: re-running replaces the paper. Images are read from
 * ./scripts/sample-exam-media/ and uploaded to the assessment-media bucket.
 *
 *   npx tsx scripts/seed-sample-exam.mts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const env = fs.readFileSync(".env.local", "utf8");
const g = (k: string) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const admin = createClient(g("NEXT_PUBLIC_SUPABASE_URL")!, g("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const TITLE = "AITEL Joint Mock 2025 — Chemistry Paper 1";
const MEDIA_DIR = "scripts/sample-exam-media";

type Sub = { label: string; prompt: string; marks: number; model: string };
type Item = {
  scenario: string;
  task_intro?: string;
  image?: string; // filename in MEDIA_DIR
  imageCaption?: string;
  subs: Sub[];
};
type Section = { label: string; instructions: string; pick: number | null; items: Item[] };

const SECTIONS: Section[] = [
  {
    label: "Section A",
    instructions: "Answer all the items in this section.",
    pick: null,
    items: [
      {
        scenario:
          "Shafie runs a restaurant in Manafwa City. Customers have abandoned it because the food tastes poor, has an unpleasant scent, spoils after a short time, and the soup is always watery — unlike the food of rival restaurants. He wants to buy a substance to add to his food and has asked you, as a chemistry student, to advise him on the right product to buy.",
        task_intro: "As a chemistry student, write a piece of advice on:",
        image: "item1.jpeg",
        imageCaption: "Preserved foods and processed food products",
        subs: [
          {
            label: "i",
            prompt: "The categories of the products to be bought.",
            marks: 2,
            model:
              "Food additives: preservatives (e.g. sodium benzoate, sodium chloride), flavourings/flavour enhancers (e.g. monosodium glutamate), and thickeners/stabilisers (e.g. starch, pectin).",
          },
          {
            label: "ii",
            prompt: "The suitability of the different products.",
            marks: 4,
            model:
              "Preservatives kill or inhibit micro-organisms and slow oxidation, so the food keeps longer and does not develop an off scent. Flavour enhancers improve taste. Thickeners absorb water and give the soup body so it is no longer watery.",
          },
          {
            label: "iii",
            prompt: "The side effects of long-term use of the products.",
            marks: 3,
            model:
              "Excess salt raises blood pressure; some preservatives (e.g. nitrites, benzoates) are linked to allergic reactions and, in large amounts, to long-term health risks; MSG can cause headaches in sensitive people; over-reliance lowers the nutritional quality of the diet.",
          },
          {
            label: "iv",
            prompt: "How to choose the best product to use.",
            marks: 3,
            model:
              "Choose additives that are food-grade and approved by the standards body, used within the recommended dose, with a clear expiry date, suited to the specific problem (preservation vs flavour vs texture), and safe for the customers (low sodium, no banned substances).",
          },
        ],
      },
      {
        scenario:
          "A group of students on a project-based-learning task bought a package of material labelled X1327 to make saucepans, aiming to solve the problem of poor-quality saucepans in their community. They must present information about their choice.",
        task_intro: "As a chemistry student, help them to explain:",
        image: "item2.jpeg",
        imageCaption: "Casting a saucepan from molten metal; cooking on a charcoal stove",
        subs: [
          {
            label: "i",
            prompt: "The category of element they chose.",
            marks: 2,
            model:
              "A metal — specifically aluminium, a reactive metal in Group III (or, more generally, a light structural metal). It is not a transition metal but shares the useful metallic properties.",
          },
          {
            label: "ii",
            prompt: "What makes you believe this element will make a good saucepan.",
            marks: 4,
            model:
              "It is a good conductor of heat so food cooks evenly; it has a fairly high melting point so it does not melt in use; it is light, malleable and can be cast or beaten into shape; it forms a thin protective oxide layer that resists corrosion; it is cheap and available from scrap.",
          },
          {
            label: "iii",
            prompt: "The possible dangers of long-term use of saucepans made of element X.",
            marks: 3,
            model:
              "Acidic foods dissolve small amounts of aluminium into the food; high aluminium intake over many years has been associated with health concerns (e.g. effects on the nervous system). Poorly made pans from mixed scrap may also release other toxic metals such as lead.",
          },
          {
            label: "iv",
            prompt: "Any other use of element X apart from making saucepans.",
            marks: 3,
            model:
              "Overhead power transmission cables, aircraft and vehicle body parts, window and door frames, cooking foil and drink cans, and the thermite reaction for welding rails.",
          },
        ],
      },
    ],
  },
  {
    label: "Section B — Part I",
    instructions: "Answer only one item from this part.",
    pick: 1,
    items: [
      {
        scenario:
          "In Namisidwa and Bubutu, farmers of onions and tomatoes have registered low yields. The district agricultural officer tested the soil, found it very low in nitrogen, and advised a high-nitrogen fertilizer. An investor has been cleared to set up a fertilizer production plant in the district. Residents are worried about how the process works and its impact on their wellbeing, and fear losing their land. You have been invited to a radio talk show to address their concerns.",
        task_intro: "As a learner of chemistry, make a write-up you will use to sensitise the citizens of the region.",
        image: "item3.jpeg",
        imageCaption: "A nitrogen fertilizer / chemical production plant",
        subs: [
          {
            label: "i",
            prompt:
              "Write the sensitisation talk. Explain why a nitrogen fertilizer is needed, how it is produced, the benefits to the community, and the likely social and environmental effects with how they can be managed.",
            marks: 12,
            model:
              "Nitrogen is essential for leaf growth; low soil nitrogen limits onion and tomato yields, so a nitrogen fertilizer restores it. Ammonia is made by the Haber process: N2 from fractional distillation of liquid air, H2 from methane + steam; the gases react at about 450 °C and 200 atm over an iron catalyst in a reversible reaction; unreacted gases are recycled. Ammonia is then oxidised to nitric acid and neutralised to give ammonium nitrate, or reacted with CO2 to give urea. Benefits: higher yields, more income, local jobs, reduced need to import fertilizer. Concerns and controls: over-use causes nitrate run-off and eutrophication (advise correct dosing and buffer strips); ammonium fertilizers acidify soil (advise liming); the plant emits some NOx and ammonia (scrubbers and monitoring). Land is bought fairly by agreement, not seized; the plant occupies a small fixed area.",
          },
        ],
      },
      {
        scenario:
          "Nitrogen is used in the food and beverage industry to create an inert atmosphere and extend the shelf life of meat, dairy and fruit. As supermarkets and malls grow with the population, demand for nitrogen has risen. An investor plans to open a nitrogen production plant serving Bwatabala and Mbale City. Residents need to be sensitised about how nitrogen is produced. Your school has been invited to a community meeting.",
        task_intro: "As a learner of chemistry, prepare a write-up to sensitise the residents.",
        image: "item4.jpeg",
        imageCaption: "Industrial gas / air-separation plant",
        subs: [
          {
            label: "i",
            prompt:
              "Write the sensitisation talk. Explain the uses of nitrogen behind the demand, how nitrogen is obtained industrially, the properties that make it suitable, and the relevant safety and environmental points.",
            marks: 12,
            model:
              "Nitrogen keeps packaged food fresh by displacing oxygen, is used to freeze and transport food, to fill tyres and to make ammonia and fertilizers. It is obtained from air: air is filtered, CO2 and water are removed, it is compressed and cooled until it liquefies, then fractionally distilled — nitrogen boils off first at about −196 °C, leaving oxygen and argon. Nitrogen is chosen because it is inert, non-toxic and makes up 78 % of air, so it is cheap and plentiful. Safety: an escape of nitrogen in a closed room lowers the oxygen level and can cause suffocation, so ventilation and alarms are needed; cylinders are stored cool and secured. The process only takes in ordinary air and releases oxygen-rich air, so it has little environmental impact.",
          },
        ],
      },
    ],
  },
  {
    label: "Section B — Part II",
    instructions: "Answer only one item from this part.",
    pick: 1,
    items: [
      {
        scenario:
          "In the hilly area of Bukusu, youth earn a living by brick-laying and by cutting down trees to burn the bricks and to sell as firewood. They also fish with small nets and, at times, with poison. These activities have led to shortages of fresh water, lower crop yields and the death of livestock and people. Community leaders have organised a meeting and invited your school.",
        task_intro: "As a chemistry student, make a write-up you will present.",
        image: "item5.jpeg",
        imageCaption: "Youth making and stacking clay bricks",
        subs: [
          {
            label: "i",
            prompt:
              "Write the write-up. Explain, using chemistry, how these activities are causing the water shortage, poor yields and deaths, and give practical safer alternatives the community could adopt.",
            marks: 12,
            model:
              "Burning wood to fire bricks and selling firewood releases carbon dioxide, carbon monoxide and smoke particles: this pollutes the air, causes respiratory illness and adds to global warming. Cutting trees exposes the hillside soil, so rain washes it away (erosion), springs and streams dry up, and less rain is recycled — hence the water shortage and poor harvests. Using poison to fish puts toxic substances into the water; these kill the fish, then poison livestock and people who drink or use the water, and the poison stays in the water for a long time. Better options: use fuel-efficient or LPG-fired kilns and stabilised (cement) blocks to cut wood use; replant trees and practise agroforestry to hold the soil and protect the springs; set up fish ponds and use only legal nets; treat drinking water by boiling, filtering or chlorination and protect the water source.",
          },
        ],
      },
      {
        scenario:
          "The people of the rocky hills of Bulambuli in north-eastern Uganda depend mainly on stone quarrying for income. Extensive quarrying has caused seasonal changes, water shortage, reduced air quality and water contamination, raising concern with the leaders and NEMA. A sensitisation workshop has been organised and you have been selected to educate the community.",
        task_intro: "As a learner of chemistry, prepare a write-up to sensitise the residents.",
        image: "item6.jpeg",
        imageCaption: "Manual stone quarrying and crushing",
        subs: [
          {
            label: "i",
            prompt:
              "Write the write-up. Explain how the quarrying is causing the seasonal changes, water shortage, poor air quality and water contamination, and describe how each harm can be reduced.",
            marks: 12,
            model:
              "Quarrying breaks rock into fine dust containing silica; breathing it over time causes silicosis and other lung disease, and the dust settles on crops and water. Stripping the rock and plants changes how rain soaks in and runs off, so the water table falls and streams flow only in the wet season. Crushed-rock fines, spilt diesel and engine oil, and any blasting chemicals wash into rivers and seep to groundwater, making the water unsafe. To reduce the harm: spray water to keep dust down and give workers masks; blast in a controlled way at set times; direct run-off through settling ponds and oil traps before it reaches streams; back-fill and replant worked-out sections; and support other income sources such as brick-making, farming or trained construction work so people depend less on the quarry.",
          },
        ],
      },
    ],
  },
];

async function upload(file: string): Promise<string> {
  const buf = fs.readFileSync(path.join(MEDIA_DIR, file));
  const key = `aitel-2025/${file}`;
  const { error } = await admin.storage
    .from("assessment-media")
    .upload(key, buf, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return key;
}

async function main() {
  // wipe any previous copy
  const { data: existing } = await admin.from("assessments").select("id").eq("title", TITLE);
  for (const row of existing ?? []) await admin.from("assessments").delete().eq("id", row.id);

  const { data: paper, error: pErr } = await admin
    .from("assessments")
    .insert({
      subject_id: "chemistry",
      title: TITLE,
      source: "AITEL Joint Mock Assessments 2025 · 545/1",
      format: "structured",
      kind: "exam",
      duration_minutes: 120,
      published: true,
      instructions:
        "The paper has two sections, A and B, with six examination items in all.\n" +
        "Section A has two compulsory items — answer both.\n" +
        "Section B has two parts, I and II — answer one item from each part.\n" +
        "Answer four items in all. Any additional item answered will not be scored.",
      token_cost_to_attempt: 10,
      token_reward_on_completion: 40,
      pass_pct: 0.8,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;

  let sPos = 0;
  for (const sec of SECTIONS) {
    const { data: section } = await admin
      .from("assessment_sections")
      .insert({
        assessment_id: paper.id,
        position: sPos++,
        label: sec.label,
        instructions: sec.instructions,
        pick_count: sec.pick,
      })
      .select("id")
      .single();

    let n = 0;
    for (const it of sec.items) {
      n++;
      const images = it.image ? [{ path: await upload(it.image), caption: it.imageCaption }] : [];
      const { data: item } = await admin
        .from("assessment_items")
        .insert({
          assessment_id: paper.id,
          section_id: section!.id,
          item_number: sPos * 100 + n, // unique, ordered
          position: sPos * 100 + n,
          question_type: "structured",
          scenario: it.scenario,
          task_intro: it.task_intro ?? null,
          images,
          sub_questions: it.subs.map((s) => ({ label: s.label, prompt: s.prompt, marks: s.marks })),
          max_marks: it.subs.reduce((t, s) => t + s.marks, 0),
        })
        .select("id")
        .single();

      await admin.from("assessment_item_keys").insert({
        item_id: item!.id,
        model_answers: Object.fromEntries(it.subs.map((s) => [s.label, s.model])),
      });
    }
  }

  console.log(`Seeded "${TITLE}" (${paper.id}) — 3 sections, 6 items, images uploaded.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
