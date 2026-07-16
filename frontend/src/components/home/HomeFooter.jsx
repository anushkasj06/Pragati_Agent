import { Link } from "react-router-dom";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Seller Portal",    to: "/seller"    },
      { label: "Admin Dashboard",  to: "/dashboard" },
      { label: "Evaluate Loan",    to: "/evaluate"  },
      { label: "Decision History", to: "/history"   },
    ],
  },
  {
    heading: "Technology",
    links: [
      { label: "Groq Llama 3.1",   to: "/docs" },
      { label: "XGBoost + SHAP",   to: "/docs" },
      { label: "LangChain.js",     to: "/docs" },
      { label: "MongoDB Atlas",    to: "/docs" },
    ],
  },
  {
    heading: "Hackathon",
    links: [
      { label: "Meesho ScriptedBy Her 2.0", to: "/" },
      { label: "Theme: Building for Bharat", to: "/" },
      { label: "Team: Anushka's Team 2",    to: "/" },
    ],
  },
];

export default function HomeFooter() {
  return (
    <footer className="bg-white border-t border-[#E9E5F5]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6F2DBD, #8B5CF6)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9"/>
                  <circle cx="8" cy="8" r="2.5" fill="white"/>
                </svg>
              </div>
              <div className="leading-tight">
                <p className="font-bold text-sm" style={{ color: "#6F2DBD" }}>Pragati Agent</p>
                <p className="text-[#9CA3AF] text-xs">by Meesho Finance</p>
              </div>
            </div>
            <p className="text-[#4B5563] text-sm leading-relaxed max-w-xs mb-4">
              Transparent, multilingual, AI-powered financial access
              for every Meesho seller in Bharat.
            </p>
            <div className="flex gap-2">
              <span className="badge-purple">ScriptedBy Her 2.0</span>
              <span className="badge-green">2026</span>
            </div>
          </div>

          {/* Link groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="font-semibold text-[#1A1A2E] text-sm mb-4">{group.heading}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[#4B5563] hover:text-[#6F2DBD] text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#E9E5F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#9CA3AF] text-sm">
            Meesho Pragati Agent — Built for Bharat. All rights reserved 2026.
          </p>
          <p className="text-[#9CA3AF] text-xs">
            Team: Anushka Sunil Jadhav
          </p>
        </div>
      </div>
    </footer>
  );
}
