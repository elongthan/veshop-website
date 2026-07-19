import { fmtPrice } from "@/lib/slug";

async function imageUrlToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadCatalogPdf({ products, categoryLabel, showPrices, settings }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(settings.site_name || "VeShop", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Product catalog${categoryLabel ? `: ${categoryLabel}` : ""}`, margin, y);
  y += 14;
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-SG", { year: "numeric", month: "long", day: "numeric" })}`,
    margin, y
  );
  y += 14;
  const contactLine = [settings.phone1, settings.contact_email].filter(Boolean).join("  ·  ");
  if (contactLine) { doc.text(contactLine, margin, y); y += 14; }
  doc.setTextColor(0);
  y += 10;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const colWidth = (pageWidth - margin * 2 - 20) / 2;
  let col = 0;
  let rowStartY = y;
  const imgSize = 70;
  const rowHeight = 92;

  for (const p of products) {
    ensureSpace(rowHeight);
    if (col === 0) rowStartY = y;
    const x = margin + col * (colWidth + 20);

    doc.setDrawColor(225);
    doc.rect(x, rowStartY, colWidth, rowHeight);

    if (p.image_url) {
      try {
        const dataUrl = await imageUrlToDataUrl(p.image_url);
        doc.addImage(dataUrl, "JPEG", x + 8, rowStartY + 8, imgSize, imgSize, undefined, "FAST");
      } catch (e) {
        // Image failed to load — leave the box empty rather than fail the whole PDF
      }
    }

    const textX = x + imgSize + 18;
    const textWidth = colWidth - imgSize - 26;
    let ty = rowStartY + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const nameLines = doc.splitTextToSize(p.name, textWidth);
    doc.text(nameLines.slice(0, 2), textX, ty);
    ty += nameLines.slice(0, 2).length * 11 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${p.brand || ""}${p.sku ? " · " + p.sku : ""}`, textX, ty);
    ty += 12;

    if (showPrices) {
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
      if (onSale) {
        doc.setTextColor(180, 20, 20);
        doc.text(`${fmtPrice(p.sale_price)} (was ${fmtPrice(p.price)})`, textX, ty);
      } else {
        doc.text(fmtPrice(p.price), textX, ty);
      }
    }
    doc.setTextColor(0);

    col++;
    if (col === 2) {
      col = 0;
      y = rowStartY + rowHeight + 12;
    }
  }
  if (col === 1) y = rowStartY + rowHeight + 12;

  doc.save(`veshop-catalog${categoryLabel ? "-" + categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}.pdf`);
}
