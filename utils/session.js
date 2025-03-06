
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataProvider } from "../src/App";
import axios from "axios";

const checkSession = ()=>{
    const navigate = useNavigate()
    const {token,setToken} = useContext(DataProvider)

    useEffect(() => {
        
        const verify = async () => {
          try {
            const resp = await axios.get(`/auth/verify-user`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          
          
            navigate("/dashboard");
          } catch (error) {
            navigate("/login");
          
           
          }
        };
   
        verify();
      }, [token]);
}

export default checkSession;