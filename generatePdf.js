import { fmtPrice } from "@/lib/slug";
import { cleanText } from "@/lib/textClean";

async function urlToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

function measureImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not measure image"));
    img.src = dataUrl;
  });
}

function hexToRgb(hex) {
  const clean = (hex || "#1B3A6B").replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Fit `natural` inside a `maxW`x`maxH` box without distorting it, and
// return the centered x/y offset within that box.
function fitContain(natural, maxW, maxH) {
  const ratio = Math.min(maxW / natural.width, maxH / natural.height);
  const w = natural.width * ratio;
  const h = natural.height * ratio;
  return { w, h, offsetX: (maxW - w) / 2, offsetY: (maxH - h) / 2 };
}

export async function downloadCatalogPdf({ products, categoryLabel, settings }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const footerHeight = 44;
  const contentBottom = pageHeight - footerHeight;
  const [accentR, accentG, accentB] = hexToRgb(settings.accent_color);

  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > contentBottom) {
      doc.addPage();
      y = margin;
    }
  }

  // ---- Header (first page) ----
  let logoDataUrl = null;
  if (settings.logo_url) {
    try {
      logoDataUrl = await urlToDataUrl(settings.logo_url);
    } catch (e) { /* no logo, continue without it */ }
  }

  let titleX = margin;
  if (logoDataUrl) {
    try {
      const natural = await measureImage(logoDataUrl);
      const fit = fitContain(natural, 46, 46);
      doc.addImage(logoDataUrl, margin, y, fit.w, fit.h);
      titleX = margin + 46 + 14;
    } catch (e) { /* skip logo if it fails to measure/draw */ }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(20);
  doc.text(settings.site_name || "VeShop", titleX, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(categoryLabel ? `${categoryLabel} — Product Catalog` : "Product Catalog", titleX, y + 37);

  y += 58;
  doc.setDrawColor(accentR, accentG, accentB);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // ---- Products ----
  const imgBox = 88;
  const textX = margin + imgBox + 16;
  const textWidth = pageWidth - margin - textX;

  for (const p of products) {
    const safeName = cleanText(p.name);
    const safeShortDesc = cleanText(p.short_description);
    const safeDesc = cleanText(p.description);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const nameLines = doc.splitTextToSize(safeName, textWidth);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const introLines = safeShortDesc ? doc.splitTextToSize(safeShortDesc, textWidth) : [];

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const descPoints = (safeDesc || "")
      .split("\n").map((s) => s.trim()).filter(Boolean);
    let descLineCount = 0;
    const wrappedPoints = descPoints.map((pt) => {
      const wrapped = doc.splitTextToSize(pt, textWidth - 12);
      descLineCount += wrapped.length;
      return wrapped;
    });

    const textHeight = nameLines.length * 13 + 6
      + (introLines.length ? introLines.length * 11 + 8 : 0)
      + (descLineCount ? descLineCount * 10 + wrappedPoints.length * 3 + 6 : 0);
    const blockHeight = Math.max(imgBox, textHeight) + 32;

    ensureSpace(blockHeight);
    const blockTop = y;

    // Image
    if (p.image_url) {
      try {
        const dataUrl = await urlToDataUrl(p.image_url);
        const natural = await measureImage(dataUrl);
        const fit = fitContain(natural, imgBox, imgBox);
        doc.setDrawColor(225);
        doc.rect(margin, blockTop, imgBox, imgBox);
        doc.addImage(dataUrl, margin + fit.offsetX, blockTop + fit.offsetY, fit.w, fit.h);
      } catch (e) {
        // image failed — leave the box outline empty
        doc.setDrawColor(225);
        doc.rect(margin, blockTop, imgBox, imgBox);
      }
    }

    // Text
    let ty = blockTop + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(nameLines, textX, ty + 9);
    ty += nameLines.length * 13 + 6;

    if (introLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(introLines, textX, ty + 8);
      ty += introLines.length * 11 + 8;
    }

    if (wrappedPoints.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      for (const wrapped of wrappedPoints) {
        doc.setTextColor(accentR, accentG, accentB);
        doc.text("•", textX, ty + 8);
        doc.setTextColor(70);
        doc.text(wrapped, textX + 12, ty + 8);
        ty += wrapped.length * 10 + 3;
      }
    }

    y = blockTop + blockHeight;
    doc.setDrawColor(235);
    doc.line(margin, y - 8, pageWidth - margin, y - 8);
  }

  // ---- Footer on every page ----
  const totalPages = doc.internal.getNumberOfPages();
  const footerLine1 = [settings.site_name, settings.phone1, settings.contact_email].filter(Boolean).join("  ·  ");
  const footerLine2 = `Product catalog${categoryLabel ? `: ${categoryLabel}` : ""}`;
  const footerLine3 = `Generated on ${new Date().toLocaleDateString("en-SG", { year: "numeric", month: "long", day: "numeric" })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(225);
    doc.setLineWidth(0.75);
    doc.line(margin, contentBottom + 6, pageWidth - margin, contentBottom + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(footerLine1 || "", margin, contentBottom + 18);
    doc.text(footerLine2, margin, contentBottom + 29);
    doc.text(`${footerLine3}   ·   Page ${i} of ${totalPages}`, margin, contentBottom + 40);
  }

  doc.save(`veshop-catalog${categoryLabel ? "-" + categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}.pdf`);
}
