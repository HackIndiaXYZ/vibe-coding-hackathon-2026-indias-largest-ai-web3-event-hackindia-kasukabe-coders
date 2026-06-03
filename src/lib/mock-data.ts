// Mock data for MandiMind AI platform

export const kpiData = [
  {
    title: "Monitored Mandis",
    value: "2,847",
    change: "+12.5%",
    trend: "up" as const,
    description: "Across 28 states",
    icon: "MapPin",
    color: "emerald",
  },
  {
    title: "Active Commodities",
    value: "184",
    change: "+3.2%",
    trend: "up" as const,
    description: "Live price tracking",
    icon: "Wheat",
    color: "amber",
  },
  {
    title: "High Risk Markets",
    value: "23",
    change: "-8.1%",
    trend: "down" as const,
    description: "Requires attention",
    icon: "AlertTriangle",
    color: "red",
  },
  {
    title: "Predicted Opportunities",
    value: "67",
    change: "+24.3%",
    trend: "up" as const,
    description: "This week",
    icon: "TrendingUp",
    color: "blue",
  },
];

export const onionForecastData = {
  commodity: "Onion",
  market: "Lasalgaon, Maharashtra",
  currentPrice: 2850,
  predictedMin: 3100,
  predictedMax: 3600,
  predictedMid: 3350,
  confidence: 87,
  timeframe: "Next 14 days",
  trend: "bullish",
};

export const riskAlerts = [
  {
    id: 1,
    severity: "high" as const,
    commodity: "Tomato",
    region: "Andhra Pradesh",
    priceChange: -34.5,
    reason: "Supply surplus due to bumper harvest in Kurnool district",
    timestamp: "2 hours ago",
    affectedMandis: 12,
  },
  {
    id: 2,
    severity: "medium" as const,
    commodity: "Potato",
    region: "Uttar Pradesh",
    priceChange: -18.2,
    reason: "Cold storage release expected next week",
    timestamp: "4 hours ago",
    affectedMandis: 8,
  },
  {
    id: 3,
    severity: "high" as const,
    commodity: "Onion",
    region: "Rajasthan",
    priceChange: +22.8,
    reason: "Unseasonal rains damaged standing crops",
    timestamp: "6 hours ago",
    affectedMandis: 6,
  },
  {
    id: 4,
    severity: "low" as const,
    commodity: "Garlic",
    region: "Madhya Pradesh",
    priceChange: +8.4,
    reason: "Export demand increase from Southeast Asia",
    timestamp: "8 hours ago",
    affectedMandis: 4,
  },
  {
    id: 5,
    severity: "medium" as const,
    commodity: "Wheat",
    region: "Punjab",
    priceChange: -12.1,
    reason: "MSP procurement ahead of schedule reducing open market demand",
    timestamp: "12 hours ago",
    affectedMandis: 15,
  },
];

export const aiRecommendations = [
  {
    id: 1,
    type: "sell" as const,
    commodity: "Onion",
    message: "Sell 60% inventory within 7 days due to expected supply surge from Nashik region.",
    urgency: "high" as const,
    expectedGain: "+₹850/quintal",
    confidence: 91,
  },
  {
    id: 2,
    type: "hold" as const,
    commodity: "Potato",
    message: "Hold stock for 10–14 days. Price recovery expected post-cold-storage cycle.",
    urgency: "medium" as const,
    expectedGain: "+₹320/quintal",
    confidence: 76,
  },
  {
    id: 3,
    type: "buy" as const,
    commodity: "Garlic",
    message: "Procurement opportunity at Neemuch mandi. Prices 18% below 3-year average.",
    urgency: "low" as const,
    expectedGain: "+₹1,200/quintal",
    confidence: 83,
  },
];

export const forecastChartData = [
  { date: "May 1", actual: 2200, forecast: null, low: null, high: null },
  { date: "May 5", actual: 2350, forecast: null, low: null, high: null },
  { date: "May 10", actual: 2480, forecast: null, low: null, high: null },
  { date: "May 15", actual: 2620, forecast: null, low: null, high: null },
  { date: "May 20", actual: 2750, forecast: null, low: null, high: null },
  { date: "May 25", actual: 2850, forecast: null, low: null, high: null },
  { date: "Jun 1", actual: 2850, forecast: 2850, low: 2700, high: 3000 },
  { date: "Jun 5", actual: null, forecast: 3050, low: 2850, high: 3250 },
  { date: "Jun 10", actual: null, forecast: 3200, low: 2950, high: 3450 },
  { date: "Jun 15", actual: null, forecast: 3350, low: 3050, high: 3650 },
  { date: "Jun 20", actual: null, forecast: 3480, low: 3150, high: 3810 },
  { date: "Jun 25", actual: null, forecast: 3550, low: 3100, high: 4000 },
  { date: "Jun 30", actual: null, forecast: 3600, low: 3050, high: 4150 },
];

export const historicalData: Record<string, { month: string; price: number; volume: number }[]> = {
  Onion: [
    { month: "Jan", price: 1850, volume: 45000 },
    { month: "Feb", price: 2100, volume: 52000 },
    { month: "Mar", price: 2450, volume: 48000 },
    { month: "Apr", price: 2200, volume: 55000 },
    { month: "May", price: 2600, volume: 61000 },
    { month: "Jun", price: 2850, volume: 58000 },
  ],
  Tomato: [
    { month: "Jan", price: 1200, volume: 72000 },
    { month: "Feb", price: 980, volume: 68000 },
    { month: "Mar", price: 1450, volume: 75000 },
    { month: "Apr", price: 1800, volume: 82000 },
    { month: "May", price: 2100, volume: 79000 },
    { month: "Jun", price: 1650, volume: 85000 },
  ],
  Potato: [
    { month: "Jan", price: 1100, volume: 120000 },
    { month: "Feb", price: 1250, volume: 115000 },
    { month: "Mar", price: 1380, volume: 108000 },
    { month: "Apr", price: 1220, volume: 125000 },
    { month: "May", price: 1050, volume: 132000 },
    { month: "Jun", price: 980, volume: 145000 },
  ],
  Garlic: [
    { month: "Jan", price: 5500, volume: 18000 },
    { month: "Feb", price: 5800, volume: 16500 },
    { month: "Mar", price: 6200, volume: 17800 },
    { month: "Apr", price: 6500, volume: 19200 },
    { month: "May", price: 6800, volume: 20100 },
    { month: "Jun", price: 7200, volume: 18900 },
  ],
};

export type MandiResult = {
  rank: number;
  name: string;
  district: string;
  expectedPrice: number;
  advantage: string;
  score: number;
  distance: string;
  volume: string;
};

export const mandiFinderResults: Record<string, Record<string, MandiResult[]>> = {
  Onion: {
    Maharashtra: [
      { rank: 1, name: "Lasalgaon APMC", district: "Nashik", expectedPrice: 3250, advantage: "+14.2%", score: 94, distance: "45 km", volume: "High" },
      { rank: 2, name: "Pimpalgaon APMC", district: "Nashik", expectedPrice: 3180, advantage: "+11.7%", score: 88, distance: "62 km", volume: "High" },
      { rank: 3, name: "Manmad APMC", district: "Nashik", expectedPrice: 3050, advantage: "+7.0%", score: 81, distance: "78 km", volume: "Medium" },
      { rank: 4, name: "Yeola APMC", district: "Nashik", expectedPrice: 2980, advantage: "+4.6%", score: 74, distance: "92 km", volume: "Medium" },
      { rank: 5, name: "Niphad APMC", district: "Nashik", expectedPrice: 2920, advantage: "+2.5%", score: 68, distance: "55 km", volume: "Low" },
    ],
    "Andhra Pradesh": [
      { rank: 1, name: "Kurnool APMC", district: "Kurnool", expectedPrice: 3100, advantage: "+8.8%", score: 86, distance: "120 km", volume: "High" },
      { rank: 2, name: "Kadapa APMC", district: "Kadapa", expectedPrice: 2980, advantage: "+4.6%", score: 79, distance: "145 km", volume: "Medium" },
      { rank: 3, name: "Nandyal APMC", district: "Nandyal", expectedPrice: 2910, advantage: "+2.1%", score: 71, distance: "98 km", volume: "Medium" },
      { rank: 4, name: "Ongole APMC", district: "Prakasam", expectedPrice: 2850, advantage: "0%", score: 65, distance: "210 km", volume: "Low" },
      { rank: 5, name: "Guntur APMC", district: "Guntur", expectedPrice: 2820, advantage: "-1.0%", score: 60, distance: "185 km", volume: "High" },
    ],
  },
  Tomato: {
    Karnataka: [
      { rank: 1, name: "Kolar APMC", district: "Kolar", expectedPrice: 2100, advantage: "+27.3%", score: 96, distance: "68 km", volume: "High" },
      { rank: 2, name: "Chintamani APMC", district: "Chikkaballapur", expectedPrice: 1980, advantage: "+20.0%", score: 89, distance: "82 km", volume: "High" },
      { rank: 3, name: "Bangalore APMC", district: "Bengaluru", expectedPrice: 1850, advantage: "+12.1%", score: 82, distance: "35 km", volume: "Very High" },
      { rank: 4, name: "Mysore APMC", district: "Mysuru", expectedPrice: 1720, advantage: "+4.2%", score: 74, distance: "145 km", volume: "Medium" },
      { rank: 5, name: "Hubli APMC", district: "Dharwad", expectedPrice: 1650, advantage: "0%", score: 66, distance: "320 km", volume: "Medium" },
    ],
    Maharashtra: [
      { rank: 1, name: "Pune APMC", district: "Pune", expectedPrice: 1950, advantage: "+18.2%", score: 91, distance: "28 km", volume: "Very High" },
      { rank: 2, name: "Nashik APMC", district: "Nashik", expectedPrice: 1820, advantage: "+10.3%", score: 84, distance: "72 km", volume: "High" },
      { rank: 3, name: "Aurangabad APMC", district: "Aurangabad", expectedPrice: 1740, advantage: "+5.4%", score: 77, distance: "125 km", volume: "Medium" },
      { rank: 4, name: "Kolhapur APMC", district: "Kolhapur", expectedPrice: 1680, advantage: "+1.8%", score: 70, distance: "198 km", volume: "Medium" },
      { rank: 5, name: "Solapur APMC", district: "Solapur", expectedPrice: 1650, advantage: "0%", score: 63, distance: "225 km", volume: "Low" },
    ],
  },
};

export const aiInsights = [
  {
    id: 1,
    commodity: "Onion",
    region: "Maharashtra",
    demandTrend: "Rising",
    demandScore: 78,
    supplyTrend: "Falling",
    supplyScore: 42,
    opportunityScore: 88,
    riskScore: 24,
    insight: "Strong export demand from Middle East combined with reduced arrivals creating a bullish price environment. MSP procurement unlikely to cap prices this season.",
    recommendation: "Buy / Hold",
    priceTarget: "₹3,400–3,800/quintal",
    horizon: "14–21 days",
    tags: ["Export Demand", "Supply Deficit", "Bullish"],
  },
  {
    id: 2,
    commodity: "Tomato",
    region: "Andhra Pradesh",
    demandTrend: "Stable",
    demandScore: 55,
    supplyTrend: "Rising",
    supplyScore: 81,
    opportunityScore: 31,
    riskScore: 76,
    insight: "Bumper harvest in Kurnool and Madanapalle expected to flood markets. Arrivals up 35% week-on-week. Processors capacity already at 90%.",
    recommendation: "Sell Immediately",
    priceTarget: "₹900–1,200/quintal",
    horizon: "3–7 days",
    tags: ["Supply Surplus", "Price Crash Risk", "Bearish"],
  },
  {
    id: 3,
    commodity: "Potato",
    region: "Uttar Pradesh",
    demandTrend: "Rising",
    demandScore: 66,
    supplyTrend: "Stable",
    supplyScore: 58,
    opportunityScore: 62,
    riskScore: 38,
    insight: "QSR sector demand pickup ahead of summer season. Cold storage stocks at 5-year low creating tight supply. Price recovery of 15–20% expected.",
    recommendation: "Hold",
    priceTarget: "₹1,200–1,450/quintal",
    horizon: "10–14 days",
    tags: ["QSR Demand", "Storage Depletion", "Neutral"],
  },
  {
    id: 4,
    commodity: "Garlic",
    region: "Madhya Pradesh",
    demandTrend: "Rising",
    demandScore: 84,
    supplyTrend: "Falling",
    supplyScore: 35,
    opportunityScore: 91,
    riskScore: 18,
    insight: "Export to China rebounding after diplomatic thaw. Domestic pharma demand stable. New crop 3 months away creating sustained price support.",
    recommendation: "Buy",
    priceTarget: "₹7,500–8,200/quintal",
    horizon: "21–30 days",
    tags: ["Export Rebound", "Pharma Demand", "Strong Buy"],
  },
];

export const commodities = ["Onion", "Tomato", "Potato", "Garlic", "Wheat", "Rice", "Soybean", "Maize"];
export const states = ["Maharashtra", "Andhra Pradesh", "Karnataka", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Punjab", "Gujarat"];
