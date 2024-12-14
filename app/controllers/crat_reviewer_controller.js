import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "@/app/utils/endpoint";
import { getUser } from "../utils/local_storage"; 



export const publishChanges = async (data) => {
  try {
      const response = await axios.post(`${server_url}/reviewer/update`, data, { headers });
      return response.data;
  } catch (error) {
      console.log('Error updating financial data:', error.response);
      throw error;
  }
};

export const getApplicationList = async () => {
  console.log('getting applications');

  try {
      const response = await axios.get(`${server_url}/reviewer/getCratApplications`, { headers });
      console.log(response);
      return response.data.body;
  } catch (error) {
      console.log('Error fetching report data:', error.response);
      throw error;
  }
};

export const getReport = async (id) => {
  console.log("getting report");


  const data = {
    id,
  };

  try {
    const response = await axios.post(`${server_url}/reviewer/get_report_byId`, data, { headers });

    // Log the response
    console.log("Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error publishing report:", error);
    throw error;
  }
};

export const publishUser = async (data) => {
  try {
    const formData = new FormData();
    formData.append("file", data.file); // Add file
    formData.append("userId", data.userId); // Add userId

    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await axios.post(`${server_url}/reviewer/publish`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${getUser().ACCESS_TOKEN}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log("Error attaching document:", error.response);
    throw error;
  }
};


export  const initialData = {
    commercial: {
      "Market demand and share": [
        {
          subDomain: "Demand", score: 0, narrative: [
            { score: 0, text: "The business is operating in an industry it doesn't understand essential demand dynamics. It has no reports or statistical evidence to back up its claim of sufficient demand for its products or services" },
            { score: 1, text: "The business is operating in an industry in which it has limited understanding of demand dynamics. Nonetheless, there are either outdated data or reports to back its demand" },
            { score: 2, text: "The business is operating in an industry it fully understands with clear industry data on demand dynamics" },
          ]
        },
        {
          subDomain: "Market share", score: 0, narrative: [
            { score: 0, text: "The company's market share is declining relative to its competitors and there seem to be no indication of acquiring more in the foreseeable future" },
            { score: 1, text: "The company's market share hasn't changed in the last 12 months but is likely to improve given the company's overall strategy" },
            { score: 2, text: "The company's market share has been growing in the past 12 months and is likely to continue growing in the foreseeable future relative to competitors" },
          ]
        },
      ],
      "Sales and traction": [
        {
          subDomain: "Sales", score: 0, narrative: [
            { score: 0, text: "Sales have not grown on a month-to-month or quarter-to-quarter basis for the past 12 months; i.e., MRR has been a net negative for the past 12 months" },
            { score: 1, text: "Sales didn't grow to the projected values but grew at a positive rate, with month growths alternating between positive and negative territories, leaving overall monthly change constant for the past 12 months" },
            { score: 2, text: "Monthly or quarterly sales were recording a positive increase, i.e., MRR recorded positive change throughout the year for the past 12 months" },
          ]
        },
        {
          subDomain: "Customer segments", score: 0, narrative: [
            { score: 0, text: "The company hasn't clearly identified key customers and segmented them; data-based is still raw" },
            { score: 1, text: "The company has identified the customer segments but has not yet determined which of them is the most valuable customer" },
            { score: 2, text: "The company has already done thorough customer segmentation and identified which are MVCs, focusing their sales resources on these segments" },
          ]
        },
        {
          subDomain: "Payment terms", score: 0, narrative: [
            { score: 0, text: "The company has no clear payment terms; invoices to customers contain different payment durations for the same products" },
            { score: 1, text: "The company is working to improve its payment terms with customers; invoices for the same services to different customers are becoming increasingly similar, and there are potential customer agreement drafting conversations going on" },
            { score: 2, text: "There are clear payment terms as per the contract or subscription agreements" },
          ]
        },
        {
          subDomain: "Sales strategy", score: 0, narrative: [
            { score: 0, text: "The company lacks a defined sales strategy" },
            { score: 1, text: "The company is developing its sales strategy" },
            { score: 2, text: "The company has a sales strategy that guides its sales process" },
          ]
        },
      ],
      "Product": [
        {
          subDomain: "Product development", score: 0, narrative: [
            { score: 0, text: "The company doesn't have a product roadmap, and all improvements are impromptu" },
            { score: 1, text: "The company has some form of product roadmap, but it's not properly scheduled" },
            { score: 2, text: "The company has a proper product roadmap with a schedule of features to be released and a mode of testing the customer feedback of the same" },
          ]
        },
        {
          subDomain: "Product distribution", score: 0, narrative: [
            { score: 0, text: "The company hasn't figured out its product distribution model; there are multiple trials going on" },
            { score: 1, text: "The company has figured out several distribution models that work for the product and is gathering evidence on which would be economical and sustainable" },
            { score: 2, text: "The company already has a distribution model that works and is economical and sustainable" },
          ]
        },
        {
          subDomain: "Product pricing basis", score: 0, narrative: [
            { score: 0, text: "The company has not yet figured out how to price its products/services and is trying to develop a pricing structure for the same" },
            { score: 1, text: "The company has established pricing for its products but remains open to changes following customer feedback" },
            { score: 2, text: "The company has developed a well-structured pricing system for its products/services" },
          ]
        },
      ],
      "Competition analysis": [
        {
          subDomain: "Level of competition", score: 0, narrative: [
            { score: 0, text: "There's unhealthy competition in the industry" },
            { score: 1, text: "The competitive landscape is improving, enabling the company to innovate" },
            { score: 2, text: "There is a very healthy competitive landscape" },
          ]
        },
        {
          subDomain: "Competitive advantage", score: 0, narrative: [
            { score: 0, text: "The company has no apparent competitive advantage" },
            { score: 1, text: "The company is improving its value proposition to cement its competitive advantage in the market" },
            { score: 2, text: "The company has a clear and visible competitive advantage" },
          ]
        },
      ],
      "Marketing": [
        {
          subDomain: "Marketing strategy", score: 0, narrative: [
            { score: 0, text: "The company has no marketing strategy" },
            { score: 1, text: "The company is developing its marketing strategy" },
            { score: 2, text: "The company has an active and well-executed marketing strategy" },
          ]
        },
        {
          subDomain: "Packaging and branding", score: 0, narrative: [
            { score: 0, text: "The company is not properly branded; no brand guidelines exist" },
            { score: 1, text: "The company is developing its branding and packaging, including such brand and packaging items relevant and consistent with its overall business strategy" },
            { score: 2, text: "The company is properly packaged and branded, manifested by their existing brand guidelines and execution" },
          ]
        },
        {
          subDomain: "Promotion strategy", score: 0, narrative: [
            { score: 0, text: "The company has no promotion strategy" },
            { score: 1, text: "The company is developing a promotional strategy for its suite of products" },
            { score: 2, text: "The company has a working promotional strategy consistent with their growth plans" },
          ]
        },
      ],
    },
    financial: {
      "Profitability": [
        {
          subDomain: "Revenue", score: 0, narrative: [
            { score: 0, text: "Revenue has been declining on a month-to-month or quarter-to-quarter basis, with a net negative growth for the past year" },
            { score: 1, text: "Revenue growth trended between negative and positive, alternating between months/quarters, resulting in 0% overall growth in a year" },
            { score: 2, text: "Revenue growth was positive month-on-month or quarter-on-quarter, recording overall positive growth for the year" },
          ]
        },
        {
          subDomain: "Cost management", score: 0, narrative: [
            { score: 0, text: "Unit costs increased in the year" },
            { score: 1, text: "Unit costs remained relatively constant in the year" },
            { score: 2, text: "Unit costs declined in the year" },
          ]
        },
      ],
      "Balance sheet": [
        {
          subDomain: "Working capital management", score: 0, narrative: [
            { score: 0, text: "Working capital was not well managed, and the company had to seek short-term funding to cover shortfalls" },
            { score: 1, text: "Working capital was adequately managed but not well enough to support growth" },
            { score: 2, text: "Working capital was well managed and supported the growth of the business" },
          ]
        },
        {
          subDomain: "Assets management", score: 0, narrative: [
            { score: 0, text: "Assets were not well managed, with asset turnover substantially below 1" },
            { score: 1, text: "Assets were satisfactorily managed, with asset turnover at or slightly above 1" },
            { score: 2, text: "Assets were well managed, with asset turnover substantially above 1" },
          ]
        },
        {
          subDomain: "Debt manageability", score: 0, narrative: [
            { score: 0, text: "Debt is mismanaged and is causing stress to the company" },
            { score: 1, text: "Debt is satisfactorily managed but there are visible risks in the near future" },
            { score: 2, text: "Debt is well managed and is proving to be very useful in generating value for shareholders" },
          ]
        },
        {
          subDomain: "OBS Items", score: 0, narrative: [
            { score: 0, text: "OBS items have a substantial negative effect on the company's financial health" },
            { score: 1, text: "OBS items have a small negative effect on the balance sheet" },
            { score: 2, text: "OBS items have no negative effect on the company's balance sheet" },
          ]
        },
      ],
      "Cash flows": [
        {
          subDomain: "Operating cash flow", score: 0, narrative: [
            { score: 0, text: "OCF is negative, and funding for operations came from other sources" },
            { score: 1, text: "OCF was negative but showed substantial improvement across the year, with no additional cash required from other sources to finance operations" },
            { score: 2, text: "OCF was positive and fully funded the company's operations" },
          ]
        },
        {
          subDomain: "CAPEX", score: 0, narrative: [
            { score: 0, text: "No CapEx were done, and the company is running on depleted fixed assets" },
            { score: 1, text: "Small CapEx was undertaken but not enough to facilitate growth" },
            { score: 2, text: "CapEx was done consistent with the growth plan" },
          ]
        },
      ],
      "Projections": [
        {
          subDomain: "Assumptions", score: 0, narrative: [
            { score: 0, text: "Financial assumptions are overly hypothetical" },
            { score: 1, text: "Financial assumptions are a mix of reality and hypothesis" },
            { score: 2, text: "Financial assumptions are rooted in reality" },
          ]
        },
      ],
      "Financial management": [
        {
          subDomain: "Quality of financial records", score: 0, narrative: [
            { score: 0, text: "No clear financial records available" },
            { score: 1, text: "Financial records available but have questionable accuracy and consistency" },
            { score: 2, text: "Excellent financial records" },
          ]
        },
        {
          subDomain: "Financial reporting", score: 0, narrative: [
            { score: 0, text: "No financial statements available" },
            { score: 1, text: "No consistency in publishing financial reports" },
            { score: 2, text: "Financial reports are consistently published" },
          ]
        },
        {
          subDomain: "Internal controls", score: 0, narrative: [
            { score: 0, text: "No internal controls exist" },
            { score: 1, text: "Internal controls exist but are not adhered to" },
            { score: 2, text: "Internal controls exist and are adhered to" },
          ]
        },
        {
          subDomain: "Tax liability", score: 0, narrative: [
            { score: 0, text: "There are unsettled taxes that might jeopardize the compliance of the company in the future" },
            { score: 1, text: "The tax liabilities existing are being addressed by management" },
            { score: 2, text: "There are no outstanding tax liabilities" },
          ]
        },
      ],

    },
    operations: {
      "Management Capacity": [
        {
          subDomain: "Vision clarity", score: 0, narrative: [
            { score: 0, text: "The vision of the company is vague" },
            { score: 1, text: "The vision is not very clear and the management makes efforts to enable employees to understand it" },
            { score: 2, text: "The vision is very clear and everyone at the company lives to see it fulfilled" },
          ]
        },
        {
          subDomain: "Management structure", score: 0, narrative: [
            { score: 0, text: "There's no particular structure and thus reporting lines are not clear" },
            { score: 1, text: "The team is making efforts to establish clear reporting lines to support its operational goals" },
            { score: 2, text: "The company has clear reporting lines and is equipped to deliver on operational goals" },
          ]
        },
        {
          subDomain: "Track record", score: 0, narrative: [
            { score: 0, text: "The team's track record is inadequate to deliver on the mandate of the company" },
            { score: 1, text: "The team's track record is mixed with limited ability to deliver on the company's mandate" },
            { score: 2, text: "The team has a credible track record and is able to deliver on the company's mandate" },
          ]
        },
        {
          subDomain: "Management commitment", score: 0, narrative: [
            { score: 0, text: "The management is substantially partially committed with key managers spending less than 25% of their time on day-to-day running of the company" },
            { score: 1, text: "The management is partially committed with key managers spending only 50% of their time on running the company" },
            { score: 2, text: "The management is fully committed and each senior manager spends 100% of their time in running the company" },
          ]
        },
        {
          subDomain: "Team capacity", score: 0, narrative: [
            { score: 0, text: "There are notable technical and managerial gaps in the company's team" },
            { score: 1, text: "There are a few technical and managerial gaps but they are addressed through part-time consulting services" },
            { score: 2, text: "The team is complete in its technical and managerial capabilities" },
          ]
        },
        {
          subDomain: "Performance measurement", score: 0, narrative: [
            { score: 0, text: "The team doesn't gauge performance, and as such every action taken seems ad hoc" },
            { score: 1, text: "The team has some form of performance measurement but not standardized" },
            { score: 2, text: "The company measures performance and tracks it through standardized means, including KPIs" },
          ]
        },
        {
          subDomain: "Professional development", score: 0, narrative: [
            { score: 0, text: "The company has no structured PD or on-job trainings" },
            { score: 1, text: "The company is developing PD plans and on-job training manuals" },
            { score: 2, text: "The company has well-structured PD and on-job training sessions that are well executed" },
          ]
        },
      ],
      "Management Information System": [
        {
          subDomain: "Data management", score: 0, narrative: [
            { score: 0, text: "Data is not consciously collected or managed by the company" },
            { score: 1, text: "Data collected is not managed properly for informing the company's strategy" },
            { score: 2, text: "The company consciously collects data, manages it, and uses the data to inform its strategy" },
          ]
        },
        {
          subDomain: "System used", score: 0, narrative: [
            { score: 0, text: "The company doesn't have any MIS in use" },
            { score: 1, text: "The company has an MIS but it doesn't seem to be compatible with its operations" },
            { score: 2, text: "The company uses an MIS that is compatible with its operations" },
          ]
        },
        {
          subDomain: "System effectiveness", score: 0, narrative: [
            { score: 0, text: "The MIS used is not effective" },
            { score: 1, text: "The MIS used is slightly effective" },
            { score: 2, text: "The MIS used is very effective" },
          ]
        },
      ],
      "Quality management": [
        {
          subDomain: "Quality control", score: 0, narrative: [
            { score: 0, text: "No quality checks exist in the company for its products or services" },
            { score: 1, text: "There are occasional product/service checks" },
            { score: 2, text: "Quality checks for products/services are standardized and fully integrated into the company's operations" },
          ]
        },
        {
          subDomain: "Quality management team", score: 0, narrative: [
            { score: 0, text: "No quality management team or function in the company" },
            { score: 1, text: "Quality management function exists but is managed occasionally by consultants" },
            { score: 2, text: "The quality management function is fully operational and adequately staffed" },
          ]
        },
      ],
      "Overall Operations": [
        {
          subDomain: "Platform utilization", score: 0, narrative: [
            { score: 0, text: "The company's assets lie idle" },
            { score: 1, text: "Assets are underutilized, i.e., below 50% of their capacity" },
            { score: 2, text: "Assets are fully utilized" },
          ]
        },
        {
          subDomain: "CRM", score: 0, narrative: [
            { score: 0, text: "Customer relations at the company are not organized" },
            { score: 1, text: "There's some form of customer relations management but it's not very organized" },
            { score: 2, text: "Customer relation management is managed well with the support of relevant tools" },
          ]
        },
      ],
      "Planning and Strategy": [
        {
          subDomain: "Business strategy", score: 0, narrative: [
            { score: 0, text: "The company doesn't have a consistent business strategy" },
            { score: 1, text: "The company is crafting a business strategy to guide its operations" },
            { score: 2, text: "The company has a clear business strategy that guides its organizational goal setting and operations" },
          ]
        },
        {
          subDomain: "Organizational planning", score: 0, narrative: [
            { score: 0, text: "No organizational planning exists" },
            { score: 1, text: "Organizational planning is occasional and subject to particular needs" },
            { score: 2, text: "Organizational planning process is standardized" },
          ]
        },
      ],

    },

    legal: {
      "Corporate Documents and Compliance": [
        {
          subDomain: "Business incorporation", score: 0, narrative: [
            { score: 0, text: "The business is not legally registered" },
            { score: 1, text: "The business has filed with BRELA for registration" },
            { score: 2, text: "The business is legally registered and has a relevant BRELA certificate" },
          ]
        },
        {
          subDomain: "Tax Identification", score: 0, narrative: [
            { score: 0, text: "The company has no TIN" },
            { score: 1, text: "The company has filed for TIN" },
            { score: 2, text: "The company has a current TIN" },
          ]
        },
        {
          subDomain: "Tax compliance", score: 0, narrative: [
            { score: 0, text: "The company has not yet filed its tax returns" },
            { score: 1, text: "The company has filed tax returns but not yet cleared" },
            { score: 2, text: "The company has tax clearance" },
          ]
        },
        {
          subDomain: "Business license", score: 0, narrative: [
            { score: 0, text: "The business has not yet received a business license" },
            { score: 1, text: "The company has already sent in an application for a license" },
            { score: 2, text: "The company has a business license" },
          ]
        },
        {
          subDomain: "Sector specific license", score: 0, narrative: [
            { score: 0, text: "The company doesn't have a sector-specific license" },
            { score: 1, text: "The company has already submitted an application for a license to the regulator" },
            { score: 2, text: "The company has a license from the regulator" },
          ]
        },
      ],
      "Contracts & Agreements": [
        {
          subDomain: "Lease agreements", score: 0, narrative: [
            { score: 0, text: "Lease agreements don't exist and/or are unclear" },
            { score: 1, text: "Lease agreements are being developed" },
            { score: 2, text: "Lease agreements are very clear" },
          ]
        },
        {
          subDomain: "Customer agreements", score: 0, narrative: [
            { score: 0, text: "Customer agreements available are not in favor of the company" },
            { score: 1, text: "Company is renegotiating the terms with customers to improve its position on the contracts" },
            { score: 2, text: "Contracts available are in favor of the company" },
          ]
        },
        {
          subDomain: "Supplier agreements", score: 0, narrative: [
            { score: 0, text: "Supplier agreements available are not in favor of the company" },
            { score: 1, text: "Company is renegotiating supplier agreements to improve its position" },
            { score: 2, text: "Supplier agreements are in favor of the company" },
          ]
        },
        {
          subDomain: "Employee agreements", score: 0, narrative: [
            { score: 0, text: "Employees don't have contracts" },
            { score: 1, text: "Employees have contracts which require a revisit for improvements" },
            { score: 2, text: "Employee contracts are available" },
          ]
        },
      ],
      "Intellectual Property": [
        {
          subDomain: "IP ownership", score: 0, narrative: [
            { score: 0, text: "Company doesn't own its IP (trademarks or copyrights) to source code or brand" },
            { score: 1, text: "Company is transitioning from renting IP to owning it" },
            { score: 2, text: "Company owns its IP, including source code, trademarks, and other trade secrets" },
          ]
        }
      ],
      "Entrepreneur & Family": [
        {
          subDomain: "Character", score: 0, narrative: [
            { score: 0, text: "The founder's character is questionable" },
            { score: 1, text: "The founder has a history with a tainted image" },
            { score: 2, text: "The founder's character is that of a reliable, adaptable, and trustworthy person" },
          ]
        },
        {
          subDomain: "Personal legal liability", score: 0, narrative: [
            { score: 0, text: "The founder has legal liabilities which have a negative effect on the company" },
            { score: 1, text: "The founder has legal liabilities which have a moderate effect on the functioning of the company" },
            { score: 2, text: "The founder has little or no legal liabilities that have no or extremely limited effect on the functioning of the company" },
          ]
        },
        {
          subDomain: "Succession plan", score: 0, narrative: [
            { score: 0, text: "There's no succession plan" },
            { score: 1, text: "The founder has created an informal succession plan" },
            { score: 2, text: "There's a formal succession plan for the company" },
          ]
        }
      ],
      "Corporate Governance": [
        {
          subDomain: "BOD", score: 0, narrative: [
            { score: 0, text: "Company doesn't have a board of directors or advisors" },
            { score: 1, text: "Company has a board but it isn't active" },
            { score: 2, text: "The BOD is active and provides oversight as required" },
          ]
        }
      ],

    },
  };




  
  

