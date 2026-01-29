
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

      <p className="text-sm text-muted-foreground mb-6">Last updated: January 29, 2026</p>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">1. Acceptance of Terms</h2>
        <p>
          By accessing, downloading, or using the GutCheck application ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms constitute a legal agreement between you and the operators of GutCheck.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">2. Description of Service & Eligibility</h2>
        <p>
          GutCheck is an <strong>independent application</strong> designed for food journaling and health tracking. This is an early-stage tool provided for personal use.
        </p>
        <p>
          <strong>Independent Status:</strong> This application is a personal project and is <strong>not affiliated with, endorsed by, or associated with any corporation, organization, or employer</strong>. The views, opinions, and functionality expressed herein are solely those of the individual creator.
        </p>
        <p>
          <strong>Age Limitation:</strong> You must be at least 13 years old to use this Service. The Service is not intended for children under 13. By using the Service, you represent and warrant that you are at least 13 years of age.
        </p>
        <p>
          GutCheck allows users to log food intake and personal symptoms, and it uses artificial intelligence to provide analysis, such as potential FODMAP content, nutritional estimates, and other health-related indicators.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">3. No Medical Advice - Disclaimer of Warranties</h2>
        <p className="font-bold text-destructive">
          THE SERVICE IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE.
        </p>
        <p>
          GutCheck is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
        <div className="bg-secondary/10 p-4 rounded-md my-4">
          <h3 className="font-semibold text-lg mb-2">AI & Data Disclaimer</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>AI Analysis:</strong> Features utilizing Artificial Intelligence (AI) may generate incorrect, misleading, or "hallucinated" information. You should never rely solely on AI analysis for dietary or health decisions.</li>
            <li><strong>Third-Party Data:</strong> We display data imported from third-party services (e.g., Apple Health, Fitbit) "AS IS". We are not responsible for the accuracy, completeness, or reliability of data provided by these external services.</li>
          </ul>
        </div>
        <p>
          The Service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, express or implied.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">4. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE OPERATORS OF GUTCHECK, ITS AFFILIATES, OR THEIR RESPECTIVE EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOOD-WILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Your access to or use of or inability to access or use the Service.</li>
          <li>Any information, analysis, or content obtained from the Service, and any reliance you place on such information.</li>
          <li>Any personal injury or property damage resulting from your use of the Service.</li>
          <li>Any unauthorized access to or use of our servers and/or any and all personal information stored therein.</li>
        </ul>
        <p>
          Our total liability for any claim arising out of or relating to these Terms or the Service is limited to the greater of one dollar ($1.00) or any amount you paid us to use the Service.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">5. User Responsibilities & Termination</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account login information and are fully responsible for all activities that occur under your account. You agree to use the Service in compliance with all applicable laws.
        </p>
        <p>
          We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold mb-2 border-b pb-2">6. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the <strong>Kingdom of Bahrain</strong>, without regard to its conflict of law provisions. Any dispute arising from these Terms or the use of the Service shall be submitted to the exclusive jurisdiction of the competent courts in the Kingdom of Bahrain.
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
