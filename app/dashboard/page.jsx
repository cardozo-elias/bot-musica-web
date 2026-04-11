import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  // Verificamos quién acaba de iniciar sesión
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Lo enviamos instantáneamente a su Dashboard personal
  redirect(`/dashboard/${session.user.id}`);
}