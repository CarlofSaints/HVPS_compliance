"use client";

import { useAuth, authFetch } from "@/lib/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function NewSpendPage() {
  const { session, loading } = useAuth("submit_spend");
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [quotes, setQuotes] = useState<(File | null)[]>([null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleQuoteChange = (index: number, file: File | null) => {
    const updated = [...quotes];
    updated[index] = file;
    setQuotes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("description", description);
    formData.append("estimatedAmount", estimatedAmount);

    quotes.forEach((quote, i) => {
      if (quote) {
        formData.append(`quote${i + 1}`, quote);
      }
    });

    const res = await authFetch("/api/spend", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/spend/${data.id}`);
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Submission failed", type: "error" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">New Spend Application</h1>
        <p className="text-gray-500 text-sm">Submit a spend request for SGB approval</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="e.g. Classroom Painting"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe the project, justification, and expected outcomes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Amount (ZAR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                R
              </span>
              <input
                type="number"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quotes (up to 4)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <label className="block text-xs text-gray-500 mb-1">
                    Quote {i + 1}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={(e) =>
                      handleQuoteChange(i, e.target.files?.[0] || null)
                    }
                    className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {quotes[i] && (
                    <p className="text-xs text-primary mt-1 truncate">
                      {quotes[i]!.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
