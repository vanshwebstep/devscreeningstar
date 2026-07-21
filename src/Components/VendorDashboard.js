import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { FaBars, FaBriefcase, FaCheckCircle, FaHome, FaIdBadge, FaUpload } from "react-icons/fa";
import Logo from "../imgs/screeningLogoNew.png";
import { CgProfile } from "react-icons/cg";
import { IoNotifications } from "react-icons/io5";
import { RiArrowRightWideLine } from "react-icons/ri";

const API = "http://localhost:5000";
const casePageOptions = [10, 25, 50, 100, 200];

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const valueOrNA = (value) => (value || value === 0 ? value : "NA");
const getFileUrl = (path) => {
  if (!path) return "";
  const normalizedPath = String(path).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return `${API}/${normalizedPath.replace(/^\/+/, "")}`;
};
const getReportUrl = (item) => getFileUrl(item.vendor_report_url || item.vendor_report_path);
const getFileName = (path) => String(path || "vendor-report").replace(/\\/g, "/").split("/").pop() || "vendor-report";
const compactCaseColumns = [
  ["date_of_initiation", "Date of Initiation", "date"],
  ["application_id", "Reference ID"],
  ["service_names", "Name of the Services"],
  ["name", "Name of Applicant"],
 
];
const formatDate = (value) => {
  if (!value) return "NA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NA";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const ProfileRow = ({ label, value, valueClass = "" }) => (
  <tr>
    <th className="py-2 px-4 border border-black whitespace-nowrap text-left">{label}</th>
    <td className={`py-2 px-4 border border-black text-left whitespace-nowrap ${valueClass}`}>{valueOrNA(value)}</td>
  </tr>
);

const personRows = (prefix, data) => {
  const details = parseJson(data, {});
  return [
    <ProfileRow key={`${prefix}-name`} label={`${prefix} Name`} value={details.name} />,
    <ProfileRow key={`${prefix}-email`} label={`${prefix} Email`} value={details.email} />,
    <ProfileRow key={`${prefix}-mobile`} label={`${prefix} Mobile`} value={details.mobile} />,
    <ProfileRow key={`${prefix}-designation`} label={`${prefix} Designation`} value={details.designation} />,
  ];
};

const flattenVendorServices = (services) => {
  const groups = parseJson(services, []);
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((group) => (group.services || []).map((service) => ({
    group: group.group_title || group.symbol || "NA",
    serviceCode: service.serviceCode || service.service_code || "NA",
    serviceTitle: service.serviceTitle || service.service_title || service.title || "NA",
    price: service.price || "NA",
    packages: Array.isArray(service.packages) ? service.packages.map((pkg) => pkg.name || pkg.label || pkg.title || pkg).join(", ") : "",
  })));
};

const getServiceItems = (value) => String(value || "")
  .split(",")
  .map((service) => service.trim())
  .filter(Boolean);
const getVendorSpocName = (value) => {
  const spoc = parseJson(value, {});
  return spoc.name || spoc.email || spoc.mobile || "NA";
};

const normalizeCase = (item) => ({
  ...item,
  date_of_initiation: item.initiation_date || item.created_at,
  
  father_name: item.father_name || "",
  address: item.address || item.current_address || item.permanent_address || item.location || "",
  pin_code: item.pin_code || "",
  state: item.state || "",
  pan: item.pan || item.pan_number || "",
  aadhaar: item.aadhaar || item.aadhar || item.aadhaar_number || "",
  vendor_spoc_name: getVendorSpocName(item.vendor_spoc),
  insuff_remarks: [item.first_insufficiency_marks, item.second_insufficiency_marks, item.third_insufficiency_marks].filter(Boolean).join(" | "),
  insuff_date: item.first_insuff_date || item.second_insuff_date || item.third_insuff_date || "",
  verification_status: item.overall_status || item.final_verification_status || "WIP",
});

const menuItems = [
  { key: "profile", label: "MY PROFILE", icon: <FaIdBadge className="text-4xl m-auto" /> },
  { key: "cases", label: "CASES", icon: <FaBriefcase className="text-4xl m-auto" /> },
];

const caseTabs = [
  { key: "assigned", label: "Assigned Cases" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
];

const assignedColumns = [
  ...compactCaseColumns,
  ["dob", "DOB", "date"],
  ["gender", "Gender"],
  ["father_name", "Father Name"],
  ["address", "Address"],
  ["pin_code", "Pin Code"],
  ["state", "State"],
  ["pan", "PAN"],
  ["aadhaar", "Aadhaar"],
  ["screeningstar_spoc", "ScreeningStar SPOC"],
  ["vendor_spoc_name", "Vendor SPOC"],
];
const acceptedColumns = [...compactCaseColumns, ["insuff_remarks", "Insuff Remarks"], ["insuff_date", "Insuff Date", "date"], ["verification_status", "Verification Status"], ["vendor_report_path", "Upload Report", "upload"], ["vendor_verified_date", "Verified Date", "verifiedDate"]];
const completedColumns = [...compactCaseColumns, ["in_tat_days", "Calculate In TAT"], ["out_of_tat_days", "Calculate Out of TAT"], ["vendor_report_path", "Upload / Edit Report", "upload"], ["vendor_verified_date", "Verified Date", "verifiedDate"]];

const VendorDashboard = () => {
  const navigate = useNavigate();
  const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
  const [activeSection, setActiveSection] = useState("profile");
  const [activeCaseTab, setActiveCaseTab] = useState("assigned");
  const [cases, setCases] = useState([]);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionId, setActionId] = useState(null);
  const [verifiedDates, setVerifiedDates] = useState({});
  const [caseRowsPerPage, setCaseRowsPerPage] = useState(10);
  const [caseCurrentPage, setCaseCurrentPage] = useState(1);
  const [serviceModalItems, setServiceModalItems] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);

  const signOut = () => {
    localStorage.removeItem("vendor");
    localStorage.removeItem("vendor_token");
    navigate("/vendor-login");
  };

  const openUpdatePassword = () => {
    setIsMyAccountOpen(false);
    navigate("/vendor-update-password");
  };

  const handleMenuClick = (key) => {
    setActiveSection(key);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchCases = useCallback(async (status = activeCaseTab) => {
    const token = localStorage.getItem("vendor_token");
    if (!vendor?.id || !token) return;
    setCaseLoading(true);
    setCaseError("");
    try {
      const response = await fetch(`${API}/vendor/cases?vendor_id=${vendor.id}&_token=${token}&status=${status}`);
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to fetch cases.");
      setCases((result.cases || []).map(normalizeCase));
    } catch (error) {
      setCases([]);
      setCaseError(error.message || "Unable to fetch cases.");
    } finally {
      setCaseLoading(false);
    }
  }, [activeCaseTab, vendor?.id]);

  useEffect(() => {
    if (activeSection === "cases") fetchCases(activeCaseTab);
  }, [activeSection, activeCaseTab, fetchCases]);

  const filteredCases = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return cases.filter((item) => [item.application_id, item.name, item.service_names, item.mobile_number, item.email, item.screeningstar_spoc, item.vendor_spoc_name, item.verification_status]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(search)));
  }, [cases, searchTerm]);

  const totalCasePages = Math.max(1, Math.ceil(filteredCases.length / caseRowsPerPage));
  const paginatedCases = filteredCases.slice((caseCurrentPage - 1) * caseRowsPerPage, caseCurrentPage * caseRowsPerPage);

  useEffect(() => {
    setCaseCurrentPage(1);
  }, [activeCaseTab, searchTerm, caseRowsPerPage]);

  useEffect(() => {
    if (caseCurrentPage > totalCasePages) setCaseCurrentPage(totalCasePages);
  }, [caseCurrentPage, totalCasePages]);

  const visibleColumns = activeCaseTab === "assigned" ? assignedColumns : activeCaseTab === "accepted" ? acceptedColumns : completedColumns;
  const activeItem = menuItems.find((item) => item.key === activeSection) || menuItems[0];
  const vendorServices = useMemo(() => flattenVendorServices(vendor.services), [vendor.services]);


  const openServiceModal = (services) => setServiceModalItems(services);
  const closeServiceModal = () => setServiceModalItems([]);

  const renderServices = (value) => {
    const services = getServiceItems(value);
    if (!services.length) {
      return <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg text-sm">No Services</span>;
    }
    return <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm max-w-[260px] truncate inline-block" title={services[0]}>{services[0]}</span>
      {services.length > 1 && <button type="button" className="text-blue-600 text-sm font-semibold" onClick={() => openServiceModal(services)}>View More</button>}
    </div>;
  };
  const exportCases = () => {
    const rows = filteredCases.map((item, index) => ({
      "SL No": index + 1,
      "Date of Initiation": formatDate(item.date_of_initiation),
      "Reference ID": valueOrNA(item.application_id),
      "Name of the Services": valueOrNA(item.service_names),
      "Name of Applicant": valueOrNA(item.name),
      
      DOB: formatDate(item.dob),
      Gender: valueOrNA(item.gender),
      "Father Name": valueOrNA(item.father_name),
      Address: valueOrNA(item.address),
      "Pin Code": valueOrNA(item.pin_code),
      State: valueOrNA(item.state),
      PAN: valueOrNA(item.pan),
      Aadhaar: valueOrNA(item.aadhaar),
      "ScreeningStar SPOC": valueOrNA(item.screeningstar_spoc),
      "Vendor SPOC": valueOrNA(item.vendor_spoc_name),
      "Insuff Remarks": valueOrNA(item.insuff_remarks),
      "Insuff Date": formatDate(item.insuff_date),
      "Verification Status": valueOrNA(item.verification_status),
      "Calculate In TAT": valueOrNA(item.in_tat_days),
      "Calculate Out of TAT": valueOrNA(item.out_of_tat_days),
      "Report Path": valueOrNA(item.vendor_report_path),
      "Verified Date": formatDate(item.vendor_verified_date),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Cases");
    XLSX.writeFile(workbook, `vendor-${activeCaseTab}-cases.xlsx`);
  };

  const acceptCase = async (item) => {
    const token = localStorage.getItem("vendor_token");
    setActionId(item.id);
    try {
      const response = await fetch(`${API}/vendor/cases/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, _token: token, client_application_id: item.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to accept case.");
      await fetchCases(activeCaseTab);
    } catch (error) {
      alert(error.message || "Unable to accept case.");
    } finally {
      setActionId(null);
    }
  };

  const downloadReport = async (path) => {
    const url = getFileUrl(path);
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Unable to download report.");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getFileName(path);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error.message || "Unable to download report.");
    }
  };

  const uploadReport = async (item, file) => {
    if (!file) return;
    if (Number(item.vendor_case_enabled) === 0) return alert("This case is disabled by ScreeningStar admin.");
    const token = localStorage.getItem("vendor_token");
    const formData = new FormData();
    formData.append("vendor_id", vendor.id);
    formData.append("_token", token);
    formData.append("client_application_id", item.id);
    formData.append("image", file);
    setActionId(item.id);
    try {
      const response = await fetch(`${API}/vendor/cases/upload-report`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to upload report.");
      await fetchCases(activeCaseTab);
    } catch (error) {
      alert(error.message || "Unable to upload report.");
    } finally {
      setActionId(null);
    }
  };

  const getVerifiedDateValue = (item) => verifiedDates[item.id] ?? (item.vendor_verified_date ? String(item.vendor_verified_date).slice(0, 10) : "");

  const saveVerifiedDate = async (item, verifiedDate) => {
    const token = localStorage.getItem("vendor_token");
    const nextVerifiedDate = verifiedDate || "";
    setVerifiedDates((prev) => ({ ...prev, [item.id]: nextVerifiedDate }));
    setActionId(item.id);
    try {
      const response = await fetch(`${API}/vendor/cases/verified-date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, _token: token, client_application_id: item.id, verified_date: nextVerifiedDate }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to update verified date.");
      setCases((prev) => prev.map((caseItem) => caseItem.id === item.id ? { ...caseItem, vendor_verified_date: nextVerifiedDate } : caseItem));
    } catch (error) {
      alert(error.message || "Unable to update verified date.");
    } finally {
      setActionId(null);
    }
  };


  const completeCase = async (item) => {
    if (!item.vendor_report_path) return alert("Upload report before completing this case.");
    if (!getVerifiedDateValue(item)) return alert("Select verified date before completing this case.");
    const token = localStorage.getItem("vendor_token");
    setActionId(item.id);
    try {
      const response = await fetch(`${API}/vendor/cases/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendor.id, _token: token, client_application_id: item.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to complete case.");
      await fetchCases(activeCaseTab);
    } catch (error) {
      alert(error.message || "Unable to complete case.");
    } finally {
      setActionId(null);
    }
  };
  const renderCell = (item, key, type) => {
    if (key === "service_names") return renderServices(item[key]);
    if (type === "date") return formatDate(item[key]);
    if (type === "upload") {
      const reportUrl = getReportUrl(item);
      return <div className="flex flex-col gap-2 min-w-[220px]">
        <span className={item.vendor_report_path ? "text-green-700" : "text-gray-500"}>{item.vendor_report_path ? "Uploaded" : "Not Uploaded"}</span>
        {reportUrl && <div className="flex justify-center gap-2"><a href={reportUrl} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-3 py-1 rounded">View</a></div>}
        <label className={`inline-flex justify-center items-center gap-2 px-3 py-2 rounded text-white ${Number(item.vendor_case_enabled) === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-[#2c81ba] cursor-pointer"}`}>
          <FaUpload /> Upload
          <input type="file" className="hidden" disabled={Number(item.vendor_case_enabled) === 0 || actionId === item.id} onChange={(event) => uploadReport(item, event.target.files?.[0])} />
        </label>
      </div>;
    }
    if (type === "verifiedDate") {
      return <div className="flex flex-col gap-1 items-center">
        <input type="date" className="border rounded px-2 py-1" value={getVerifiedDateValue(item)} onChange={(event) => saveVerifiedDate(item, event.target.value)} disabled={Number(item.vendor_case_enabled) === 0 || actionId === item.id} />
        {actionId === item.id && <span className="text-xs text-[#2c81ba]">Saving...</span>}
      </div>;
    }
    return valueOrNA(item[key]);
  };

  const renderCases = () => <>
    <h2 className="text-center md:text-4xl text-2xl font-bold pb-4 md:pt-7">CASES</h2>
    <div className="px-3 md:px-8 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {caseTabs.map((tab) => <button key={tab.key} onClick={() => setActiveCaseTab(tab.key)} className={`px-4 py-2 border border-black font-semibold ${activeCaseTab === tab.key ? "bg-[#c1dff2] text-[#4d606b]" : "bg-white text-black"}`}>{tab.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={caseRowsPerPage} onChange={(event) => setCaseRowsPerPage(Number(event.target.value))} className="border border-gray-300 rounded px-3 py-2 bg-white">
            {casePageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <button onClick={exportCases} className="bg-green-600 text-white px-4 py-2 rounded font-semibold">Download Excel</button>
        </div>
      </div>
      <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search cases" className="w-full border border-gray-300 rounded p-2 mb-4" />
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full border border-collapse whitespace-nowrap">
          <thead><tr className="bg-[#c1dff2] text-[#4d606b]"><th className="py-3 px-4 border border-black uppercase">SL No</th>{visibleColumns.map(([, label]) => <th key={label} className="py-3 px-4 border border-black uppercase">{label}</th>)}{(activeCaseTab === "assigned" || activeCaseTab === "accepted") && <th className="py-3 px-4 border border-black uppercase">Action</th>}</tr></thead>
          <tbody>
            {caseLoading ? <tr><td colSpan={visibleColumns.length + 2} className="py-6 text-center border border-black">Loading...</td></tr> : filteredCases.length === 0 ? <tr><td colSpan={visibleColumns.length + 2} className="py-6 text-center border border-black text-red-500">{caseError || "No cases found"}</td></tr> : paginatedCases.map((item, index) => <tr key={item.id} className="text-center">
              <td className="py-2 px-4 border border-black">{(caseCurrentPage - 1) * caseRowsPerPage + index + 1}</td>
              {visibleColumns.map(([key, , type]) => <td key={key} className="py-2 px-4 border border-black">{renderCell(item, key, type)}</td>)}
              {activeCaseTab === "assigned" && <td className="py-2 px-4 border border-black"><button onClick={() => acceptCase(item)} disabled={actionId === item.id || Number(item.vendor_case_enabled) === 0} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"><FaCheckCircle />Accept</button></td>}{activeCaseTab === "accepted" && <td className="py-2 px-4 border border-black"><button onClick={() => completeCase(item)} disabled={actionId === item.id || Number(item.vendor_case_enabled) === 0 || !item.vendor_report_path || !getVerifiedDateValue(item)} className="inline-flex items-center gap-2 bg-[#2c81ba] text-white px-4 py-2 rounded disabled:opacity-50"><FaCheckCircle />Complete</button></td>}
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <button onClick={() => setCaseCurrentPage((page) => Math.max(1, page - 1))} disabled={caseCurrentPage === 1 || caseLoading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50">Previous</button>
        <span className="text-gray-700">Page {caseCurrentPage} of {totalCasePages} | Total {filteredCases.length}</span>
        <button onClick={() => setCaseCurrentPage((page) => Math.min(totalCasePages, page + 1))} disabled={caseCurrentPage === totalCasePages || caseLoading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50">Next</button>
      </div>
      {serviceModalItems.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3 max-w-[95vw]">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-[#4d606b]">Services</h2>
              <button type="button" className="text-red-500 text-2xl" onClick={closeServiceModal}>&times;</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 w-full m-auto max-h-96 overflow-y-auto">
              {serviceModalItems.map((service, index) => (
                <span key={`${service}-${index}`} className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">{service}</span>
              ))}
            </div>
          </div>
        </div>
      )}    </div>
  </>;

  return <div className="min-h-screen bg-white text-black">
    <header className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 shadow-md"><div className="mx-auto md:px-10 px-4 py-4"><div className="flex md:flex-row justify-between items-center">
      <div className="lg:hidden"><button className="text-[#4d606b]" onClick={() => setIsMenuOpen((value) => !value)}><FaBars className="text-xl" /></button></div>
      <div className="flex items-center gap-6"><button onClick={() => handleMenuClick("profile")} className="text-[#4d606b] hidden lg:block"><FaHome className="text-3xl hover:text-[#004391] transition duration-200" /></button><div className="border newBorderOrange rounded-md p-2 shadow-md"><button onClick={() => handleMenuClick("profile")}><img src={Logo} alt="ScreeningStar" className="md:w-[13.5rem] w-auto" /></button></div><span className="text-xs md:text-lg hidden lg:block font-bold text-[#4d606b]">Hi Vendor...</span></div>
      <div className="md:mt-4 mt-0 flex items-center md:gap-10 gap-4"><div className="relative"><CgProfile className="text-4xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer" onClick={() => setIsMyAccountOpen((value) => !value)} />{isMyAccountOpen && <div className="absolute orangeBorder md:right-0 right-0 mt-2 w-64 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"><h3 className="text-xl font-bold z-99999 text-gray-700">My Account</h3><ul className="mt-2 space-y-2"><li className="text-gray-600 cursor-pointer" onClick={openUpdatePassword}><span className="text-lg text-blue-700">Update Password</span></li><li className="text-sm text-red-600 md:hidden block cursor-pointer" onClick={signOut}>SIGN OUT</li></ul></div>}</div><IoNotifications className="md:text-4xl text-2xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer" /><button onClick={signOut} className="border uppercase signoutButton hidden lg:block hover:text-white font-semibold py-2 px-6 rounded transition duration-200">SIGN OUT</button></div>
    </div></div></header>

    <div className="block md:flex flex-grow desktopPOS"><aside className="bg-white md:h-full"><div className="container flex flex-col mx-auto md:py-4 py-0">
      <ul className="flex flex-col sm:block hidden max-w-[250px] min-w-[250px] space-y-2">{menuItems.map((item) => <li key={item.key} className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeSection === item.key ? "activeSubmenu bg-[#c1dff2] text-gray-800 scale-105" : "bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105"} rounded-md shadow-md hover:shadow-lg`}><button className="flex flex-wrap justify-center items-center p-2 w-full font-semibold" onClick={() => handleMenuClick(item.key)}><div className="p-2 m-auto text-center">{item.icon}<div className="mt-2 text-sm">{item.label}</div></div></button></li>)}</ul>
      <ul className={`flex-col space-y-2 px-4 pt-4 sm:pt-0 ${isMenuOpen ? "block" : "hidden"} sm:hidden`}>{menuItems.map((item) => <li key={item.key} className={`flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeSection === item.key ? "bg-gray-200 text-gray-800 font-semibold scale-105" : "bg-white text-gray-600 hover:bg-gray-100 hover:scale-105"} shadow-md hover:shadow-lg`}><button className="flex items-center space-x-2 w-full" onClick={() => handleMenuClick(item.key)}><div className="flex gap-3 items-center">{item.icon}<span>{item.label}</span></div></button></li>)}</ul>
    </div></aside>

    <main className="flex-grow w-full overflow-hidden h-full"><div className="w-full mx-auto"><div className="bg-white"><div className="m-auto md:flex items-center w-full md:w-auto justify-between mb-4"><div className="md:py-3 flex-wrap gap-y-4 flex items-center md:pb-1"><button className="text-lg font-bold text-white" onClick={() => handleMenuClick("profile")}><div className="tab bg-[#d1d1d1] relative z-999 px-6 py-[7px]"><FaHome className="text-[rgb(44,129,186)] text-3xl hover:text-black" /><RiArrowRightWideLine className="absolute right-[-46px] top-[-28px] text-[100px] uppercase text-white z-50" /></div></button><div className="w-full md:w-auto tab bg-[#c1dff2] transition-all duration-300 ease-in-out relative polygon"><button className="tab-link transition-all duration-300 ease-in-out uppercase font-bold text-black bg-[#c1dff2]" onClick={() => handleMenuClick(activeItem.key)}>{activeItem.label}</button></div></div></div></div></div>
      <section className="border border-black bg-white">{activeSection === "profile" ? <><h2 className="text-center md:text-4xl text-2xl font-bold pb-8 md:pt-7 md:pb-4">MY PROFILE</h2><div className="table-container rounded-lg"><div className="table-scroll rounded-lg overflow-x-auto"><table className="min-w-full border bg-white overflow-auto shadow-md rounded-md p-3"><tbody><tr className="bg-[#c1dff2] text-[#4d606b]"><th className="py-2 px-4 border border-black whitespace-nowrap text-center font-bold">PARTICULARS</th><td className="py-2 px-4 border border-black text-center whitespace-nowrap uppercase font-bold">INFORMATION</td></tr><ProfileRow label="Name of the Organization" value={vendor.name_of_organization} /><ProfileRow label="Vendor Code" value={vendor.vendor_code} /><ProfileRow label="Registered Address" value={vendor.registered_address} /><ProfileRow label="State" value={vendor.state} /><ProfileRow label="Pin Code" value={vendor.pin_code} /><ProfileRow label="GSTIN" value={vendor.gst} /><ProfileRow label="TAT" value={vendor.tat} /><ProfileRow label="Agreement Date" value={vendor.agreement_date ? String(vendor.agreement_date).slice(0, 10) : "NA"} /><ProfileRow label="Email ID" value={vendor.email_id} />{personRows("Vendor SPOC", vendor.vendor_spoc)}{personRows("Escalation Manager", vendor.escalation_manager)}{personRows("Authorized Detail", vendor.authorized_details)}<ProfileRow label="Status" value={vendor.status === 0 ? "Inactive" : "Active"} valueClass={vendor.status === 0 ? "text-red-500" : "text-green-500"} /></tbody></table></div></div><h3 className="text-center md:text-2xl text-xl font-bold py-5 text-[#4d606b]">SERVICES AND PRICES</h3><div className="table-container rounded-lg px-3 pb-6"><div className="table-scroll rounded-lg overflow-x-auto"><table className="min-w-full border bg-white overflow-auto shadow-md rounded-md p-3"><thead><tr className="bg-[#c1dff2] text-[#4d606b]"><th className="py-2 px-4 border border-black uppercase">SL No</th><th className="py-2 px-4 border border-black uppercase">Group</th><th className="py-2 px-4 border border-black uppercase">Service Code</th><th className="py-2 px-4 border border-black uppercase">Services</th><th className="py-2 px-4 border border-black uppercase">Pricing</th><th className="py-2 px-4 border border-black uppercase">Packages</th></tr></thead><tbody>{vendorServices.length ? vendorServices.map((service, index) => <tr key={`${service.serviceCode}-${index}`}><td className="py-2 px-4 border border-black text-center">{index + 1}</td><td className="py-2 px-4 border border-black">{service.group}</td><td className="py-2 px-4 border border-black">{service.serviceCode}</td><td className="py-2 px-4 border border-black">{service.serviceTitle}</td><td className="py-2 px-4 border border-black text-center">{service.price}</td><td className="py-2 px-4 border border-black">{service.packages || "No Packages"}</td></tr>) : <tr><td colSpan={6} className="py-5 text-center border border-black text-red-500">No services found</td></tr>}</tbody></table></div></div></> : renderCases()}</section>
    </main></div>
  </div>;
};

export default VendorDashboard;
