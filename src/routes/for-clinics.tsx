import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./search";
export const Route = createFileRoute("/for-clinics")({ component: () => <ComingSoon title="For clinics" /> });
