import { Package } from "@/types/package";

interface TableThreeProps {
  data: Package[];
  title: string;
  headers: string[]; // Use an array for headers
}

const TableThree = ({ data, title, headers }: TableThreeProps) => {
  return (
    <div className="rounded-lg border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="py-4 px-4">
        <h4 className="text-xl font-semibold text-black dark:text-white">{title}</h4>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((packageItem, key) => (
              <tr key={key}>
                {Object.values(packageItem).slice(0, headers.length).map((value, index) => (
                  <td
                    key={index}
                    className="border-b border-[#eee] py-5 px-4 dark:border-strokedark"
                  >
                    {typeof value === "string" ? (
                      <p className="text-black dark:text-white">{value}</p>
                    ) : (
                      <div className="flex items-center space-x-3.5">
                        {value} {/* Adjust for non-string values as needed */}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableThree;
