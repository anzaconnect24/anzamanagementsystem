export const assignProgramApplicationReviewer = async (data) => {
    try {
    //   console.log(headers)
    alert("hello")
      const response = await axios.post(`${server_url}/program_application_review/`,data,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };