import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./search";
export const Route = createFileRoute("/terms")({ component: () => <ComingSoon title="Terms of service" /> });
