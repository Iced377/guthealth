
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 pt-16 pb-32 relative">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Privacy Notice</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Introduction & Identity</h2>
        <p>
          Welcome to GutCheck. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy notice explains how we collect, use, share, and protect your personal information when you use our application.
        </p>
        <p className="mt-2 text-primary font-medium">
          The Service Builder is the Data Manager/Controller of your personal data.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Collection & Sensitive Personal Data</h2>
        <p>
          We collect various types of information to provide our services. <strong>Important:</strong> Some of this data is classified as <strong>Sensitive Personal Data</strong>.
        </p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li><strong>Sensitive Personal Data:</strong> Health-related information you provide or sync, including dietary habits, symptoms, food logs, body composition data, and other health metrics.</li>
          <li><strong>Account Information:</strong> Email and profile details provided during signup (via Google or Apple Sign-In).</li>
          <li><strong>Device & Usage Data:</strong> Automatically collected technical data such as log files, IP address, device type, and app usage patterns.</li>
          <li><strong>Wearable Device Data:</strong> If authorized, we sync data from third-party services (e.g., Apple Health, Fitbit) like health and activity data.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Legal Basis & Consent</h2>
        <p>
          We process your personal data based on your explicit consent, which you provide when you register an account and when you enable specific features (such as AI analysis or health integrations). You have the right to withdraw your consent at any time by submitting a request in our contact us page, though this will limit the application's functionality.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Health & Fitness Integrations</h2>
        <p>
          To provide a holistic view of your health, our application integrates with third-party health platforms. Data is only accessed with your explicit permission.
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
          <li>
            <strong>Apple Health (iOS Only):</strong> If enabled, we read generic health and activity data from Apple Health solely to display activity trends. You can manage or revoke permissions in iOS Settings.
          </li>
          <li>
            <strong>Fitbit:</strong> If connected, we use the Fitbit Web API to securely fetch activity and body composition data. We store OAuth tokens securely and strictly for this connection. You can revoke access via Fitbit or GutCheck settings.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">AI Features & Processing</h2>
        <p>
          We use <strong>Google Gemini</strong> to provide AI-powered food analysis and insights.
        </p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>
            <strong>Data Processing:</strong> When you use AI features (e.g., "Analyze Meal"), relevant data (meal descriptions, context) is sent to Google's API for processing.
          </li>
          <li>
            <strong>Training & Liability:</strong> The use of your data for model training is governed entirely by <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Terms of Service</a> and <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Generative AI Additional Terms</a>. We are not responsible for Google's data handling practices and disclaim all liability regarding their use of your data.
          </li>
          <li>
            <strong>Consent:</strong> By using these AI features, you consent to sending your data to Google and acknowledge that their terms apply.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">International Data Transfers</h2>
        <p>
          Your personal data may be transferred to and processed Internationally, specifically where our service providers operate (e.g., Google Cloud/Firebase servers).
        </p>
        <p className="mt-2">
          We ensure such transfers comply with applicable laws by relying on major cloud providers who maintain robust security certifications (such as ISO 27001) to safeguard your rights.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share your information:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>With service providers (cloud hosting, analytics) bound by confidentiality.</li>
          <li>To comply with legal obligations or valid legal process.</li>
          <li>In connection with a merger or acquisition.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Security & Retention</h2>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>
            <strong>Security:</strong> We use encryption in transit (SSL/TLS) and at rest (Google Cloud encryption), along with strict access controls via Firebase Authentication.
          </li>
          <li>
            <strong>Retention:</strong> We retain your data only for as long as your account is active. If you request account deletion, your personal data will be deleted from our active databases, typically within 30-90 days. <strong>Disclaimer:</strong> We may be required to retain certain data even after an erasure request for a limited period to comply with legal obligations, prevent fraud, or for legitimate business interests (such as resolving disputes or enforcing our terms).
          </li>
        </ul>
        <p className="mt-2">
          No system is impenetrable. While we strive for high security, we cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">User Rights</h2>
        <p>
          You have specific rights regarding your data:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li><strong>Right to Access:</strong> You can download a copy of your data via the "Download My Data" feature in the User Center.</li>
          <li><strong>Right to Rectification:</strong> You can request corrections by contacting us.</li>
          <li><strong>Right to Erasure:</strong> You can request account deletion by contacting us or via the app settings.</li>
          <li><strong>Right to Withdraw Consent:</strong> You can stop using specific features or submit a request in our contact us page.</li>
        </ul>
        <p className="mt-2">
          We aim to respond to data rights requests within 30 days. We may request proof of identity to verify your request.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cookies & Local Storage</h2>
        <p>
          Our application uses device/app storage (e.g., `localStorage`, `IndexedDB`) and Firebase Authentication tokens to maintain your login session and preferences (like theme settings). We use identifiers (like IDFA on iOS) for analytics purposes only with your explicit consent (via App Tracking Transparency), which may be classified as tracking.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Changes to This Notice</h2>
        <p>
          We may update this privacy notice. Significant changes will be communicated through the app or this page.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
        <p>
          If you have any questions about your privacy rights or this notice, please contact us at:
        </p>
        <a href="mailto:happygut@mygutcheck.app" className="block mt-2 text-primary text-lg font-medium hover:underline">happygut@mygutcheck.app</a>
      </section>

      <div className="mt-8 text-sm text-gray-500">
        <p>Last updated: January 31, 2026</p>
      </div>

    </div>
  );
};

export default PrivacyPage;
