import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useApiLoading } from "../ApiLoadingContext";

const ExpenseMaster = () => {
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const navigate = useNavigate();

  // State declarations
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState("100%");

  // 🔹 Sync scroll positions
  const syncScroll = (e) => {
    if (e.target === topScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.target.scrollLeft;
    } else {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };
  const [expenseData, setExpenseData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setLocalApiLoading] = useState(false); // For internal loading if needed

  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    invoice_date: "",
    invoice_number: "",
    vendor_name: "",
    invoice_value: "",
    gst_value: "",
    sub_total: "",
    tds_deduction: "",
    payable_mount: "",
    payment_status: "",
    date_of_payment: "",
    remarks: "",
  });

  const fetchData = async () => {
    setApiLoading(true);
    setLoading(true);

    const storedToken = localStorage.getItem("_token");
    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;

    if (!storedToken || !admin_id) {
      Swal.fire("Error", "Authentication data missing. Please login again.", "error");
      localStorage.clear();
      navigate("/admin-login");
      return;
    }

    const url = `https://api.screeningstar.co.in/expense-tracker?admin_id=${admin_id}&_token=${storedToken}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && Array.isArray(result.data.customers)) {
        setExpenseData(result.data.customers);
        setFilterData(result.data.customers);
        const pageCount = Math.ceil(result.data.customers.length / rowsPerPage);
        setTotalPages(pageCount);
      } else {
        Swal.fire("Error", result.message || "Failed to load data", "error");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire("Error", "Something went wrong while fetching data.", "error");
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };


  useEffect(() => {
    validateAdminLogin();
    fetchData();
  }, []);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle search
  useEffect(() => {
    const filtered = expenseData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilterData(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setCurrentPage(1);
  }, [searchTerm, expenseData, rowsPerPage]);

  // Pagination change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle Add/Edit button click
  const handleAdd = () => {
    setEditId(null);
    setFormData({
      invoice_date: "",
      invoice_number: "",
      vendor_name: "",
      invoice_value: "",
      gst_value: "",
      sub_total: "",
      tds_deduction: "",
      payable_mount: "",
      payment_status: "",
      date_of_payment: "",
      remarks: "",
    });
    setShowAddModal(true);
  };

  // const handleEditClick = (item) => {
  //   setEditId(item.id);
  //   setFormData(item);
  //   setShowAddModal(true);
  // };

  const handleEditClick = (id) => {
    const selectedItem = expenseData.find((item) => item.id === id);
    if (selectedItem) {
      setFormData({
        invoice_date: selectedItem.invoice_date || "",
        invoice_number: selectedItem.invoice_number || "",
        vendor_name: selectedItem.vendor_name || "",
        invoice_value: selectedItem.invoice_value || "",
        gst_value: selectedItem.gst_value || "",
        sub_total: selectedItem.sub_total || "",
        tds_deduction: selectedItem.tds_deduction || "",
        payable_mount: selectedItem.payable_mount || "",
        payment_status: selectedItem.payment_status || "",
        date_of_payment: selectedItem.date_of_payment || "",
        remarks: selectedItem.remarks || "",
      });
      setEditId(id);
      setShowAddModal(true);
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setApiLoading(true);
    setLoading(true);

    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire("Error", "Missing admin ID or token. Please login again.", "error");
      localStorage.clear();
      navigate("/admin-login");
      return;
    }

    const payload = {
      ...formData,
      admin_id,
      _token: storedToken,
    };

    if (editId) payload.id = editId;

    const url = editId
      ? `https://api.screeningstar.co.in/expense-tracker/update`
      : `https://api.screeningstar.co.in/expense-tracker/create`;

    const method = editId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload), // ✅ Send as JSON, not query string
      });

      const result = await response.json();

      if (response.ok && result.status !== false) {
        const newToken = result.token || result._token || storedToken;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }

        Swal.fire(
          "Success!",
          editId ? "Expense updated successfully!" : "Expense saved successfully!",
          "success"
        );

        // Reset form
        setFormData({
          invoice_date: "",
          invoice_number: "",
          vendor_name: "",
          invoice_value: "",
          gst_value: "",
          sub_total: "",
          tds_deduction: "",
          payable_mount: "",
          payment_status: "",
          date_of_payment: "",
          remarks: "",
        });

        setEditId(null);
        setShowAddModal(false);
        fetchData();
      } else {
        Swal.fire("Failed!", result.message || "An error occurred", "error");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire("Failed!", "Something went wrong. Please try again.", "error");
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };


  // delete
  const handleDeleteClick = async (invoiceId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const token = localStorage.getItem("_token");

      if (!admin?.id || !token) {
        Swal.fire("Error", "Admin not logged in.", "error");
        return;
      }

      const payload = {
        admin_id: admin.id,
        _token: token,
        id: invoiceId,
      };

      const response = await fetch("https://api.screeningstar.co.in/expense-tracker/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("Raw delete response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse error:", err);
        throw new Error("Server did not return valid JSON");
      }

      if (data.status) {
        Swal.fire("Deleted!", "Invoice deleted successfully.", "success");
        fetchData(); // Refresh invoice list
      } else {
        Swal.fire("Delete failed", data.message || "Failed to delete invoice.", "error");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      Swal.fire("Error", error.message || "An unexpected error occurred.", "error");
    }
  };
  // Pagination data
  const paginatedData = (searchTerm ? filterData : expenseData).slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [paginatedData, loading]);



  return (
    <div className="w-full border border-black overflow-hidden bg-white md:p-12 p-6 mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={handleAdd}
          className="bg-[#2c81ba] p-5 w-15 mt-5 rounded-md text-white "
        >
          Add Expense
        </button>
      </div>

      <div className="table-container rounded-lg">
        {/* Top Scroll */}
        <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
          <div className="top-scroll-inner" style={{ width: scrollWidth }} />
        </div>

        {/* Actual Table Scroll */}
        <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
          <table className="min-w-full border-collapse border border-black ">
            <thead className="bg-[#c1dff2]">
              <tr className="whitespace-nowrap text-[#4d606b]">
                <th className="border border-black uppercase px-4 py-2">SL NO</th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Invoice Date
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Invoice Number
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Vendor Name
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Invoice Value
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  GST Value
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Sub Total
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  TDS Deduction
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Payable Amount
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Payment Status
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Date of Payment
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Remarks
                </th>
                <th className="uppercase border border-black px-4 py-2 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="15" className="text-center py-6">
                    <div className="flex w-full justify-center items-center">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border  border-black px-4 py-2 text-center">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="border  border-black px-4 py-2">{item.invoice_date}</td>
                    <td className="border  border-black px-4 py-2">{item.invoice_number}</td>
                    <td className="border  border-black px-4 py-2">{item.vendor_name}</td>
                    <td className="border  border-black px-4 py-2 text-center">
                      {item.invoice_value}
                    </td>
                    <td className="border  border-black px-4 py-2 text-center">
                      {item.gst_value}
                    </td>
                    <td className="border  border-black px-4 py-2">{item.sub_total}</td>
                    <td className="border  border-black px-4 py-2">{item.tds_deduction}</td>
                    <td className="border  border-black px-4 py-2">{item.payable_mount}</td>
                    <td className="border  border-black px-4 py-2">{item.payment_status}</td>
                    <td className="border  border-black px-4 py-2">{item.date_of_payment}</td>
                    <td className="border  border-black px-4 py-2">{item.remarks}</td>
                    <td className="border  border-black px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditClick(item.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 hover:scale-105 text-white font-bold rounded-md transition duration-200 whitespace-nowrap"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 hover:scale-105 text-white font-bold rounded-md transition duration-200 whitespace-nowrap">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {editId ? "Edit Expense" : "Add New Expense"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Value
                </label>
                <input
                  type="number"
                  name="invoice_value"
                  value={formData.invoice_value}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Value
                </label>
                <input
                  type="number"
                  name="gst_value"
                  value={formData.gst_value}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Total
                </label>
                <input
                  type="number"
                  name="sub_total"
                  value={formData.sub_total}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TDS Deduction
                </label>
                <input
                  type="number"
                  name="tds_deduction"
                  value={formData.tds_deduction}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payable Amount
                </label>
                <input
                  type="number"
                  name="payable_mount"
                  value={formData.payable_mount}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <input
                  type="text"
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Payment
                </label>
                <input
                  type="date"
                  name="date_of_payment"
                  value={formData.date_of_payment}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {editId ? "Update" : "Save"}
              </button>

            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseMaster;
