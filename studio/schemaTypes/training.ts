import { defineField, defineType } from "sanity";
import { validateSession, validateVenue } from "../../shared/training.ts";
const publication = [
  defineField({
    name: "visibility",
    title: "Website-Sichtbarkeit",
    type: "string",
    options: {
      list: [
        { title: "Zurückhalten", value: "hidden" },
        { title: "Auf der Website zeigen", value: "public" },
      ],
    },
    validation: (r) => r.required(),
  }),
  defineField({
    name: "contentApproved",
    title: "Angaben geprüft und freigegeben",
    type: "boolean",
    validation: (r) =>
      r.custom((value, context) =>
        context.document?.visibility === "public" && value !== true
          ? "Freigabe vor Veröffentlichung erforderlich."
          : true,
      ),
  }),
];
const field = (name: string, title: string, type = "string") =>
  defineField({ name, title, type });
export const venue = defineType({
  name: "venue",
  title: "Trainingsstätte",
  type: "document",
  initialValue: {
    status: "planned_city",
    visibility: "hidden",
    contentApproved: false,
  },
  fields: [
    field("city", "Stadt"),
    field("rinkName", "Bestätigte Eishalle (optional)"),
    field("address", "Bestätigte Adresse (optional)"),
    field("details", "Beschreibung", "text"),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Aktive Trainingsstadt", value: "active_city" },
          { title: "In Planung", value: "planned_city" },
        ],
      },
    }),
    ...publication,
  ],
  validation: (r) =>
    r.custom((v) =>
      v ? validateVenue(v as unknown as Record<string, unknown>) : true,
    ),
});
export const trainingSession = defineType({
  name: "trainingSession",
  title: "Trainingstermin",
  type: "document",
  initialValue: {
    status: "draft",
    isDemo: false,
    visibility: "hidden",
    contentApproved: false,
  },
  fields: [
    field("title", "Titel"),
    field("startAt", "Beginn", "datetime"),
    field("endAt", "Ende", "datetime"),
    field("group", "Alters-/Leistungsgruppe"),
    defineField({
      name: "venue",
      title: "Trainingsstätte",
      type: "reference",
      to: [{ type: "venue" }],
      options: {
        filter:
          'status == "active_city" && visibility == "public" && contentApproved == true',
      },
      validation: (r) =>
        r.custom(async (value, context) => {
          if (context.document?.visibility !== "public") return true;
          const ref = value as { _ref?: string } | undefined;
          if (!ref?._ref || /^(drafts|versions)\./.test(ref._ref))
            return "Freigegebene Trainingsstätte erforderlich.";
          try {
            const valid = await context
              .getClient({ apiVersion: "2026-10-01" })
              .fetch(
                'count(*[_id == $id && _type == "venue" && status == "active_city" && visibility == "public" && contentApproved == true])',
                { id: ref._ref },
              );
            return valid === 1
              ? true
              : "Freigegebene aktive Trainingsstätte erforderlich.";
          } catch {
            return "Trainingsstätte konnte nicht geprüft werden.";
          }
        }),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Veröffentlicht", value: "open" },
          { title: "Ausgebucht", value: "full" },
          { title: "Abgesagt", value: "cancelled" },
          { title: "Entwurf", value: "draft" },
        ],
      },
    }),
    field("availableSpots", "Freie Plätze (leer = unbekannt)", "number"),
    field("isDemo", "Beispieltermin", "boolean"),
    ...publication,
  ],
  validation: (r) =>
    r.custom((v) =>
      v ? validateSession(v as unknown as Record<string, unknown>) : true,
    ),
});
