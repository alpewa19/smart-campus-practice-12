"""Builds report/Practice12_Alpenov_Ruslan_Report.pdf from report/Practice12_Report.md via headless Chrome."""
import os, re, subprocess
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / "report"
md = (REPORT / "Practice12_Report.md").read_text(encoding="utf-8")
# STUDENT_ID=... builds the emailed copy with the student ID; the public repository copy has no ID.
STUDENT_ID = os.environ.get("STUDENT_ID", "").strip()
if STUDENT_ID:
    md = md.replace("**Student:** Ruslan Alpenov ·", f"**Student:** Ruslan Alpenov · **ID:** {STUDENT_ID} ·", 1)

# Appendix A: screenshots of every test case, both versions.
cases = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "S1", "S2", "S3", "S4"]
rows = "\n".join(f"| {c} | ![](../evidence/screenshots/code/code-{c}.png) | ![](../evidence/screenshots/lowcode/lowcode-{c}.png) |" for c in cases)
md += ("\n\n## Appendix A. Screenshots of every test case (final run)\n\n"
       "T8 is checked by comparing the bookings list before and after T1–T7, so it has no separate screenshot.\n\n"
       "| Case | Code-based | Low-code |\n|---|---|---|\n" + rows + "\n")
md += ("\n\n## Appendix B. Security runtime checks\n\n"
       "| Client B after client A's check, before fix D1 | Stale result after editing a field (D3, open) |\n|---|---|\n"
       "| ![](../evidence/screenshots/lowcode/dast-before-fix-clientB.png) | ![](../evidence/screenshots/lowcode/stale-result-after-edit.png) |\n")
prompt = (ROOT / "evidence" / "ai" / "01-review-prompt.md").read_text(encoding="utf-8")
raw = (ROOT / "evidence" / "ai" / "02-review-output.md").read_text(encoding="utf-8")
demote = lambda t, n: re.sub(r"^(#+) ", lambda m: "#" * min(len(m.group(1)) + n, 6) + " ", t, flags=re.M)
md += "\n\n## Appendix C. Review prompt (verbatim)\n\n" + demote(prompt.split("\n", 1)[1], 2)
md += "\n\n## Appendix D. Raw AI review output (verbatim)\n\n" + demote(raw.split("---", 1)[1].strip(), 2) + "\n"

body = markdown.markdown(md, extensions=["tables", "fenced_code", "sane_lists"])
body = body.replace("<h1>", '<h1 class="title">', 1)
body = re.sub(r'(<h2>Appendix A\..*?<table>)', r'\1<colgroup><col style="width:6%"><col style="width:47%"><col style="width:47%"></colgroup>', body, count=1, flags=re.S)

css = """
@page { size: A4; margin: 15mm 14mm 15mm 14mm; }
body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 9.6pt; line-height: 1.42; color: #1a1a1a; }
h1.title { font-size: 19pt; margin: 0 0 3mm; }
h2 { font-size: 13pt; margin: 7mm 0 2.5mm; border-bottom: 1.5px solid #333; padding-bottom: 1mm; break-after: avoid; }
h3 { font-size: 11pt; margin: 5mm 0 2mm; break-after: avoid; }
h4, h5, h6 { font-size: 10pt; margin: 4mm 0 1.5mm; break-after: avoid; }
p { margin: 1.6mm 0; }
ul, ol { margin: 1.5mm 0; padding-left: 6mm; }
table { border-collapse: collapse; width: 100%; margin: 2.5mm 0 3.5mm; font-size: 8.3pt; }
tr { break-inside: avoid; }
th, td { border: 1px solid #b9b9b9; padding: 1.2mm 1.6mm; vertical-align: top; text-align: left; }
th { background: #ececec; }
code { font-family: Menlo, monospace; font-size: 8.2pt; background: #f2f2f2; padding: 0 .6mm; border-radius: 1mm; }
pre { background: #f5f5f5; border: 1px solid #ddd; padding: 2.5mm; font-size: 7.8pt; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
pre code { background: none; padding: 0; }
img { max-width: 100%; border: 1px solid #ccc; }
td img { display: block; max-height: 105mm; width: auto; max-width: 100%; margin: auto; }
p > img { display: block; max-height: 120mm; margin: 2mm auto; }
"""
html = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Practice Work 12 — Alpenov Ruslan</title><style>{css}</style></head><body>{body}</body></html>'
out_html = REPORT / "Practice12_Report.html"
out_html.write_text(html, encoding="utf-8")
pdf = (ROOT / "submission" / f"Practice12_Alpenov_Ruslan_{STUDENT_ID}_Report.pdf") if STUDENT_ID else (REPORT / "Practice12_Alpenov_Ruslan_Report.pdf")
pdf.parent.mkdir(exist_ok=True)
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu",
                "--no-pdf-header-footer", f"--print-to-pdf={pdf}", out_html.as_uri()], check=True, capture_output=True)
print(pdf)
