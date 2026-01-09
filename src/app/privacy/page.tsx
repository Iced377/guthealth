
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <h1 className="text-3xl font-bold mb-6">Privacy Notice</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
        <p>
          Welcome to GutCheck! We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy notice explains how we collect, use, share, and protect your personal information when you use our application. Please note that this is a test project that is not currently intended for commercial use.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Collection</h2>
        <p>
          We collect various types of information in connection with the services we provide, including:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Information you provide directly (e.g., when you create an account, log meals, report symptoms).</li>
          <li>Data collected automatically (e.g., usage data, device information, IP address).</li>
          <li>Information from third-party sources (e.g., if you log in via a third-party service).</li>
        </ul>
        <p className="mt-2">
          Specifically, this may include health-related information, dietary habits, and other sensitive data that you choose to share with us to enable personalized insights and recommendations.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Usage</h2>
        <p>
          Your data is used to:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Provide, maintain, and improve our services.</li>
          <li>Personalize your experience and offer tailored recommendations.</li>
          <li>Communicate with you about your account or our services.</li>
          <li>Conduct research and analysis to better understand our users and improve our application.</li>
          <li>Ensure the security of our platform.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">AI Features & Third-Party Processing</h2>
        <p>
          Our application utilizes advanced artificial intelligence (AI) to provide comprehensive food analysis and personalized insights. Specifically, we use <strong>Google Gemini</strong> as our AI provider.
        </p>
        <ul className="list-disc list-inside ml-4 mt-2">
          <li>
            <strong>Data Processing:</strong> When you use features such as "Analyze Meal" or "Personal Dietitian", relevant data (including your meal descriptions, recent food logs, and profile context) is sent to Google's Gemini API for processing.
          </li>
          <li>
            <strong>Privacy Assurance:</strong> We use the enterprise/developer standard for the Gemini API. According to Google's API Data Governance terms, data submitted to the API is <strong>not used to train their models</strong>. Your data is processed solely to generate the response for your request.
          </li>
          <li>
            <strong>Transparency:</strong> We only send data to the AI service when you explicitly interact with AI-powered features.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share your information in the following circumstances:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>With your consent.</li>
          <li>With service providers who assist us in our operations (e.g., cloud hosting, analytics). These providers are bound by confidentiality obligations.</li>
          <li>For legal reasons (e.g., to comply with a subpoena or other legal process).</li>
          <li>In connection with a sale, merger, or acquisition of all or part of our company.</li>
          <li>Aggregated or anonymized data may be shared for research or statistical purposes.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Security</h2>
        <p>
          We are committed to protecting your data and implement robust security measures. These measures include, but are not limited to:
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>
            <strong>Authentication and Access Control:</strong> We utilize Firebase Authentication for secure user management. Access to your data within our database (Firestore) is strictly controlled by server-side Firestore Security Rules, ensuring users can only access their own information.
          </li>
          <li>
            <strong>Data Encryption:</strong> Your data is encrypted in transit using industry-standard SSL/TLS protocols. Data stored in Firestore is encrypted at rest by Google Cloud.
          </li>
          <li>
            <strong>Secure Cloud Infrastructure:</strong> Our application is built on Google Cloud Platform (Firebase), which provides a secure and reliable infrastructure with comprehensive security controls and compliance certifications.
          </li>
          <li>
            <strong>Principle of Least Privilege:</strong> Our system architecture adheres to the principle of least privilege, meaning components and services are granted only the minimum access necessary to perform their functions.
          </li>
          <li>
            <strong>Regular Reviews:</strong> We aim to regularly review and update our security practices to adapt to new threats and best practices.
          </li>
        </ul>
        <p className="mt-2">
          Despite these measures, please remember that no system is completely impenetrable, and we cannot guarantee the absolute security of your information. We continuously strive to enhance our security practices.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">User Rights</h2>
        <p>
          You have certain rights regarding your personal data, including:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>The right to access your data.</li>
          <li>The right to correct inaccuracies in your data.</li>
          <li>The right to request deletion of your data.</li>
          <li>The right to object to or restrict certain processing activities.</li>
          <li>The right to data portability.</li>
        </ul>
        <p className="mt-2">
          You can exercise your right to access and portability directly within the app by using the "Download My Data" feature in the User Center. for other rights, please contact us through the support channels provided in the app.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cookies and Tracking Technologies</h2>
        <p>
          Our application uses essential data storage mechanisms like browser `localStorage` and technologies employed by Firebase Authentication to ensure functionality and enhance your experience. We do not use cookies for third-party advertising or extensive cross-site tracking.
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>
            <strong>Firebase Authentication:</strong> To manage your login sessions securely and remember your authentication state, Firebase Authentication utilizes browser storage mechanisms (such as `localStorage` or `IndexedDB`). These are essential for the application to function correctly for logged-in users.
          </li>
          <li>
            <strong>User Preferences:</strong> We use `localStorage` to remember your preferences, such as your theme choice (light/dark mode) and your cookie consent status. This helps provide a consistent experience across your visits without tracking you across other sites.
          </li>
        </ul>
        <p className="mt-2">
          You can typically manage settings related to browser storage and cookies through your browser's privacy settings. Disabling certain essential storage mechanisms may affect the application's functionality, particularly login persistence.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Changes to This Privacy Notice</h2>
        <p>
          We may update this privacy notice from time to time. We will notify you of any significant changes by posting the new notice on this page and, where appropriate, through other channels.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
        <p>
          If you have any questions or concerns about this privacy notice or our data practices, please contact us via the green feedback button.
        </p>
      </section>

      <div className="mt-8 text-sm text-gray-500">
        <p>Last updated: January 09, 2026</p>
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link href="/?openDashboard=true">
            <Home className="mr-2 h-4 w-4" /> Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default PrivacyPage;
