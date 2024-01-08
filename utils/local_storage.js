export const storeUser = (user)=>{
    localStorage.setItem('user', JSON.stringify(user));

}

export const getUser = ()=>{
    return JSON.parse(localStorage.getItem('user'))
}

export const logout = ()=>{
    localStorage.removeItem('user');
}


