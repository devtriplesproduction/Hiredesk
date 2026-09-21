import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import pdfjs-dist in Node environment
    // @ts-ignore
    const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
    const path = await import("path");
    
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs");
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    const pagesToRead = Math.min(4, doc.numPages);

    let fullText = "";
    const firstPageLines: Array<{
      text: string;
      fontSize: number;
      y: number;
      x: number;
      width: number;
      height: number;
      fontFamily: string;
      isBold: boolean;
    }> = [];

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const items: any[] = textContent.items || [];

      // Sort items by Y (top-to-bottom) then X (left-to-right)
      const sorted = [...items]
        .filter(item => item.str && item.str.trim())
        .sort((a, b) => {
          const ay = a.transform?.[5] || 0;
          const by = b.transform?.[5] || 0;
          if (Math.abs(ay - by) > 4) return by - ay;
          const ax = a.transform?.[4] || 0;
          const bx = b.transform?.[4] || 0;
          return ax - bx;
        });

      // Group into lines by Y proximity
      let currentY: number | null = null;
      let currentLineItems: any[] = [];
      const pageLines: string[] = [];

      for (const item of sorted) {
        const y = item.transform?.[5] || 0;
        if (currentY === null || Math.abs(y - currentY) > 5) {
          if (currentLineItems.length > 0) {
            const lineStr = currentLineItems.map(it => it.str).join(" ").trim();
            if (lineStr) pageLines.push(lineStr);

            if (i === 1) {
              const maxFontSize = Math.max(...currentLineItems.map(it => Math.abs(it.transform?.[3]) || 12));
              const minX = Math.min(...currentLineItems.map(it => it.transform?.[4] || 0));
              firstPageLines.push({
                text: lineStr,
                fontSize: maxFontSize,
                y: currentY || 0,
                x: minX,
                width: 200,
                height: maxFontSize,
                fontFamily: "",
                isBold: maxFontSize >= 14,
              });
            }
          }
          currentLineItems = [item];
          currentY = y;
        } else {
          currentLineItems.push(item);
        }
      }

      if (currentLineItems.length > 0) {
        const lineStr = currentLineItems.map(it => it.str).join(" ").trim();
        if (lineStr) pageLines.push(lineStr);
        if (i === 1) {
          const maxFontSize = Math.max(...currentLineItems.map(it => Math.abs(it.transform?.[3]) || 12));
          const minX = Math.min(...currentLineItems.map(it => it.transform?.[4] || 0));
          firstPageLines.push({
            text: lineStr,
            fontSize: maxFontSize,
            y: currentY || 0,
            x: minX,
            width: 200,
            height: maxFontSize,
            fontFamily: "",
            isBold: maxFontSize >= 14,
          });
        }
      }

      // Extract hyperlink annotations if present (LinkedIn, GitHub, LeetCode, etc.)
      try {
        const annotations = await page.getAnnotations();
        const urls = annotations.map((a: any) => a.url).filter(Boolean);
        if (urls.length > 0) {
          pageLines.push("Links: " + urls.join(" "));
        }
      } catch {
        // Ignore annotation error
      }

      fullText += (fullText ? "\n\n" : "") + pageLines.join("\n") + "\n\n";
    }

    try {
      await doc.destroy();
    } catch {}

    return NextResponse.json({
      text: fullText.trim(),
      firstPageLines,
      numPages: doc.numPages,
    });
  } catch (error: any) {
    console.error("[API parse-resume] Server extraction error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
