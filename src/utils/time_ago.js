import moment from "moment";
export const timeAgo = (date) => {
  return moment(date).fromNow();
};
