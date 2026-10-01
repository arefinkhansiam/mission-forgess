import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../components/game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Mission Forge | Playable 3D Space Mission Game" },
    { name: "description", content: "Build a spacecraft, launch on SLS, fly through a live NASA-data solar system, survive failures, rescue and land." },
    { property: "og:title", content: "Mission Forge — Design. Explore. Decide. Survive." },
    { property: "og:description", content: "A playable 3D space mission engineering game driven by NASA data." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Game,
});
