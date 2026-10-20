export type SourceCode = "F1" | "F2" | "R1" | "R2" | "R3" | "G1" | "G2" | "P1" | "P2" | "P3" | "P4";

export const SOURCES: Record<SourceCode, { title: string; url: string }> = {
  F1: { title: "Flexiple, India GCC statistics (Aug 2026)", url: "https://flexiple.com/gcc/statistics" },
  F2: { title: "Flexiple, salary methodology", url: "https://flexiple.com/market/methodology" },
  R1: {
    title: "ANAROCK average office rents by city, 2025 (CXOToday, 23 May 2025)",
    url: "https://cxotoday.com/media-coverage/mmrs-office-rental-values-zoom-28-from-2022-to-2025-hyderabad-next-with-24-1/",
  },
  R2: {
    title: "Hyderabad GCC office demand report (CXOToday, 2026)",
    url: "https://cxotoday.com/others/hyderabad-gcc-acceleration-projected-to-drive-up-to-12-million-sq-ft-office-demand/",
  },
  R3: {
    title: "ANAROCK H1 2026 GCC leasing (IANS, 17 Jul 2026)",
    url: "https://ianslive.in/gccs-account-for-45-pc-of-gross-office-leasing-in-india-during-jan-june--20260717163137",
  },
  G1: { title: "JLL India (17 Feb 2026)", url: "https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million" },
  G2: {
    title: "Telangana Socio Economic Outlook 2026 (Deccan Chronicle)",
    url: "https://www.deccanchronicle.com/southern-states/telangana/hyderabad-emerges-as-gcc-hub-hosts-20-of-indias-gccs-1945301",
  },
  P1: { title: "Government of Karnataka, GCC Policy 2024–29", url: "https://eitbt.karnataka.gov.in/it/public/policy5/en" },
  P2: { title: "Law.asia, state GCC policies", url: "https://law.asia/india-gcc-growth/" },
  P3: { title: "Tamil Nadu and Maharashtra policies, as summarised by Flexiple", url: "https://flexiple.com/gcc/statistics" },
  P4: {
    title: "UP GCC Policy 2025 (The Finance Story)",
    url: "https://thefinancestory.com/up-gcc-policy-introduced-aims-to-hit-its-1-trillion-economy",
  },
};

export type Fact = { text: string; sources: SourceCode[]; conflict?: boolean } | null;

export interface City {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  professionalsM: number;
  companies25: number;
  seMedian: number;
  seniorMedian: number;
  avgRent: number;
  primeRent: Fact;
  gccCount: Fact;
  gccShare: Fact;
  incentive: { text: string; sources: SourceCode[] };
}

export const CITIES: City[] = [
  {
    id: "bengaluru", name: "Bengaluru", state: "Karnataka", lat: 12.97, lng: 77.59,
    professionalsM: 7.1, companies25: 1000, seMedian: 15.7, seniorMedian: 32.5, avgRent: 95,
    primeRent: { text: "₹110–140", sources: ["R2"] },
    gccCount: { text: "900+ units (JLL) vs 880+ GCCs (market report): sources disagree", sources: ["G1", "R2"], conflict: true },
    gccShare: { text: "70%", sources: ["R3"] },
    incentive: {
      text: "Karnataka GCC Policy 2024–29. Land-cost support up to 50%, training stipends, IP reimbursements; the largest incentive bands go to centres outside Bengaluru.",
      sources: ["P1", "P2"],
    },
  },
  {
    id: "hyderabad", name: "Hyderabad", state: "Telangana", lat: 17.39, lng: 78.49,
    professionalsM: 5.3, companies25: 700, seMedian: 10.4, seniorMedian: 24.2, avgRent: 72,
    primeRent: { text: "₹95–115", sources: ["R2"] },
    gccCount: { text: "515+ GCCs (market report) vs ~20% of India's GCCs (Telangana): sources disagree", sources: ["R2", "G2"], conflict: true },
    gccShare: { text: "48%", sources: ["R3"] },
    incentive: {
      text: "Telangana GCC framework. Land subsidies, electricity benefits, employment-linked support; no dedicated GCC policy document found yet.",
      sources: ["P2"],
    },
  },
  {
    id: "chennai", name: "Chennai", state: "Tamil Nadu", lat: 13.08, lng: 80.27,
    professionalsM: 4.1, companies25: 600, seMedian: 7.6, seniorMedian: 19.1, avgRent: 72,
    primeRent: { text: "₹65–90", sources: ["R2"] },
    gccCount: { text: "280+ GCCs", sources: ["R2"] },
    gccShare: { text: "55%", sources: ["R3"] },
    incentive: {
      text: "Tamil Nadu GCC payroll subsidy (to Mar 2027). Only for Forbes Global 2000 or Fortune 1000 parents committing at least 200 direct jobs.",
      sources: ["P3"],
    },
  },
  {
    id: "pune", name: "Pune", state: "Maharashtra", lat: 18.52, lng: 73.86,
    professionalsM: 2.4, companies25: 500, seMedian: 9.5, seniorMedian: 22.3, avgRent: 80,
    primeRent: { text: "₹80–105", sources: ["R2"] },
    gccCount: { text: "475+ GCCs", sources: ["R2"] },
    gccShare: null,
    incentive: {
      text: "Maharashtra GCC Policy 2025. Targets about 400 new GCCs; extra incentives steer centres to Nagpur, Nashik and Chhatrapati Sambhajinagar.",
      sources: ["P3", "P2"],
    },
  },
  {
    id: "mumbai", name: "Mumbai", state: "Maharashtra (MMR)", lat: 19.08, lng: 72.88,
    professionalsM: 5.8, companies25: 700, seMedian: 9.7, seniorMedian: 22.8, avgRent: 168,
    primeRent: null, gccCount: null, gccShare: null,
    incentive: {
      text: "Maharashtra GCC Policy 2025. Targets about 400 new GCCs; extra incentives steer centres to Nagpur, Nashik and Chhatrapati Sambhajinagar.",
      sources: ["P3", "P2"],
    },
  },
  {
    id: "delhi", name: "Delhi NCR", state: "Haryana / UP", lat: 28.61, lng: 77.21,
    professionalsM: 5.0, companies25: 700, seMedian: 14.1, seniorMedian: 24.0, avgRent: 110,
    primeRent: null, gccCount: null, gccShare: null,
    incentive: {
      text: "Haryana GCC Policy 2025 (Gurugram) or UP GCC Policy 2025 (Noida). UP offers a 30–50% subsidy on land bought from state agencies.",
      sources: ["P2", "P4"],
    },
  },
];

export const CITY_NAMES = CITIES.map((c) => c.name);
