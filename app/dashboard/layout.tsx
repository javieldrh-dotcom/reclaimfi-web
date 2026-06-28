import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RealtimeInitializer from "@/app/components/RealtimeInitializer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  return (
    <>
      <RealtimeInitializer />
      {children}
    </>
  );
}

