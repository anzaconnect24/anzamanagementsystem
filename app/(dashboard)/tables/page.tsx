import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableOne from "@/components/Tables/TableOne";
import TableThree from "@/components/Tables/TableThree";
import TableTwo from "@/components/Tables/TableTwo";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Tables Page | Next.js E-commerce Dashboard Template",
  description: "This is Tables page for TailAdmin Next.js",
  // other metadata
};

const TablesPage = () => {
  return (
    <>
      <Breadcrumb prevLink="" prevPage="" pageName="Tables" />

      <div className="flex flex-col gap-10">
        <TableOne />
        <TableTwo />
        <TableThree data={[]} title={""} headers={[]} />
      </div>
    </>
  );
};

export default TablesPage;
