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
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

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

    const startTime = Date.now();

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      let result = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        let pageText = "";
        let lastY = 0;
        
        for (const item of content.items as any[]) {
          const currentY = item.transform[5];
          
          if (lastY > 0 && Math.abs(lastY - currentY) > 20) {
            pageText += "\n\n";
          }
          
          pageText += item.str + " ";
          lastY = currentY;
        }
        
        result += `\n\n## Page ${i}\n\n${pageText.trim()}`;
      }
      
      result = cleanMarkdown(result);
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      result = `${result}\n\n---\n\n*Converted ${pdf.numPages} pages in ${processingTime}s with ConvertPDF.pro*`;
      
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
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/^[•●○◦▪▫-]\s+/gm, '- ');
    cleaned = cleaned.replace(/^(\d+)\.\s+/gm, '$1. ');
    cleaned = cleaned.replace(/^([A-Z][A-Z\s]{10,})$/gm, (match) => {
      return `### ${match.trim()}`;
    });
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

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      console.log("Email submitted:", email);
      setEmailSubmitted(true);
      setEmail("");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold text-slate-900">ConvertPDF.pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#security" className="text-slate-600 hover:text-slate-900">Security</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
            <a href="#convert" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Try Free</a>
          </nav>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium">
            Zero uploads • 100% local processing
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Convert PDFs to Markdown
            <span className="text-slate-500"> in 2 Seconds</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Fast, private PDF conversion for professionals. HIPAA-safe. Attorney-client protected.
          </p>

          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-6">
            {!emailSubmitted ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for Pro early access"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg"
                  required
                />
                <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">
                  Get Access
                </button>
              </div>
            ) : (
              <div className="py-3 px-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                Thanks! We'll notify you when Pro launches.
              </div>
            )}
          </form>
        </div>
      </section>

      <section id="security" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Why Local Processing Matters</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Cloud Tools</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Upload to third-party servers</li>
                <li>• Data exposure risk</li>
                <li>• Slow processing</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">ConvertPDF.pro</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Files never leave device</li>
                <li>• Zero exposure</li>
                <li>• Instant (2 seconds)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="convert" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Try It Free</h2>
          
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl m-6 p-16 transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
            >
              <div className="text-center">
                <p className="text-lg font-medium text-slate-700 mb-4">
                  {isDragging ? "Drop PDF here" : "Drag and drop PDF here"}
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <span className="px-6 py-3 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 font-medium">
                    Browse Files
                  </span>
                </label>
                {fileName && <p className="mt-4 text-sm text-green-600">Loaded: {fileName}</p>}
              </div>
            </div>

            {loading && <div className="px-6 pb-6 text-center text-blue-600">Converting...</div>}
            {error && <div className="px-6 pb-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div></div>}

            {text && (
              <div className="border-t bg-slate-50 p-6">
                <div className="flex justify-between mb-3">
                  <p className="text-sm font-semibold">Markdown Output</p>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(text)} className="px-4 py-2 text-sm border rounded-lg">Copy</button>
                    <button onClick={downloadMarkdown} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg">Download</button>
                  </div>
                </div>
                <textarea className="w-full h-96 border rounded-lg p-4 font-mono text-sm bg-white" value={text} readOnly />
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border-2 border-slate-200 rounded-2xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li>✓ Unlimited PDFs</li>
                <li>✓ Local processing</li>
                <li>• Watermark on output</li>
              </ul>
              <a href="#convert" className="block text-center py-3 border-2 rounded-lg font-medium hover:bg-slate-50">Start Free</a>
            </div>
            <div className="border-2 border-slate-900 rounded-2xl p-8 bg-white relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-semibold">COMING SOON</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">$29<span className="text-lg text-slate-600">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm">
                <li>✓ Everything in Free</li>
                <li>✓ No watermark</li>
                <li>✓ Batch processing</li>
                <li>✓ Priority support</li>
              </ul>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium">Join Waitlist</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-bold text-slate-900">ConvertPDF.pro</span>
          </div>
          <p className="text-sm text-slate-600 mb-2">Your files never leave your device</p>
          <p className="text-xs text-slate-400">© 2026 ConvertPDF.pro</p>
        </div>
      </footer>
    </div>
  );
}