import * as pdfjs from "pdfjs-dist";

// Worker configured once at module load — avoids repeated CDN negotiation
const PDFJS_VERSION = pdfjs.version || "4.4.168";
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export interface PDFTextLine {
  text: string;
  fontSize: number;
  y: number;
  x: number;
  width: number;
  height: number;
  fontFamily: string;
  isBold: boolean;
}

export interface PDFParsedResult {
  text: string;
  firstPageLines: PDFTextLine[];
  ocrUsed: boolean;
  ocrText?: string;
}

/**
 * Renders a PDF page directly onto a high-resolution canvas in the browser,
 * returning a PNG Blob for OCR processing.
 */
async function renderPageToImageBlob(page: pdfjs.PDFPageProxy): Promise<Blob> {
  const viewport = page.getViewport({ scale: 1.6 }); // High resolution zoom for crisp OCR characters
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error("Could not construct Canvas 2D context");
  }

  // Render PDF page to Canvas context
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to convert canvas to binary Blob"));
    }, "image/png");
  });
}

/**
 * Dynamically loads Tesseract.js from CDN and performs OCR on a Canvas Image Blob.
 */
export async function performOCROnImageBlob(blob: Blob): Promise<string> {
  if (typeof window === "undefined") return "";

  console.log("[HireDesk OCR] Performing high-resolution Canvas OCR...");

  return new Promise((resolve, reject) => {
    // Inject Tesseract CDN script if not already present
    if (!(window as any).Tesseract) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@v5.1.0/dist/tesseract.min.js";
      script.onload = () => runTesseract(blob, resolve, reject);
      script.onerror = (err) => {
        console.error("[HireDesk OCR] Failed to load Tesseract.js CDN script:", err);
        reject(new Error("Failed to load Tesseract.js CDN"));
      };
      document.head.appendChild(script);
    } else {
      runTesseract(blob, resolve, reject);
    }
  });
}

function runTesseract(blob: Blob, resolve: (text: string) => void, reject: (err: any) => void) {
  const Tesseract = (window as any).Tesseract;
  if (!Tesseract) {
    reject(new Error("Tesseract library not found after script injection"));
    return;
  }

  Tesseract.recognize(
    blob,
    "eng",
    {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          console.log(`[HireDesk OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    }
  )
    .then(({ data: { text } }: any) => {
      console.log(`[HireDesk OCR] Success. Extracted ${text.length} characters of scanned/stylized text.`);
      resolve(text);
    })
    .catch((err: any) => {
      console.error("[HireDesk OCR] Tesseract processing failed:", err);
      reject(err);
    });
}

/**
 * Extracts plain text and layout metadata from a PDF file using pdfjs-dist.
 * Reconstructs semantic text blocks geometrically (layout-aware proximity clustering)
 * and executes Canvas Rendering + OCR hybrid processing.
 */
export async function extractTextAndMetaFromPDF(file: File): Promise<PDFParsedResult> {
  let pdf: pdfjs.PDFDocumentProxy | undefined;
  let ocrUsed = false;
  let ocrText: string | undefined;
  let fullText = "";
  let firstPageLines: PDFTextLine[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: false,
    });
    pdf = await loadingTask.promise;

    const pagesToRead = Math.min(4, pdf.numPages);
    const pageNumbers = Array.from({ length: pagesToRead }, (_, i) => i + 1);

    // 1. Render Page 1 to Canvas and trigger OCR for Hybrid validation on client-side
    let imageBlob: Blob | undefined;
    try {
      const page1 = await pdf.getPage(1);
      imageBlob = await renderPageToImageBlob(page1);
      console.log("[HireDesk PDF] Page 1 successfully rendered to high-resolution Canvas Blob.");
    } catch (renderErr) {
      console.error("[HireDesk PDF] Canvas render failed:", renderErr);
    }

    // 2. Perform Layout-Aware Geometric Text Reconstruction across all pages
    const pageTexts = await Promise.all(
      pageNumbers.map(async (num) => {
        const page = await pdf!.getPage(num);
        const textContent = await page.getTextContent();
        const pageItems: any[] = textContent.items;

        // Group text items by Y-coordinate proximity.
        // First, sort all items vertically from top of page to bottom.
        const sortedPageItems = [...pageItems]
          .filter(item => item.str !== undefined)
          .sort((a, b) => {
            const ay = a.transform?.[5] || 0;
            const by = b.transform?.[5] || 0;
            return by - ay;
          });

        const lines: PDFTextLine[] = [];

        interface VerticalGroup {
          y: number;
          fontSize: number;
          items: any[];
        }
        const verticalGroups: VerticalGroup[] = [];

        for (const item of sortedPageItems) {
          const y = item.transform?.[5] || 0;
          const fontSize = Math.abs(item.transform?.[3]) || Math.abs(item.transform?.[0]) || 10;

          // Proximity clustering vertical threshold: scales with font size to handle larger headers having slightly larger vertical jitter.
          let group = verticalGroups.find(g => {
            const yDiff = Math.abs(g.y - y);
            const threshold = Math.max(5, Math.min(g.fontSize, fontSize) * 0.7);
            return yDiff <= threshold;
          });

          if (!group) {
            group = { y, fontSize, items: [] };
            verticalGroups.push(group);
          } else {
            if (fontSize > group.fontSize) {
              group.fontSize = fontSize;
            }
          }
          group.items.push(item);
        }

        // For each vertical row group, sort items left-to-right and split into horizontal segments (columns)
        for (const group of verticalGroups) {
          const sortedItems = [...group.items].sort((a, b) => {
            const ax = a.transform?.[4] || 0;
            const bx = b.transform?.[4] || 0;
            return ax - bx;
          });

          const segments: any[][] = [];
          let currentSegment: any[] = [];

          for (const item of sortedItems) {
            const x = item.transform?.[4] || 0;
            const fontSize = Math.abs(item.transform?.[3]) || Math.abs(item.transform?.[0]) || 10;

            if (currentSegment.length === 0) {
              currentSegment.push(item);
            } else {
              const prev = currentSegment[currentSegment.length - 1];
              const prevX = prev.transform?.[4] || 0;
              const prevFontSize = Math.abs(prev.transform?.[3]) || Math.abs(prev.transform?.[0]) || 10;
              const prevWidth = prev.width || (prev.str.length * prevFontSize * 0.45);
              const gap = x - (prevX + prevWidth);

              // Multi-column split check: if horizontal gap is large, start a new segment (different column)
              const maxGapAllowed = Math.max(30, Math.min(fontSize, prevFontSize) * 2.2);
              if (gap > maxGapAllowed) {
                segments.push(currentSegment);
                currentSegment = [item];
              } else {
                currentSegment.push(item);
              }
            }
          }
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }

          // Merge each horizontal segment into a distinct semantic line
          for (const segment of segments) {
            let mergedText = "";
            const segmentItems: any[] = [];

            for (let i = 0; i < segment.length; i++) {
              const item = segment[i];
              const str = item.str;
              const x = item.transform?.[4] || 0;
              const fontSize = Math.abs(item.transform?.[3]) || Math.abs(item.transform?.[0]) || 10;
              const width = item.width || (str.length * fontSize * 0.45);

              if (segmentItems.length === 0) {
                segmentItems.push({ str, x, fontSize, width });
                mergedText = str;
              } else {
                const prev = segmentItems[segmentItems.length - 1];
                const gap = x - (prev.x + prev.width);

                // Glyphs and Syllables joining heuristics
                if (gap < fontSize * 0.12) {
                  mergedText += str;
                } else if (gap < fontSize * 1.2) {
                  mergedText += " " + str;
                } else {
                  mergedText += "  " + str;
                }
                segmentItems.push({ str, x, fontSize, width });
              }
            }

            if (segmentItems.length > 0) {
              const maxFontSize = Math.max(...segmentItems.map(i => i.fontSize));
              const minX = Math.min(...segmentItems.map(i => i.x));
              const maxX = Math.max(...segmentItems.map(i => i.x + i.width));
              const totalWidth = maxX - minX;

              const fontStyle = textContent.styles[segment[0].fontName];
              const fontFamily = fontStyle?.fontFamily || "";
              const isBold = /bold|heavy|black|semibold|medium|w[6-9]/i.test(fontFamily) ||
                            /bold/i.test(segment[0].fontName || "");

              lines.push({
                text: mergedText.trim(),
                fontSize: maxFontSize,
                y: group.y,
                x: minX,
                width: totalWidth,
                height: maxFontSize,
                fontFamily,
                isBold
              });
            }
          }
        }

        // Sort reconstructed page lines vertically from top to bottom (Y coordinate descending)
        lines.sort((a, b) => b.y - a.y);

        if (num === 1) {
          firstPageLines = lines;
        }

        page.cleanup();
        return lines.map(l => l.text).filter(Boolean).join("\n");
      })
    );

    fullText = pageTexts.join("\n").trim();
    
    // Release native PDF resources
    try { await pdf.destroy(); pdf = undefined; } catch {}

    // 3. Fire Hybrid Canvas OCR in parallel or as validation layer
    if (imageBlob) {
      try {
        ocrText = await performOCROnImageBlob(imageBlob);
        
        // If native layout text extraction is extremely sparse, merge OCR output
        if (fullText.length < 80 && ocrText.length > 50) {
          ocrUsed = true;
          fullText = ocrText;
        }
      } catch (ocrErr) {
        console.error("[HireDesk PDF] Hybrid OCR processing failed:", ocrErr);
      }
    }

  } catch (error) {
    console.error("[HireDesk PDF] Native PDF.js processing failed completely.", error);
    fullText = file.name.replace(/[_\-\.]/g, " ");
  } finally {
    if (pdf) {
      try { await pdf.destroy(); } catch {}
    }
  }

  // Ensure default string values exist
  if (!fullText.trim()) {
    fullText = file.name.replace(/[_\-\.]/g, " ");
  }

  return {
    text: fullText,
    firstPageLines,
    ocrUsed: ocrUsed || !!ocrText,
    ocrText
  };
}

/**
 * Standard plain text extractor for legacy compatibility.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const result = await extractTextAndMetaFromPDF(file);
  return result.text;
}
