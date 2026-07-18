import DataIngestion from "@/app/components/DataIngestion";
import NeuralBackground from "@/app/components/NeuralBackground";

export default function IngestionPage() {
  return (
    <div className="min-h-screen bg-black p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />
      <div className="relative z-10">
      <DataIngestion />
      </div>
    </div>
  );
}