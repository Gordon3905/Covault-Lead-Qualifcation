export const demoVerticals = [
  vertical({
    slug: "real-estate",
    name: "Coastal Realty Group",
    industry: "real_estate",
    regions: ["Florida", "Georgia"],
    teams: ["Inbound Realty", "Enterprise Realty"],
    reps: ["Ava Brooks", "Noah Carter", "Maya Chen"],
    nurture: "Open House Long Tail",
    sampleLeads: [
      lead("Harbor Homes", "real_estate", 22000, "high", "Florida", "partner_referral"),
      lead("Pine Street Brokers", "real_estate", 9000, "medium", "Georgia", "web_form"),
      lead("Solo Agent Lead", "real_estate", 2000, "low", "Alabama", "paid_search")
    ]
  }),
  vertical({
    slug: "plumbing",
    name: "RapidFlow Plumbing",
    industry: "plumbing",
    regions: ["Ohio", "Michigan"],
    teams: ["Emergency Services", "Commercial Plumbing"],
    reps: ["Luis Rivera", "Ivy Patel", "Grace Kim"],
    nurture: "Seasonal Maintenance Nurture",
    sampleLeads: [
      lead("Metro Pipe Rescue", "plumbing", 18000, "high", "Ohio", "emergency_form"),
      lead("Lakeview Maintenance", "plumbing", 8000, "medium", "Michigan", "web_form"),
      lead("DIY Faucet Inquiry", "plumbing", 500, "low", "Indiana", "paid_search")
    ]
  }),
  vertical({
    slug: "law-firm",
    name: "Summit Legal Partners",
    industry: "law_firm",
    regions: ["Texas", "Arizona"],
    teams: ["Intake Counsel", "Growth Counsel"],
    reps: ["June Ellis", "Omar Haddad", "Priya Shah"],
    nurture: "Consultation Warmup",
    sampleLeads: [
      lead("Austin Injury Group", "law_firm", 26000, "high", "Texas", "partner_referral"),
      lead("Desert Estate Counsel", "law_firm", 10000, "medium", "Arizona", "web_form"),
      lead("One-Off Contract Review", "law_firm", 1200, "low", "Nevada", "directory")
    ]
  }),
  vertical({
    slug: "medical-practice",
    name: "Northstar Medical Practice",
    industry: "medical_practice",
    regions: ["New York", "Pennsylvania"],
    teams: ["Practice Growth", "Specialty Clinics"],
    reps: ["Mia Foster", "Eli Stone", "Sam Nguyen"],
    nurture: "Patient Demand Education",
    sampleLeads: [
      lead("Parker Medical", "medical_practice", 24000, "high", "New York", "partner_referral"),
      lead("Keystone Pediatrics", "medical_practice", 11000, "medium", "Pennsylvania", "web_form"),
      lead("Small Clinic Inquiry", "medical_practice", 1500, "low", "New Jersey", "paid_search")
    ]
  })
];

function vertical(input) {
  return input;
}

function lead(name, industry, budget, urgency, region, sourceQuality) {
  return {
    name,
    industry,
    budget,
    urgency,
    region,
    sourceQuality,
    companySize: budget >= 20000 ? "51-200" : budget >= 8000 ? "11-50" : "1-10"
  };
}
