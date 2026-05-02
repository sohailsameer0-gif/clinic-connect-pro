import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./search";
export const Route = createFileRoute("/contact")({ component: () => <ComingSoon title="Contact us" /> });
