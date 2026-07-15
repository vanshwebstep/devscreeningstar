import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";

const API = "http://localhost:5000";
const optionsPerPage = [10, 50, 100, 200, 500, 1000];

const parseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const display = (value) => (value === null || value === undefined || value === "" ? "NIL" : value);

const formatDate = (value) => {
  if (!value) return "NIL";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NIL";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const getServiceIds = (value) => String(value || "")
  .split(",")
  .map((id) => Number(String(id).trim()))
  .filter(Boolean);

const flattenVendorServices = (vendor) => {
  const groups = parseJson(vendor?.services, []);
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((group) => (group.services || []).map((service) => ({
    serviceId: Number(service.serviceId || service.service_id || service.id),
    serviceTitle: service.serviceTitle || service.service_title || service.title || "NIL",
    price: service.price || "0",
  })));
};

const getPricing = (application, vendor) => {
  if (!vendor) return "NIL";
  const appServiceIds = new Set(getServiceIds(application.services));
  const matchedServices = flattenVendorServices(vendor).filter((service) => appServiceIds.has(Number(service.serviceId)));
  if (!matchedServices.length) return "NIL";
  return matchedServices.map((service) => `${service.serviceTitle}: ${service.price || "0"}`).join(", ");
};

const AdminVendorValidationSheet = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const initializedRef = useRef(false);
  const printRef = useRef(null);
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const vendorById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => map.set(String(vendor.id), vendor));
    return map;
  }, [vendors]);

  const fetchData = useCallback(async () => {
    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");
    if (!admin?.id || !token) {
      navigate("/admin-login");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    try {
      await validateAdminLogin();
      const [caseResponse, vendorResponse] = await Promise.all([
        fetch(`${API}/client-master-tracker/vendor-allocation-list?admin_id=${admin.id}&_token=${token}`),
        fetch(`${API}/vendor/list?admin_id=${admin.id}&_token=${token}&status=all`),
      ]);
      const caseResult = await caseResponse.json();
      const vendorResult = await vendorResponse.json();
      const newToken = caseResult.token || caseResult._token || vendorResult.token || vendorResult._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!caseResponse.ok || !caseResult.status) throw new Error(caseResult.message || "Unable to fetch vendor validation data.");
      if (!vendorResponse.ok || !vendorResult.status) throw new Error(vendorResult.message || "Unable to fetch vendors.");
      setApplications((caseResult.data?.applications || []).filter((item) => item.vendor_id));
      setVendors(vendorResult.vendors || []);
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to fetch vendor validation data.", "error");
      if (String(error.message || "").toLowerCase().includes("login")) navigate("/admin-login");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, [navigate, setApiLoading, validateAdminLogin]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return applications.filter((item) => {
      const vendor = vendorById.get(String(item.vendor_id));
      const matchesVendor = !selectedVendor || String(item.vendor_id) === String(selectedVendor);
      const values = [item.application_id, item.name, item.service_names, item.vendor_name, item.vendor_code, getPricing(item, vendor), item.vendor_accepted_at, item.vendor_verified_date];
      const matchesSearch = values.filter(Boolean).some((value) => String(value).toLowerCase().includes(search));
      return matchesVendor && matchesSearch;
    });
  }, [applications, searchTerm, selectedVendor, vendorById]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const buildRows = (rows = filteredData) => rows.map((item, index) => {
    const vendor = vendorById.get(String(item.vendor_id));
    return {
      "Sno.": index + 1,
      "Reference ID": display(item.application_id),
      "Name of Applicant": display(item.name),
      "Name of Services": display(item.service_names),
      Pricing: display(getPricing(item, vendor)),
      "Accepted Date": formatDate(item.vendor_accepted_at),
      "Verified Date": formatDate(item.vendor_verified_date),
    };
  });

  const exportToExcel = () => {
    if (!filteredData.length) {
      Swal.fire("No Data", "No vendor validation data available to export.", "info");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(buildRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Validation");
    XLSX.writeFile(workbook, "vendor-validation-sheet.xlsx");
  };

  const printSheet = () => {
    const printContents = printRef.current?.innerHTML || "";
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Vendor Validation Sheet</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{text-align:center;font-size:22px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:8px;font-size:12px;text-align:left}th{background:#c1dff2;color:#4d606b;text-transform:uppercase}.no-print{display:none}</style></head><body>${printContents}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="bg-[#c1dff2] border border-black">
      <h2 className="md:text-2xl text-xl font-bold py-3 text-left text-[#4d606b] px-3 border">VENDOR VALIDATION SHEET</h2>
      <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        <div className="md:flex justify-between items-start gap-4 no-print">
          <div className="flex flex-wrap gap-2">
            <button onClick={exportToExcel} className="bg-green-600 text-white px-5 py-2 rounded font-semibold">Download Excel</button>
            {/* <button onClick={printSheet} className="bg-[#2c81ba] text-white px-5 py-2 rounded font-semibold">Print</button> */}
            <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setCurrentPage(1); }} className="border rounded px-3 py-2 bg-white">
              {optionsPerPage.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="md:flex gap-3 md:w-1/2 mt-3 md:mt-0">
            <select value={selectedVendor} onChange={(event) => { setSelectedVendor(event.target.value); setCurrentPage(1); }} className="border md:w-56 w-full mb-2 p-2.5 rounded bg-white">
              <option value="">All Vendors</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name_of_organization}</option>)}
            </select>
            <input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Search reference, applicant, service, pricing" className="w-full rounded-md p-2.5 border border-gray-300" />
          </div>
        </div>

        <div ref={printRef}>
          <h1 className="text-center text-2xl font-bold text-[#4d606b] pb-4">Vendor Validation Sheet</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-black whitespace-nowrap">
              <thead><tr className="bg-[#c1dff2] text-[#4d606b]"><th className="border border-black px-4 py-2">Sno.</th><th className="border border-black px-4 py-2">Reference ID</th><th className="border border-black px-4 py-2">Name of Applicant</th><th className="border border-black px-4 py-2">Name of Services</th><th className="border border-black px-4 py-2">Pricing</th><th className="border border-black px-4 py-2">Accepted Date</th><th className="border border-black px-4 py-2">Verified Date</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="py-8 text-center border border-black">Loading...</td></tr> : paginatedData.length === 0 ? <tr><td colSpan={7} className="py-4 text-center text-red-500 border border-black">No data available in table</td></tr> : paginatedData.map((item, index) => {
                  const vendor = vendorById.get(String(item.vendor_id));
                  return <tr key={item.id}><td className="border border-black px-4 py-2 text-center">{index + 1 + (currentPage - 1) * rowsPerPage}</td><td className="border border-black px-4 py-2">{display(item.application_id)}</td><td className="border border-black px-4 py-2">{display(item.name)}</td><td className="border border-black px-4 py-2 min-w-[260px]">{display(item.service_names)}</td><td className="border border-black px-4 py-2 min-w-[260px]">{display(getPricing(item, vendor))}</td><td className="border border-black px-4 py-2">{formatDate(item.vendor_accepted_at)}</td><td className="border border-black px-4 py-2">{formatDate(item.vendor_verified_date)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 no-print">
          <button onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50">Previous</button>
          <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorValidationSheet;