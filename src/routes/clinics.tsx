import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/clinics")({
  beforeLoad: () => { throw redirect({ to: "/search" }); },
  component: () => null,
});
