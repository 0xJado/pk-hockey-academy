import type { UserViewComponent } from "sanity/structure";
import { useDataset, useProjectId } from "sanity";
import {
  asRecord,
  parseTrainerFields,
  validateTrainerPublication,
} from "../../shared/trainer-profile.ts";
import { previewPortraitUrl } from "../lib/trainer-preview";
import "./editorial.css";

export const TrainerPreview: UserViewComponent = ({ document }) => {
  const projectId = useProjectId();
  const dataset = useDataset();
  return (
    <TrainerPreviewContent
      raw={document.displayed}
      projectId={projectId}
      dataset={dataset}
    />
  );
};

export function TrainerPreviewContent({
  raw,
  projectId,
  dataset,
}: {
  raw: Record<string, unknown>;
  projectId: string;
  dataset: string;
}) {
  const profile = parseTrainerFields(raw);
  const portrait = asRecord(raw.portrait);
  const image = previewPortraitUrl(raw.portrait, projectId, dataset);
  const validation = validateTrainerPublication(raw);
  return (
    <div className="pk-editorial">
      <aside className="pk-editorial-notice">
        <strong>Private Studio-Vorschau</strong>
        <p>
          Diese Ansicht zeigt den aktuellen Bearbeitungsstand ausschließlich im
          angemeldeten Studio. Sie veröffentlicht nichts und ist keine
          Live-Website-Vorschau.
        </p>
        <p>
          {raw.visibility === "public" &&
          raw.contentApproved === true &&
          raw.active === true
            ? "Website-Freigabe gewählt. Erst Veröffentlichung und erfolgreicher Website-Build aktualisieren die Website."
            : "Dieses Profil ist für die Website zurückgehalten oder inaktiv."}
        </p>
      </aside>
      {!profile ? (
        <p role="status">
          Die Profilvorschau erscheint nach dem Ergänzen der Pflichtfelder.{" "}
          {validation !== true ? validation : ""}
        </p>
      ) : (
        <article className="pk-coach-preview">
          {image ? (
            <figure>
              <img
                src={image}
                alt={
                  typeof portrait.alt === "string"
                    ? portrait.alt
                    : "Trainerfoto in Bearbeitung"
                }
              />
              <figcaption>
                {typeof portrait.credit === "string"
                  ? portrait.credit
                  : "Bildnachweis ergänzen"}
              </figcaption>
            </figure>
          ) : (
            <div className="pk-preview-placeholder">
              Academy-Wappen auf der Website · Trainerfoto folgt
            </div>
          )}
          <div>
            <p className="pk-editorial-eyebrow">UNSER TRAINERPOOL</p>
            <h2>{profile.name}</h2>
            <p>{profile.role} · PK Hockey Academy</p>
            {profile.biography
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            {(
              [
                ["Hintergrund", profile.verifiedBackground],
                ["Bestätigte Qualifikationen", profile.qualifications],
                ["Trainingsschwerpunkte", profile.specialties],
              ] as const
            )
              .filter(([, items]) => items.length)
              .map(([title, items]) => (
                <section key={title}>
                  <h3>{title}</h3>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </article>
      )}
      {validation !== true && profile && <p role="status">{validation}</p>}
    </div>
  );
}
