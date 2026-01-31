
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TermsOfUsePage = () => {
  return (
    <div className="container mx-auto px-4 pt-16 max-w-3xl pb-32 relative">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Terms of Use</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">Last updated: January 31, 2026</p>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">1. Identity & Contact</h2>
        <p>
          GutCheck ("Service") is operated by the Service Builder ("we", "us", or "our"), based in the Kingdom of Bahrain.
        </p>
        <p>
          <strong>Independent Operation:</strong> This Service is independently owned and operated. It is <strong>not affiliated with, endorsed by, or associated with any other corporation, employer, or organization</strong>. While we utilize technology from third-party providers (such as Google Cloud, Firebase, and Gemini), GutCheck is not an affiliate, partner, or agent of these providers.
        </p>
        <p>
          For any inquiries, data requests, or support, you may contact us at: <a href="mailto:happygut@mygutcheck.app" className="text-primary hover:underline">happygut@mygutcheck.app</a>
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">2. Eligibility & Minors</h2>
        <p>
          <strong>Age Limitation:</strong> You must be at least 13 years old to use this Service. The Service is not intended for children under 13. By using the Service, you represent and warrant that you are at least 13 years of age.
        </p>
        <p>
          We do not knowingly collect personal data from children under 13. If you believe we have inadvertently collected such data, please contact us immediately at <a href="mailto:happygut@mygutcheck.app" className="text-primary hover:underline">happygut@mygutcheck.app</a> for deletion.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">3. Medical Disclaimer</h2>
        <p className="font-bold text-destructive">
          THE SERVICE IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.
        </p>
        <p>
          GutCheck is designed for informational and educational purposes only. It is not designed to diagnose, treat, cure, or prevent any disease or medical condition.
        </p>
        <p>
          <strong>Not for Emergencies:</strong> Do not use this Service for medical emergencies. If you have a medical emergency, call your doctor or emergency services immediately.
        </p>
        <div className="bg-secondary/10 p-4 rounded-md my-4">
          <h3 className="font-semibold text-lg mb-2">AI & Data Disclaimer</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>AI Analysis:</strong> Features utilizing Artificial Intelligence (AI) may generate incorrect, misleading, or "hallucinated" information. You should never rely solely on AI analysis for dietary or health decisions.</li>
            <li><strong>Third-Party Data:</strong> We display data imported from third-party services (e.g., Apple Health, Fitbit) "AS IS". We are not responsible for the accuracy, completeness, or reliability of data provided by these external services.</li>
          </ul>
        </div>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">4. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE OPERATORS OF GUTCHECK, ITS AFFILIATES, OR THEIR RESPECTIVE EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOOD-WILL, OR OTHER INTANGIBLE LOSSES.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitation may not apply to you. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.
        </p>
        <p>
          Our total liability for any claim arising out of or relating to these Terms or the Service is limited to the greater of one dollar ($1.00) or any amount you paid us to use the Service.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">5. User Responsibilities & Termination</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account login information. We reserve the right to suspend or terminate your account at our sole discretion for any violation of these Terms.
        </p>
        <p>
          Upon termination, your right to access the Service will immediately cease. You may request the deletion of your data by contacting support or using the delete account function in the app, subject to our Privacy Notice and data retention policies.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">6. Governing Law & Language</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the <strong>Kingdom of Bahrain</strong>. Any dispute arising from these Terms shall be submitted to the exclusive jurisdiction of the competent courts in the Kingdom of Bahrain.
        </p>
        <p>
          If these Terms are translated into any other language and there is a discrepancy between the English version and the translation, the English version shall prevail.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms of Use on this page. Your continued use of the Service after any such change constitutes your acceptance of the new Terms.
        </p>
      </section>

    </div>

  );
};

export default TermsOfUsePage;
