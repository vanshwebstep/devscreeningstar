import React, { useCallback, useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import swal from "sweetalert";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";
import { VendorForm } from "./AdminVendorOnboarding";

Modal.setAppElement("#root");
const API = "http://localhost:5000";

const parseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const AdminVendorListing = () => {
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const navigate = useNavigate();
  const initializedRef = useRef(false);
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState("100%");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const syncScroll = (e) => {
    if (!topScrollRef.current || !tableScrollRef.current) return;
    if (e.target === topScrollRef.current) tableScrollRef.current.scrollLeft = e.target.scrollLeft;
    else topScrollRef.current.scrollLeft = e.target.scrollLeft;
  };

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);
    const admin = JSON.parse(localStorage.getItem("admin"));
    const token = localStorage.getItem("_token");
    try {
      await validateAdminLogin();
      const response = await fetch(`${API}/vendor/list?admin_id=${admin?.id}&_token=${token}`);
      const data = await response.json();
      const newToken = data.token || data._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok) throw new Error(data.message || "Unable to fetch vendors.");
      setVendors(data.vendors || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Unable to fetch vendors.", "error");
      if (String(error.message || "").toLowerCase().includes("login")) navigate("/admin-login");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, [navigate, setApiLoading, validateAdminLogin]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (tableScrollRef.current) setScrollWidth(tableScrollRef.current.scrollWidth + "px");
  }, [vendors, loading]);

  const handleDelete = async (vendor) => {
    const confirm = await swal({ title: "Are you sure?", text: `Delete ${vendor.name_of_organization}?`, icon: "warning", buttons: true, dangerMode: true });
    if (!confirm) return;

    const admin = JSON.parse(localStorage.getItem("admin"));
    const token = localStorage.getItem("_token");
    setDeletingId(vendor.id);
    try {
      const response = await fetch(`${API}/vendor/delete?vendor_id=${vendor.id}&admin_id=${admin?.id}&_token=${token}`, { method: "DELETE" });
      const data = await response.json();
      const newToken = data.token || data._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok) throw new Error(data.message || "Unable to delete vendor.");
      setVendors((prev) => prev.filter((item) => item.id !== vendor.id));
      Swal.fire("Deleted", data.message || "Vendor deleted successfully.", "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to delete vendor.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = vendors.filter((vendor) => [vendor.name_of_organization, vendor.vendor_code, vendor.email_id, vendor.state]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const firstService = (vendor) => {
    const groups = parseJson(vendor.services, []);
    const services = groups.flatMap((group) => group.services || []);
    if (!services.length) return "No Services";
    return services.length > 1 ? `${services[0].serviceTitle} +${services.length - 1}` : services[0].serviceTitle;
  };

  const personText = (value) => {
    const person = parseJson(value, {});
    return [person.name, person.email, person.mobile, person.designation].filter(Boolean).join(" | ") || "-";
  };

  return (
    <div className="w-full bg-[#c1dff2] overflow-hidden">
      <div className="border border-black space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        <div className="md:flex justify-between items-center">
          <div className="text-left">
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 shadow-sm focus:ring-2 focus:ring-blue-400">
              {[10, 50, 100, 200, 500, 1000].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="mb-4 md:w-1/2 text-right">
            <input type="text" placeholder="Search by Vendor Name, Code, Email or State" className="w-full rounded-md p-2.5 border border-gray-300" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="table-container rounded-lg">
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}><div className="top-scroll-inner" style={{ width: scrollWidth }} /></div>
          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table className="min-w-full border-collapse border border-black rounded-lg">
              <thead className="rounded-lg border border-black">
                <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap text-left">
                  <th className="uppercase border border-black px-4 py-2 text-center">SL</th>
                  <th className="uppercase border border-black px-4 py-2">Vendor Code</th>
                  <th className="uppercase border border-black px-4 py-2">Name of Organization</th>
                  <th className="uppercase border border-black px-4 py-2">Registered Address</th>
                  <th className="uppercase border border-black px-4 py-2">State</th>
                  <th className="uppercase border border-black px-4 py-2">Pin Code</th>
                  <th className="uppercase border border-black px-4 py-2">GST</th>
                  <th className="uppercase border border-black px-4 py-2">TAT</th>
                  <th className="uppercase border border-black px-4 py-2">Agreement Date</th>
                  <th className="uppercase border border-black px-4 py-2">Email</th>
                  <th className="uppercase border border-black px-4 py-2">Services</th>
                  <th className="uppercase border border-black px-4 py-2">Vendor Spoc</th>
                  <th className="uppercase border border-black px-4 py-2">Escalation Manager</th>
                  <th className="uppercase border border-black px-4 py-2">Authorized Details</th>
                  <th className="uppercase border border-black px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={15} className="py-10 text-center"><div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin m-auto"></div></td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={15} className="text-center py-4 text-red-500">No data available in table</td></tr>
                ) : paginated.map((vendor, index) => (
                  <tr key={vendor.id} className="border-b border-gray-300 text-left">
                    <td className="border border-black px-4 py-2 text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.vendor_code || "-"}</td>
                    <td className="border border-black px-4 py-2 min-w-[220px] whitespace-nowrap">{vendor.name_of_organization || "-"}</td>
                    <td className="border border-black px-4 py-2 min-w-[260px]">{vendor.registered_address || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.state || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.pin_code || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.gst || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.tat || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.agreement_date ? String(vendor.agreement_date).slice(0, 10) : "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">{vendor.email_id || "-"}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap"><span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">{firstService(vendor)}</span></td>
                    <td className="border border-black px-4 py-2 min-w-[260px]">{personText(vendor.vendor_spoc)}</td>
                    <td className="border border-black px-4 py-2 min-w-[260px]">{personText(vendor.escalation_manager)}</td>
                    <td className="border border-black px-4 py-2 min-w-[260px]">{personText(vendor.authorized_details)}</td>
                    <td className="border border-black px-4 py-2 whitespace-nowrap">
                      <button onClick={() => setEditingVendor(vendor)} className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-2">Edit</button>
                      <button disabled={deletingId === vendor.id} onClick={() => handleDelete(vendor)} className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded ${deletingId === vendor.id ? "opacity-50 cursor-not-allowed" : ""}`}>{deletingId === vendor.id ? "Deleting..." : "Delete"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400">Previous</button>
          <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400">Next</button>
        </div>
      </div>

      <Modal isOpen={!!editingVendor} onRequestClose={() => setEditingVendor(null)} contentLabel="Edit Vendor" className="modal-content overflow-y-scroll max-h-[90vh] md:w-[90%]" overlayClassName="modal-overlay">
        {editingVendor && <VendorForm mode="edit" initialVendor={editingVendor} onSaved={() => { setEditingVendor(null); fetchVendors(); }} onCancel={() => setEditingVendor(null)} />}
      </Modal>
    </div>
  );
};

export default AdminVendorListing;
