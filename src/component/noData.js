import Image from "@/utils/image";
import { useTranslation } from "@/locales";
const NoData = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-100 bg-white flex justify-center items-center">
      <div className="text-center">
        <Image
          height={300}
          width={300}
          src={"/no data.jpg"}
          alt={t("common.noDataImageAlt", "No data image")}
        />
        <div className="text-2xl">
          {t("common.noDataAvailable", "No data available")}
        </div>
      </div>
    </div>
  );
};

export default NoData;
