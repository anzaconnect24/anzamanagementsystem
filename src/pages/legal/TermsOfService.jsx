"use client";

import LegalPageLayout, { LegalSection } from "./LegalPageLayout";

const TermsOfService = () => {
  return (
    <LegalPageLayout
      badge="Legal"
      title="Terms of Service"
      subtitle="The terms that govern your access to and use of the Anza Connect platform. Please read them carefully before using our services."
      updatedAt="June 23, 2026"
    >
      <p className="text-[15px] leading-7 text-gray-600">
        These Terms of Service ("Terms") form a binding agreement between you
        and Anza Connect ("Anza Connect", "we", "us", or "our") and govern your
        use of our websites, applications, and related services (collectively,
        the "Platform"). By creating an account or otherwise using the Platform,
        you agree to be bound by these Terms.
      </p>

      <LegalSection index="1" title="Acceptance of Terms">
        <p>
          By accessing or using the Platform, you confirm that you have read,
          understood, and agree to these Terms and our Privacy Policy. If you do
          not agree, you must not use the Platform. If you are using the Platform
          on behalf of an organization, you represent that you are authorized to
          bind that organization to these Terms.
        </p>
      </LegalSection>

      <LegalSection index="2" title="Eligibility and Accounts">
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to use the Platform. You agree to provide accurate, current,
          and complete information when creating an account and to keep it up to
          date.
        </p>
        <p>
          You are responsible for safeguarding your login credentials and for
          all activity that occurs under your account. Notify us immediately of
          any unauthorized use or security breach.
        </p>
      </LegalSection>

      <LegalSection index="3" title="User Roles and Responsibilities">
        <p>
          The Platform serves different participants in the entrepreneurial
          ecosystem, including entrepreneurs, investors, mentors, business
          development advisors, finance officers, and administrators. Certain
          features, content, and obligations depend on your role.
        </p>
        <p>
          You agree to use the Platform consistent with your role and to provide
          truthful information about yourself, your business, and any documents
          or assessments you submit.
        </p>
      </LegalSection>

      <LegalSection index="4" title="Acceptable Use">
        <p>You agree that you will not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Violate any applicable law or regulation, or infringe the rights of
            others;
          </li>
          <li>
            Submit false, misleading, fraudulent, or impersonating information;
          </li>
          <li>
            Upload malware or attempt to gain unauthorized access to the
            Platform or other users' accounts or data;
          </li>
          <li>
            Disrupt, overload, or interfere with the integrity or performance of
            the Platform;
          </li>
          <li>
            Use the Platform to harass, defame, or harm any person or
            organization.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="5" title="Content and Intellectual Property">
        <p>
          You retain ownership of the content, documents, and information you
          submit ("User Content"). You grant Anza Connect a non-exclusive,
          worldwide license to host, process, and display your User Content
          solely to operate and improve the Platform and deliver its services
          to you and authorized participants (for example, mentors, reviewers,
          investors, or program administrators where applicable).
        </p>
        <p>
          All Platform software, designs, trademarks, and other materials owned
          by Anza Connect remain our property and may not be copied or used
          without our prior written consent.
        </p>
      </LegalSection>

      <LegalSection index="6" title="Programs, Grants, and Mentorship">
        <p>
          The Platform may facilitate access to programs, grants, assessments,
          mentorship, and investor connections. Participation may be subject to
          additional eligibility criteria, program rules, or third-party terms.
        </p>
        <p>
          Anza Connect does not guarantee any funding, investment, grant award,
          mentorship outcome, or business result. Decisions made by funders,
          investors, mentors, or program partners are their own.
        </p>
      </LegalSection>

      <LegalSection index="7" title="Third-Party Services">
        <p>
          The Platform may link to or integrate third-party services (for
          example, authentication, file storage, analytics, or payment
          providers). We are not responsible for third-party services, and your
          use of them is governed by their own terms and privacy policies.
        </p>
      </LegalSection>

      <LegalSection index="8" title="Disclaimers">
        <p>
          The Platform is provided "as is" and "as available" without warranties
          of any kind, whether express or implied, including warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Platform will be
          uninterrupted, secure, or error-free.
        </p>
      </LegalSection>

      <LegalSection index="9" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Anza Connect and its
          affiliates will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for any loss of profits, data,
          goodwill, or business, arising out of or related to your use of the
          Platform.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Termination">
        <p>
          You may stop using the Platform at any time. We may suspend or
          terminate your access if you violate these Terms or if we reasonably
          believe your use poses a risk to the Platform or other users. Certain
          provisions survive termination, including intellectual property,
          disclaimers, and limitations of liability.
        </p>
      </LegalSection>

      <LegalSection index="11" title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we will
          revise the "Last updated" date above. Your continued use of the
          Platform after changes become effective constitutes acceptance of the
          revised Terms.
        </p>
      </LegalSection>

      <LegalSection index="12" title="Governing Law">
        <p>
          These Terms are governed by the laws of the United Republic of
          Tanzania, without regard to its conflict-of-laws principles. Any
          disputes will be subject to the exclusive jurisdiction of the courts
          of Tanzania.
        </p>
      </LegalSection>

      <LegalSection index="13" title="Contact Us">
        <p>
          If you have questions about these Terms, contact us at{" "}
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

export default TermsOfService;
