import type { APIRoute } from "astro";
import { inactiveRegistration } from "../../lib/registration/processor.ts";
export const prerender = false;
// Deliberately unconditional: no request body is read, even if someone posts directly.
export const ALL: APIRoute = () => inactiveRegistration();
