import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '/assets/pdf.worker.min.mjs',
  import.meta.url
).href;

export default function App() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

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
        
        // Extract text with better structure
        let pageText = "";
        let lastY = 0;
        
        for (const item of content.items as any[]) {
          const currentY = item.transform[5];
          
          // Detect paragraph breaks (vertical spacing)
          if (lastY > 0 && Math.abs(lastY - currentY) > 20) {
            pageText += "\n\n";
          }
          
          pageText += item.str + " ";
          lastY = currentY;
        }
        
        result += `\n\n## Page ${i}\n\n${pageText.trim()}`;
      }
      
      // Clean up the markdown
      result = cleanMarkdown(result);
      
      // Add watermark
      result = `${result}\n\n---\n\n*Converted with PrivMD - 100% Local Processing*`;
      
      setText(result);
    } catch (err) {
      console.error("PDF error:", err);
      setError(`Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function cleanMarkdown(text: string): string {
    let cleaned = text;
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    // Normalize line breaks (max 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Detect and format bullet points
    cleaned = cleaned.replace(/^[•●○◦▪▫-]\s+/gm, '- ');
    
    // Detect numbered lists
    cleaned = cleaned.replace(/^(\d+)\.\s+/gm, '$1. ');
    
    // Detect potential headings (ALL CAPS lines)
    cleaned = cleaned.replace(/^([A-Z][A-Z\s]{10,})$/gm, (match) => {
      return `### ${match.trim()}`;
    });
    
    // Clean up spacing around headers
    cleaned = cleaned.replace(/\n(#{1,6}\s)/g, '\n\n$1');
    cleaned = cleaned.replace(/(#{1,6}\s[^\n]+)\n/g, '$1\n\n');
    
    return cleaned.trim();
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">PrivMD</h1>
            <p className="text-sm text-slate-600">Convert PDFs Locally - No Uploads</p>
          </div>
          
            href="#pricing"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Pricing
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">
            Convert Sensitive PDFs to Markdown
          </h2>
          <p className="text-xl text-slate-600 mb-2">
            100% Local Processing. No Uploads. No Tracking.
          </p>
          <p className="text-sm text-slate-500">
            HIPAA-safe • Attorney-client privilege protected • Works offline
          </p>
        </div>

        {/* Converter Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-xl m-6 p-16
              transition-all duration-200
              ${isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }
            `}
          >
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-slate-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              <p className="text-lg font-medium text-slate-700 mb-2">
                {isDragging ? "Drop PDF here" : "Drag and drop PDF here"}
              </p>
              
              <p className="text-sm text-slate-500 mb-4">or</p>
              
              <label className="inline-block">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <span className="px-6 py-3 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 transition font-medium">
                  Browse Files
                </span>
              </label>

              {fileName && (
                <p className="mt-4 text-sm text-green-600 font-medium">
                  ✓ Loaded: {fileName}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="px-6 pb-6">
            {loading && (
              <div className="flex items-center justify-center py-4 text-blue-600">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing PDF...
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Output */}
          {text && (
            <div className="border-t bg-slate-50 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">Markdown Output</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(text)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-white transition"
                  >
                    Copy
                  </button>
                  <button
                    onClick={downloadMarkdown}
                    className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    Download .md
                  </button>
                </div>
              </div>
              
              <textarea
                className="w-full h-96 border border-slate-300 rounded-lg p-4 font-mono text-sm bg-white resize-none"
                value={text}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 mb-3">Trusted by professionals who handle sensitive data</p>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
            <span>✓ HIPAA-compliant workflow</span>
            <span>✓ Attorney-client privilege safe</span>
            <span>✓ Zero data transmission</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-600">
          <p className="mb-2">Your files never leave your device. Processing happens 100% locally in your browser.</p>
          <p className="text-xs text-slate-400">© 2026 PrivMD. No tracking. No cookies. No BS.</p>
        </div>
      </footer>
    </div>
  );
}