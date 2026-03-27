import { BuilderApp } from "@/components/color-builder/builder-app";
import { listPublicPalettes } from "@/lib/color-builder/repository";

export default async function HomePage() {
  const featuredPalettes = await listPublicPalettes(6);

  return <BuilderApp featuredPalettes={featuredPalettes} />;
}
