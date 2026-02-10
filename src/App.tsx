import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

/* Worker will be copied to assets folder during build */
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '/assets/pdf.worker.min.mjs',
  import.meta.url
).href;

export default function App() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;

    setFileName(file.name);
    setText("");
    setError("");
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      let result = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str).join(" ");
        result += `\n\n--- Page ${i} ---\n\n${strings}`;
      }

      setText(result);
    } catch (err) {
      console.error("PDF error:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown() {
    if (!text) return;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? fileName.replace(/\.pdf$/i, ".md") : "output.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">PrivMD</h1>
        <p className="text-slate-500 mb-6">
          Local PDF → Markdown (Private, Offline)
        </p>

        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div>
            <label className="inline-block px-4 py-2 bg-slate-900 text-white rounded cursor-pointer hover:bg-slate-800">
              Select PDF
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            {fileName && (
              <p className="mt-2 text-sm text-green-600">Loaded: {fileName}</p>
            )}
          </div>

          {loading && <p className="text-blue-600">Processing PDF...</p>}
          {error && <p className="text-red-600">{error}</p>}

          <div>
            <p className="text-sm font-medium mb-2">Markdown Output</p>
            <textarea
              className="w-full h-[400px] border rounded p-3 font-mono text-sm"
              value={text}
              readOnly
              placeholder="Markdown will appear here..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              disabled={!text}
              className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-slate-50"
            >
              Copy
            </button>
            <button
              onClick={downloadMarkdown}
              disabled={!text}
              className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50 hover:bg-slate-800"
            >
              Download .md
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Runs locally. No uploads. No tracking.
        </p>
      </div>
    </div>
  );
}