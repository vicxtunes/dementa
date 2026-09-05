import type { ProcessEntry } from "@/lib/quick-solution/types";

export const processes: ProcessEntry[] = [
  {
    id: "oxygen",
    day: 1,
    title: "Manufacture of Oxygen",
    rawMaterials: ["Air", "Concentrated sodium hydroxide", "Silica"],
    steps: [
      "Air is passed through an air filter to remove dust and smoke particles.",
      "Air is passed through concentrated sodium hydroxide solution to remove carbon dioxide.",
      "Air is passed through silica to absorb water vapour.",
      "CO2 and water vapour are removed before liquefaction because they would solidify and block the apparatus.",
      "The remaining air is compressed at 200 atmospheres and cooled to about -200°C to form liquid air.",
      "Liquid air is fractionally distilled in a fractionating column.",
      "Nitrogen boils off first (b.p. -196°C), leaving oxygen (b.p. -183°C) behind.",
      "Pure oxygen is stored under pressure in steel cylinders.",
    ],
    equations: ["2NaOH(aq) + CO2(g) → Na2CO3(aq) + H2O(l)"],
    sideEffects: [
      {
        issue: "Explosion of oxygen cylinders due to high pressure.",
        effect: "Can ignite nearby materials, causing injury and fire outbreaks.",
        mitigation: "Regular maintenance and monitoring of cylinders; store in cool areas.",
      },
      {
        issue: "Exposure to liquid oxygen.",
        effect: "Severe skin/eye irritation, burns, loss of vision, cancer.",
        mitigation:
          "Post hazard warnings; communicate safety info to workers; submerge affected skin in warm water.",
      },
    ],
    socialBenefits: [
      "Employment opportunities → improved income → better standards of living",
      "Increased government revenue from taxes → improved infrastructure (roads, schools, hospitals)",
      "Development of small-scale businesses around the plant",
      "Availability of oxygen for patients → saves lives",
    ],
    flashcards: [
      {
        front: "Why are CO2 and water vapour removed before air is liquefied?",
        back: "Because they would solidify and block the apparatus.",
      },
      {
        front: "Which gas boils off first during fractional distillation of liquid air, and why?",
        back: "Nitrogen, because it has a lower boiling point (-196°C) than oxygen (-183°C).",
      },
      {
        front: "What removes CO2 from air in this process?",
        back: "Concentrated sodium hydroxide solution.",
      },
      { front: "What absorbs water vapour from the air?", back: "Silica." },
      {
        front: "At what pressure and temperature is air liquefied?",
        back: "200 atmospheres, cooled to about -200°C.",
      },
    ],
    quiz: [
      {
        question: "Why must carbon dioxide be removed from air before liquefaction?",
        options: [
          "It reacts with nitrogen",
          "It would solidify and block the apparatus",
          "It lowers the boiling point of oxygen",
          "It is flammable",
        ],
        correctIndex: 1,
        explanation:
          "CO2 (and water vapour) solidify at the very low temperatures used and would block the plant.",
      },
      {
        question:
          "What is the correct order in which nitrogen and oxygen separate during fractional distillation of liquid air?",
        options: [
          "Oxygen boils off first, then nitrogen",
          "Nitrogen boils off first, then oxygen",
          "Both boil off at the same time",
          "Neither boils; they are filtered",
        ],
        correctIndex: 1,
        explanation:
          "Nitrogen has a lower boiling point (-196°C) than oxygen (-183°C), so it boils off first.",
      },
      {
        question: "Which substance is used to remove carbon dioxide from air in this process?",
        options: ["Silica", "Concentrated sodium hydroxide", "Calcium oxide", "Sodium chloride"],
        correctIndex: 1,
        explanation: "2NaOH(aq) + CO2(g) → Na2CO3(aq) + H2O(l).",
      },
      {
        question: "A major danger during storage of manufactured oxygen is:",
        options: [
          "Explosion of cylinders due to high pressure",
          "Oxygen turning into ozone spontaneously",
          "Oxygen reacting with the steel cylinder",
          "Oxygen leaking as a liquid at room temperature",
        ],
        correctIndex: 0,
        explanation:
          "High-pressure storage risks explosion; mitigated by regular maintenance and monitoring.",
      },
    ],
  },
  {
    id: "sulphuric-acid",
    day: 2,
    title: "Manufacture of Sulphuric Acid (Contact Process)",
    rawMaterials: ["Dry sulphur dioxide", "Dry oxygen", "Vanadium(V) oxide catalyst", "Water"],
    steps: [
      "Dry SO2 and dry O2, free from impurities, are heated to about 450°C at low pressure (~1 atmosphere) in a combustion cylinder with a V2O5 catalyst, forming sulphur trioxide.",
      "Sulphur trioxide is dissolved in concentrated sulphuric acid to form a fuming liquid called oleum.",
      "Oleum is added to a regulated volume of distilled water to form 98% concentrated sulphuric acid.",
    ],
    equations: ["2SO2(g) + O2(g) ⇌ 2SO3(g)  [V2O5 catalyst, ~450°C]"],
    sideEffects: [
      {
        issue: "Hot surface burns from combustion cylinders.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of personal protective equipment (PPE).",
      },
      {
        issue: "Poisonous waste gas fumes.",
        effect: "Respiratory complications when inhaled.",
        mitigation: "Fit catalytic converters in exhaust pipes.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2 in the air, contributing to global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment opportunities → increased income → improved standards of living",
      "Government revenue → roads → facilitates trade",
      "Government revenue → schools → better, cheaper education",
    ],
    flashcards: [
      { front: "What catalyst is used in the Contact Process?", back: "Vanadium(V) oxide, V2O5." },
      {
        front: "What is oleum?",
        back: "A fuming liquid formed when SO3 is dissolved in concentrated sulphuric acid.",
      },
      { front: "At roughly what temperature is SO2 oxidised to SO3?", back: "About 450°C." },
      {
        front: "How is 98% concentrated sulphuric acid finally obtained?",
        back: "By adding oleum to a regulated volume of distilled water.",
      },
    ],
    quiz: [
      {
        question: "Which catalyst is used to convert sulphur dioxide to sulphur trioxide?",
        options: ["Iron", "Vanadium(V) oxide", "Platinum", "Manganese(IV) oxide"],
        correctIndex: 1,
        explanation: "V2O5 is the catalyst used in the Contact Process at around 450°C.",
      },
      {
        question: "Why is SO3 dissolved in concentrated sulphuric acid rather than water directly?",
        options: [
          "Dissolving SO3 directly in water causes a violent, uncontrollable reaction",
          "Water does not dissolve SO3 at all",
          "It produces a coloured product",
          "It is cheaper",
        ],
        correctIndex: 0,
        explanation:
          "SO3 is instead absorbed to form oleum, which is then carefully diluted with water.",
      },
      {
        question: "How is poisonous waste gas from this process typically mitigated?",
        options: [
          "Releasing it at night",
          "Fitting catalytic converters in exhaust pipes",
          "Diluting it with fresh air only",
          "Storing it underground",
        ],
        correctIndex: 1,
        explanation: "Catalytic converters reduce harmful gases before they reach the atmosphere.",
      },
    ],
  },
  {
    id: "ethanol",
    day: 2,
    title: "Manufacture of Ethanol",
    rawMaterials: ["Starch-containing substance", "Malt (diastase enzyme)", "Yeast (maltase, zymase enzymes)"],
    steps: [
      "The starch-containing substance is crushed to extract starch.",
      "Malt is added to the starch; diastase in malt catalyses hydrolysis of starch to maltose.",
      "Yeast is added to the maltose after about 5 days at room temperature.",
      "Maltase in yeast catalyses hydrolysis of maltose to glucose.",
      "Zymase in yeast catalyses breakdown of glucose to crude ethanol and carbon dioxide.",
      "Crude ethanol is converted to pure ethanol by fractional distillation.",
    ],
    equations: [
      "(C6H10O5)n + nH2O → nC12H22O11 (starch → maltose, diastase)",
      "C12H22O11 + H2O → 2C6H12O6 (maltose → glucose, maltase)",
      "C6H12O6 → 2C2H5OH + 2CO2 (glucose → ethanol, zymase)",
    ],
    sideEffects: [
      {
        issue: "Hot surface burns from the distillation tank.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of PPE.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, contributing to global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment opportunities → increased income → improved standards of living",
      "Government revenue → roads, schools, hospitals",
    ],
    flashcards: [
      { front: "What enzyme in malt converts starch to maltose?", back: "Diastase." },
      { front: "What enzyme in yeast converts maltose to glucose?", back: "Maltase." },
      { front: "What enzyme in yeast breaks down glucose to ethanol?", back: "Zymase." },
      { front: "How is crude ethanol purified?", back: "By fractional distillation." },
    ],
    quiz: [
      {
        question: "Which enzyme catalyses the hydrolysis of starch to maltose?",
        options: ["Zymase", "Diastase", "Maltase", "Amylase-2"],
        correctIndex: 1,
        explanation: "Diastase, present in malt, hydrolyses starch to maltose.",
      },
      {
        question: "Zymase catalyses the conversion of:",
        options: [
          "Starch to maltose",
          "Maltose to glucose",
          "Glucose to ethanol and carbon dioxide",
          "Ethanol to acetic acid",
        ],
        correctIndex: 2,
        explanation: "Zymase in yeast breaks glucose down into ethanol and CO2 (fermentation).",
      },
      {
        question: "How is pure ethanol obtained from the fermentation mixture?",
        options: ["Filtration", "Fractional distillation", "Precipitation", "Electrolysis"],
        correctIndex: 1,
        explanation:
          "Fractional distillation separates ethanol from water and other impurities by boiling point.",
      },
    ],
  },
  {
    id: "detergents",
    day: 3,
    title: "Manufacture of Detergent (Soap)",
    rawMaterials: ["Vegetable oil", "Concentrated sodium hydroxide", "Sodium chloride (brine)"],
    steps: [
      "Vegetable oil and concentrated sodium hydroxide are boiled together, with stirring, until no more reaction occurs, in a stainless-steel boiler.",
      "The soap solution is cooled; concentrated sodium chloride solution is added to precipitate the soap (salting out).",
      "Soap floats and is skimmed off; perfumes and dyes may be added.",
      "It is purified by re-boiling in water and re-precipitating with brine.",
      "Soap is baked into desired bars and stored.",
    ],
    equations: ["Fat/Oil + 3NaOH → Glycerol + 3 Soap (saponification)"],
    sideEffects: [
      {
        issue: "Hot surface burns during heating.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of PPE.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads, schools, hospitals",
    ],
    flashcards: [
      { front: "What process converts oil + NaOH into soap?", back: "Saponification." },
      {
        front: "What is added to soap solution to precipitate the soap?",
        back: "Concentrated sodium chloride solution (brine) — 'salting out'.",
      },
      { front: "What is the by-product of saponification, alongside soap?", back: "Glycerol." },
    ],
    quiz: [
      {
        question:
          "The reaction between vegetable oil and concentrated sodium hydroxide to form soap is called:",
        options: ["Esterification", "Saponification", "Neutralisation", "Fermentation"],
        correctIndex: 1,
        explanation: "Saponification produces soap and glycerol.",
      },
      {
        question: "What is added to the cooled soap solution to precipitate the soap out?",
        options: [
          "Distilled water",
          "Concentrated sodium chloride solution",
          "Dilute sulphuric acid",
          "Silica",
        ],
        correctIndex: 1,
        explanation:
          "Brine (concentrated NaCl solution) 'salts out' the soap so it floats and can be skimmed off.",
      },
      {
        question: "What is the by-product of soap manufacture, besides soap itself?",
        options: ["Glycerol", "Ammonia", "Oleum", "Cryolite"],
        correctIndex: 0,
        explanation: "Saponification of fats/oils with NaOH produces soap and glycerol.",
      },
    ],
  },
  {
    id: "iron",
    day: 3,
    title: "Extraction of Iron (Blast Furnace)",
    rawMaterials: ["Coke", "Haematite (iron ore)", "Limestone", "Hot air"],
    steps: [
      "Coke, haematite and limestone are fed into a blast furnace from the top; hot air enters from the bottom.",
      "Coke is oxidised by hot air to carbon dioxide.",
      "Carbon dioxide is reduced by unreacted coke to carbon monoxide.",
      "Carbon monoxide reduces haematite to molten iron, releasing carbon dioxide.",
      "Limestone decomposes to calcium oxide and carbon dioxide.",
      "Calcium oxide reacts with silicon dioxide impurity to form calcium silicate (slag), which is tapped off.",
    ],
    equations: [
      "2C(s) + O2(g) → 2CO(g)",
      "Fe2O3(s) + 3CO(g) → 2Fe(l) + 3CO2(g)",
      "CaCO3(s) → CaO(s) + CO2(g)",
      "CaO(s) + SiO2(s) → CaSiO3(l) (slag)",
    ],
    sideEffects: [
      {
        issue: "Hot surface burns during the process.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of PPE.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads, schools, hospitals",
    ],
    flashcards: [
      {
        front: "What reduces haematite to molten iron in the blast furnace?",
        back: "Carbon monoxide.",
      },
      {
        front: "What is the role of limestone in iron extraction?",
        back: "It decomposes to CaO, which reacts with silica impurity to form slag (calcium silicate), removing it.",
      },
      { front: "What is the main iron ore mentioned in this process?", back: "Haematite." },
    ],
    quiz: [
      {
        question: "What reduces iron(III) oxide to molten iron in the blast furnace?",
        options: ["Coke directly", "Carbon monoxide", "Hot air", "Limestone"],
        correctIndex: 1,
        explanation: "Fe2O3(s) + 3CO(g) → 2Fe(l) + 3CO2(g).",
      },
      {
        question: "Why is limestone added to the blast furnace?",
        options: [
          "To provide the iron itself",
          "To react with silica impurity and form slag",
          "To cool the furnace",
          "To act as the fuel",
        ],
        correctIndex: 1,
        explanation:
          "CaO from decomposed limestone reacts with SiO2 to form calcium silicate (slag), removing the impurity.",
      },
      {
        question: "What is produced when coke is oxidised by hot air at the bottom of the furnace?",
        options: ["Carbon monoxide directly", "Carbon dioxide", "Calcium oxide", "Silicon dioxide"],
        correctIndex: 1,
        explanation: "Coke is first oxidised to CO2, which is then reduced by more coke to CO.",
      },
    ],
  },
  {
    id: "copper",
    day: 4,
    title: "Extraction of Copper",
    rawMaterials: ["Copper pyrites", "Silicon dioxide", "Air"],
    steps: [
      "Copper pyrites are crushed and concentrated by froth flotation.",
      "The concentrated ore is dried and roasted in air to form copper(I) sulphide, iron(II) oxide, and sulphur dioxide gas.",
      "Silicon dioxide is added; it reacts with iron(II) oxide to form iron(II) silicate, removing the iron oxide as slag.",
      "The remaining copper(I) sulphide is heated in a controlled air supply to form impure copper.",
      "Impure copper is purified by electrolysis in an electrolytic cell to form pure copper.",
    ],
    equations: ["FeO + SiO2 → FeSiO3 (slag)"],
    sideEffects: [
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
      {
        issue: "Toxic sulphur dioxide released to the atmosphere.",
        effect: "Respiratory complications.",
        mitigation: "Fit scrubbers in exhaust pipes to neutralise acidic gases.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads, schools, hospitals",
    ],
    flashcards: [
      { front: "How is copper pyrites first concentrated?", back: "By froth flotation." },
      {
        front: "What removes iron(II) oxide during copper extraction?",
        back: "Silicon dioxide, forming iron(II) silicate slag.",
      },
      { front: "How is impure copper finally purified?", back: "By electrolysis in an electrolytic cell." },
    ],
    quiz: [
      {
        question: "What method is used to concentrate copper pyrites before roasting?",
        options: ["Fractional distillation", "Froth flotation", "Electrolysis", "Filtration"],
        correctIndex: 1,
        explanation: "Froth flotation separates the valuable ore from waste rock.",
      },
      {
        question: "What is added to remove iron(II) oxide during roasting?",
        options: ["Limestone", "Silicon dioxide", "Sodium hydroxide", "Cryolite"],
        correctIndex: 1,
        explanation: "SiO2 reacts with FeO to form iron(II) silicate slag, which is removed.",
      },
      {
        question: "How is impure copper converted into pure copper?",
        options: ["Roasting again", "Electrolysis", "Froth flotation", "Distillation"],
        correctIndex: 1,
        explanation: "Electrolytic refining deposits pure copper at the cathode.",
      },
      {
        question: "A key toxic gas released during copper extraction, requiring scrubbers, is:",
        options: ["Carbon monoxide", "Sulphur dioxide", "Ammonia", "Chlorine"],
        correctIndex: 1,
        explanation: "SO2 from roasting causes respiratory problems and acid rain if unmitigated.",
      },
    ],
  },
  {
    id: "aluminium",
    day: 4,
    title: "Extraction of Aluminium",
    rawMaterials: ["Bauxite", "Sodium hydroxide", "Cryolite"],
    steps: [
      "Bauxite is roasted in air to drive off water, then crushed into fine powder.",
      "It is concentrated with hot sodium hydroxide solution (Bayer's process) to form aluminium hydroxide.",
      "Aluminium hydroxide is heated to form pure aluminium oxide (alumina).",
      "Aluminium oxide is dissolved in molten cryolite to lower its melting point to about 800°C.",
      "The molten mixture is electrolysed between graphite electrodes.",
      "At the cathode, aluminium ions are reduced and discharged as molten aluminium metal.",
      "At the anode, oxide ions are oxidised and released as oxygen gas.",
    ],
    equations: [
      "Al2O3(s) + 2OH-(aq) → 2AlO2-(aq) + H2O(l)",
      "Cathode: Al3+(l) + 3e- → Al(s)",
      "Anode: 2O2-(l) → O2(g) + 4e-",
    ],
    sideEffects: [
      {
        issue: "Hot surface burns during the process.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of PPE.",
      },
      {
        issue: "Poisonous waste gas fumes.",
        effect: "Respiratory disorders.",
        mitigation: "Fit catalytic converters in exhaust pipes.",
      },
    ],
    socialBenefits: ["Employment opportunities → increased income → improved standards of living"],
    flashcards: [
      { front: "What is the principal ore of aluminium?", back: "Bauxite." },
      {
        front: "Why is aluminium oxide dissolved in molten cryolite?",
        back: "To lower its melting point from ~2000°C to about 800°C, saving energy.",
      },
      {
        front: "What happens at the cathode during aluminium electrolysis?",
        back: "Al3+ ions gain electrons and are deposited as molten aluminium metal.",
      },
      {
        front: "What happens at the anode during aluminium electrolysis?",
        back: "O2- ions lose electrons and are released as oxygen gas.",
      },
      { front: "What electrodes are used in aluminium electrolysis?", back: "Graphite electrodes." },
    ],
    quiz: [
      {
        question: "What is the principal ore from which aluminium is extracted?",
        options: ["Haematite", "Bauxite", "Copper pyrites", "Galena"],
        correctIndex: 1,
        explanation: "Bauxite is purified via the Bayer process to obtain pure aluminium oxide.",
      },
      {
        question: "Why is aluminium oxide dissolved in molten cryolite before electrolysis?",
        options: [
          "To make it conduct electricity for the first time",
          "To lower its melting point and save energy",
          "To remove iron impurities",
          "To increase its density",
        ],
        correctIndex: 1,
        explanation:
          "Pure Al2O3 melts around 2000°C; dissolving it in cryolite lowers this to about 800°C.",
      },
      {
        question: "During electrolysis of molten aluminium oxide, what happens at the cathode?",
        options: [
          "Oxygen gas is released",
          "Aluminium ions are reduced to aluminium metal",
          "Cryolite is decomposed",
          "Graphite is deposited",
        ],
        correctIndex: 1,
        explanation: "Al3+(l) + 3e- → Al(s) — reduction occurs at the cathode.",
      },
      {
        question: "What gas is produced at the anode during aluminium extraction?",
        options: ["Hydrogen", "Chlorine", "Oxygen", "Carbon dioxide only"],
        correctIndex: 2,
        explanation: "2O2-(l) → O2(g) + 4e- at the anode.",
      },
    ],
  },
  {
    id: "cement",
    day: 5,
    title: "Manufacture of Cement",
    rawMaterials: ["Limestone", "Clay", "Water", "Gypsum"],
    steps: [
      "Limestone and clay are crushed and milled into fine powder.",
      "The powder is mixed with water and fed into a rotating cylinder, heated to about 1500°C.",
      "Limestone decomposes to calcium oxide and carbon dioxide.",
      "Calcium oxide reacts with aluminium oxide and silicon dioxide in clay to form lumps of calcium aluminate and calcium silicate.",
      "The lumps are crushed to form cement as a fine powder.",
      "Gypsum is added during grinding to moderate the reaction between cement and water.",
      "Cement is packed in bags for use.",
    ],
    equations: ["CaCO3(s) → CaO(s) + CO2(g)"],
    sideEffects: [
      {
        issue: "Toxic gases and dust released to the atmosphere.",
        effect: "Respiratory complications.",
        mitigation: "Fit scrubbers in exhaust pipes to neutralise toxic gases.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
      {
        issue: "Hot surface burns from combustion process.",
        effect: "Wounds and pain to workers.",
        mitigation: "Proper use of PPE.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads, schools, hospitals",
    ],
    flashcards: [
      {
        front: "What is added during grinding to moderate cement's reaction with water?",
        back: "Gypsum.",
      },
      {
        front: "At roughly what temperature is the limestone/clay mixture heated?",
        back: "About 1500°C.",
      },
      { front: "What does limestone decompose into when heated?", back: "Calcium oxide and carbon dioxide." },
    ],
    quiz: [
      {
        question: "Why is gypsum added during the grinding of cement clinker?",
        options: [
          "To colour the cement",
          "To moderate the reaction between cement and water",
          "To increase the melting point",
          "To act as a catalyst",
        ],
        correctIndex: 1,
        explanation: "Gypsum controls the setting time of cement when mixed with water.",
      },
      {
        question: "The main raw materials for cement manufacture are:",
        options: [
          "Bauxite and cryolite",
          "Limestone and clay",
          "Copper pyrites and silica",
          "Haematite and coke",
        ],
        correctIndex: 1,
        explanation:
          "Limestone and clay are crushed, milled, and heated together to form cement clinker.",
      },
    ],
  },
  {
    id: "ammonium-nitrate",
    day: 6,
    title: "Manufacture of Ammonium Nitrate Fertilizer",
    rawMaterials: [
      "Nitrogen (from air)",
      "Hydrogen (from natural gas)",
      "Iron catalyst",
      "Platinum catalyst",
      "Ammonia",
    ],
    steps: [
      "Nitrogen from air and hydrogen from natural gas are compressed and passed over heated iron catalyst to form ammonia.",
      "Ammonia is mixed with excess oxygen, purified, and passed over a platinum catalyst at 700°C, oxidising it to nitrogen monoxide and water.",
      "The gases are cooled and mixed with more air to form nitrogen dioxide.",
      "Nitrogen dioxide is absorbed in hot water with excess oxygen to form nitric acid in the absorption tower.",
      "Nitric acid is reacted with concentrated ammonia to form ammonium nitrate.",
      "The product is evaporated to dryness to obtain pure ammonium nitrate.",
    ],
    equations: [
      "N2(g) + 3H2(g) ⇌ 2NH3(g) [Fe catalyst]",
      "4NH3(g) + 5O2(g) → 4NO(g) + 6H2O(g) [Pt catalyst, 700°C]",
      "NH3 + HNO3 → NH4NO3",
    ],
    sideEffects: [
      {
        issue: "Toxic acidic gases released to the atmosphere.",
        effect: "Acid rain, lowering soil pH and reducing crop yields.",
        mitigation: "Fit catalytic converters to convert nitrogen oxides to nitrogen.",
      },
      {
        issue: "Toxic gases released to the atmosphere.",
        effect: "Respiratory complications.",
        mitigation: "Fit scrubbers in exhaust pipes.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads → facilitates trade",
    ],
    flashcards: [
      { front: "What catalyst is used to make ammonia from nitrogen and hydrogen?", back: "Heated iron catalyst." },
      { front: "What catalyst oxidises ammonia to nitrogen monoxide?", back: "Platinum, at about 700°C." },
      {
        front: "What acid is formed when nitrogen dioxide is absorbed in hot water and oxygen?",
        back: "Nitric acid.",
      },
      { front: "What is formed when nitric acid reacts with ammonia?", back: "Ammonium nitrate." },
    ],
    quiz: [
      {
        question: "Which catalyst is used to combine nitrogen and hydrogen into ammonia?",
        options: ["Platinum", "Vanadium(V) oxide", "Iron", "Nickel"],
        correctIndex: 2,
        explanation: "N2 + 3H2 ⇌ 2NH3 over a heated iron catalyst.",
      },
      {
        question: "At which stage is a platinum catalyst used in this process?",
        options: [
          "Combining nitrogen and hydrogen",
          "Oxidising ammonia to nitrogen monoxide",
          "Forming ammonium nitrate",
          "Evaporating the final product",
        ],
        correctIndex: 1,
        explanation: "4NH3 + 5O2 → 4NO + 6H2O, over platinum at ~700°C.",
      },
      {
        question: "What is the final product of reacting nitric acid with ammonia?",
        options: ["Sodium nitrate", "Ammonium nitrate", "Ammonium sulphate", "Urea"],
        correctIndex: 1,
        explanation: "NH3 + HNO3 → NH4NO3, evaporated to dryness to obtain the pure fertilizer.",
      },
    ],
  },
  {
    id: "biogas",
    day: 7,
    title: "Manufacture of Biogas",
    rawMaterials: ["Organic waste", "Water", "Anaerobic bacteria"],
    steps: [
      "Organic wastes are put into a tank and mixed with a little water.",
      "The tank is covered to prevent aerial oxidation.",
      "The tank and contents are kept at room temperature for about 2 weeks.",
      "Anaerobic bacteria break down the organic matter to produce biogas.",
      "The biogas is compressed and collected in gas cylinders for storage via pipes.",
    ],
    equations: [],
    sideEffects: [
      {
        issue: "Explosion of biogas cylinders due to high pressure.",
        effect: "Can ignite other materials and cause fire.",
        mitigation: "Keep cylinders in cool areas.",
      },
      {
        issue: "Air pollution by waste gases (hydrogen sulphide, ammonia) from leaks.",
        effect: "Stomach and respiratory disorders.",
        mitigation: "Regular maintenance and monitoring of cylinders.",
      },
      {
        issue: "Leakage of hydrogen sulphide.",
        effect: "Contributes to acid rain, crumbling buildings.",
        mitigation: "Regular maintenance and monitoring of cylinders.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Gas used for lighting and cooking fuel → improved living standards",
    ],
    flashcards: [
      { front: "What breaks down organic matter to produce biogas?", back: "Anaerobic bacteria." },
      { front: "Why is the biogas tank covered?", back: "To prevent aerial (air) oxidation." },
      {
        front: "Roughly how long does the biogas tank need to sit at room temperature?",
        back: "About 2 weeks.",
      },
      {
        front: "Name two toxic gases that can leak from biogas systems.",
        back: "Hydrogen sulphide and ammonia.",
      },
    ],
    quiz: [
      {
        question: "What organisms break down organic waste to produce biogas?",
        options: ["Aerobic fungi", "Anaerobic bacteria", "Yeast", "Algae"],
        correctIndex: 1,
        explanation: "Anaerobic bacteria decompose organic matter in the absence of air to produce biogas.",
      },
      {
        question: "Why is the biogas digester tank kept covered?",
        options: [
          "To keep it warm only",
          "To prevent aerial oxidation",
          "To speed up combustion",
          "To let sunlight in",
        ],
        correctIndex: 1,
        explanation: "Covering prevents air from entering, maintaining the anaerobic conditions bacteria need.",
      },
      {
        question: "A toxic gas that can leak from biogas systems and contribute to acid rain is:",
        options: ["Nitrogen", "Hydrogen sulphide", "Argon", "Oxygen"],
        correctIndex: 1,
        explanation: "Hydrogen sulphide leakage can cause acid rain and crumbling of buildings.",
      },
    ],
  },
  {
    id: "naoh-chlorine",
    day: 7,
    title: "Manufacture of Sodium Hydroxide and Chlorine",
    rawMaterials: ["Brine (concentrated sodium chloride solution)", "Mercury (cathode)", "Graphite (anode)"],
    steps: [
      "Brine is electrolysed in an electrolytic cell with a mercury cathode and graphite anode.",
      "Chloride ions move to the anode, are discharged, and lose electrons to form chlorine gas (due to high concentration).",
      "Chlorine gas is dried, liquefied, and stored in tightly closed tanks.",
      "Sodium and hydrogen ions move to the cathode; sodium ions are discharged, gaining electrons to form sodium metal.",
      "Sodium metal dissolves in mercury to form sodium amalgam.",
      "Sodium amalgam reacts with water to form sodium hydroxide solution, hydrogen, and mercury (mercury is recycled to the cathode).",
      "The sodium hydroxide solution is evaporated to dryness, then cooled to form solid sodium hydroxide.",
    ],
    equations: [
      "At anode: 2Cl-(aq) → Cl2(g) + 2e-",
      "At cathode: Na+ + e- → Na (with Hg) → sodium amalgam",
      "2Na(Hg) + 2H2O → 2NaOH(aq) + H2(g) + 2Hg",
    ],
    sideEffects: [
      {
        issue: "Mercury poisoning.",
        effect: "Damage to nervous system, kidneys, liver, immune system; cancer risk.",
        mitigation: "Post hazard warning information in working areas.",
      },
      {
        issue: "Toxic acidic gases released to the atmosphere.",
        effect: "Acid rain, lowering soil pH.",
        mitigation: "Fit catalytic converters.",
      },
      {
        issue: "Destruction of vegetation for plant construction.",
        effect: "Increased CO2, global warming.",
        mitigation: "Plant fast-growing, fast-maturing trees.",
      },
    ],
    socialBenefits: [
      "Employment → increased income → improved standards of living",
      "Government revenue → roads → facilitates trade",
    ],
    flashcards: [
      {
        front: "What are the cathode and anode materials in this electrolytic cell?",
        back: "Mercury cathode, graphite anode.",
      },
      { front: "What forms at the anode during brine electrolysis?", back: "Chlorine gas." },
      { front: "What does sodium form when it dissolves in mercury?", back: "Sodium amalgam." },
      {
        front: "What does sodium amalgam produce when reacted with water?",
        back: "Sodium hydroxide solution, hydrogen gas, and mercury (recycled).",
      },
      { front: "What is the major health hazard specific to this process?", back: "Mercury poisoning." },
    ],
    quiz: [
      {
        question: "In the mercury-cathode cell for brine electrolysis, what forms at the graphite anode?",
        options: ["Hydrogen gas", "Chlorine gas", "Sodium metal", "Oxygen gas"],
        correctIndex: 1,
        explanation: "Chloride ions are discharged at the anode: 2Cl- → Cl2 + 2e-.",
      },
      {
        question: "What does sodium form when it dissolves into the mercury cathode?",
        options: ["Sodium hydroxide directly", "Sodium amalgam", "Sodium chloride", "Sodium oxide"],
        correctIndex: 1,
        explanation: "Sodium metal dissolves in mercury to form sodium amalgam, later reacted with water.",
      },
      {
        question: "The major specific health hazard of this process, requiring hazard warnings, is:",
        options: ["Sulphur dioxide poisoning", "Mercury poisoning", "Radiation exposure", "Carbon monoxide poisoning"],
        correctIndex: 1,
        explanation:
          "Mercury exposure can damage the nervous system, kidneys, liver, and immune system.",
      },
      {
        question: "What three products form when sodium amalgam reacts with water?",
        options: [
          "Sodium hydroxide, hydrogen, and mercury",
          "Sodium chloride, oxygen, and mercury",
          "Sodium oxide, chlorine, and water",
          "Sodium carbonate, hydrogen, and graphite",
        ],
        correctIndex: 0,
        explanation: "2Na(Hg) + 2H2O → 2NaOH(aq) + H2(g) + 2Hg, with mercury recycled to the cathode.",
      },
    ],
  },
];

export function processesForDay(day: number): ProcessEntry[] {
  return processes.filter((p) => p.day === day);
}

export function processById(id: string): ProcessEntry | undefined {
  return processes.find((p) => p.id === id);
}

export const TOTAL_DAYS = 8;
export const PASS_THRESHOLD = 0.8;

export const DAY_FOCUS: Record<number, string> = {
  1: "Oxygen",
  2: "Sulphuric Acid & Ethanol",
  3: "Detergents & Iron",
  4: "Copper & Aluminium",
  5: "Cement",
  6: "Ammonium Nitrate Fertilizer",
  7: "Biogas & Sodium Hydroxide/Chlorine",
  8: "Full Mock Exam & Review",
};
