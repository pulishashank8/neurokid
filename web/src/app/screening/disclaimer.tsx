export default function ScreeningDisclaimer() {
    return (
        <div className="max-w-3xl mx-auto p-6 bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">⚖️ Legal Disclaimer & Important Information</h2>

            <div className="space-y-4 text-sm text-[var(--text)]">
                <section>
                    <h3 className="font-semibold mb-2">NOT A MEDICAL DIAGNOSIS</h3>
                    <p>
                        This autism screening tool is for educational and informational purposes only.
                        It is NOT a diagnostic instrument and does not replace professional medical evaluation.
                        Only qualified healthcare professionals (pediatricians, psychologists, developmental
                        specialists) can diagnose Autism Spectrum Disorder (ASD).
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">NO MEDICAL ADVICE</h3>
                    <p>
                        The information provided through this screening does not constitute medical advice,
                        diagnosis, or treatment. Always seek the advice of your physician or other qualified
                        health provider with any questions you may have regarding your child's development
                        or health condition.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">NO DOCTOR-PATIENT RELATIONSHIP</h3>
                    <p>
                        Use of this screening tool does not create a doctor-patient or professional-client
                        relationship between you and NeuroKid, its creators, or any affiliated parties.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">LIMITATION OF LIABILITY</h3>
                    <p>
                        NeuroKid and its affiliates are not liable for any direct, indirect, incidental,
                        consequential, or punitive damages resulting from your use of, or reliance on,
                        this screening tool or its results. You assume full responsibility for any actions
                        taken based on the information provided.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">INDIVIDUAL RESULTS MAY VARY</h3>
                    <p>
                        Screening results are estimates based on parent-reported observations and may not
                        accurately reflect your child's developmental status. False positives and false
                        negatives are possible with any screening tool.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">DATA PRIVACY</h3>
                    <p>
                        Individual screening answers are not stored or transmitted. Only aggregate summary
                        data (score, category, date) is optionally saved locally in your browser if you
                        choose to enable this feature.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">PROFESSIONAL EVALUATION RECOMMENDED</h3>
                    <p>
                        If you have concerns about your child's development, please consult with a qualified
                        healthcare provider for a comprehensive evaluation. Early intervention services can
                        be beneficial regardless of diagnosis.
                    </p>
                </section>

                <section>
                    <h3 className="font-semibold mb-2">EMERGENCY SITUATIONS</h3>
                    <p>
                        This tool is not for emergency use. If your child is in immediate danger or
                        experiencing a medical emergency, call 911 or your local emergency services immediately.
                    </p>
                </section>

                <section className="mt-6 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)]">
                        By using this screening tool, you acknowledge that you have read, understood,
                        and agree to this disclaimer. This screening should be used as one of many tools
                        to support informed decision-making about seeking professional evaluation.
                    </p>
                </section>
            </div>
        </div>
    );
}
