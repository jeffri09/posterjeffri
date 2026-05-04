import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, HeadingLevel, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ArticleContent } from "../services/articleService";

const MM_TO_TWIP = 56.6929;

export const generateAndDownloadDocx = async (content: ArticleContent) => {
  const paragraphs = [];

  // Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 240 },
      children: [
        new TextRun({
          text: content.title,
          bold: true,
          size: 28, // 14pt
          font: "Calibri",
        }),
      ],
    })
  );

  // Separator setelah judul
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" } },
      children: [],
    })
  );

  // Content Paragraphs
  let prevWasArabic = false;
  for (const p of content.paragraphs) {
    const isArabic = p.type === 'arabic';
    const isBabTitle = p.bold && p.align === 'center' && p.type === 'latin';
    
    // Determine alignment
    let alignment: any = AlignmentType.JUSTIFIED;
    if (p.align === 'center') alignment = AlignmentType.CENTER;
    if (p.align === 'right' || isArabic) alignment = AlignmentType.RIGHT;
    if (p.align === 'left') alignment = AlignmentType.LEFT;

    // Spacing ekstra sebelum judul bab dan setelah teks Arab
    const spacingBefore = isBabTitle ? 400 : (prevWasArabic && !isArabic ? 100 : 0);
    const spacingAfter = isBabTitle ? 200 : (isArabic ? 100 : 200);

    paragraphs.push(
      new Paragraph({
        heading: isBabTitle ? HeadingLevel.HEADING_2 : undefined,
        alignment: alignment,
        spacing: { before: spacingBefore, after: spacingAfter, line: 240 }, // Line spacing 1.0
        bidirectional: isArabic,
        children: [
          new TextRun({
            text: p.text,
            bold: p.bold || false,
            size: isArabic ? 32 : (isBabTitle ? 24 : 22), // 16pt Arab, 12pt judul bab, 11pt normal
            font: isArabic ? "Traditional Arabic" : "Calibri",
            rightToLeft: isArabic,
          }),
        ],
      })
    );

    prevWasArabic = isArabic;
  }

  // Footer dengan nomor halaman
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Calibri", color: "888888" }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round(215 * MM_TO_TWIP), // F4 width: 215mm
              height: Math.round(330 * MM_TO_TWIP), // F4 height: 330mm
            },
            margin: {
              top: Math.round(20 * MM_TO_TWIP),    // 2cm
              right: Math.round(20 * MM_TO_TWIP),  // 2cm
              bottom: Math.round(20 * MM_TO_TWIP), // 2cm
              left: Math.round(20 * MM_TO_TWIP),   // 2cm
            },
          },
        },
        footers: { default: footer },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeTitle = content.title.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim();
  saveAs(blob, `Artikel_${safeTitle || 'Dakwah'}.docx`);
};
