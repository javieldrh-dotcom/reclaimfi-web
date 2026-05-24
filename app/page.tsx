export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-cyan-400">
          ReclaimFi
        </h1>

        <button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2 rounded-xl transition">
          Connect Wallet
        </button>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-32 relative">

        <div className="absolute w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full top-32"></div>

        <h2 className="text-7xl font-extrabold mb-8 relative z-10">
          Recover Lost{" "}
          <span className="text-cyan-400">Crypto Assets</span>
        </h2>

        <p className="text-xl text-gray-400 max-w-3xl mb-10 relative z-10">
          Discover forgotten rewards, staking balances, bridge assets,
          unclaimed airdrops, and hidden DeFi positions across multiple blockchains.
        </p>

        <div className="flex gap-4 relative z-10">
          <button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-2xl transition">
            Start Scanning
          </button>

          <button className="border border-white/20 hover:border-cyan-400 px-8 py-4 rounded-2xl transition">
            Learn More
          </button>
        </div>

      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-cyan-400">
            Multi-Chain
          </h3>
          <p className="text-gray-400">
            Scan Ethereum, Arbitrum, Polygon, Solana, and more.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-cyan-400">
            Secure
          </h3>
          <p className="text-gray-400">
            No seed phrases. No private keys. Wallet-safe architecture.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-cyan-400">
            Automated Recovery
          </h3>
          <p className="text-gray-400">
            Smart contracts automate claims and fee distribution.
          </p>
        </div>

      </section>

    </main>
  );
}