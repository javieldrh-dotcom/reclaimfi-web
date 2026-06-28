"use client";

export default function CommandCenter({
  cases = [],
}: {
  cases?: any[];
}) {
  return (
    <div>

      <h1 className="text-5xl font-black text-cyan-300">
        COMMAND CENTER
      </h1>

      <p className="mt-4 text-gray-400">
        Advanced forensic intelligence ecosystem
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        {/* ACTIVE CASES */}
        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-8 backdrop-blur-md">

          <p className="text-xs tracking-[0.3em] text-cyan-400">
            ACTIVE CASES
          </p>

          <h2 className="mt-4 text-5xl font-black">
            {cases?.length || 0}
          </h2>

        </div>

        {/* STATUS */}
        <div className="rounded-xl border border-red-500/20 bg-black/40 p-8 backdrop-blur-md">

          <p className="text-xs tracking-[0.3em] text-red-400">
            STATUS
          </p>

          <h2 className="mt-4 text-5xl font-black text-red-400">
            HIGH RISK
          </h2>

        </div>

        {/* TRACKED WALLETS */}
        <div className="rounded-xl border border-green-500/20 bg-black/40 p-8 backdrop-blur-md">

          <p className="text-xs tracking-[0.3em] text-green-400">
            TRACKED WALLETS
          </p>

          <h2 className="mt-4 text-5xl font-black text-green-400">
            182
          </h2>

        </div>

      </div>

    </div>
  );
}

