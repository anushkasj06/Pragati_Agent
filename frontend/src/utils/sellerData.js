/**
 * sellerData.js — Three canonical seller profiles used across all seller portal pages.
 * This is the single source of truth for demo seller data.
 * Every seller portal page reads from useApp().selectedSeller which holds one of these.
 */

export const SELLER_PROFILES = [
  {
    id:            "SELL_00199",
    name:          "Anjali Narayan",
    initials:      "AN",
    business:      "Anjali Fashions",
    city:          "Pune",
    state:         "Maharashtra",
    email:         "anjali.narayan@meesho.in",
    phone:         "+91 9876543210",
    gst:           "27AABCU9603R1ZX",
    language:      "Hindi",
    risk_category: "Low",
    tier:          "Silver",
    tier_pct:      68,
    account_age_months: 24,
    summary:       "Strong performer with excellent dispatch SLA and customer ratings. Eligible for the maximum pre-approved amount.",
    metrics: {
      sales_velocity_6m:         145000,
      sales_growth_rate:         22.4,
      rto_rate:                  6.2,
      dispatch_sla_compliance:   97,
      avg_customer_rating:       4.8,
      rating_trend:              0.15,
      order_cancellation_rate:   3.1,
      ad_spend_roi:              3.2,
      account_age_months:        24,
      total_orders_6m:           520,
      catalog_size:              220,
      prior_loan_default:        0,
    },
    loan_history: [
      { id:"TXN-2025-001", date:"10 Jul 2025", status:"Approved",  amount:"₹75,000",  riskClass:"Low",  language:"Hindi",
        sellerMsg:"आपका लोन आवेदन स्वीकृत हो गया है। आपकी उत्कृष्ट डिस्पैच SLA और ग्राहक रेटिंग ने आपकी पात्रता बढ़ाई।",
        plan:["RTO दर को 6% से नीचे रखें","Catalog को 250+ products तक बढ़ाएं","Monthly sales consistency बनाए रखें"] },
      { id:"TXN-2024-007", date:"15 Mar 2024", status:"Approved",  amount:"₹50,000",  riskClass:"Low",  language:"Hindi",
        sellerMsg:"बधाई हो! आपका लोन मंजूर हो गया है।",
        plan:["Order volume बढ़ाएं","Rating trend positive रखें"] },
    ],
    insights: {
      monthly_sales:  [82000, 95000, 88000, 112000, 105000, 145000],
      monthly_orders: [1850,  2100,  1980,  2450,   2300,   2847 ],
      categories:     [{ name:"Fashion", value:55 }, { name:"Home", value:25 }, { name:"Others", value:20 }],
    },
  },
  {
    id:            "SELL_00123",
    name:          "Ramesh Sharma",
    initials:      "RS",
    business:      "RS Electronics",
    city:          "Jaipur",
    state:         "Rajasthan",
    email:         "ramesh.sharma@meesho.in",
    phone:         "+91 9876500002",
    gst:           "08AABCU9603R1ZX",
    language:      "English",
    risk_category: "Moderate",
    tier:          "Bronze",
    tier_pct:      35,
    account_age_months: 14,
    summary:       "Moderate risk seller with improving sales but high RTO. Improvement in dispatch SLA and RTO reduction would unlock better terms.",
    metrics: {
      sales_velocity_6m:         62000,
      sales_growth_rate:         8.1,
      rto_rate:                  14.5,
      dispatch_sla_compliance:   82,
      avg_customer_rating:       3.7,
      rating_trend:             -0.05,
      order_cancellation_rate:   9.2,
      ad_spend_roi:              1.8,
      account_age_months:        14,
      total_orders_6m:           840,
      catalog_size:              78,
      prior_loan_default:        0,
    },
    loan_history: [
      { id:"TXN-2025-003", date:"2 May 2025", status:"Review",   amount:"₹30,000", riskClass:"Moderate", language:"English",
        sellerMsg:"Your application is under review. Our team will contact you within 24 hours.",
        plan:["Reduce RTO from 14.5% to below 10%","Improve dispatch SLA to 90%+","Grow monthly sales by 20%"] },
    ],
    insights: {
      monthly_sales:  [48000, 52000, 55000, 59000, 61000, 62000],
      monthly_orders: [620,   680,   710,   760,   800,   840  ],
      categories:     [{ name:"Electronics", value:70 }, { name:"Accessories", value:20 }, { name:"Others", value:10 }],
    },
  },
  {
    id:            "SELL_00456",
    name:          "Priya Nair",
    initials:      "PN",
    business:      "Priya Home Decor",
    city:          "Kochi",
    state:         "Kerala",
    email:         "priya.nair@meesho.in",
    phone:         "+91 9876500003",
    gst:           "32AABCU9603R1ZX",
    language:      "Malayalam",
    risk_category: "High",
    tier:          "New",
    tier_pct:      8,
    account_age_months: 4,
    summary:       "High risk profile due to young account, high RTO, and prior default. Needs 6 months of consistent performance before loan eligibility.",
    metrics: {
      sales_velocity_6m:         12000,
      sales_growth_rate:        -3.2,
      rto_rate:                  22.8,
      dispatch_sla_compliance:   67,
      avg_customer_rating:       2.6,
      rating_trend:             -0.3,
      order_cancellation_rate:   17.4,
      ad_spend_roi:              0.9,
      account_age_months:        4,
      total_orders_6m:           130,
      catalog_size:              15,
      prior_loan_default:        1,
    },
    loan_history: [
      { id:"TXN-2025-002", date:"1 Jun 2025", status:"Rejected", amount:"—", riskClass:"High", language:"Malayalam",
        sellerMsg:"നിങ്ങളുടെ അപേക്ഷ ഈ സമയം അംഗീകരിക്കാൻ സാധിക്കില്ല. ഉയർന്ന RTO നിരക്കും മുൻ ലോൺ ഡിഫോൾട്ടും കാരണം.",
        plan:["Previous default resolve ചെയ്യുക","RTO 22% ൽ നിന്ന് 15% ൽ താഴെ കൊണ്ടുവരിക","6 months consistent sales build ചെയ്യുക"] },
    ],
    insights: {
      monthly_sales:  [14000, 13500, 12800, 11900, 12200, 12000],
      monthly_orders: [180,   175,   168,   152,   158,   130  ],
      categories:     [{ name:"Home Decor", value:65 }, { name:"Kitchen", value:25 }, { name:"Others", value:10 }],
    },
  },
];

export const DEFAULT_SELLER = SELLER_PROFILES[0];

/** Get seller by ID */
export function getSellerById(id) {
  return SELLER_PROFILES.find(s => s.id === id) || null;
}

/** Compute a simple health score (0-100) from metrics */
export function computeHealthScore(metrics) {
  if (!metrics) return 50;
  let score = 60;
  if (metrics.dispatch_sla_compliance >= 95)  score += 10;
  else if (metrics.dispatch_sla_compliance >= 80) score += 5;
  if (metrics.avg_customer_rating >= 4.5)     score += 10;
  else if (metrics.avg_customer_rating >= 3.8) score += 5;
  if (metrics.rto_rate <= 5)                  score += 8;
  else if (metrics.rto_rate <= 10)            score += 4;
  else if (metrics.rto_rate > 18)             score -= 10;
  if (metrics.sales_growth_rate >= 15)        score += 7;
  else if (metrics.sales_growth_rate < 0)     score -= 8;
  if (metrics.prior_loan_default === 1)       score -= 15;
  if (metrics.account_age_months < 6)         score -= 8;
  return Math.max(20, Math.min(98, score));
}
