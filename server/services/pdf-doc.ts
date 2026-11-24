/** Small helper over pdf-lib for text documents: headings, paragraphs, lists, page breaks. */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export class PdfDoc {
  private pdf!: PDFDocument;
  private page!: PDFPage;
  private font!: PDFFont;
  private bold!: PDFFont;
  private y = 0;
  private readonly margin = 56;
  private readonly width = 612;
  private readonly height = 792;

  static async create(): Promise<PdfDoc> {
    const doc = new PdfDoc();
    doc.pdf = await PDFDocument.create();
    doc.font = await doc.pdf.embedFont(StandardFonts.Helvetica);
    doc.bold = await doc.pdf.embedFont(StandardFonts.HelveticaBold);
    doc.newPage();
    return doc;
  }

  newPage() {
    this.page = this.pdf.addPage([this.width, this.height]);
    this.y = this.height - this.margin;
  }

  private ensure(space: number) {
    if (this.y - space < this.margin) this.newPage();
  }

  /** The built-in fonts use WinAnsi; swap the few symbols we use that it cannot encode. */
  private sanitize(text: string): string {
    return text
      .replace(/→/g, "->")
      .replace(/←/g, "<-")
      .replace(/…/g, "...")
      .replace(/✓|✔/g, "[x]")
      .replace(/[\u2010-\u2012]/g, "-")
      .replace(/[^\x00-\x7F\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g, "?");
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of this.sanitize(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(" ")) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(content: string, options: { size?: number; bold?: boolean; indent?: number; gap?: number; color?: [number, number, number] } = {}) {
    const size = options.size ?? 10.5;
    const font = options.bold ? this.bold : this.font;
    const indent = options.indent ?? 0;
    const lines = this.wrap(content, font, size, this.width - this.margin * 2 - indent);
    for (const line of lines) {
      this.ensure(size * 1.5);
      this.page.drawText(line, { x: this.margin + indent, y: this.y, size, font, color: rgb(...(options.color ?? [0, 0, 0])) });
      this.y -= size * 1.45;
    }
    this.y -= options.gap ?? 5;
  }

  heading(content: string, level: 1 | 2 | 3 = 1) {
    const size = level === 1 ? 18 : level === 2 ? 13 : 11;
    this.ensure(size * 3);
    this.y -= level === 1 ? 4 : 2;
    this.text(content, { size, bold: true, gap: level === 1 ? 8 : 4 });
  }

  bullets(items: string[], options: { numbered?: boolean; checkbox?: boolean } = {}) {
    items.forEach((item, index) => {
      const marker = options.checkbox ? "[ ]" : options.numbered ? `${index + 1}.` : "•";
      const size = 10.5;
      const lines = this.wrap(item, this.font, size, this.width - this.margin * 2 - 22);
      lines.forEach((line, i) => {
        this.ensure(size * 1.5);
        if (i === 0) this.page.drawText(marker, { x: this.margin, y: this.y, size, font: this.font });
        this.page.drawText(line, { x: this.margin + 22, y: this.y, size, font: this.font });
        this.y -= size * 1.45;
      });
      this.y -= 2;
    });
    this.y -= 4;
  }

  keyValue(rows: [string, string][]) {
    for (const [key, value] of rows) {
      this.ensure(16);
      this.page.drawText(`${this.sanitize(key)}:`, { x: this.margin, y: this.y, size: 10.5, font: this.bold });
      const lines = this.wrap(value, this.font, 10.5, this.width - this.margin * 2 - 150);
      lines.forEach((line, i) => {
        if (i > 0) { this.ensure(16); }
        this.page.drawText(line, { x: this.margin + 150, y: this.y, size: 10.5, font: this.font });
        this.y -= 15;
      });
    }
    this.y -= 6;
  }

  rule() {
    this.ensure(12);
    this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.width - this.margin, y: this.y }, thickness: 0.6, color: rgb(0.4, 0.4, 0.4) });
    this.y -= 12;
  }

  async save(): Promise<Buffer> {
    return Buffer.from(await this.pdf.save());
  }
}
