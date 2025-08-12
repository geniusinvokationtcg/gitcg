import { redirect } from "next/navigation";

export default async function NotFound ({ params }: { params?: { locale?: string } }) {
  redirect("/not-found")
}