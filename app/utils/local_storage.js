export const storeUser = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const getUser = () => {
  return (
    typeof window !== "undefined" && JSON.parse(localStorage.getItem("user"))
  );
};

export const logout = () => {
  storeUser(null);
  localStorage.clear();
  localStorage.removeItem("user");
};

// Language storage functions
export const storeLanguage = (language) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferred-language", language);
  }
};

export const getLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("preferred-language") || "en";
  }
  return "en";
};
