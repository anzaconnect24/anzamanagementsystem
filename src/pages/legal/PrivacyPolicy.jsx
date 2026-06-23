"use client";

import LegalPageLayout, { LegalSection } from "./LegalPageLayout";

const PrivacyPolicy = () => {
  return (
    <LegalPageLayout
      badge="Legal"
      title="Privacy Policy"
      subtitle="How Anza Connect collects, uses, shares, and protects your personal information when you use our platform."
      updatedAt="June 23, 2026"
    >
      <p className="text-[15px] leading-7 text-gray-600">
        This Privacy Policy explains how Anza Connect ("Anza Connect", "we",
        "us", or "our") handles personal information when you use our websites,
        applications, and related services (collectively, the "Platform"). By
        using the Platform, you agree to the practices described here.
      </p>

      <LegalSection index="1" title="Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-gray-800">
              Account information
            </span>{" "}
            — such as your name, email address, phone number, role, and profile
            picture.
          </li>
          <li>
            <span className="font-semibold text-gray-800">
              Business and profile information
            </span>{" "}
            — details about your business, sector, location, documents, and
            assessments you submit.
          </li>
          <li>
            <span className="font-semibold text-gray-800">
              Program and activity data
            </span>{" "}
            — milestones, KPIs, grants, mentorship, coaching sessions, and
            related records.
          </li>
          <li>
            <span className="font-semibold text-gray-800">
              Usage and device data
            </span>{" "}
            — log data, device and browser information, and interactions with
            the Platform.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="2" title="How We Use Your Information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, operate, maintain, and improve the Platform;</li>
          <li>Create and manage your account and verify your identity;</li>
          <li>
            Facilitate programs, grants, assessments, mentorship, and investor
            connections;
          </li>
          <li>
            Communicate with you about updates, security alerts, and support;
          </li>
          <li>
            Protect the Platform, prevent fraud, and comply with legal
            obligations.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="3" title="How We Share Information">
        <p>
          We share information only as needed to operate the Platform and
          deliver its services, including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            With authorized participants based on your role — for example,
            mentors, business development advisors, reviewers, finance officers,
            investors, or program administrators where relevant;
          </li>
          <li>
            With service providers who process data on our behalf (such as
            hosting, file storage, and analytics) under appropriate
            confidentiality obligations;
          </li>
          <li>
            When required by law, regulation, legal process, or to protect the
            rights, safety, and security of Anza Connect and its users.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection index="4" title="Data Retention">
        <p>
          We retain personal information for as long as your account is active
          or as needed to provide the Platform, comply with legal obligations,
          resolve disputes, and enforce our agreements. When information is no
          longer needed, we take reasonable steps to delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection index="5" title="Security">
        <p>
          We implement reasonable technical and organizational measures designed
          to protect personal information against unauthorized access, loss, or
          misuse. However, no method of transmission or storage is completely
          secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection index="6" title="Your Rights and Choices">
        <p>
          Depending on your location, you may have rights to access, correct,
          update, or delete your personal information, or to object to or
          restrict certain processing. You can update much of your information
          directly from your account settings, or contact us to exercise your
          rights.
        </p>
      </LegalSection>

      <LegalSection index="7" title="Cookies and Similar Technologies">
        <p>
          We use cookies and similar technologies to keep you signed in,
          remember preferences, and understand how the Platform is used. You can
          control cookies through your browser settings, though some features
          may not function properly without them.
        </p>
      </LegalSection>

      <LegalSection index="8" title="Third-Party Services">
        <p>
          The Platform may integrate third-party services (such as
          authentication, storage, or analytics providers). Their handling of
          your information is governed by their own privacy policies, and we
          encourage you to review them.
        </p>
      </LegalSection>

      <LegalSection index="9" title="Children's Privacy">
        <p>
          The Platform is not intended for individuals under 18 years of age. We
          do not knowingly collect personal information from children. If you
          believe a child has provided us information, please contact us so we
          can remove it.
        </p>
      </LegalSection>

      <LegalSection index="10" title="International Transfers">
        <p>
          Your information may be processed and stored in countries other than
          your own. Where required, we take steps to ensure appropriate
          safeguards are in place for such transfers.
        </p>
      </LegalSection>

      <LegalSection index="11" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will revise the "Last updated" date above. Your continued use of the
          Platform after changes become effective constitutes acceptance of the
          revised policy.
        </p>
      </LegalSection>

      <LegalSection index="12" title="Contact Us">
        <p>
          If you have questions or requests regarding this Privacy Policy or your
          personal information, contact us at{" "}
          <a
            href="mailto:info@anzaconnect.co.tz"
            className="font-semibold text-[#082d77] hover:underline"
          >
            info@anzaconnect.co.tz
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
