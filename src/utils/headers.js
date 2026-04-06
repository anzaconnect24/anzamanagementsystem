import { getUser } from "./local_storage";

// Create headers object with getters to ensure the token is always fresh when accessed
const headersObj = {};

Object.defineProperty(headersObj, "Content-Type", {
  get() {
    return "application/json";
  },
  enumerable: true,
});

Object.defineProperty(headersObj, "Authorization", {
  get() {
    const user = getUser();
    return `Bearer ${user && user.ACCESS_TOKEN}`;
  },
  enumerable: true,
});

export const headers = headersObj;
