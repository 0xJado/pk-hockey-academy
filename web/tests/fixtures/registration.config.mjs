// Explicit test-only config. Normal build/dev config never injects this route.
import base from "../../astro.config.mjs";
export default {
  ...base,
  integrations: [...base.integrations, {name:"fictional-registration-only",hooks:{"astro:config:setup":({injectRoute})=>{
    injectRoute({pattern:"/__registration-fixture",entrypoint:"./tests/fixtures/registration-form.astro",prerender:true});
  }}}],
};
