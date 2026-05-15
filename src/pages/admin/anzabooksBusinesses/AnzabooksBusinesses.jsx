import { useEffect, useMemo, useState } from "react";
import Link from "@/utils/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import { getAnzabooksBusinesses } from "@/controllers/anzabooks_business_intelligence_controller";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "TZS",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("en-US");

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const scoreColor = (score) => {
  if (score >= 75) return "text-green-600";
  if (score >= 55) return "text-amber-600";
  return "text-red-600";
};

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [payload, setPayload] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const loadBusinesses = async ({ keepSkeleton = false } = {}) => {
    try {
      if (keepSkeleton) {
        setLoading(true);
      } else {
        setLoadingList(true);
      }

      const data = await getAnzabooksBusinesses(query);
      setPayload(data);
    } catch (error) {
      setPayload(null);
    } finally {
      setLoading(false);
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBusinesses({ keepSkeleton: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      loadBusinesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const businesses = payload?.businesses || [];
  const pagination = payload?.pagination;
  const summary = payload?.summary?.pageTotals;

  const cards = useMemo(
    () => [
      {
        label: "Page Sales",
        value: currency.format(summary?.sales || 0),
      },
      {
        label: "Page Purchases",
        value: currency.format(summary?.purchases || 0),
      },
      {
        label: "Page Expenses",
        value: currency.format(summary?.expenses || 0),
      },
      {
        label: "Operating Profit",
        value: currency.format(summary?.operatingProfit || 0),
      },
      {
        label: "Low Stock Alerts",
        value: numberFmt.format(summary?.lowStockProducts || 0),
      },
    ],
    [summary],
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        pageName="AnzaBooks Shops Overview"
        prevPage="Dashboard"
        prevLink="/dashboard"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-black dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col gap-3 border-b border-stroke px-4 py-4 dark:border-strokedark md:flex-row md:items-center md:justify-between md:px-6">
          <h4 className="text-lg font-semibold text-black dark:text-white">
            Businesses and Shop Performance
          </h4>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search business name or owner email"
              className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark sm:w-72"
            />
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              onClick={() => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  search: searchInput.trim(),
                }));
              }}
            >
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-stroke dark:border-strokedark">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Catalog
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Sales
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Profit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Health
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Loading business intelligence data...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No businesses found for your current filters.
                  </td>
                </tr>
              ) : (
                businesses.map((business) => (
                  <tr
                    key={business.id}
                    className="border-b border-stroke/70 dark:border-strokedark"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-black dark:text-white">
                        {business.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: {business.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      {business.owner?.email || "-"}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      {business.businessType}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      <div>
                        Products:{" "}
                        {numberFmt.format(business.counts?.products || 0)}
                      </div>
                      <div>
                        Customers:{" "}
                        {numberFmt.format(business.counts?.customers || 0)}
                      </div>
                      <div>
                        Suppliers:{" "}
                        {numberFmt.format(business.counts?.suppliers || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      <div>
                        {currency.format(
                          business.performanceSnapshot?.salesTotal || 0,
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Collected:{" "}
                        {currency.format(
                          business.performanceSnapshot?.salesPaid || 0,
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      <div>
                        {currency.format(
                          business.performanceSnapshot?.operatingProfit || 0,
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Outstanding:{" "}
                        {currency.format(
                          business.performanceSnapshot?.salesBalance || 0,
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 align-top text-sm font-semibold ${scoreColor(business.performanceSnapshot?.healthScore || 0)}`}
                    >
                      {numberFmt.format(
                        business.performanceSnapshot?.healthScore || 0,
                      )}{" "}
                      / 100
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-700">
                      {formatDate(business.updatedAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/dashboard/anzabooks-businesses/${business.id}/report`}
                        className="inline-flex rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
                      >
                        View Full Report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-sm text-slate-600">
            Page {pagination?.page || 1} of {pagination?.totalPages || 1} •
            Total businesses: {numberFmt.format(pagination?.totalItems || 0)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-stroke px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!pagination?.hasPreviousPage}
              onClick={() =>
                setQuery((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-stroke px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!pagination?.hasNextPage}
              onClick={() =>
                setQuery((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
