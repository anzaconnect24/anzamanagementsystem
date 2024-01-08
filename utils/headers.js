import { getUser } from "./local_storage"
const user = getUser()
export const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
  }