const moment = require("moment")
export const timeAgo = (date)=>{
    return moment(date).fromNow()
}