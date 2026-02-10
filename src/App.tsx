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

  async function handleFile(file) {
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
        for (const item of content.items) {
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
      setError("Failed to parse PDF");
    } finally {
      setLoading(false);
    }
  }

  function cleanMarkdown(text) {
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

  function handleDrop(e) {
    e.preventDefault();
    setIsDragg    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    if (email) {
      console.log("Email:", email);
      setEmailSubmitted(true);
      setEmail("");
    }
  }

  function clearAll() {
    setFileName("");
    setText("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold text-slate-900">ConvertPDF.pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#security" className="text-slate-600 hover:text-slate-900">Security</a>
            <a href="#workflows" className="text-slate-600 hover:text-slate-900">Use Cases</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
            <a href="#convert" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Try Free</a>
          </nav>
        </div>
      </header>
      <section className="py-16 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium">
            🔒 Zero uploads • 100% local • Full audit trail
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Secure Document Processing<br/><span className="text-sla">for Regulated Professionals</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Process confidential files locally. No uploads. No cloud.
          </p>
          <div className="flex gap-3 justify-center mb-4">
            <a href="#convert" className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">Try Free Now</a>
            <a href="mailto:support@convertpdf.pro" className="px-6 py-3 border-2 border-slate-900 text-slate-900 rounded-lg hover:bg-slate-50 font-medium">Request Demo</a>
          </div>
          <p className="text-sm text-slate-500">No credit card required</p>
        </div>
      </section>
    </div>
  );
}
