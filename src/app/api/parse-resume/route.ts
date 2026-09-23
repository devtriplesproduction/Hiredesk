import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error - no default export in types
import * as pdfParse from "pdf-parse";

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

    // Use pdf-parse for robust server-side extraction
    const data = await pdfParse(buffer);
    
    // We can't extract geometric layout with pdf-parse as easily as pdfjs-dist,
    // but we can just split by lines to simulate firstPageLines for the fallback
    const lines = data.text.split('\n').filter((l: string) => l.trim().length > 0);
    const firstPageLines = lines.slice(0, 30).map((str: string, idx: number) => ({
      text: str.trim(),
      fontSize: 12,
      y: idx * 20,
      x: 0,
      width: 200,
      height: 12,
      fontFamily: "",
      isBold: false
    }));

    return NextResponse.json({
      text: data.text.trim(),
      firstPageLines,
      numPages: data.numpages,
    });
  } catch (error: any) {
    console.error("[API parse-resume] Server extraction error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse PDF" },
      { status: 500 }
    );
  }
}
