"use client";

interface SidebarProps {

  activeTab: string;

  setActiveTab: (
    tab: string
  ) => void;

}

export default function Sidebar({

  activeTab,
  setActiveTab,

}: SidebarProps) {

  const items = [

    {
      id: "overview",
      label: "OVERVIEW",
    },

    {
      id: "cases",
      label: "CASES",
    },

    {
      id: "aml",
      label: "AML",
    },

    {
      id: "blockchain",
      label: "BLOCKCHAIN",
    },

    {
      id: "cybersecurity",
      label: "CYBERSECURITY",
    },

    {
      id: "compliance",
      label: "COMPLIANCE",
    },

    {
      id: "ai",
      label: "AI INVESTIGATOR",
    },

    {
      id: "risk",
      label: "RISK MAP",
    },

    {
      id: "reports",
      label: "REPORTS",
    },

  ];

  return (

    <aside className="relative w-[320px] border-r border-blue-500/10 bg-black/40 backdrop-blur-2xl">

      {/* BLUE GLOW */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)]" />

      {/* HEADER */}

      <div className="relative z-10 border-b border-blue-500/10 p-8">

        <h1 className="text-3xl font-black tracking-[0.3em] text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]">

          AGI

        </h1>

        <p className="mt-3 text-xs tracking-[0.25em] text-gray-500">

          AUDIT GLOBAL INTELLIGENCE

        </p>

      </div>

      {/* NAVIGATION */}

      <nav className="relative z-10 p-5">

        <div className="space-y-3">

          {items.map((item) => (

            <button
              key={item.id}
              onClick={() =>
                setActiveTab(
                  item.id
                )
              }
              className={`group relative w-full overflow-hidden rounded-2xl border px-5 py-4 text-left text-sm font-bold tracking-[0.2em] transition-all duration-300 ${
                activeTab ===
                item.id
                  ? "border-blue-400/40 bg-blue-500 text-black shadow-[0_0_35px_rgba(59,130,246,0.75)]"
                  : "border-blue-500/5 bg-[#0d1117]/60 text-gray-400 hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-blue-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
              }`}
            >

              {/* LIGHT EFFECT */}

              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">

                <div className="absolute -left-10 top-0 h-full w-20 rotate-12 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent blur-xl" />

              </div>

              {/* LABEL */}

              <span className="relative z-10">

                {item.label}

              </span>

            </button>

          ))}

        </div>

      </nav>

      {/* FOOTER */}

      <div className="absolute bottom-0 w-full border-t border-blue-500/10 p-6">

        <div className="rounded-2xl border border-cyan-400/20 bg-[#0d1117]/90 p-5 shadow-[0_0_25px_rgba(34,211,238,0.2)]">

          <p className="text-xs tracking-[0.25em] text-cyan-400">

            SYSTEM STATUS

          </p>

          <h2 className="mt-3 text-2xl font-black text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">

            ONLINE

          </h2>

        </div>

      </div>

    </aside>

  );

}

