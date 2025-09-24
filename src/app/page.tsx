import HomeClient from "./HomeClient";
import { getLibraryModules } from "@/lib/supabase";

export default async function HomePage() {
  const modules = await getLibraryModules();

  return <HomeClient initialModules={modules} />;
}
