import axios from "axios";

const anzabooksApiBase =
  import.meta.env.VITE_ANZABOOKS_API_URL ||
  "https://anzabooks.anzaconnect.co.tz";

export const getAnzabooksBusinesses = async ({
  page = 1,
  limit = 10,
  search = "",
  sortBy = "createdAt",
  order = "desc",
} = {}) => {
  try {
    const response = await axios.get(
      `${anzabooksApiBase}/api/public/business-intelligence/businesses`,
      {
        params: {
          page,
          limit,
          search,
          sortBy,
          order,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to load AnzaBooks businesses", error);
    throw error;
  }
};

export const getAnzabooksBusinessReport = async (
  storeId,
  { from, to } = {},
) => {
  try {
    const response = await axios.get(
      `${anzabooksApiBase}/api/public/business-intelligence/businesses/${storeId}/report`,
      {
        params: {
          from,
          to,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Failed to load AnzaBooks business report", error);
    throw error;
  }
};
