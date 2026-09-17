import { HiOutlineChartBar, HiOutlineOfficeBuilding } from "react-icons/hi";
import { Leaf } from "lucide-react";
import { profileList } from "@/utils/profile_list";

// An investor's answers to the profile questions, as other users read them.
// Contact information is deliberately not part of this: startups must not see
// it, and the pages that may show it render it separately.

// The answers with the older columns filled in for profiles that predate the
// current questions.
export const investorAnswers = (profile = {}) => {
  const sectors = profileList(profile.sectors);
  const capital = profile.capitalType ? [profile.capitalType] : profileList(profile.investmentType);
  return {
    company: profile.company || "",
    legalName: profile.legalName || "",
    investorType: profile.investorType || "",
    headquarters: profile.headquarters || profile.geography || "",
    yearFounded: profile.yearFounded || "",
    fundSize: profile.fundSize || "",
    bio: profile.bio || "",
    sectors: sectors.length ? sectors : profile.BusinessSector?.name ? [profile.BusinessSector.name] : [],
    businessStages: profileList(profile.businessStages),
    ticketSize: profile.ticketSize || profile.investmentSize || "",
    capitalType: capital.join(", "),
    geographies: profileList(profile.geographies),
    impactAreas: profileList(profile.impactAreas).length
      ? profileList(profile.impactAreas)
      : profileList(profile.investmentFocus),
    impactThesis: profile.impactThesis || "",
  };
};

const notProvided = <span className="text-slate-400">Not provided</span>;

const Detail = ({ label, children, wide }) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{children}</dd>
  </div>
);

const Chips = ({ items }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[#082d77]/10 px-2.5 py-1 text-xs font-semibold text-[#082d77]">
          {item}
        </span>
      ))}
    </div>
  ) : (
    notProvided
  );

const Card = ({ icon, title, children }) => (
  <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-boxdark">
    <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#082d77]">
      <span className="text-xl">{icon}</span>
      {title}
    </h2>
    <dl className="grid gap-5 sm:grid-cols-2">{children}</dl>
  </section>
);

export default function InvestorProfileDetails({ profile }) {
  const a = investorAnswers(profile || {});

  return (
    <div className="space-y-6">
      <Card icon={<HiOutlineOfficeBuilding />} title="Company Overview">
        <Detail label="Organisation / Fund Name">{a.company || notProvided}</Detail>
        <Detail label="Legal Company Name">{a.legalName || notProvided}</Detail>
        <Detail label="Investor Type">{a.investorType || notProvided}</Detail>
        <Detail label="Headquarters">{a.headquarters || notProvided}</Detail>
        <Detail label="Year Founded">{a.yearFounded || notProvided}</Detail>
        <Detail label="Fund Size">{a.fundSize || notProvided}</Detail>
        <Detail label="About The Organisation" wide>
          {a.bio ? <p className="whitespace-pre-line font-normal leading-relaxed text-slate-700">{a.bio}</p> : notProvided}
        </Detail>
      </Card>

      <Card icon={<HiOutlineChartBar />} title="Investment Focus">
        <Detail label="Sectors" wide><Chips items={a.sectors} /></Detail>
        <Detail label="Business Stages" wide><Chips items={a.businessStages} /></Detail>
        <Detail label="Typical Ticket Size">{a.ticketSize || notProvided}</Detail>
        <Detail label="Type Of Capital">{a.capitalType || notProvided}</Detail>
        <Detail label="Geographies" wide><Chips items={a.geographies} /></Detail>
      </Card>

      <Card icon={<Leaf className="h-5 w-5" />} title="Impact Focus">
        <Detail label="Impact Areas" wide><Chips items={a.impactAreas} /></Detail>
        <Detail label="Impact Thesis" wide>
          {a.impactThesis ? <p className="whitespace-pre-line font-normal leading-relaxed text-slate-700">{a.impactThesis}</p> : notProvided}
        </Detail>
      </Card>
    </div>
  );
}
