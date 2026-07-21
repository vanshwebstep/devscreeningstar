import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";

const API = "http://localhost:5000";
const optionsPerPage = [10, 50, 100, 200, 500, 1000];

const formatDate = (value) => {
  if (!value) return "NIL";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NIL";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const display = (value) => {
  if (value === null || value === undefined || value === "") return "NIL";
  return value;
};

const formatStatus = (value) => {
  const normalizedValue = display(value);
  if (normalizedValue === "NIL") return normalizedValue;
  return String(normalizedValue).replace(/_/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
};

const parseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const getVendorSpocName = (vendor) => {
  const spoc = parseJson(vendor?.vendor_spoc, {});
  return spoc.name || spoc.email || spoc.mobile || "NIL";
};

const getFileUrl = (path) => {
  if (!path) return "";
  const normalizedPath = String(path).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  return `${API}/${normalizedPath.replace(/^\/+/, "")}`;
};

const getReportUrl = (item) => getFileUrl(item.vendor_report_url || item.vendor_report_path);
const getFileName = (path) => String(path || "vendor-report").replace(/\\/g, "/").split("/").pop() || "vendor-report";

const getServiceItems = (value) => String(value || "")
  .split(",")
  .map((service) => service.trim())
  .filter(Boolean);
const getCaseStatus = (item) => item.overall_status || item.status || "NIL";

const CaseAllocationToVendor = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const initializedRef = useRef(false);
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState("100%");
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseError, setResponseError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [allocatingId, setAllocatingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [bulkAllocating, setBulkAllocating] = useState(false);
  const [serviceModalItems, setServiceModalItems] = useState([]);

  const syncScroll = (event) => {
    if (!topScrollRef.current || !tableScrollRef.current) return;
    if (event.target === topScrollRef.current) {
      tableScrollRef.current.scrollLeft = event.target.scrollLeft;
    } else {
      topScrollRef.current.scrollLeft = event.target.scrollLeft;
    }
  };

  const fetchData = useCallback(async () => {
    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");

    if (!admin?.id || !token) {
      navigate("/admin-login");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    setResponseError("");

    try {
      await validateAdminLogin();

      const [caseResponse, vendorResponse] = await Promise.all([
        fetch(`${API}/client-master-tracker/vendor-allocation-list?admin_id=${admin.id}&_token=${token}`),
        fetch(`${API}/vendor/list?admin_id=${admin.id}&_token=${token}`),
      ]);

      const caseResult = await caseResponse.json();
      const vendorResult = await vendorResponse.json();

      const newToken = caseResult.token || caseResult._token || vendorResult.token || vendorResult._token;
      if (newToken) localStorage.setItem("_token", newToken);

      if (!caseResponse.ok || !caseResult.status) {
        throw new Error(caseResult.message || "Unable to fetch cases.");
      }

      if (!vendorResponse.ok || !vendorResult.status) {
        throw new Error(vendorResult.message || "Unable to fetch vendors.");
      }

      setApplications(caseResult.data?.applications || []);
      setVendors(vendorResult.vendors || []);
    } catch (error) {
      console.error(error);
      setResponseError(error.message || "Unable to fetch case allocation data.");
      Swal.fire("Error", error.message || "Unable to fetch case allocation data.", "error");
      if (String(error.message || "").toLowerCase().includes("login")) {
        navigate("/admin-login");
      }
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

  const vendorById = useMemo(() => {
    const map = new Map();
    vendors.forEach((vendor) => map.set(String(vendor.id), vendor));
    return map;
  }, [vendors]);

  const statusOptions = useMemo(() => {
    const values = applications
      .map((item) => getCaseStatus(item))
      .filter((status) => status && status !== "NIL");
    return [...new Set(values)];
  }, [applications]);

  const filteredData = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return applications.filter((item) => {
      const matchesStatus = !selectedStatus || getCaseStatus(item) === selectedStatus;
      const allocatedVendor = vendorById.get(String(item.vendor_id));
      const searchableValues = [
        item.client_unique_id,
        item.customer_name,
        item.branch_name,
        item.location,
        item.name,
        item.sub_client,
        item.application_id,
        item.check_id,
        item.ticket_id,
        item.employee_id,
        item.client_spoc_name,
        item.vendor_name,
        item.vendor_code,
        getVendorSpocName(allocatedVendor),
        item.vendor_report_path,
        item.vendor_report_url,
        getCaseStatus(item),
        formatStatus(getCaseStatus(item)),
      ];
      const matchesSearch = searchableValues
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [applications, searchTerm, selectedStatus, vendorById]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const selectedCaseIdSet = useMemo(() => new Set(selectedCaseIds.map((id) => String(id))), [selectedCaseIds]);
  const selectablePageIds = useMemo(() => paginatedData.map((item) => String(item.id)), [paginatedData]);
  const selectedPageCount = selectablePageIds.filter((id) => selectedCaseIdSet.has(id)).length;
  const isPageFullySelected = selectablePageIds.length > 0 && selectedPageCount === selectablePageIds.length;
  const isBulkMode = selectedCaseIds.length > 0;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [paginatedData, loading, vendors]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleCaseSelection = (caseId) => {
    const normalizedId = String(caseId);
    setSelectedCaseIds((prev) => prev.includes(normalizedId)
      ? prev.filter((id) => id !== normalizedId)
      : [...prev, normalizedId]);
  };

  const togglePageSelection = () => {
    setSelectedCaseIds((prev) => {
      const current = new Set(prev.map((id) => String(id)));
      if (isPageFullySelected) {
        selectablePageIds.forEach((id) => current.delete(id));
      } else {
        selectablePageIds.forEach((id) => current.add(id));
      }
      return [...current];
    });
  };

  const clearSelectedCases = () => setSelectedCaseIds([]);
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

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire("No Data", "No case data available to export.", "info");
      return;
    }

    const rows = filteredData.map((item, index) => ({
      "SL No": index + 1,
      "Client ID": display(item.client_unique_id),
      "Client Name": display(item.customer_name),
      Branch: display(item.branch_name),
      Location: display(item.location),
      "Applicant Name": display(item.name),
      "Sub Client": display(item.sub_client),
      "Reference ID": display(item.application_id),
      "Check ID": display(item.check_id),
      "Ticket ID": display(item.ticket_id),
      "Employee ID": display(item.employee_id),
      Services: display(item.service_names),
      Status: formatStatus(getCaseStatus(item)),
      "Allocated Vendor": display(item.vendor_name),
      "Vendor Code": display(item.vendor_code),
      "Vendor SPOC": display(getVendorSpocName(vendorById.get(String(item.vendor_id)))),
      "Vendor Report": display(item.vendor_report_url || item.vendor_report_path),
      "Vendor Upload Access": Number(item.vendor_case_enabled) === 0 ? "Disabled" : "Enabled",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Case Allocation");
    XLSX.writeFile(workbook, "case-allocation-to-vendor.xlsx");
  };

  const handleVendorAllocate = async (application, vendorId) => {
    if (!vendorId) return;

    const vendor = vendors.find((item) => String(item.id) === String(vendorId));
    if (!vendor) {
      Swal.fire("Error", "Selected vendor was not found.", "error");
      return;
    }

    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");

    setAllocatingId(application.id);
    setApiLoading(true);

    try {
      const response = await fetch(`${API}/client-master-tracker/allocate-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_application_id: application.id,
          vendor_id: vendor.id,
          admin_id: admin.id,
          _token: token,
        }),
      });

      const result = await response.json();
      const newToken = result.token || result._token;
      if (newToken) localStorage.setItem("_token", newToken);

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Unable to allocate vendor.");
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id
            ? {
                ...item,
                vendor_id: vendor.id,
                vendor_name: vendor.name_of_organization,
                vendor_code: vendor.vendor_code,
                vendor_allocated_at: new Date().toISOString(),
                vendor_case_status: "assigned",
                vendor_case_enabled: 1,
              }
            : item
        )
      );

      Swal.fire("Success", result.message || "Vendor allocated successfully.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Unable to allocate vendor.", "error");
    } finally {
      setAllocatingId(null);
      setApiLoading(false);
    }
  };

  const handleBulkVendorAllocate = async (vendorId) => {
    if (!vendorId) return;
    if (!selectedCaseIds.length) {
      Swal.fire("Select Cases", "Please select cases before bulk allocation.", "info");
      return;
    }

    const vendor = vendors.find((item) => String(item.id) === String(vendorId));
    if (!vendor) {
      Swal.fire("Error", "Selected vendor was not found.", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Allocate selected cases?",
      text: `${selectedCaseIds.length} selected case(s) will be allocated to ${vendor.name_of_organization}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Allocate",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");

    setBulkAllocating(true);
    setApiLoading(true);

    try {
      const response = await fetch(`${API}/client-master-tracker/allocate-vendor-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_application_ids: selectedCaseIds,
          vendor_id: vendor.id,
          admin_id: admin.id,
          _token: token,
        }),
      });

      const result = await response.json();
      const newToken = result.token || result._token;
      if (newToken) localStorage.setItem("_token", newToken);

      if (!response.ok || !result.status) {
        throw new Error(result.message || "Unable to allocate selected cases.");
      }

      const selectedSet = new Set(selectedCaseIds.map((id) => String(id)));
      setApplications((prev) => prev.map((item) => selectedSet.has(String(item.id))
        ? {
            ...item,
            vendor_id: vendor.id,
            vendor_name: vendor.name_of_organization,
            vendor_code: vendor.vendor_code,
            vendor_allocated_at: new Date().toISOString(),
            vendor_case_status: "assigned",
            vendor_case_enabled: 1,
          }
        : item));
      setSelectedCaseIds([]);
      Swal.fire("Success", result.message || "Selected cases allocated successfully.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Unable to allocate selected cases.", "error");
    } finally {
      setBulkAllocating(false);
      setApiLoading(false);
    }
  };

  const handleVendorCaseAccessToggle = async (application) => {
    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    const token = localStorage.getItem("_token");
    const nextEnabled = Number(application.vendor_case_enabled) === 0 ? 1 : 0;

    setTogglingId(application.id);
    setApiLoading(true);

    try {
      const response = await fetch(`${API}/client-master-tracker/vendor-case-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_application_id: application.id,
          enabled: nextEnabled,
          admin_id: admin.id,
          _token: token,
        }),
      });
      const result = await response.json();
      const newToken = result.token || result._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok || !result.status) throw new Error(result.message || "Unable to update vendor case access.");

      setApplications((prev) => prev.map((item) => item.id === application.id ? { ...item, vendor_case_enabled: nextEnabled } : item));
      Swal.fire("Success", result.message || "Vendor case access updated.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Unable to update vendor case access.", "error");
    } finally {
      setTogglingId(null);
      setApiLoading(false);
    }
  };
  return (
    <div className="bg-[#c1dff2] border border-black">
      <h2 className="md:text-2xl text-xl font-bold py-3 text-left text-[#4d606b] px-3 border">
        CASE ALLOCATION TO VENDOR
      </h2>

      <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        <div className="md:flex justify-between items-baseline mb-6 gap-4">
          <div className="text-left">
            <button
              className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-6 py-2 rounded"
              onClick={exportToExcel}
            >
              Export to Excel
            </button>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <select
                value=""
                disabled={!isBulkMode || bulkAllocating || vendors.length === 0}
                onChange={(event) => handleBulkVendorAllocate(event.target.value)}
                className="border rounded-md px-3 py-2 min-w-[320px] bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {isBulkMode ? `Allocate ${selectedCaseIds.length} selected case(s) to vendor` : "Select cases to bulk allocate"}
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name_of_organization}
                    {vendor.vendor_code ? ` (${vendor.vendor_code})` : ""}
                    {` - SPOC: ${getVendorSpocName(vendor)}`}
                  </option>
                ))}
              </select>
              {isBulkMode && <button type="button" onClick={clearSelectedCases} disabled={bulkAllocating} className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50">Clear Selection</button>}
              {bulkAllocating && <span className="text-sm text-[#2c81ba]">Allocating selected cases...</span>}
            </div>
            <div className="mt-4">
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-1 text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
              >
                {optionsPerPage.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:w-1/2 text-right">
            <div className="md:flex justify-end gap-3">
              <select
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value);
                  setCurrentPage(1);
                }}
                className="border md:w-56 w-full  p-2.5 rounded bg-white uppercase"
              >
                <option value="">Select Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search by Client, Branch, Reference ID, Name, Vendor, Check ID and Ticket ID"
                className="w-full rounded-md p-2.5 border border-gray-300"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="table-container rounded-lg">
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
          </div>

          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
              <thead className="rounded-lg">
                <tr className="bg-[#c1dff2] text-[#4d606b]">
                  <th className="uppercase border border-black px-4 py-2">
                    <input
                      type="checkbox"
                      checked={isPageFullySelected}
                      disabled={bulkAllocating || paginatedData.length === 0}
                      onChange={togglePageSelection}
                    />
                  </th>
                  <th className="uppercase border border-black px-4 py-2">SL No</th>
                  <th className="uppercase border border-black px-4 py-2">Client ID</th>
                  <th className="uppercase border border-black px-4 py-2">Client Name</th>
                  <th className="uppercase border border-black px-4 py-2">Branch</th>
                  <th className="uppercase border border-black px-4 py-2">TAT Days</th>
                  <th className="uppercase border border-black px-4 py-2">Location</th>
                  <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
                  <th className="uppercase border border-black px-4 py-2">Sub Client</th>
                  <th className="uppercase border border-black px-4 py-2">Reference ID</th>
                  <th className="uppercase border border-black px-4 py-2">Check ID</th>
                  <th className="uppercase border border-black px-4 py-2">Ticket ID</th>
                  <th className="uppercase border border-black px-4 py-2">Employee ID</th>
                  <th className="uppercase border border-black px-4 py-2">Initiation Date</th>
                  <th className="uppercase border border-black px-4 py-2">Deadline Date</th>
                  <th className="uppercase border border-black px-4 py-2">Services</th>
                  <th className="uppercase border border-black px-4 py-2">Overall Status</th>
                  <th className="uppercase border border-black px-4 py-2">Current Vendor</th>
                  <th className="uppercase border border-black px-4 py-2">Vendor Report</th>
                  <th className="uppercase border border-black px-4 py-2">Vendor Upload Access</th>
                  <th className="uppercase border border-black px-4 py-2">Select Vendor To Allocate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={21} className="py-10 text-center">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin m-auto"></div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="py-4 text-center text-red-500">
                      {responseError || "No data available in table"}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="text-center">
                      <td className="border border-black px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedCaseIdSet.has(String(item.id))}
                          disabled={bulkAllocating || allocatingId === item.id}
                          onChange={() => toggleCaseSelection(item.id)}
                        />
                      </td>
                      <td className="border border-black px-4 py-2">
                        {index + 1 + (currentPage - 1) * rowsPerPage}
                      </td>
                      <td className="border border-black px-4 py-2">{display(item.client_unique_id)}</td>
                      <td className="border border-black px-4 py-2">{display(item.customer_name)}</td>
                      <td className="border border-black px-4 py-2">{display(item.branch_name)}</td>
                      <td className="border border-black px-4 py-2">{display(item.tat_days)}</td>
                      <td className="border border-black px-4 py-2">{display(item.location)}</td>
                      <td className="border border-black px-4 py-2">{display(item.name)}</td>
                      <td className="border border-black px-4 py-2">{display(item.sub_client)}</td>
                      <td className="border border-black px-4 py-2">{display(item.application_id)}</td>
                      <td className="border border-black px-4 py-2">{display(item.check_id)}</td>
                      <td className="border border-black px-4 py-2">{display(item.ticket_id)}</td>
                      <td className="border border-black px-4 py-2">{display(item.employee_id)}</td>
                      <td className="border border-black px-4 py-2">{formatDate(item.initiation_date || item.created_at)}</td>
                      <td className="border border-black px-4 py-2">{formatDate(item.deadline_date)}</td>
                      <td className="border border-black px-4 py-2 text-left">
                        {renderServices(item.service_names)}
                      </td>
                      <td className="border border-black px-4 py-2 uppercase">{formatStatus(getCaseStatus(item))}</td>
                      <td className="border border-black px-4 py-2">
                        {item.vendor_name ? (
                          <div className="text-left">
                            <div>{item.vendor_name}</div>
                            {item.vendor_code && <div className="text-xs text-gray-500">{item.vendor_code}</div>}
                            <div className="text-xs text-gray-600">SPOC: {getVendorSpocName(vendorById.get(String(item.vendor_id)))}</div>
                          </div>
                        ) : (
                          "NIL"
                        )}
                      </td>
                      <td className="border border-black px-4 py-2">
                        {item.vendor_report_path ? (
                          <div className="flex justify-center gap-2">
                            <a href={getReportUrl(item)} target="_blank" rel="noreferrer" className="bg-[#2c81ba] text-white px-3 py-2 rounded inline-block">View</a>
                          </div>
                        ) : "NIL"}
                      </td>
                      <td className="border border-black px-4 py-2">
                        <button
                          onClick={() => handleVendorCaseAccessToggle(item)}
                          disabled={togglingId === item.id || !item.vendor_id}
                          className={`px-4 py-2 rounded text-white ${Number(item.vendor_case_enabled) === 0 ? "bg-red-600" : "bg-green-600"} disabled:opacity-50`}
                        >
                          {Number(item.vendor_case_enabled) === 0 ? "Disabled" : "Enabled"}
                        </button>
                      </td>
                      <td className="border border-black px-4 py-2">
                        <select
                          value={item.vendor_id || ""}
                          disabled={allocatingId === item.id || vendors.length === 0 || isBulkMode || bulkAllocating}
                          onChange={(event) => handleVendorAllocate(item, event.target.value)}
                          className="border rounded-md p-2 min-w-[240px] bg-white"
                        >
                          <option value="">Select Vendor</option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name_of_organization}
                              {vendor.vendor_code ? ` (${vendor.vendor_code})` : ""}
                              {` - SPOC: ${getVendorSpocName(vendor)}`}
                            </option>
                          ))}
                        </select>
                        {allocatingId === item.id && (
                          <div className="text-xs text-[#2c81ba] mt-1">Allocating...</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
        )}        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseAllocationToVendor;
