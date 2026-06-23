"use client";

import Link from "@/utils/link";

// Shared layout for the public Terms of Service and Privacy Policy pages.
// Reuses the "view startups" hero treatment (black hero, image, gradient
// overlays, orange-dot badge) for a consistent, stylish look.
const LegalPageLayout = ({
  badge = "Legal",
  title,
  subtitle,
  updatedAt,
  children,
}) => {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Hero — view-startups style */}
        <div className="relative overflow-hidden rounded-3xl bg-black shadow-xl">
          <img
            src="/images/investment_readiness_classes.svg"
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          <div className="relative z-10 flex min-h-[260px] items-end">
            <div className="w-full p-6 sm:p-8 lg:p-12">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  {badge}
                </div>

                <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl md:text-5xl">
                  {title}
                </h1>

                {subtitle && (
                  <p className="max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
                    {subtitle}
                  </p>
                )}

                {updatedAt && (
                  <p className="mt-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-md">
                    Last updated: {updatedAt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-10">{children}</div>
        </article>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Link
            href="/auth/signin"
            className="text-sm font-semibold text-[#082d77] hover:underline"
          >
            ← Back to sign in
          </Link>
          <p className="text-xs text-gray-400">
            © {year} Anza Connect. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
};

// Consistently styled section block.
export const LegalSection = ({ title, children }) => (
  <section className="scroll-mt-24">
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>

    <div className="mt-3 space-y-3 text-[15px] leading-7 text-gray-600">
      {children}
    </div>
  </section>
);

export default LegalPageLayout;
