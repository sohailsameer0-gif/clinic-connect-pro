import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./search";
export const Route = createFileRoute("/clinics")({ component: () => <ComingSoon title="Browse clinics" /> });
