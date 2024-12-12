export const storeUser = (user)=>{
    if (typeof window !== 'undefined') {
         localStorage.setItem('user', JSON.stringify(user)); 
      }

}

export const storeVersion = (version)=>{
    if (typeof window !== 'undefined') {
         localStorage.setItem('version', JSON.stringify(version)); 
      }

}

export const storeStatus = (publishStatus)=>{
    if (typeof window !== 'undefined') {
         localStorage.setItem('publishStatus', JSON.stringify(publishStatus)); 
      }

}

export const getUser = ()=>{
    return typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user'))
}

export const getStatus = ()=>{
    return typeof window !== 'undefined' && JSON.parse(localStorage.getItem('publishStatus'))
}

export const getVersion = ()=>{
    return typeof window !== 'undefined' && JSON.parse(localStorage.getItem('version'))
}

export const logout = ()=>{
    localStorage.removeItem('user');
}


