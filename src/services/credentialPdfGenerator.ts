import { jsPDF } from 'jspdf';
import { TechnicianRecord } from '../types/dms';
import {
  ORACLIME_CROPPED_LOGO_DATA_URL,
  ORACLIME_DARK_HEADER_LOGO_DATA_URL,
  ORACLIME_LOGO_ASPECT_RATIO,
  ORACLIME_OWNER_SIGNATURE_DATA_URL,
  ORACLIME_OWNER_SIGNATURE_ASPECT_RATIO,
} from '../assets/oraclimeOfficialLogo';

export class CredentialPdfGenerator {
  /**
   * Embeds the supplied official transparent OraClime PNG logo
   * preserving exact original aspect ratio (object-fit: contain equivalent) without a white background box.
   */
  private static drawOfficialOraclimeLogo(
    doc: jsPDF,
    x: number,
    y: number,
    logoHeightMm: number,
    options?: {
      align?: 'left' | 'center';
      padX?: number;
      padY?: number;
      surface?: 'dark' | 'light';
    }
  ): { boxW: number; boxH: number } {
    const padX = options?.padX ?? 0;
    const padY = options?.padY ?? 0;
    const surface = options?.surface ?? 'dark';
    const logoWidthMm = logoHeightMm * ORACLIME_LOGO_ASPECT_RATIO;
    const boxW = logoWidthMm + padX * 2;
    const boxH = logoHeightMm + padY * 2;
    const startX = options?.align === 'center' ? x - boxW / 2 : x;

    const logoDataUrl =
      surface === 'light' ? ORACLIME_CROPPED_LOGO_DATA_URL : ORACLIME_DARK_HEADER_LOGO_DATA_URL;

    doc.addImage(
      logoDataUrl,
      'PNG',
      startX + padX,
      y + padY,
      logoWidthMm,
      logoHeightMm,
      undefined,
      'FAST'
    );

    return { boxW, boxH };
  }

  /**
   * Embeds the reusable Official OraClime Owner Digital Signature with preserved proportions
   * and transparent background, centered horizontally at centerX with its bottom edge at bottomY.
   */
  public static drawOfficialOwnerSignature(
    doc: jsPDF,
    centerX: number,
    bottomY: number,
    maxHeightMm: number,
    maxWidthMm?: number
  ): { sigW: number; sigH: number } {
    let sigH = maxHeightMm;
    let sigW = sigH * ORACLIME_OWNER_SIGNATURE_ASPECT_RATIO;
    if (maxWidthMm && sigW > maxWidthMm) {
      sigW = maxWidthMm;
      sigH = sigW / ORACLIME_OWNER_SIGNATURE_ASPECT_RATIO;
    }
    const startX = centerX - sigW / 2;
    const startY = bottomY - sigH;

    doc.addImage(
      ORACLIME_OWNER_SIGNATURE_DATA_URL,
      'PNG',
      startX,
      startY,
      sigW,
      sigH,
      undefined,
      'FAST'
    );

    return { sigW, sigH };
  }

  /**
   * Draws precision crop marks around a rectangle for exact CR80 cutting/printing
   */
  private static drawCropMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
    const offset = 2;
    const len = 4;
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.2);

    // Top-left
    doc.line(x - offset - len, y, x - offset, y);
    doc.line(x, y - offset - len, x, y - offset);
    // Top-right
    doc.line(x + w + offset, y, x + w + offset + len, y);
    doc.line(x + w, y - offset - len, x + w, y - offset);
    // Bottom-left
    doc.line(x - offset - len, y + h, x - offset, y + h);
    doc.line(x, y + h + offset, x, y + h + offset + len);
    // Bottom-right
    doc.line(x + w + offset, y + h, x + w + offset + len, y + h);
    doc.line(x + w, y + h + offset, x + w, y + h + offset + len);
  }

  /**
   * Generates a printable double-sided Technician Identity Card PDF at exact CR80 scale (85.6 x 54 mm)
   * Confidential Application / Registration Number is strictly excluded from all card surfaces and metadata.
   */
  public static generateTechnicianIdCardPdf(tech: TechnicianRecord): {
    doc: jsPDF;
    dataUrl: string;
    filename: string;
  } {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    const cardW = 85.6; // Standard ISO/IEC 7810 ID-1 (CR80) width in mm
    const cardH = 54.0; // Standard ISO/IEC 7810 ID-1 (CR80) height in mm

    const techId = tech.technicianId || 'OR-TECH-PENDING';
    const fullName = (tech.fullName || 'Unnamed Technician').toUpperCase();
    const trade = tech.specialization || tech.category || 'AC Installation & Repair';
    const district = tech.district || 'General Service Area';
    const isVerified = tech.status === 'verified';
    const statusLabel = isVerified
      ? 'VERIFIED TECHNICIAN'
      : tech.status === 'flagged_handwritten'
      ? 'FLAGGED FOR REVIEW'
      : tech.status === 'rejected'
      ? 'NOT AUTHORIZED'
      : 'PENDING VERIFICATION';

    // Reference code derived strictly from public Technician ID and district (never applicationNumber)
    const distCode = district
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const verificationRefCode = `ORAC-VRF-${techId}-${distCode}`;

    // =========================================================================
    // SHEET HEADER (Print & Scale Instructions Banner)
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 12, pageWidth - 28, 16, 'F');
    doc.setFillColor(6, 182, 212);
    doc.rect(14, 28, pageWidth - 28, 1, 'F');

    this.drawOfficialOraclimeLogo(doc, 17, 16.0, 5.6, { surface: 'dark' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.2);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL TECHNICIAN IDENTITY CARD — CR80 PRINT SHEET', 49, 18.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(165, 243, 252);
    doc.text(
      `Standard CR80 Size: 85.6 × 54.0 mm (ISO/IEC 7810 ID-1) · Print at 100% Actual Size · Technician ID: ${techId}`,
      49,
      24
    );

    const cardX = (pageWidth - cardW) / 2; // 62.2 mm
    const frontY = 42;
    const backY = 114;

    // Label above Front Card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SIDE A — FRONT IDENTITY FACE (85.6 × 54.0 mm)', cardX, frontY - 3.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('1:1 TRUE SCALE', cardX + cardW, frontY - 3.5, { align: 'right' });

    // =========================================================================
    // FRONT SIDE OF ID CARD (cardX, frontY, 85.6 x 54.0 mm)
    // =========================================================================
    this.drawCropMarks(doc, cardX, frontY, cardW, cardH);

    // Card Base Surface
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(cardX, frontY, cardW, cardH, 3, 3, 'FD');

    // Top Header Band (Dark Navy)
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.roundedRect(cardX, frontY, cardW, 13.5, 3, 3, 'F');
    doc.rect(cardX, frontY + 10, cardW, 3.5, 'F');

    // Cyan Accent Strip under header
    doc.setFillColor(6, 182, 212); // #06b6d4
    doc.rect(cardX, frontY + 13.5, cardW, 1.1, 'F');

    // Official Transparent OraClime Logo on Front Header
    this.drawOfficialOraclimeLogo(doc, cardX + 3.8, frontY + 2.4, 5.0, {
      surface: 'dark',
    });

    // Division Subtitle beneath Official Logo on Front Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.9);
    doc.setTextColor(103, 232, 249); // cyan-300
    doc.text('AIR SYSTEMS · FIELD SERVICE DIVISION', cardX + 3.8, frontY + 11.2);

    // Right Badge in Header: IDENTITY CARD
    doc.setFillColor(8, 145, 178); // cyan-600
    doc.roundedRect(cardX + cardW - 24, frontY + 3.8, 20.5, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(255, 255, 255);
    doc.text('TECHNICIAN ID', cardX + cardW - 13.75, frontY + 7.2, { align: 'center' });

    // Left Column: Technician Photograph (21.5 x 26.5 mm)
    const photoX = cardX + 4.2;
    const photoY = frontY + 17.2;
    const photoW = 21.5;
    const photoH = 26.5;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(14, 116, 144); // cyan-700
    doc.setLineWidth(0.4);
    doc.roundedRect(photoX, photoY, photoW, photoH, 1.2, 1.2, 'FD');

    let photoRendered = false;
    if (tech.photoUrl && (tech.photoUrl.startsWith('data:image/') || tech.photoUrl.startsWith('data:application/'))) {
      try {
        const imgFormat = tech.photoUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(tech.photoUrl, imgFormat, photoX + 0.6, photoY + 0.6, photoW - 1.2, photoH - 1.2, undefined, 'FAST');
        photoRendered = true;
      } catch {
        photoRendered = false;
      }
    }

    if (!photoRendered) {
      doc.setFillColor(203, 213, 225);
      doc.circle(photoX + photoW / 2, photoY + 9.5, 4.2, 'F');
      doc.roundedRect(photoX + 4.2, photoY + 15, photoW - 8.4, 8, 2.5, 2.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PHOTO ON FILE', photoX + photoW / 2, photoY + 25, { align: 'center' });
    }

    // Right Column: Technician Primary Details (Strictly excludes confidential Application Number)
    const infoX = photoX + photoW + 4.0;
    const maxInfoW = cardW - (infoX - cardX) - 3.5;

    // Technician Full Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    const truncatedName = fullName.length > 26 ? fullName.slice(0, 25) + '…' : fullName;
    doc.text(truncatedName, infoX, frontY + 20.5);

    // Trade / Specialization text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(8, 145, 178); // cyan-600
    const cleanTrade = trade.length > 34 ? trade.slice(0, 33) + '…' : trade;
    doc.text(cleanTrade.toUpperCase(), infoX, frontY + 24.0);

    // Dedicated Technician ID Highlight Box
    doc.setFillColor(236, 254, 255); // cyan-50
    doc.setDrawColor(103, 232, 249); // cyan-300
    doc.setLineWidth(0.25);
    doc.roundedRect(infoX, frontY + 25.8, maxInfoW, 6.8, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(14, 116, 144);
    doc.text('UNIQUE TECHNICIAN ID', infoX + 2, frontY + 28.2);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(15, 23, 42);
    doc.text(techId, infoX + 2, frontY + 31.5);

    // Row 1: Service Area / District & Registered Mobile
    const gridY = frontY + 35.4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    doc.setTextColor(100, 116, 139);
    doc.text('SERVICE AREA / DISTRICT', infoX, gridY);
    doc.text('REGISTERED MOBILE', infoX + 28, gridY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(30, 41, 59);
    const cleanDistrict = district.length > 17 ? district.slice(0, 16) + '…' : district;
    doc.text(cleanDistrict, infoX, gridY + 2.9);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(30, 41, 59);
    doc.text(tech.mobile || 'N/A', infoX + 28, gridY + 2.9);

    // Row 2: Field Qualification & Enrolled Date
    const row2Y = frontY + 41.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    doc.setTextColor(100, 116, 139);
    doc.text('SERVICE QUALIFICATION', infoX, row2Y);
    doc.text('ENROLLED DATE', infoX + 28, row2Y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(30, 41, 59);
    const qualLabel = tech.experienceYears ? `HVAC FIELD TECH (${tech.experienceYears}Y)` : 'HVAC FIELD SPECIALIST';
    doc.text(qualLabel, infoX, row2Y + 2.8);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(30, 41, 59);
    doc.text(tech.registrationDate || 'Active', infoX + 28, row2Y + 2.8);

    // Bottom Footer Band on Front Card (Verification Status Bar)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(cardX, frontY + cardH - 6.8, cardW, 6.8, 3, 3, 'F');
    doc.rect(cardX, frontY + cardH - 6.8, cardW, 3.5, 'F');

    // Status Indicator Dot + Label
    if (isVerified) {
      doc.setFillColor(16, 185, 129); // emerald-500
    } else if (tech.status === 'rejected') {
      doc.setFillColor(244, 63, 94); // rose-500
    } else {
      doc.setFillColor(245, 158, 11); // amber-500
    }
    doc.circle(cardX + 5.5, frontY + cardH - 3.3, 1.3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${statusLabel}`, cardX + 8.2, frontY + cardH - 2.6);

    doc.setFont('courier', 'normal');
    doc.setFontSize(5.0);
    doc.setTextColor(148, 163, 184);
    doc.text(`ID: ${techId}`, cardX + cardW - 4, frontY + cardH - 2.6, { align: 'right' });

    // =========================================================================
    // BACK SIDE OF ID CARD (cardX, backY, 85.6 x 54.0 mm)
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SIDE B — REVERSE VERIFICATION & COMPLIANCE FACE (85.6 × 54.0 mm)', cardX, backY - 3.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('1:1 TRUE SCALE', cardX + cardW, backY - 3.5, { align: 'right' });

    this.drawCropMarks(doc, cardX, backY, cardW, cardH);

    // Card Base Surface
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(cardX, backY, cardW, cardH, 3, 3, 'FD');

    // Top Brand Header Band on Back Card (Matching Front Side Branding)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(cardX, backY, cardW, 9.8, 3, 3, 'F');
    doc.rect(cardX, backY + 6.8, cardW, 3.0, 'F');
    doc.setFillColor(6, 182, 212);
    doc.rect(cardX, backY + 9.8, cardW, 0.8, 'F');

    // Official Transparent OraClime Logo on Back Header
    this.drawOfficialOraclimeLogo(doc, cardX + 3.8, backY + 2.2, 4.4, {
      surface: 'dark',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.9);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL TECHNICIAN CREDENTIAL', cardX + cardW - 3.5, backY + 4.8, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.3);
    doc.setTextColor(103, 232, 249);
    doc.text('VERIFICATION & COMPLIANCE · REVERSE', cardX + cardW - 3.5, backY + 7.6, {
      align: 'right',
    });

    // Authorized Technician Identification Statement
    const backContentX = cardX + 4.5;
    const backContentW = cardW - 9.0;
    let by = backY + 13.8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    doc.setTextColor(15, 23, 42);
    doc.text('AUTHORIZED TECHNICIAN IDENTIFICATION STATEMENT', backContentX, by);

    by += 2.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(51, 65, 85);
    const authStatement =
      'This credential identifies the bearer as a registered HVAC technician recorded in the ORACLIME Local DMS Archive. Cardholders must display this badge during field installation, maintenance, and warranty service assignments.';
    const splitStatement = doc.splitTextToSize(authStatement, backContentW);
    doc.text(splitStatement, backContentX, by);

    by += 7.2;

    // Verification Reference Box (Strictly uses Unique Technician ID, never applicationNumber)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.roundedRect(backContentX, by, backContentW, 10.5, 1, 1, 'FD');

    // Left accent bar in reference box
    doc.setFillColor(8, 145, 178);
    doc.rect(backContentX, by, 1.8, 10.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    doc.setTextColor(71, 85, 105);
    doc.text('DMS VERIFICATION REFERENCE CODE (LOCAL ARCHIVE LOOKUP)', backContentX + 3.5, by + 3.0);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(verificationRefCode, backContentX + 3.5, by + 6.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Tech ID: ${techId}  |  Status: ${statusLabel}  |  Station: ${district}`,
      backContentX + 3.5,
      by + 9.2
    );

    by += 12.8;

    // Safety Note & Official Owner Digital Signature Area side by side
    const leftBoxW = backContentW * 0.56;
    const rightBoxW = backContentW * 0.41;
    const rightBoxX = backContentX + backContentW - rightBoxW;

    // Left: Safety & Compliance Note
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(15, 23, 42);
    doc.text('SAFETY & IDENTIFICATION NOTE:', backContentX, by);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.4);
    doc.setTextColor(71, 85, 105);
    const safetyNote =
      'Follow electrical isolation, refrigerant handling (R32/R410A), and PPE protocols. Verify credential status in ORACLIME DMS using Unique Technician ID.';
    doc.text(doc.splitTextToSize(safetyNote, leftBoxW), backContentX, by + 2.4);

    // Right: Official Owner Digital Signature Box (Replaces faint grey placeholder)
    doc.setDrawColor(148, 163, 184);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.25);
    doc.roundedRect(rightBoxX, by - 1.5, rightBoxW, 11.5, 1, 1, 'FD');

    // Embed actual uploaded Owner Digital Signature above the line
    this.drawOfficialOwnerSignature(
      doc,
      rightBoxX + rightBoxW / 2,
      by + 6.3,
      6.4,
      rightBoxW - 4
    );

    doc.setDrawColor(203, 213, 225);
    doc.line(rightBoxX + 2.5, by + 6.8, rightBoxX + rightBoxW - 2.5, by + 6.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.2);
    doc.setTextColor(15, 23, 42);
    doc.text('AUTHORIZED SIGNATORY · ORACLIME', rightBoxX + rightBoxW / 2, by + 9.1, {
      align: 'center',
    });

    // Bottom Strip on Back Card
    doc.setFillColor(241, 245, 249);
    doc.rect(cardX + 0.5, backY + cardH - 4.8, cardW - 1, 4.3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.4);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `ORACLIME AIR SYSTEMS · REGIONAL STATION: ${district.toUpperCase()} · GENERATED: ${new Date().toLocaleDateString('en-IN')}`,
      cardX + cardW / 2,
      backY + cardH - 1.9,
      { align: 'center' }
    );

    // =========================================================================
    // CUTTING & LAMINATION SUMMARY FOOTER ON SHEET
    // =========================================================================
    const sheetNoteY = backY + cardH + 14;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(24, sheetNoteY, pageWidth - 48, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('PRINTING & CARD PRODUCTION SPECIFICATIONS', 30, sheetNoteY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '1. Dimensions: Standard CR80 (85.60 × 53.98 mm). Ensure printer scaling is set to "100%" or "Actual Size".',
      30,
      sheetNoteY + 11.5
    );
    doc.text(
      '2. Alignment: Trim along the corner crop marks. Fold or bond Side A (Front) and Side B (Back) prior to thermal pouch lamination.',
      30,
      sheetNoteY + 16
    );
    doc.text(
      `3. Record Integrity: Exported from ORACLIME DMS for ${tech.fullName} (Unique Technician ID: ${techId}).`,
      30,
      sheetNoteY + 20.5
    );

    const dataUrl = doc.output('datauristring');
    const cleanId = techId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `ORACLIME_Technician_ID_Card_${cleanId}.pdf`;

    return { doc, dataUrl, filename };
  }

  /**
   * Generates an official A4 Landscape Business Partner Certificate PDF
   * Strictly respects the partner's actual verification status (`partner.status === 'verified'`).
   */
  public static generatePartnerCertificatePdf(partner: TechnicianRecord): {
    doc: jsPDF;
    dataUrl: string;
    filename: string;
  } {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = doc.internal.pageSize.getWidth(); // 297 mm
    const pageH = doc.internal.pageSize.getHeight(); // 210 mm

    const isVerified = partner.status === 'verified';
    const partnerId = partner.applicationNumber || 'OR-PART-UNASSIGNED';
    const firmName = (partner.fullName || 'UNNAMED BUSINESS ENTITY').toUpperCase();
    const partnerType = partner.partnerType || 'Commercial HVAC Partner';
    const district = partner.district || 'General Territory';
    const coverage = partner.capacityOrCoverage || `${district} Service Region`;
    const contactPerson = partner.contactPerson || 'Authorized Representative';
    const gstNo = partner.gstNumber || 'Not Provided';
    const issueDate = partner.verificationDate
      ? new Date(partner.verificationDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    const enrolledDate = partner.registrationDate || issueDate;

    const yearStr = new Date().getFullYear();
    const cleanRefSuffix = partnerId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const certRefNumber = `ORAC-CERT-${yearStr}-${cleanRefSuffix}`;

    // =========================================================================
    // 1. ARCHITECTURAL CORPORATE BORDER & FRAME
    // =========================================================================
    doc.setFillColor(252, 253, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Outer thick dark navy frame
    doc.setDrawColor(15, 23, 42); // #0f172a
    doc.setLineWidth(2.2);
    doc.rect(8, 8, pageW - 16, pageH - 16);

    // Middle cyan accent border
    doc.setDrawColor(8, 145, 178); // #0891b2
    doc.setLineWidth(0.7);
    doc.rect(11.5, 11.5, pageW - 23, pageH - 23);

    // Inner fine slate border
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(13.5, 13.5, pageW - 27, pageH - 27);

    // Corner Architectural Accents
    const corners = [
      [8, 8],
      [pageW - 16, 8],
      [8, pageH - 16],
      [pageW - 16, pageH - 16],
    ];
    doc.setFillColor(15, 23, 42);
    corners.forEach(([cx, cy]) => {
      doc.rect(cx, cy, 8, 8, 'F');
      doc.setFillColor(6, 182, 212);
      doc.rect(cx + 2, cy + 2, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
    });

    // =========================================================================
    // 2. TOP BRAND HEADER & REFERENCE METADATA BAR
    // =========================================================================
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`CERTIFICATE REF: ${certRefNumber}`, 20, 22);
    doc.text(`PARTNER DOSSIER ID: ${partnerId}`, pageW - 20, 22, { align: 'right' });

    // Center Official Transparent OraClime Logo Emblem (no white rectangle needed)
    this.drawOfficialOraclimeLogo(doc, pageW / 2, 19.5, 9.6, {
      align: 'center',
      surface: 'light',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ORACLIME AIR SYSTEMS', pageW / 2, 38.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(8, 145, 178);
    doc.text('COMMERCIAL HVAC DISTRIBUTION, LOGISTICS & AUTHORIZED SERVICE NETWORK', pageW / 2, 44.5, {
      align: 'center',
    });

    // Decorative Divider Line
    doc.setDrawColor(8, 145, 178);
    doc.setLineWidth(0.6);
    doc.line(pageW / 2 - 55, 48.5, pageW / 2 + 55, 48.5);

    // =========================================================================
    // 3. CERTIFICATE HEADING (STATUS-ACCURATE)
    // =========================================================================
    if (isVerified) {
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(pageW / 2 - 98, 53.5, 196, 12, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13.5);
      doc.setTextColor(255, 255, 255);
      doc.text('ORACLIME AUTHORIZED BUSINESS PARTNER CERTIFICATE', pageW / 2, 61.2, {
        align: 'center',
      });
    } else {
      doc.setFillColor(120, 53, 15); // amber-900
      doc.roundedRect(pageW / 2 - 104, 53.5, 208, 12, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(254, 243, 199);
      doc.text('ORACLIME BUSINESS PARTNER ENROLLMENT RECORD (PROVISIONAL)', pageW / 2, 61.2, {
        align: 'center',
      });
    }

    // =========================================================================
    // 4. PROCLAMATION & BUSINESS ENTITY NAME
    // =========================================================================
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      isVerified
        ? 'This is to officially certify that the commercial establishment named below is a verified and registered business partner of ORACLIME:'
        : 'This document records that the commercial establishment named below is currently registered in the ORACLIME system with provisional status:',
      pageW / 2,
      73,
      { align: 'center' }
    );

    const nameFontSize = firmName.length > 42 ? 16 : firmName.length > 30 ? 19 : 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nameFontSize);
    doc.setTextColor(15, 23, 42);
    doc.text(firmName, pageW / 2, 85, { align: 'center' });

    // Underline beneath Business Name
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(45, 88.5, pageW - 45, 88.5);

    // Address / Contact subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const cleanAddr = partner.address
      ? `Registered Facility: ${partner.address} (${district})`
      : `Registered District / Territory: ${district}`;
    doc.text(cleanAddr.slice(0, 110), pageW / 2, 94, { align: 'center' });

    // =========================================================================
    // 5. STRUCTURED CREDENTIAL METADATA GRID (6 KEY ATTRIBUTES)
    // =========================================================================
    const gridX = 26;
    const gridY = 100;
    const gridW = pageW - 52; // 245 mm
    const gridH = 38;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(gridX, gridY, gridW, gridH, 2.5, 2.5, 'FD');

    const colW = gridW / 3;
    doc.line(gridX + colW, gridY + 3, gridX + colW, gridY + gridH - 3);
    doc.line(gridX + colW * 2, gridY + 3, gridX + colW * 2, gridY + gridH - 3);
    doc.line(gridX + 4, gridY + gridH / 2, gridX + gridW - 4, gridY + gridH / 2);

    const drawGridCell = (col: number, row: number, label: string, value: string, highlight = false) => {
      const cx = gridX + col * colW + 6;
      const cy = gridY + row * (gridH / 2) + 6.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), cx, cy);

      doc.setFont(highlight ? 'courier' : 'helvetica', 'bold');
      doc.setFontSize(9.5);
      if (highlight) {
        doc.setTextColor(8, 145, 178);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      const maxChars = 34;
      const safeVal = (value || 'Not Provided').length > maxChars ? value.slice(0, maxChars - 1) + '…' : value;
      doc.text(safeVal, cx, cy + 6.5);
    };

    const statusDisplay = isVerified
      ? 'VERIFIED & AUTHORIZED'
      : partner.status === 'rejected'
      ? 'REJECTED / INACTIVE'
      : partner.status === 'flagged_handwritten'
      ? 'FLAGGED FOR AUDIT REVIEW'
      : 'PENDING VERIFICATION';

    drawGridCell(0, 0, 'Official Partner ID', partnerId, true);
    drawGridCell(1, 0, 'Business Classification / Partner Type', partnerType, false);
    drawGridCell(2, 0, 'Service Area / District Territory', `${district} (${coverage.slice(0, 18)})`, false);

    drawGridCell(0, 1, 'Verification & Authorization Status', statusDisplay, isVerified);
    drawGridCell(1, 1, 'Authorized Representative & GSTIN', `${contactPerson} · GST: ${gstNo}`, false);
    drawGridCell(2, 1, 'Certificate Issue Date & Enrollment', `Issued: ${issueDate} (Reg: ${enrolledDate})`, false);

    // =========================================================================
    // 6. SCOPE OF AUTHORIZATION STATEMENT
    // =========================================================================
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const scopeParagraph = isVerified
      ? `The above-named commercial establishment is recognized within the ORACLIME HVAC Network under classification "${partnerType}" for the ${district} territory. This certificate remains valid subject to continued compliance with ORACLIME quality standards, genuine spare-parts integrity, and statutory regulations.`
      : `NOTICE: This partner record (${partnerId}) currently holds status "${statusDisplay}". Full commercial authorization is granted only upon completion of document verification and approval by an authorized ORACLIME administrator.`;
    doc.text(doc.splitTextToSize(scopeParagraph, pageW - 56), pageW / 2, 145.5, { align: 'center' });

    // =========================================================================
    // 7. SIGNATORY, COMPANY SEAL & VERIFICATION FOOTER BLOCKS
    // =========================================================================
    const sigY = 156;
    const blockW = 72;

    // Left Signatory: Partner Representative (Reserved for Partner's own signature/stamp)
    const leftSigX = 28;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);
    doc.line(leftSigX, sigY + 20, leftSigX + blockW, sigY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(contactPerson, leftSigX + blockW / 2, sigY + 17, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('AUTHORIZED PARTNER REPRESENTATIVE', leftSigX + blockW / 2, sigY + 24.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Partner Signature & Establishment Stamp', leftSigX + blockW / 2, sigY + 28.5, { align: 'center' });

    // Center: Official Company Seal Emblem
    const sealCx = pageW / 2;
    const sealCy = sigY + 15;
    doc.setDrawColor(isVerified ? 8 : 180, isVerified ? 145 : 83, isVerified ? 178 : 9);
    doc.setLineWidth(0.8);
    doc.circle(sealCx, sealCy, 14, 'S');
    doc.setLineWidth(0.3);
    doc.circle(sealCx, sealCy, 11.8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(isVerified ? 8 : 180, isVerified ? 145 : 83, isVerified ? 178 : 9);
    doc.text('ORACLIME AIR SYSTEMS', sealCx, sealCy - 4, { align: 'center' });
    doc.setFontSize(7.2);
    doc.text(isVerified ? 'OFFICIAL SEAL' : 'PROVISIONAL', sealCx, sealCy + 0.8, { align: 'center' });
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.text(partnerId, sealCx, sealCy + 5, { align: 'center' });

    // Right Signatory: ORACLIME Issuing Authority with Official Owner Digital Signature
    const rightSigX = pageW - 28 - blockW;
    this.drawOfficialOwnerSignature(
      doc,
      rightSigX + blockW / 2,
      sigY + 16.2,
      12.5,
      blockW - 8
    );

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);
    doc.line(rightSigX, sigY + 20, rightSigX + blockW, sigY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AUTHORIZED SIGNATORY · ORACLIME', rightSigX + blockW / 2, sigY + 24.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Commercial Network & Compliance Division', rightSigX + blockW / 2, sigY + 28.5, { align: 'center' });

    // Bottom Archival Strip
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `ORACLIME DMS · Certificate Ref: ${certRefNumber} · Partner ID: ${partnerId} · Status: ${statusDisplay} · Generated: ${issueDate}`,
      pageW / 2,
      pageH - 15.5,
      { align: 'center' }
    );

    const dataUrl = doc.output('datauristring');
    const cleanPartnerId = partnerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `ORACLIME_Partner_Certificate_${cleanPartnerId}.pdf`;

    return { doc, dataUrl, filename };
  }
}

