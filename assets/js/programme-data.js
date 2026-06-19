/*! BlastBeat V2 — canonical programme data (window.BB_PROGRAMME).
 * Generated from /data/programme-data.json — the single source of truth.
 * Owner: Tumelo Ncube (CTO). Regenerate this file when the JSON changes.
 * Consumed by /admin (and, when imported, the programme-console + licence templates).
 */
window.BB_PROGRAMME = {
  "_meta": {
    "title": "BlastBeat V2 — Canonical Programme Data",
    "description": "Single source of truth for schools, sponsors, licences, TwinAid, ambassadors, pricing and the sponsor/funder pipeline. All dashboards and licence templates should derive from this file. Replaces the invented 'Ikageng / Meridian / Greenfield' worked example everywhere.",
    "version": "2.0",
    "updated": "2026-06-19",
    "owner": "Tumelo Ncube (CTO)",
    "currency_note": "Two legitimate rates exist. SA founding licence = R12,225 (ZAR) — used by the operations dashboard & sponsor console. Africa-pilot marketing rate = €1,250 (50% off €2,500) — used by outward marketing (flyer, magazine). Do NOT conflate; they are different products/audiences.",
    "worked_example": "Tekkers (Sean) funds Rhodes High School · recruits Puma as co-sponsor · twins a Sub-Saharan cohort."
  },
  "org": {
    "name": "Climate Actions Now",
    "sa": "Climate Actions Now RSA",
    "uk": "Climate Actions Now (UK Registered Charity No. 1113530)",
    "ie": "Irish Reg 665595",
    "programme": "BlastBeat · Sponsor Licence framework",
    "years": 23,
    "students": "360,000+",
    "countries": 19,
    "site": "blastbeat.education"
  },
  "pricing": {
    "currency": "ZAR",
    "licence": {
      "label": "Programme Licence",
      "amount": 12225,
      "rule": "fixed",
      "note": "Founding SA rate · per school / cohort"
    },
    "prize": {
      "label": "Prize pillar",
      "amount": 2500,
      "rule": "from (sponsor-set)",
      "note": "Sponsor & school choose · brand on the trophy"
    },
    "event": {
      "label": "Event / showcase",
      "amount": 10000,
      "rule": "from (sponsor-set)",
      "note": "Headline presence on the day"
    },
    "twinaid": {
      "label": "TwinAid cohort",
      "amount": 12225,
      "rule": "costed",
      "note": "Funds one real Sub-Saharan cohort"
    },
    "ambassador": {
      "label": "Ambassador share",
      "amount": 0.25,
      "rule": "percent",
      "note": "25% of the licence fee raised"
    },
    "africa_pilot_marketing": {
      "label": "Africa pilot rate (marketing only)",
      "amount": 1250,
      "currency": "EUR",
      "rule": "50% off €2,500",
      "note": "Outward marketing rate — NOT the SA founding rate"
    }
  },
  "issuing_entity_by_region": {
    "SA": "Climate Actions Now RSA",
    "Namibia": "Climate Actions Now RSA",
    "UK": "Climate Actions Now (UK Charity 1113530)"
  },
  "schools": [
    {
      "id": "camps-bay",
      "name": "Camps Bay High School",
      "area": "Camps Bay, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Featured in the TV series · Principal Louis Mostert"
    },
    {
      "id": "wynberg",
      "name": "Wynberg Girls' High School",
      "area": "Wynberg, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Ran 'Sugar Mama Records' · Principal Dr Jennifer Wallace"
    },
    {
      "id": "bishops",
      "name": "Bishops Diocesan College",
      "area": "Rondebosch, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Ran 'Define Sound'"
    },
    {
      "id": "sacs",
      "name": "South African College School",
      "area": "Newlands, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Ran 'Guns Entertainment' · alumni Sibu Mbonambi & Darren Brookbanks · Principal Brendan Grant"
    },
    {
      "id": "leap",
      "name": "LEAP 2 Science & Maths School",
      "area": "Pinelands, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "LEAP network school"
    },
    {
      "id": "manenberg",
      "name": "Manenberg High School",
      "area": "Manenberg, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Heritage community school"
    },
    {
      "id": "zisukhanyo",
      "name": "Zisukhanyo High School",
      "area": "Samora Machel, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Alumnus Mthetho Moli"
    },
    {
      "id": "df-malan",
      "name": "Hoërskool D.F. Malan",
      "area": "Bellville, Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Afrikaans-medium heritage school"
    },
    {
      "id": "jan-van-r",
      "name": "Hoërskool Jan van Riebeeck",
      "area": "Central Cape Town",
      "region": "SA",
      "group": "heritage",
      "note": "Afrikaans-medium heritage school"
    },
    {
      "id": "blasc",
      "name": "BLASC Academy",
      "area": "Cape Town",
      "region": "SA",
      "group": "pilot",
      "lead": true,
      "note": "Lead pilot · all three verticals · FootBeat / Fagan Muller link"
    },
    {
      "id": "camst",
      "name": "CAMST — Cape Academy of Maths, Science & Technology",
      "area": "Constantia, Cape Town",
      "region": "SA",
      "group": "pilot",
      "note": "Active partner via Eduponics · 20-year MOU · 20-ha aquaponics agri-hub"
    },
    {
      "id": "rhodes",
      "name": "Rhodes High School",
      "area": "Mowbray, Cape Town",
      "region": "SA",
      "group": "pilot",
      "note": "Tekkers' (Sean's) founding school · critical to the Tekkers business"
    },
    {
      "id": "nam-d1",
      "name": "Windhoek District 1 — school TBC",
      "area": "Khomas, Namibia",
      "region": "Namibia",
      "group": "namibia",
      "note": "Agreed in principle · NIPDB / Brand Namibia · subject to Ministry of Education · target Mar–Apr 2026"
    },
    {
      "id": "nam-d2",
      "name": "Windhoek District 2 — school TBC",
      "area": "Khomas, Namibia",
      "region": "Namibia",
      "group": "namibia",
      "note": "Agreed in principle · NIPDB / Brand Namibia"
    },
    {
      "id": "nam-d3",
      "name": "Windhoek District 3 — school TBC",
      "area": "Khomas, Namibia",
      "region": "Namibia",
      "group": "namibia",
      "note": "Agreed in principle · NIPDB / Brand Namibia"
    },
    {
      "id": "nam-d4",
      "name": "Windhoek District 4 — school TBC",
      "area": "Khomas, Namibia",
      "region": "Namibia",
      "group": "namibia",
      "note": "Agreed in principle · NIPDB / Brand Namibia"
    },
    {
      "id": "windy",
      "name": "Windy Heights Primary",
      "area": "Durban, KZN",
      "region": "SA",
      "group": "proposal",
      "note": "Black Coffee Foundation proposal · not confirmed"
    },
    {
      "id": "qondokuhle",
      "name": "Qondokuhle Primary",
      "area": "Durban, KZN",
      "region": "SA",
      "group": "proposal",
      "note": "Black Coffee Foundation proposal · not confirmed"
    },
    {
      "id": "king-shaka",
      "name": "King Shaka High",
      "area": "Durban, KZN",
      "region": "SA",
      "group": "proposal",
      "note": "Black Coffee Foundation proposal · not confirmed"
    },
    {
      "id": "mzimvubu",
      "name": "Mzimvubu Primary",
      "area": "Eastern Cape",
      "region": "SA",
      "group": "proposal",
      "note": "Black Coffee Foundation proposal · not confirmed"
    },
    {
      "id": "zimele",
      "name": "Zimele High",
      "area": "Eastern Cape",
      "region": "SA",
      "group": "proposal",
      "note": "Black Coffee Foundation proposal · not confirmed"
    }
  ],
  "school_groups": {
    "heritage": {
      "label": "Western Cape · Heritage relationships",
      "short": "Heritage",
      "tone": "gold",
      "blurb": "From the 2006–07 Cape Town run (the TV-series era) — warm relationships and alumni links, not cold outreach."
    },
    "pilot": {
      "label": "Current SA pilot & partners",
      "short": "SA pilot",
      "tone": "green",
      "blurb": "Live pilot and partner schools running the programme now."
    },
    "namibia": {
      "label": "Namibia pilot — agreed in principle",
      "short": "Namibia",
      "tone": "cyan",
      "blurb": "Four schools across four Windhoek districts, with NIPDB / Brand Namibia, subject to Ministry of Education approval."
    },
    "proposal": {
      "label": "Black Coffee Foundation — proposal stage",
      "short": "Proposal",
      "tone": "violet",
      "blurb": "Five KZN / Eastern Cape schools surfaced in a partnership proposal — not yet confirmed."
    }
  },
  "sponsors": [
    {
      "id": "tekkers",
      "name": "Tekkers",
      "brand": "Tekkers (Sean)",
      "region": "SA",
      "roles": [
        "Licence Sponsor",
        "Ambassador Partner"
      ],
      "journey": "amplifying",
      "founding": true,
      "note": "Founding licence at R12,225 · raising Puma"
    },
    {
      "id": "puma",
      "name": "Puma",
      "brand": "Puma",
      "region": "SA",
      "roles": [
        "Co-Sponsor",
        "Prize Sponsor"
      ],
      "journey": "licensed",
      "note": "Co-investing alongside Tekkers · boots + trophy on the 5-a-side final"
    },
    {
      "id": "eduponics",
      "name": "Eduponics",
      "brand": "Eduponics",
      "region": "SA",
      "roles": [
        "Licence Sponsor"
      ],
      "journey": "delivered",
      "note": "CAMST partner · 20-year MOU · aquaponics agri-hub"
    },
    {
      "id": "footbeat",
      "name": "FootBeat / Fagan Muller",
      "brand": "FootBeat",
      "region": "SA",
      "roles": [
        "Licence Sponsor",
        "Event Sponsor"
      ],
      "journey": "delivered",
      "note": "Lead pilot at BLASC Academy"
    },
    {
      "id": "blackcoffee",
      "name": "Black Coffee Foundation",
      "brand": "Black Coffee Foundation",
      "region": "SA",
      "roles": [
        "Licence Sponsor",
        "TwinAid Sponsor"
      ],
      "journey": "registered",
      "note": "KZN / Eastern Cape proposal — five schools"
    },
    {
      "id": "nipdb",
      "name": "NIPDB / Brand Namibia",
      "brand": "Brand Namibia",
      "region": "Namibia",
      "roles": [
        "Licence Sponsor",
        "TwinAid Sponsor"
      ],
      "journey": "registered",
      "note": "Namibia pilot — four districts, agreed in principle"
    },
    {
      "id": "queens",
      "name": "Queen's University",
      "brand": "Queen's",
      "region": "UK",
      "roles": [
        "Ambassador Partner"
      ],
      "journey": "amplifying",
      "note": "Institutional Ambassador"
    },
    {
      "id": "jason",
      "name": "Jason",
      "brand": "Jason",
      "region": "UK",
      "roles": [
        "Ambassador Partner"
      ],
      "journey": "amplifying",
      "note": "Individual Ambassador"
    }
  ],
  "licences": [
    {
      "seq": 1,
      "credentialId": "BB-LIC-26-001",
      "sponsorId": "tekkers",
      "schoolId": "rhodes",
      "role": "Founding Licence",
      "tier": "founders-circle",
      "amount": 12225,
      "status": "valid",
      "validFrom": "2026-03-12",
      "validUntil": "2027-03-11",
      "twinCohort": "Makhulong cohort",
      "twinLoc": "Limpopo · ZA"
    },
    {
      "seq": 2,
      "credentialId": "BB-LIC-26-002",
      "sponsorId": "puma",
      "schoolId": "rhodes",
      "role": "Co-Sponsor · Prize",
      "tier": "full-year-twin",
      "amount": 2500,
      "status": "welcomed",
      "validFrom": "2026-03-20",
      "validUntil": "2027-03-11",
      "twinCohort": "—",
      "twinLoc": "—"
    },
    {
      "seq": 3,
      "credentialId": "BB-LIC-26-003",
      "sponsorId": "eduponics",
      "schoolId": "camst",
      "role": "Programme Licence",
      "tier": "legacy-partner",
      "amount": 12225,
      "status": "due",
      "validFrom": "2025-08-01",
      "validUntil": "2026-07-31",
      "twinCohort": "Tukwini cohort",
      "twinLoc": "Eastern Cape · ZA"
    },
    {
      "seq": 4,
      "credentialId": "BB-LIC-26-004",
      "sponsorId": "footbeat",
      "schoolId": "blasc",
      "role": "Lead-pilot Licence",
      "tier": "founders-circle",
      "amount": 12225,
      "status": "valid",
      "validFrom": "2025-09-15",
      "validUntil": "2026-09-14",
      "twinCohort": "Soweto cohort",
      "twinLoc": "Gauteng · ZA"
    },
    {
      "seq": 5,
      "credentialId": "BB-LIC-26-005",
      "sponsorId": "nipdb",
      "schoolId": "nam-d1",
      "role": "Namibia Pilot Licence",
      "tier": "patron-cohort",
      "amount": 12225,
      "status": "issued",
      "validFrom": "",
      "validUntil": "",
      "twinCohort": "Katutura cohort",
      "twinLoc": "Windhoek · NA"
    },
    {
      "seq": 6,
      "credentialId": "BB-LIC-26-006",
      "sponsorId": "nipdb",
      "schoolId": "nam-d2",
      "role": "Namibia Pilot Licence",
      "tier": "patron-cohort",
      "amount": 12225,
      "status": "issued",
      "validFrom": "",
      "validUntil": "",
      "twinCohort": "—",
      "twinLoc": "—"
    },
    {
      "seq": 7,
      "credentialId": "BB-LIC-26-007",
      "sponsorId": "blackcoffee",
      "schoolId": "king-shaka",
      "role": "Foundation Licence",
      "tier": "full-year-twin",
      "amount": 12225,
      "status": "issued",
      "validFrom": "",
      "validUntil": "",
      "twinCohort": "Mthatha cohort",
      "twinLoc": "Eastern Cape · ZA"
    },
    {
      "seq": 8,
      "credentialId": "BB-LIC-26-008",
      "sponsorId": "blackcoffee",
      "schoolId": "windy",
      "role": "Foundation Licence",
      "tier": "founding-pilot",
      "amount": 12225,
      "status": "issued",
      "validFrom": "",
      "validUntil": "",
      "twinCohort": "—",
      "twinLoc": "—"
    },
    {
      "seq": 9,
      "credentialId": "BB-LIC-26-009",
      "sponsorId": "tekkers",
      "schoolId": "camps-bay",
      "role": "Heritage re-engagement",
      "tier": "founding-pilot",
      "amount": 12225,
      "status": "issued",
      "validFrom": "",
      "validUntil": "",
      "twinCohort": "—",
      "twinLoc": "—"
    }
  ],
  "cohort_target": 20,
  "tiers": [
    {
      "id": "founding-pilot",
      "name": "Founding Pilot",
      "validity": "12 months",
      "metal": "bronze",
      "rank": 1
    },
    {
      "id": "full-year-twin",
      "name": "Full Year Twin",
      "validity": "12 months",
      "metal": "silver",
      "rank": 2
    },
    {
      "id": "founders-circle",
      "name": "Founders' Circle Patron",
      "validity": "12 months",
      "metal": "gold",
      "rank": 3
    },
    {
      "id": "patron-cohort",
      "name": "Founding Patron Cohort",
      "validity": "12 months",
      "metal": "sapphire",
      "rank": 4
    },
    {
      "id": "legacy-partner",
      "name": "Legacy Partner",
      "validity": "12 months",
      "metal": "obsidian",
      "rank": 5
    }
  ],
  "ambassadors": [
    {
      "ambassador": "Tekkers",
      "raised": "Puma",
      "licence": "Rhodes High School",
      "amount": 3056,
      "status": "pending",
      "note": "Co-sponsor raised on the founding licence (25% of R12,225)"
    },
    {
      "ambassador": "Queen's University",
      "raised": "(institutional pipeline)",
      "licence": "—",
      "amount": 0,
      "status": "pending",
      "note": "Championing an institution"
    },
    {
      "ambassador": "Jason",
      "raised": "(pipeline)",
      "licence": "—",
      "amount": 0,
      "status": "pending",
      "note": "Individual Ambassador"
    }
  ],
  "sponsor_pipeline": {
    "categories": {
      "legacy": {
        "label": "Legacy sponsors",
        "blurb": "Past corporate sponsors across 23 years (Ireland & global era) — legacy logos, not live."
      },
      "sa-corp": {
        "label": "SA corporate",
        "blurb": "Outreach prepared or opened, 2025–26."
      },
      "sa-found": {
        "label": "SA foundations & individuals",
        "blurb": "Warm relationships, not yet closed."
      },
      "namibia": {
        "label": "Namibia",
        "blurb": "Mining & corporate — from the Mining Expo and national programme."
      },
      "ireland": {
        "label": "Ireland grants",
        "blurb": "Live grant funnels."
      },
      "connector": {
        "label": "Investors & connectors",
        "blurb": "Funding-adjacent and delivery partners, not direct sponsors."
      }
    },
    "entries": [
      {
        "name": "Coca-Cola",
        "cat": "legacy",
        "region": "Global",
        "tag": "Legacy",
        "note": "Past corporate sponsor over BlastBeat's history."
      },
      {
        "name": "AIB",
        "cat": "legacy",
        "region": "Ireland",
        "tag": "Legacy",
        "note": "Past corporate sponsor (Ireland era)."
      },
      {
        "name": "RTÉ",
        "cat": "legacy",
        "region": "Ireland",
        "tag": "Legacy",
        "note": "Past media partner / sponsor."
      },
      {
        "name": "Barclays",
        "cat": "legacy",
        "region": "Global",
        "tag": "Legacy",
        "note": "Past corporate sponsor."
      },
      {
        "name": "Mr Price Group",
        "cat": "legacy",
        "region": "South Africa",
        "tag": "Legacy",
        "note": "Past corporate sponsor."
      },
      {
        "name": "Absa",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "contact": "sponsorships@absa.co.za",
        "note": "Rolling applications · outreach drafted."
      },
      {
        "name": "Vodacom Foundation",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "note": "#DigitalSkills4Youth · full targeted campaign written, not yet sent."
      },
      {
        "name": "YES4Youth",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Warm",
        "contact": "Ravi Naidoo (CEO)",
        "note": "Flagged for the Q1 2026 cohort."
      },
      {
        "name": "MTN Foundation",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "note": "~R14M/yr digital skills. MTN MoMo fintech at NDA stage via Robert."
      },
      {
        "name": "National Lotteries Commission",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "note": "Funding window noted · R100K–R5M."
      },
      {
        "name": "Standard Bank",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "note": "Named target."
      },
      {
        "name": "Investec",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Warm",
        "note": "Via Sibu for ESE banking — 'in contact'."
      },
      {
        "name": "Naspers",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Outreach",
        "note": "Named target."
      },
      {
        "name": "Puma",
        "cat": "sa-corp",
        "region": "South Africa",
        "tag": "Live",
        "note": "Live — via Tekkers · boots + trophy co-sponsor."
      },
      {
        "name": "Black Coffee Foundation",
        "cat": "sa-found",
        "region": "South Africa",
        "tag": "Warm",
        "contact": "info@blackcoffee.foundation",
        "note": "Proposal sent · 5 schools + music-academy synergy · not closed."
      },
      {
        "name": "Sibu Mbonambi",
        "cat": "sa-found",
        "region": "South Africa",
        "tag": "Warm",
        "note": "SACS alumnus · ~R100K floated Sept 2025 · Harambee & Investec links."
      },
      {
        "name": "Landmark Foundation",
        "cat": "sa-found",
        "region": "South Africa",
        "tag": "Warm",
        "note": "CAN conservation partner · in-kind, ready."
      },
      {
        "name": "B2Gold",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "contact": "John Roos",
        "note": "Networking contact · agri / workforce angle."
      },
      {
        "name": "Swakop Uranium",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "contact": "Luo Wei",
        "note": "Education champion · Hope Farm."
      },
      {
        "name": "Debmarine",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "contact": "Willy Mertens",
        "note": "Networking stage."
      },
      {
        "name": "MTC",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "note": "Named · networking stage."
      },
      {
        "name": "Nampower",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "note": "Named · networking stage."
      },
      {
        "name": "Standard Bank Namibia",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Warm",
        "note": "Named · networking stage."
      },
      {
        "name": "NIPDB / Brand Namibia",
        "cat": "namibia",
        "region": "Namibia",
        "tag": "Government",
        "contact": "Margareth Gustavo · Iyaloo Hamata",
        "note": "Government enabler — not a sponsor. Backs the 4-district pilot."
      },
      {
        "name": "Rethink Ireland — Impact Fund",
        "cat": "ireland",
        "region": "Ireland",
        "tag": "Grant",
        "note": "€96K."
      },
      {
        "name": "Rethink Ireland — Entrepreneurship Fund",
        "cat": "ireland",
        "region": "Ireland",
        "tag": "Grant",
        "note": "€60K/yr × 3."
      },
      {
        "name": "Local Enterprise Office",
        "cat": "ireland",
        "region": "Ireland",
        "tag": "Grant",
        "note": "LEP 2026."
      },
      {
        "name": "SICAP Small Grants",
        "cat": "ireland",
        "region": "Ireland",
        "tag": "Grant",
        "note": "€2,500 rolling."
      },
      {
        "name": "Enterprise Ireland",
        "cat": "ireland",
        "region": "Ireland",
        "tag": "Grant",
        "note": "Named funnel."
      },
      {
        "name": "Cibus Capital / Rob Appleby",
        "cat": "connector",
        "region": "Global",
        "tag": "Connector",
        "note": "$30M+ food & ag VC · warm family intro · global-partner angle, not direct investment."
      },
      {
        "name": "Lovable",
        "cat": "connector",
        "region": "Global",
        "tag": "Connector",
        "contact": "Anton Osika",
        "note": "Platform-showcase angle, not money."
      },
      {
        "name": "Alain Ferrier",
        "cat": "connector",
        "region": "Global",
        "tag": "Connector",
        "note": "Event producer · delivery partner."
      },
      {
        "name": "Trixta / Mark Levitt",
        "cat": "connector",
        "region": "Global",
        "tag": "Connector",
        "note": "Tech · delivery partner."
      },
      {
        "name": "Paul / Ti.to",
        "cat": "connector",
        "region": "Ireland",
        "tag": "Connector",
        "note": "Ticketing · alumni · delivery partner."
      }
    ]
  },
  "activity": [
    {
      "when": "2026-06-12",
      "who": "Tekkers",
      "what": "Raised Puma as co-sponsor · Ambassador ledger +R3,056",
      "kind": "amplify"
    },
    {
      "when": "2026-06-09",
      "who": "Puma",
      "what": "Co-sponsor licensed · prize pillar from R2,500",
      "kind": "payment"
    },
    {
      "when": "2026-05-28",
      "who": "Eduponics",
      "what": "Impact credentials issued · CAMST delivered",
      "kind": "impact"
    },
    {
      "when": "2026-05-20",
      "who": "Brand Namibia",
      "what": "Two district licences registered · awaiting MoE",
      "kind": "pending"
    },
    {
      "when": "2026-05-14",
      "who": "Tekkers",
      "what": "Founding licence verified · R12,225",
      "kind": "verify"
    },
    {
      "when": "2026-05-02",
      "who": "Black Coffee Foundation",
      "what": "Five-school proposal received",
      "kind": "pending"
    }
  ]
};
