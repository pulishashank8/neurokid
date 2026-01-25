"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  User, 
  AlertTriangle,
  Heart,
  MessageCircle,
  Pill,
  Phone,
  Stethoscope,
  FileText,
  Trash2,
  X,
  Printer,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react";

interface EmergencyCard {
  id: string;
  childName: string;
  childAge: number | null;
  diagnosis: string | null;
  triggers: string | null;
  calmingStrategies: string | null;
  communication: string | null;
  medications: string | null;
  allergies: string | null;
  emergencyContact1Name: string | null;
  emergencyContact1Phone: string | null;
  emergencyContact2Name: string | null;
  emergencyContact2Phone: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
  additionalNotes: string | null;
  createdAt: string;
}

const INITIAL_FORM = {
  childName: "",
  childAge: "",
  diagnosis: "",
  triggers: "",
  calmingStrategies: "",
  communication: "",
  medications: "",
  allergies: "",
  emergencyContact1Name: "",
  emergencyContact1Phone: "",
  emergencyContact2Name: "",
  emergencyContact2Phone: "",
  doctorName: "",
  doctorPhone: "",
  additionalNotes: "",
};

export default function EmergencyCardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [cards, setCards] = useState<EmergencyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/emergency-card");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCards();
    }
  }, [status]);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/emergency-cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/emergency-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchCards();
        setShowForm(false);
        setForm(INITIAL_FORM);
      }
    } catch (error) {
      console.error("Error creating card:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const res = await fetch(`/api/emergency-cards/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCards(cards.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  const handlePrint = (card: EmergencyCard) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Emergency Card - ${card.childName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
          .card { border: 3px solid #10b981; border-radius: 16px; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981, #14b8a6); color: white; margin: -20px -20px 20px; padding: 16px 20px; border-radius: 13px 13px 0 0; text-align: center; }
          .header h1 { font-size: 18px; margin-bottom: 4px; }
          .header p { font-size: 24px; font-weight: bold; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .section-content { font-size: 14px; color: #1f2937; line-height: 1.4; }
          .contacts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #e5e7eb; }
          .contact { background: #f3f4f6; padding: 10px; border-radius: 8px; }
          .contact-label { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
          .contact-name { font-size: 13px; font-weight: bold; color: #1f2937; }
          .contact-phone { font-size: 14px; color: #10b981; font-weight: bold; }
          .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
          @media print { body { padding: 0; } .card { border-width: 2px; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>EMERGENCY INFORMATION</h1>
            <p>${card.childName}${card.childAge ? `, Age ${card.childAge}` : ""}</p>
          </div>
          
          ${card.diagnosis ? `<div class="section"><div class="section-title">Diagnosis</div><div class="section-content">${card.diagnosis}</div></div>` : ""}
          ${card.triggers ? `<div class="section"><div class="section-title">Triggers to Avoid</div><div class="section-content">${card.triggers}</div></div>` : ""}
          ${card.calmingStrategies ? `<div class="section"><div class="section-title">Calming Strategies</div><div class="section-content">${card.calmingStrategies}</div></div>` : ""}
          ${card.communication ? `<div class="section"><div class="section-title">Communication</div><div class="section-content">${card.communication}</div></div>` : ""}
          ${card.medications ? `<div class="section"><div class="section-title">Medications</div><div class="section-content">${card.medications}</div></div>` : ""}
          ${card.allergies ? `<div class="section"><div class="section-title">Allergies</div><div class="section-content">${card.allergies}</div></div>` : ""}
          ${card.additionalNotes ? `<div class="section"><div class="section-title">Additional Notes</div><div class="section-content">${card.additionalNotes}</div></div>` : ""}
          
          <div class="contacts">
            ${card.emergencyContact1Name ? `
              <div class="contact">
                <div class="contact-label">Emergency Contact 1</div>
                <div class="contact-name">${card.emergencyContact1Name}</div>
                <div class="contact-phone">${card.emergencyContact1Phone || "N/A"}</div>
              </div>
            ` : ""}
            ${card.emergencyContact2Name ? `
              <div class="contact">
                <div class="contact-label">Emergency Contact 2</div>
                <div class="contact-name">${card.emergencyContact2Name}</div>
                <div class="contact-phone">${card.emergencyContact2Phone || "N/A"}</div>
              </div>
            ` : ""}
            ${card.doctorName ? `
              <div class="contact">
                <div class="contact-label">Doctor</div>
                <div class="contact-name">${card.doctorName}</div>
                <div class="contact-phone">${card.doctorPhone || "N/A"}</div>
              </div>
            ` : ""}
          </div>
          
          <div class="footer">Created with NeuroKid</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold mb-2">
              <CreditCard className="w-4 h-4" />
              Emergency Ready
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Emergency Info Cards</h1>
            <p className="text-[var(--muted)] mt-1">Create printable cards for teachers, babysitters, and caregivers</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Card
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
                <h2 className="text-xl font-bold text-[var(--text)]">Create Emergency Card</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/20 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200/80">
                    <strong>Tip:</strong> Fill in as much as you can. This card will help caregivers understand your child's needs quickly.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Child's Name *
                    </label>
                    <input
                      type="text"
                      value={form.childName}
                      onChange={(e) => setForm({ ...form, childName: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={form.childAge}
                      onChange={(e) => setForm({ ...form, childAge: e.target.value })}
                      min="0"
                      max="25"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Age in years"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="e.g., Autism Spectrum Disorder, ADHD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Triggers to Avoid
                  </label>
                  <textarea
                    value={form.triggers}
                    onChange={(e) => setForm({ ...form, triggers: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Loud noises, bright lights, crowds, sudden changes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <Heart className="w-4 h-4 inline mr-2" />
                    Calming Strategies
                  </label>
                  <textarea
                    value={form.calmingStrategies}
                    onChange={(e) => setForm({ ...form, calmingStrategies: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Deep pressure, quiet space, favorite toy, counting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Communication Style
                  </label>
                  <textarea
                    value={form.communication}
                    onChange={(e) => setForm({ ...form, communication: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Uses AAC device, nonverbal, needs extra processing time..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <Pill className="w-4 h-4 inline mr-2" />
                      Medications
                    </label>
                    <textarea
                      value={form.medications}
                      onChange={(e) => setForm({ ...form, medications: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="List any medications..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Allergies
                    </label>
                    <textarea
                      value={form.allergies}
                      onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Food, medication, or other allergies..."
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-6">
                  <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[var(--primary)]" />
                    Emergency Contacts
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={form.emergencyContact1Name}
                        onChange={(e) => setForm({ ...form, emergencyContact1Name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Contact 1 Name"
                      />
                      <input
                        type="tel"
                        value={form.emergencyContact1Phone}
                        onChange={(e) => setForm({ ...form, emergencyContact1Phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Contact 1 Phone"
                      />
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={form.emergencyContact2Name}
                        onChange={(e) => setForm({ ...form, emergencyContact2Name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Contact 2 Name"
                      />
                      <input
                        type="tel"
                        value={form.emergencyContact2Phone}
                        onChange={(e) => setForm({ ...form, emergencyContact2Phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Contact 2 Phone"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                    Doctor Information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={form.doctorName}
                      onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Doctor's Name"
                    />
                    <input
                      type="tel"
                      value={form.doctorPhone}
                      onChange={(e) => setForm({ ...form, doctorPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Doctor's Phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Additional Notes
                  </label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Anything else caregivers should know..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-5 py-3 rounded-xl bg-[var(--surface2)] text-[var(--text)] font-medium hover:bg-[var(--surface2)]/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-5 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Creating..." : "Create Card"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--surface2)] flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">No cards created yet</h3>
            <p className="text-[var(--muted)] mb-6">Create emergency info cards to share with caregivers</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Card
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-premium hover:shadow-lg transition-all"
              >
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                        {card.childName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text)] text-lg">{card.childName}</h3>
                        <p className="text-sm text-[var(--muted)]">
                          {card.childAge ? `Age ${card.childAge}` : "Age not specified"}
                          {card.diagnosis && ` • ${card.diagnosis}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrint(card); }}
                        className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--primary)] transition-colors"
                        title="Print card"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                        title="Delete card"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {expandedCard === card.id ? (
                        <ChevronUp className="w-5 h-5 text-[var(--muted)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--muted)]" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedCard === card.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-[var(--border)] space-y-4">
                    {card.triggers && (
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Triggers</p>
                        <p className="text-sm text-[var(--text)]">{card.triggers}</p>
                      </div>
                    )}
                    {card.calmingStrategies && (
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Calming Strategies</p>
                        <p className="text-sm text-[var(--text)]">{card.calmingStrategies}</p>
                      </div>
                    )}
                    {card.communication && (
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Communication</p>
                        <p className="text-sm text-[var(--text)]">{card.communication}</p>
                      </div>
                    )}
                    {(card.medications || card.allergies) && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {card.medications && (
                          <div>
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Medications</p>
                            <p className="text-sm text-[var(--text)]">{card.medications}</p>
                          </div>
                        )}
                        {card.allergies && (
                          <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Allergies</p>
                            <p className="text-sm text-[var(--text)]">{card.allergies}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {(card.emergencyContact1Name || card.doctorName) && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {card.emergencyContact1Name && (
                          <div className="px-3 py-2 bg-[var(--surface2)] rounded-lg">
                            <p className="text-xs text-[var(--muted)]">Emergency Contact</p>
                            <p className="text-sm font-medium text-[var(--text)]">{card.emergencyContact1Name}</p>
                            {card.emergencyContact1Phone && (
                              <p className="text-sm text-[var(--primary)]">{card.emergencyContact1Phone}</p>
                            )}
                          </div>
                        )}
                        {card.doctorName && (
                          <div className="px-3 py-2 bg-[var(--surface2)] rounded-lg">
                            <p className="text-xs text-[var(--muted)]">Doctor</p>
                            <p className="text-sm font-medium text-[var(--text)]">{card.doctorName}</p>
                            {card.doctorPhone && (
                              <p className="text-sm text-[var(--primary)]">{card.doctorPhone}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/20 p-5">
          <p className="text-sm text-amber-800 dark:text-amber-200/80 text-center">
            <strong>Tip:</strong> Print these cards and share them with teachers, babysitters, and family members so they know how to support your child.
          </p>
        </div>
      </div>
    </div>
  );
}
