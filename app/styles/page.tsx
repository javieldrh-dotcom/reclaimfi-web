"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simula tiempo de carga / animación de splash
    const timer = setTimeout(() => {
      setLoading(false);
     router.push("/dashboard");// Redirige al dashboard
    }, 3000); // 3 segundos de splash
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="w-screen h-screen bg-black flex items-center justify-center relative">
      {loading && (
        <>
          <Image
            src="/network-neural.png" // coloca aquí tu imagen de red neuronal en public/
            alt="Neural Network"
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute text-white text-4xl font-bold z-20 text-center">
            <p>Audit Global Intelligence</p>
            <p className="text-lg mt-2 text-gray-300">Forensic AI Platform</p>
          </div>
        </>
      )}
    </main>
  );
}

