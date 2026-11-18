"""Generate a blank, policy-bound paper companion; never edit the supplied PDF."""
import hashlib
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
policy = json.loads((ROOT / "docs/registration-policy-draft-2026-11-11.json").read_text(encoding="utf-8"))
assert policy["status"] == "implementation-draft" and not policy["publicIntakeEnabled"]
canonical = json.dumps(policy, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
PRINTED_FIELDS = ["childName", "birthYear", "team", "position", "experience", "guardianName", "guardianPhone", "guardianEmail",
                  "emergencyName", "emergencyPhone", "pickupPersons", "bookingType", "healthNotes", "guardianAuthority"]
assert PRINTED_FIELDS == [field["name"] for field in policy["fields"]], "Update/review the printed field layout for the changed policy"
destination = ROOT / "output/pdf/PK-Hockey-Academy-Trainingsanfrage-v1.pdf"
destination.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(destination), pagesize=A4, invariant=1, pageCompression=1)
pdf.setTitle("PK Hockey Academy - Trainingsanfrage - Vorabfassung")
pdf.setAuthor("PK Hockey Academy")
pdf.setSubject(policy["version"] + " - keine Freigabe echter Daten")
ink, blue = HexColor("#101D2E"), HexColor("#0754DB")
left, width, y = 43, A4[0] - 86, 0


def paragraph(text, size=9.5, leading=13, indent=0):
    global y
    style = ParagraphStyle("body", fontName="Helvetica", fontSize=size, leading=leading, textColor=ink)
    block = Paragraph(escape(text), style)
    _, height = block.wrap(width - indent, 800)
    assert y - height >= 55, "Content exceeds the print area"
    block.drawOn(pdf, left + indent, y - height)
    y -= height + 7


def section(title):
    global y
    y -= 7
    pdf.setFillColor(blue)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(left, y - 12, title)
    y -= 27


def fields(labels, space=41):
    global y
    cell = width / len(labels)
    pdf.setFillColor(ink)
    for index, label in enumerate(labels):
        x = left + index * cell
        pdf.setFont("Helvetica", 8.5)
        pdf.drawString(x, y - 10, label)
        pdf.setStrokeColor(HexColor("#7D91A7"))
        pdf.setLineWidth(0.5)
        pdf.line(x, y - space + 10, x + cell - (14 if index < len(labels) - 1 else 0), y - space + 10)
    y -= space


def checkbox(text, size=9.3):
    pdf.setStrokeColor(ink)
    pdf.setLineWidth(0.7)
    pdf.rect(left, y - 11, 8, 8, fill=0)
    paragraph(text, size=size, leading=12.5, indent=16)


def header(page, subtitle):
    global y
    pdf.setFillColor(blue)
    pdf.rect(0, A4[1] - 9, A4[0], 9, fill=1, stroke=0)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawString(left, A4[1] - 44, "PK HOCKEY ACADEMY")
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(left, A4[1] - 64, subtitle)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.setFillColor(HexColor("#9B1616"))
    pdf.drawString(left, A4[1] - 83, "VORABFASSUNG - NOCH KEINE ABGABE ECHTER DATEN")
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(left, 33, policy["version"])
    pdf.drawRightString(A4[0] - left, 33, f"Seite {page} von 2")
    y = A4[1] - 100


header(1, "Trainingsanfrage | Kind, Hauptkontakt und Training")
paragraph("Druckvorlage zum handschriftlichen Ausfüllen. Mit * markierte Angaben sind erforderlich. Eine Anfrage reserviert keinen Platz; Pierre bestätigt jede Buchung persönlich.")
section("1. Training wählen")
paragraph("Bitte genau eine Anfrageart wählen *.", 9, 12)
checkbox("Einzeltermin - 50 EUR (nur einen veröffentlichten, anfragbaren Termin wählen)")
checkbox("5er-Paket - 200 EUR (Termine stimmt Pierre persönlich mit dir ab)")
fields(["Bei Einzeltermin: bestätigter Termin / Ort oder Termin-ID *"])
paragraph("Jede Einheit umfasst 60 Minuten On-Ice und 60 Minuten Off-Ice. Hier erfolgt keine Zahlung.")
section("2. Kind und Hauptkontakt")
fields(["Vor- und Nachname des Kindes *", "Vierstelliger Jahrgang *"])
fields(["Verein / Mannschaft (optional)", "Position: Feldspieler / Torwart (optional)"])
fields(["Erfahrungsstand (optional; Gesundheitsangaben nur auf Seite 2)"], 51)
fields(["Dein Vor- und Nachname *"])
fields(["Deine Telefonnummer *", "Deine E-Mail-Adresse *"])
section("3. Weitere Betreuungskontakte (freiwillig)")
fields(["Zusätzlicher Notfallkontakt: Name", "Dessen Telefonnummer"])
paragraph("Einen zusätzlichen Namen und die Telefonnummer gemeinsam angeben. Sonst nutzen wir den Hauptkontakt.", 8.7, 12)
fields(["Abholberechtigte Personen (optional)"])
section("4. Berechtigung und weitere Hinweise")
checkbox(policy["copy"]["guardianAuthority"] + " *")
paragraph("Keine Kinderanschrift, kein zweiter vollständiger Elternkontakt und keine pauschale Haftungs-, Versicherungs- oder Zahlungsbestätigung für diese erste Anfrage.", 8.7, 12)
paragraph("Die Papierabgabe ist noch nicht freigegeben. Sicheren Übergabeweg vorab persönlich mit der Academy klären. Keine ausgefüllten Formulare oder Gesundheitsangaben per gewöhnlicher E-Mail senden.", 8.7, 12)
pdf.showPage()

header(2, "Trainingsanfrage | Freiwillige Angaben und Einwilligungen")
fields(["Name des Kindes (wie auf Seite 1)", "Name des Hauptkontakts (wie auf Seite 1)"], 36)
section("5. Freiwillige Gesundheitshinweise")
paragraph(policy["copy"]["healthHint"], 9, 12.5)
checkbox(policy["consents"][0]["text"])
fields(["Betreuungsrelevante Hinweise (optional; nur mit obiger Einwilligung)"], 73)
section("6. Freiwillige Medienfreigaben")
paragraph("Jede Auswahl ist unabhängig und freiwillig. Keine Auswahl bedeutet keine Erlaubnis. Die Teilnahme hängt davon nicht ab.", 9, 12.5)
for title, consent in zip(["Academy-Website", "Gedruckte Informationsmaterialien", "Interne Videoanalyse"], policy["consents"][1:]):
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(left, y - 9, title)
    y -= 17
    checkbox(consent["text"])
paragraph("Datenschutzhinweise: https://pkhockeyacademy.de/datenschutz", 8.5, 11)
paragraph("Bitte beide Seiten zusammenhalten. Die technische oder persönliche Entgegennahme dieser Anfrage ist noch keine Bestätigung eines Trainingsplatzes.", 8.5, 11)
pdf.save()

# Verify actual PDF text, page geometry, and absence of interactive/script content.
reader = PdfReader(destination)
assert len(reader.pages) == 2
text = "\n".join(page.extract_text() for page in reader.pages)
normalized = lambda value: re.sub(r"\s+", "", value)
for consent in policy["consents"]:
    assert normalized(consent["text"]) in normalized(text), "Printed consent differs from policy"
assert normalized(policy["copy"]["guardianAuthority"]) in normalized(text)
assert normalized(policy["copy"]["healthHint"]) in normalized(text)
for page in reader.pages:
    assert abs(float(page.mediabox.width) - A4[0]) < 1
    assert abs(float(page.mediabox.height) - A4[1]) < 1
    assert not page.get("/Annots")
assert not reader.get_fields() and not reader.trailer["/Root"].get("/OpenAction")
data = destination.read_bytes()
manifest = {"version": 1, "policyVersion": policy["version"], "policySha256": hashlib.sha256(canonical).hexdigest(),
            "filename": destination.name, "pages": 2, "sizeBytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
            "fields": PRINTED_FIELDS, "consentPurposes": [item["purpose"] for item in policy["consents"]],
            "draft": True, "fillable": False}
(ROOT / "shared/registration-print-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"generated": True, "pages": 2, "consentTextsVerified": 4, "draft": True, "destination": "output/pdf/" + destination.name}))
