export const storeUser = (user) => {
    if (typeof window !== 'undefined') {
        // Clear the existing user data before storing the new one
        localStorage.removeItem('user');
        localStorage.setItem('user', JSON.stringify(user));
    }
};




export const getUser = ()=>{
    return typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user'))
}


export const logout = ()=>{
    localStorage.removeItem('user');
}


