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
      result = `${result}\n\n---\n\n*Converted ${pdf.numPages} pages in ${processingTime}s with ConvertPDF.pro - 100% Local Processing*`;
      
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
      // TODO: Send to your email service (Mailchimp, ConvertKit, etc.)
      console.log("Email submitted:", email);
      setEmailSubmitted(true);
      setEmail("");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold text-slate-900">ConvertPDF.pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="text-slate-600 hover:text-slate-900">How It Works</a>
            <a href="#security" className="text-slate-600 hover:text-slate-900">Security</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
            <a href="#convert" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
              Try Free
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium">
            ✓ Zero uploads • Processing happens in your browser
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Convert Sensitive PDFs<br/>to Markdown
            <span className="text-slate-500"> in 2 Seconds</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            The fastest local PDF converter for professionals handling confidential documents.
            HIPAA-safe. Attorney-client protected. No data ever leaves your device.
          </p>

          {/* Email Capture */}
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-6">
            {!emailSubmitted ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for Pro early access"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium whitespace-nowrap"
                >
                  Get Access
                </button>
              </div>
            ) : (
              <div className="py-3 px-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✓ Thanks! We'll notify you when Pro launches.
              </div>
            )}
          </form>

          <p className="text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y bg-slate-50 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-slate-500 mb-6">Trusted by professionals in regulated industries</p>
          <div className="grid grid-cols-3 gap-8 items-center justify-items-center text-slate-400">
            <div className="text-center">
              <div className="text-2xl mb-1">⚖️</div>
              <div className="text-xs font-medium">Legal Firms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🏥</div>
              <div className="text-xs font-medium">Healthcare</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💼</div>
              <div className="text-xs font-medium">Finance</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Drop Your PDF</h3>
              <p className="text-slate-600">
                Drag and drop any PDF file. Your file stays on your device - never uploaded.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Instant Processing</h3>
              <p className="text-slate-600">
                Converted in ~2 seconds using advanced browser-based processing. No server delays.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Download Markdown</h3>
              <p className="text-slate-600">
                Get clean, formatted Markdown with preserved structure, headings, and lists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Local Processing */}
      <section id="security" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Why Local Processing Matters
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Most PDF converters upload your files to their servers. We never do.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">❌ Traditional Cloud Tools</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Upload files to third-party servers</li>
                <li>• Data exposure risk</li>
                <li>• Slow queue processing</li>
                <li>• Not HIPAA compliant</li>
                <li>• Can't handle attorney-client privilege</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">✓ ConvertPDF.pro</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Files never leave your device</li>
                <li>• Zero data exposure</li>
                <li>• Instant processing (2 seconds)</li>
                <li>• HIPAA-safe workflow</li>
                <li>• Attorney-client privilege protected</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Built for Professionals
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Legal Firms</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Discovery documents</li>
                <li>• Client contracts</li>
                <li>• Case files</li>
                <li>• Attorney work product</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Healthcare</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Patient records</li>
                <li>• Medical charts</li>
                <li>• Lab results</li>
                <li>• Insurance forms</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Finance</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Earnings reports</li>
                <li>• SEC filings</li>
                <li>• Audit documents</li>
                <li>• Client agreements</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Converter Tool */}
      <section id="convert" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            Try It Free
          </h2>
          <p className="text-center text-slate-600 mb-12">
            No signup required. Start converting immediately.
          </p>

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
                  Converting...
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
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">
            Simple Pricing
          </h2>
          <p className="text-center text-slate-600 mb-12">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Free */}
            <div className="border-2 border-slate-200 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-slate-900 mb-1">$0</div>
                <p className="text-sm text-slate-600">Perfect for occasional use</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Unlimited PDFs</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>100% local processing</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Up to 50 pages per PDF</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="mt-0.5">•</span>
                  <span>Watermark on output</span>
                </li>
              </ul>
              
              <a href="#convert" className="block w-full py-3 text-center border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition">
                Start Free
              </a>
            </div>

            {/* Pro */}
            <div className="border-2 border-slate-900 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-semibold">
                COMING SOON
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-slate-900 mb-1">$29<span className="text-lg text-slate-600">/mo</span></div>
                <p className="text-sm text-slate-600">For professionals</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong>Everything in Free, plus:</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>No watermark</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Unlimited pages</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Advanced table extraction</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Batch processing (50+ PDFs)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">
                Is my data really safe?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Yes. Your PDF files are processed entirely in your browser using JavaScript. No data is ever uploaded to our servers. We literally cannot access your files.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">
                How fast is the conversion?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Most PDFs convert in 2-3 seconds. Complex documents with many pages may take slightly longer, but it's still instant compared to cloud-based tools that queue your files.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">
                What's the difference between Free and Pro?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Free includes unlimited conversions with a watermark and 50-page limit. Pro removes watermarks, handles unlimited pages, adds batch processing, and includes advanced table extraction.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">
                Is this HIPAA compliant?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Because no data is transmitted or stored on our servers, using ConvertPDF.pro is inherently HIPAA-safe for handling Protected Health Information (PHI). Your data never leaves your device.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">
                Can I use this for attorney-client privileged documents?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Yes. Since processing happens locally in your browser, attorney-client privilege is maintained. No third party ever has access to your documents.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Convert Securely?
          </h2>
          <p className="text-slate-300 mb-8">
            Join professionals who trust ConvertPDF.pro for sensitive document processing.
          </p>
          
            href="#convert"
            className="inline-block px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition"
          >
            Try Free Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <span className="font-bold text-slate-900">ConvertPDF.pro</span>
              </div>
              <p className="text-sm text-slate-600">
                The fastest local PDF to Markdown converter.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#how" className="hover:text-slate-900">How It Works</a></li>
                <li><a href="#security" className="hover:text-slate-900">Security</a></li>
                <li><a href="#pricing" className="hover:text-slate-900">Pricing</a></li>
                <li><a href="#convert" className="hover:text-slate-900">Try Free</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact</a></li>
                <li><a href="#" className="hover:text-slate-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Connect</h4>
              <p className="text-sm text-slate-600 mb-3">
                Questions? We're here to help.
              </p>
              <a href="mailto:hello@convertpdf.pro" className="text-sm text-slate-900 hover:underline">
                hello@convertpdf.pro
              </a>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-sm text-slate-600">
            <p>© 2026 ConvertPDF.pro. Your files never leave your device.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}