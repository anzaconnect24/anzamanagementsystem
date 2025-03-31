import Image from "next/image"
const NoData = () => {
    return ( <div className="w-full h-100 bg-white flex justify-center items-center">
    <div className="text-center">
    <Image height={300} width={300}  src={"/no data.jpg"} alt=""/>
    <div className="text-2xl">No data available</div>
    </div>
    </div> );
}
 
export default NoData;