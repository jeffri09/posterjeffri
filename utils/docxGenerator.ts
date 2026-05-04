import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
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
          size: 32, // 16pt (half-points)
          font: "Calibri",
        }),
      ],
    })
  );

  // Content Paragraphs
  for (const p of content.paragraphs) {
    const isArabic = p.type === 'arabic';
    
    // Determine alignment
    let alignment: any = AlignmentType.JUSTIFIED;
    if (p.align === 'center') alignment = AlignmentType.CENTER;
    if (p.align === 'right' || isArabic) alignment = AlignmentType.RIGHT;
    if (p.align === 'left') alignment = AlignmentType.LEFT;

    paragraphs.push(
      new Paragraph({
        alignment: alignment,
        spacing: { after: 200, line: 240 }, // Line spacing 1.0 is ~240 twips
        bidirectional: isArabic,
        children: [
          new TextRun({
            text: p.text,
            bold: p.bold || false,
            size: isArabic ? 32 : 22, // 16pt for Arabic, 11pt for Latin
            font: isArabic ? "Traditional Arabic" : "Calibri",
            rightToLeft: isArabic,
          }),
        ],
      })
    );
  }

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
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeTitle = content.title.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim();
  saveAs(blob, `Artikel_${safeTitle || 'Dakwah'}.docx`);
};
