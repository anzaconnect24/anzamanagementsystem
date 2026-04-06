import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";

const Breadcrumb = ({ pageName, prevPage, prevLink }) => {
  const router = useRouter();
  const hasPrev = Boolean(prevPage) || prevLink === "" || Boolean(prevLink);

  const handlePrevClick = (event) => {
    event.preventDefault();

    // Empty string means explicit browser-history back behavior.
    if (prevLink === "") {
      router.back();
      return;
    }

    if (prevLink) {
      router.push(prevLink);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 line-clamp-1 font-semibold text-black dark:text-white">
        {pageName}
      </h2>
      <nav>
        <ol className="flex items-center gap-2">
          {hasPrev && (
            <li>
              <Link
                className="font-medium"
                onClick={handlePrevClick}
                href={prevLink || "#"}
              >
                {prevPage || "Back"} /
              </Link>
            </li>
          )}
          <li className="font-medium line-clamp-1 text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
