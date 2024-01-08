import numeral from "numeral";

const FormatMoney = (amount) => {
    const formattedAmount = numeral(amount).format('0,0');
   return formattedAmount;
}
 
export default FormatMoney;