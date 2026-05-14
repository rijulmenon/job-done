import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max size is 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Use pdfjs-dist legacy build with the bundled worker
    const { getDocument, GlobalWorkerOptions } = await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    );

    const workerPath = path.resolve(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
    GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

    const loadingTask = getDocument({
      data: uint8,
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str ?? "")
          .join(" ") + "\n";
    }

    await pdf.destroy();

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. Make sure it is a text-based PDF (not a scanned image).",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: trimmed });
  } catch (error) {
    console.error("PDF parse error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to parse PDF: ${message}` },
      { status: 500 }
    );
  }
}
