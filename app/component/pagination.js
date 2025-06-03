const Pagination = ({ page, limit, count, setPage }) => {
  return (
    <div className="flex justify-between md:items-start pt-4 items-center  text-sm md:text-base">
      {/* Showing results */}
      <div className="flex space-x-2 whitespace-nowrap text-gray-400 ">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of{" "}
        {count} results
      </div>

      {/* Pagination controls */}
      <div className="flex space-x-2">
        {/* Previous button, disabled if on the first page */}
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={` text-dark py-2 dark:text-white hover:bg-gray-50 dark:hover:bg-dark px-0 md:px-6 rounded-lg ${
            page === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Previous
        </button>

        {/* Next button, disabled if on the last page */}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page * limit >= count}
          className={` text-dark text-white bg-primary hover:bg-gray-50 dark:hover:bg-dark py-2 px-0 md:px-6 rounded-lg ${
            page * limit >= count ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
