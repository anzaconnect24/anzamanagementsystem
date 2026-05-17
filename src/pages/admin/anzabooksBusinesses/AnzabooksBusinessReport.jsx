import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import dynamic from "@/utils/dynamic";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from "@/components/common/Loader";
import { getAnzabooksBusinessReport } from "@/controllers/anzabooks_business_intelligence_controller";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "TZS",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("en-US");
const compactNumberFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactValue = (value) => compactNumberFmt.format(Number(value) || 0);

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  if (withTime) {
    return parsed.toLocaleString();
  }
  return parsed.toLocaleDateString();
};

const riskColorClass = (level) => {
  if (level === "high") return "bg-red-100 text-red-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const MetricCard = ({ title, value, hint }) => (
  <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-xl font-semibold text-black dark:text-white">
      {value}
    </p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <h4 className="text-base font-semibold text-black dark:text-white">
      {title}
    </h4>
    <div className="mt-3">{children}</div>
  </div>
);

const ReportPage = () => {
  const { storeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [payload, setPayload] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadReport = async ({ showSkeleton = false } = {}) => {
    try {
      if (showSkeleton) {
        setLoading(true);
      } else {
        setLoadingReport(true);
      }

      const data = await getAnzabooksBusinessReport(storeId, {
        from: from || undefined,
        to: to || undefined,
      });
      setPayload(data);
    } catch (error) {
      setPayload(null);
    } finally {
      setLoading(false);
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadReport({ showSkeleton: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const business = payload?.business;
  const allTime = payload?.financialSummary?.allTime;
  const period = payload?.financialSummary?.period;
  const operational = payload?.operationalSummary;
  const trends = payload?.trends?.monthlyTrends || [];
  const rankings = payload?.rankings;
  const riskFlags = payload?.riskFlags || [];
  const feed = payload?.activityFeed || [];

  const chartSource = useMemo(() => {
    const monthLabels = trends.map((item) => item.month || "-");

    const salesSeries = trends.map((item) => Number(item.sales) || 0);
    const collectedSeries = trends.map((item) => Number(item.collected) || 0);
    const purchaseSeries = trends.map((item) => Number(item.purchases) || 0);
    const expenseSeries = trends.map((item) => Number(item.expenses) || 0);
    const cashContributionSeries = trends.map(
      (item) => Number(item.grossCashContribution) || 0,
    );

    const topProducts = (rankings?.topProducts || []).slice(0, 6);
    const topCustomers = (rankings?.topCustomers || []).slice(0, 6);
    const topSuppliers = (rankings?.topSuppliers || []).slice(0, 6);

    return {
      monthLabels,
      salesSeries,
      collectedSeries,
      purchaseSeries,
      expenseSeries,
      cashContributionSeries,
      topProducts,
      topCustomers,
      topSuppliers,
    };
  }, [trends, rankings]);

  const commonMoneyYAxis = {
    labels: {
      formatter: (value) => compactValue(value),
    },
  };

  const commonTooltip = {
    y: {
      formatter: (value) => currency.format(value || 0),
    },
  };

  const allTimeCards = useMemo(
    () => [
      {
        title: "All-Time Sales",
        value: currency.format(allTime?.salesTotal || 0),
      },
      {
        title: "Collected Sales",
        value: currency.format(allTime?.salesCollected || 0),
      },
      {
        title: "Outstanding Receivables",
        value: currency.format(allTime?.salesOutstanding || 0),
      },
      {
        title: "All-Time Purchases",
        value: currency.format(allTime?.purchasesTotal || 0),
      },
      {
        title: "All-Time Expenses",
        value: currency.format(allTime?.expensesTotal || 0),
      },
      {
        title: "Net Cash Flow",
        value: currency.format(allTime?.netCashFlow || 0),
      },
      {
        title: "Gross Margin",
        value: `${numberFmt.format(allTime?.grossMarginPct || 0)}%`,
      },
      {
        title: "Payables Outstanding",
        value: currency.format(allTime?.payablesOutstanding || 0),
      },
    ],
    [allTime],
  );

  const periodCards = useMemo(
    () => [
      {
        title: "Period Sales",
        value: currency.format(period?.salesTotal || 0),
      },
      {
        title: "Period Collected",
        value: currency.format(period?.salesCollected || 0),
      },
      {
        title: "Period Purchases",
        value: currency.format(period?.purchasesTotal || 0),
      },
      {
        title: "Period Expenses",
        value: currency.format(period?.expensesTotal || 0),
      },
      {
        title: "Period Net Cash",
        value: currency.format(period?.netCashFlow || 0),
      },
      {
        title: "Period Gross Margin",
        value: `${numberFmt.format(period?.grossMarginPct || 0)}%`,
      },
    ],
    [period],
  );

  if (loading) {
    return <Loader />;
  }

  if (!payload || !business) {
    return (
      <div className="space-y-3">
        <Breadcrumb
          pageName="Business Report"
          prevPage="AnzaBooks Shops"
          prevLink="/dashboard/anzabooks-businesses"
        />
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm text-slate-600">
            Failed to load report data for this business.
          </p>
          <Link
            href="/dashboard/anzabooks-businesses"
            className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-white"
          >
            Back to businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        pageName="Shop Performance Report"
        prevPage="AnzaBooks Shops"
        prevLink="/dashboard/anzabooks-businesses"
      />

      <div className="rounded-lg border border-stroke bg-white px-4 py-5 shadow-sm dark:border-strokedark dark:bg-boxdark md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              {business.name}
            </h3>
            <p className="text-sm text-slate-600">
              Type: {business.businessType} • Owner:{" "}
              {business.owner?.email || "-"}
            </p>
            <p className="text-sm text-slate-500">
              Created: {formatDate(business.createdAt)} • Last update:{" "}
              {formatDate(business.updatedAt)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              onClick={() => loadReport()}
            >
              {loadingReport ? "Refreshing..." : "Refresh Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-base font-semibold text-black dark:text-white">
          Financial Snapshot (All-Time)
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {allTimeCards.map((item) => (
            <MetricCard
              key={item.title}
              title={item.title}
              value={item.value}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-base font-semibold text-black dark:text-white">
          Current Window Performance
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {periodCards.map((item) => (
            <MetricCard
              key={item.title}
              title={item.title}
              value={item.value}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-base font-semibold text-black dark:text-white">
          Visual Performance Insights
        </h4>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Sales vs Collected (Monthly)">
            <ReactApexChart
              type="line"
              height={300}
              series={[
                { name: "Sales", data: chartSource.salesSeries },
                { name: "Collected", data: chartSource.collectedSeries },
              ]}
              options={{
                chart: { toolbar: { show: false }, zoom: { enabled: false } },
                stroke: { curve: "smooth", width: 3 },
                colors: ["#1d4ed8", "#0891b2"],
                xaxis: { categories: chartSource.monthLabels },
                yaxis: commonMoneyYAxis,
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>

          <ChartCard title="Purchases vs Expenses (Monthly)">
            <ReactApexChart
              type="bar"
              height={300}
              series={[
                { name: "Purchases", data: chartSource.purchaseSeries },
                { name: "Expenses", data: chartSource.expenseSeries },
              ]}
              options={{
                chart: { stacked: true, toolbar: { show: false } },
                plotOptions: {
                  bar: { borderRadius: 6, columnWidth: "45%" },
                },
                colors: ["#f59e0b", "#ef4444"],
                xaxis: { categories: chartSource.monthLabels },
                yaxis: commonMoneyYAxis,
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>

          <ChartCard title="Gross Cash Contribution Trend">
            <ReactApexChart
              type="area"
              height={300}
              series={[
                {
                  name: "Cash Contribution",
                  data: chartSource.cashContributionSeries,
                },
              ]}
              options={{
                chart: { toolbar: { show: false } },
                stroke: { curve: "smooth", width: 2 },
                fill: {
                  type: "gradient",
                  gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
                },
                colors: ["#2563eb"],
                xaxis: { categories: chartSource.monthLabels },
                yaxis: commonMoneyYAxis,
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>

          <ChartCard title="Receivables Status (All-Time)">
            <ReactApexChart
              type="donut"
              height={300}
              series={[
                Number(allTime?.salesCollected) || 0,
                Number(allTime?.salesOutstanding) || 0,
              ]}
              options={{
                labels: ["Collected", "Outstanding"],
                colors: ["#10b981", "#f97316"],
                legend: { position: "bottom" },
                dataLabels: { enabled: true },
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>

          <ChartCard title="Top 6 Products by Sales">
            <ReactApexChart
              type="bar"
              height={300}
              series={[
                {
                  name: "Sales",
                  data: chartSource.topProducts.map(
                    (item) => Number(item.salesValue) || 0,
                  ),
                },
              ]}
              options={{
                chart: { toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 5, horizontal: true } },
                colors: ["#3b82f6"],
                xaxis: {
                  categories: chartSource.topProducts.map((item) => item.name),
                  labels: {
                    formatter: (value) => compactValue(value),
                  },
                },
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>

          <ChartCard title="Top Customers vs Suppliers (Outstanding)">
            <ReactApexChart
              type="bar"
              height={300}
              series={[
                {
                  name: "Customers",
                  data: chartSource.topCustomers.map(
                    (item) => Number(item.outstandingTotal) || 0,
                  ),
                },
                {
                  name: "Suppliers",
                  data: chartSource.topSuppliers.map(
                    (item) => Number(item.outstandingTotal) || 0,
                  ),
                },
              ]}
              options={{
                chart: { toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 5, columnWidth: "45%" } },
                colors: ["#0ea5e9", "#6366f1"],
                xaxis: {
                  categories: Array.from(
                    { length: 6 },
                    (_, idx) => `Rank ${idx + 1}`,
                  ),
                },
                yaxis: commonMoneyYAxis,
                tooltip: commonTooltip,
              }}
            />
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Inventory and Operations Health
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetricCard
              title="Inventory Cost Value"
              value={currency.format(operational?.inventoryValuationCost || 0)}
            />
            <MetricCard
              title="Inventory Retail Value"
              value={currency.format(
                operational?.inventoryValuationRetail || 0,
              )}
            />
            <MetricCard
              title="Low Stock SKU Count"
              value={numberFmt.format(operational?.lowStockCount || 0)}
            />
            <MetricCard
              title="Inventory Coverage"
              value={`${numberFmt.format(operational?.velocity?.inventoryCoverageDays || 0)} days`}
            />
            <MetricCard
              title="Average Sale Ticket"
              value={currency.format(operational?.velocity?.avgSaleTicket || 0)}
            />
            <MetricCard
              title="Collection Rate"
              value={`${numberFmt.format(operational?.velocity?.collectionRatePct || 0)}%`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Risk and Attention Flags
          </h4>
          <div className="mt-3 space-y-2">
            {riskFlags.length === 0 ? (
              <p className="text-sm text-slate-500">No risk flags available.</p>
            ) : (
              riskFlags.map((risk) => (
                <div
                  key={risk.code}
                  className="rounded-md border border-stroke p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {risk.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${riskColorClass(risk.level)}`}
                    >
                      {risk.active ? "Active" : "Monitor"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{risk.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <h4 className="text-base font-semibold text-black dark:text-white">
          12-Month Trend Timeline
        </h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-stroke dark:border-strokedark">
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Month
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Sales
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Collected
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Purchases
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Expenses
                </th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                  Cash Contribution
                </th>
              </tr>
            </thead>
            <tbody>
              {trends.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-stroke/70 dark:border-strokedark"
                >
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {row.month}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {currency.format(row.sales || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {currency.format(row.collected || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {currency.format(row.purchases || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {currency.format(row.expenses || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {currency.format(row.grossCashContribution || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Top Products
          </h4>
          <div className="mt-3 space-y-2">
            {(rankings?.topProducts || []).slice(0, 8).map((product) => (
              <div
                key={product.productId}
                className="rounded-md border border-stroke p-2 text-sm"
              >
                <p className="font-medium text-black dark:text-white">
                  {product.name}
                </p>
                <p className="text-slate-600">
                  Units: {numberFmt.format(product.soldUnits || 0)}
                </p>
                <p className="text-slate-600">
                  Sales: {currency.format(product.salesValue || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Top Customers
          </h4>
          <div className="mt-3 space-y-2">
            {(rankings?.topCustomers || []).slice(0, 8).map((customer) => (
              <div
                key={customer.customerId || customer.name}
                className="rounded-md border border-stroke p-2 text-sm"
              >
                <p className="font-medium text-black dark:text-white">
                  {customer.name}
                </p>
                <p className="text-slate-600">
                  Sales: {currency.format(customer.salesTotal || 0)}
                </p>
                <p className="text-slate-600">
                  Outstanding: {currency.format(customer.outstandingTotal || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Top Suppliers
          </h4>
          <div className="mt-3 space-y-2">
            {(rankings?.topSuppliers || []).slice(0, 8).map((supplier) => (
              <div
                key={supplier.supplierId || supplier.name}
                className="rounded-md border border-stroke p-2 text-sm"
              >
                <p className="font-medium text-black dark:text-white">
                  {supplier.name}
                </p>
                <p className="text-slate-600">
                  Purchases: {currency.format(supplier.purchaseTotal || 0)}
                </p>
                <p className="text-slate-600">
                  Outstanding: {currency.format(supplier.outstandingTotal || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Low Stock Detail
          </h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Stock
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Threshold
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Gap
                  </th>
                </tr>
              </thead>
              <tbody>
                {(operational?.lowStockProducts || []).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-stroke/70 dark:border-strokedark"
                  >
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {numberFmt.format(item.stock || 0)}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {numberFmt.format(item.lowStockAt || 0)}
                    </td>
                    <td className="px-3 py-2 text-sm text-red-600">
                      {numberFmt.format(item.gap || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-white px-4 py-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-base font-semibold text-black dark:text-white">
            Recent Activity Feed
          </h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-slate-600">
                    Status/Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {feed.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="border-b border-stroke/70 dark:border-strokedark"
                  >
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {formatDate(item.createdAt, true)}
                    </td>
                    <td className="px-3 py-2 text-sm uppercase text-slate-700">
                      {item.type}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {item.reference || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {currency.format(item.amount || 0)}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {item.status || item.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
