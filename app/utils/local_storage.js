export const storeUser = (user)=>{
    if (typeof window !== 'undefined') {
         localStorage.setItem('user', JSON.stringify(user)); 
      }

}

export const getUser = ()=>{
    return typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user'))
}

export const logout = ()=>{
    localStorage.removeItem('user');
}


