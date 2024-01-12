import { useRouter} from "next/navigation"
import { getBusiness } from "@/app/controllers/business_controller";

const applicationDetails = async({params}) => {
    const {uuid} = params

    const business = await getBusiness(uuid)
    // useEffect(() => {
    //    getBusiness(uuid).then((data)=>setBusiness(data))
    // }, []);
    return ( business && <div>
        Details
        {business.name}
    </div> );
}
 
export default applicationDetails;