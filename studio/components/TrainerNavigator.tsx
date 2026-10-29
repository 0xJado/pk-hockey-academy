import { IntentLink } from "sanity/router";
import "./editorial.css";

export function TrainerNavigator() {
  return (
    <div className="pk-editorial">
      <h2>Trainerpool</h2>
      <p>
        Profiltext oder Foto in der Website-Vorschau anklicken. Rechts öffnet
        sich das passende Feld.
      </p>
      <p>
        <IntentLink intent="create" params={{ type: "trainer" }}>
          Trainer hinzufügen ↗
        </IntentLink>
      </p>
      <p>
        Neue Profile starten als zurückgehaltener Entwurf. Name, Rolle,
        Biografie und bestätigten Hintergrund ergänzen; danach die
        Website-Vorschau am Dokument öffnen.
      </p>
      <p>
        „Veröffentlichen“ aktualisiert die öffentliche Website nach dem
        erfolgreichen Build. Die Vorschau allein veröffentlicht nichts.
      </p>
    </div>
  );
}
