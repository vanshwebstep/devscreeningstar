import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO, format } from 'date-fns';
const InvoiceMaster = () => {
    const [invoices, setInvoices] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const [responseError, setResponseError] = useState(null);
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
    const formatDate = (dateString) => {
        if (!dateString || isNaN(new Date(dateString).getTime())) {
            return "N/A";
        }

        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
    const parseAndValidateDate = (dateString) => {
        if (!dateString) return null;
        const parsed = parseISO(dateString);
        return isNaN(parsed) ? null : parsed;
    };
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        month: '',
        organizationName: '',
        taxableValue: '',
        invoiceSubtotal: '',
        paymentStatus: '',
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const filteredInvoices = invoices.filter((invoice) => {
        return (
            (filters.month ? invoice.month == filters.month : true) &&
            (filters.organizationName ? invoice.customer_name.includes(filters.organizationName) : true) &&
            (filters.taxableValue ? invoice.taxable_value === filters.taxableValue : true) &&
            (filters.invoiceSubtotal ? invoice.invoice_subtotal === filters.invoiceSubtotal : true) &&
            (filters.paymentStatus ? invoice.payment_status.includes(filters.paymentStatus) : true)
        );
    });
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");

            const url = `https://api.screeningstar.co.in/invoice-master?admin_id=${admin_id}&_token=${storedToken}`;

            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const data = await response.json();

            if (!response.ok) {

                Swal.fire('Error!', `${data.message}`, 'error');
                setResponseError(data.message);


                throw new Error("Failed to fetch invoices");
            }

            setInvoices(data.invoice || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleUpdateClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowModal(true); // Open the modal when the "UPDATE" button is clicked
    };

    const handleDeleteClick = async (invoice) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action will permanently delete the invoice.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Processing...",
                    text: "Deleting invoice, please wait.",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });

                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");

                try {
                    const response = await fetch(
                        `https://api.screeningstar.co.in/invoice-master/delete?id=${invoice.id}&admin_id=${admin_id}&_token=${storedToken}`,
                        { method: "DELETE" }
                    );

                    const result = await response.text();

                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "Invoice has been deleted successfully.",
                        timer: 2000,
                        showConfirmButton: false,
                    }).then(() => {
                        fetchInvoices();
                    });

                } catch (error) {
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Something went wrong while deleting the invoice.",
                    });
                } finally {
                    fetchInvoices();
                }
            }
        });
    };

    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
        setSelectedInvoice(null); // Reset the selected invoice
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updatedInvoice = {
            admin_id: JSON.parse(localStorage.getItem("admin"))?.id,
            _token: localStorage.getItem("_token"),
            customer_id: selectedInvoice.customer_id,
            id: selectedInvoice.id,
            month: selectedInvoice.month,
            year: selectedInvoice.year,
            due_date: selectedInvoice.due_date,
            payment_status: selectedInvoice.payment_status,
            received_date: selectedInvoice.received_date,
            tds_percentage: selectedInvoice.tds_percentage,
            tds_deducted: selectedInvoice.tds_deducted,
            ammount_received: selectedInvoice.ammount_received,
            balance_payment: selectedInvoice.balance_payment,
            payment_remarks: selectedInvoice.payment_remarks,
        };

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(updatedInvoice);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        try {
            const response = await fetch("https://api.screeningstar.co.in/invoice-master/update", requestOptions);
            const result = await response.json();

            if (response.ok) {
                // Show success alert
                Swal.fire({
                    title: "Success!",
                    text: "Invoice updated successfully.",
                    icon: "success",
                    confirmButtonText: "OK",
                });
                fetchInvoices(); // Reload invoices after update
                handleCloseModal(); // Close the modal after the update
            } else {
                // Show error alert
                Swal.fire({
                    title: "Error!",
                    text: result.message || "Failed to update invoice.",
                    icon: "error",
                    confirmButtonText: "Retry",
                });
            }
        } catch (error) {
            // Show error alert
            Swal.fire({
                title: "Error!",
                text: "An unexpected error occurred while updating the invoice.",
                icon: "error",
                confirmButtonText: "Retry",
            });
            console.error("Error updating invoice:", error);
        }
    };

    const uniqueOrganizations =
        filteredInvoices.length > 0
            ? [...new Set(filteredInvoices.map((invoice) => invoice.customer_name))]
            : [];



    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };



    const exportToExcel = () => {
        const formattedData = paginatedInvoices.map((invoice, index) => ({
            "S.No": index + 1,
            Month: (() => {
                const monthNames = {
                    "01": "January",
                    "02": "February",
                    "03": "March",
                    "04": "April",
                    "05": "May",
                    "06": "June",
                    "07": "July",
                    "08": "August",
                    "09": "September",
                    "10": "October",
                    "11": "November",
                    "12": "December",
                };
                return monthNames[invoice.month] || invoice.month;
            })(),
            "Organization Name": invoice.customer_name,
            "GST Number": invoice.gst_number,
            State: invoice.state,
            "State Code": invoice.state_code,
            "Invoice Date": formatDate(invoice.invoice_date),
            "Invoice Number": invoice.invoice_number,
            "Taxable Value": invoice.taxable_value,
            CGST: invoice.cgst,
            SGST: invoice.sgst,
            IGST: invoice.igst,
            "Total GST": invoice.total_gst,
            "Invoice Subtotal": invoice.invoice_subtotal,
            "Due Date": formatDate(invoice.due_date),
            "Payment Status": invoice.payment_status,
            "Received Date": formatDate(invoice.received_date),
            "TDS Percentage": invoice.tds_percentage,
            "TDS Deducted": invoice.tds_deducted,
            "Amount Received": invoice.ammount_received,
            "Balance Payment": invoice.balance_payment,
            "Payment Remarks": invoice.payment_remarks,
        }));

        // Create a new worksheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

        // Write the workbook to a file and download it
        XLSX.writeFile(workbook, "Invoices.xlsx");
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [paginatedInvoices, loading]);
    const handleExportToExcel = () => {
        const tableHeaders = [
            "S.No",
            "Month",
            "Organization Name",
            "GST Number",
            "State",
            "State Code",
            "Invoice Date",
            "Invoice Number",
            "Taxable Value",
            "CGST",
            "SGST",
            "IGST",
            "Total GST",
            "Invoice Subtotal",
            "Due Date",
            "Payment Status",
            "Received Date",
            "TDS Percentage",
            "TDS Deducted",
            "Amount Received",
            "Balance Payment",
            "Payment Remarks",
        ];

        const tableData = paginatedInvoices.length
            ? paginatedInvoices.map((invoice, index) => ({
                "S.No": index + 1,
                Month: (() => {
                    const monthNames = {
                        "1": "January",
                        "2": "February",
                        "3": "March",
                        "4": "April",
                        "5": "May",
                        "6": "June",
                        "7": "July",
                        "8": "August",
                        "9": "September",
                        "10": "October",
                        "11": "November",
                        "12": "December",
                    };
                    return monthNames[invoice.month] || invoice.month; // Fallback to original value if no match
                })(),
                "Organization Name": invoice.customer_name || "null",
                "GST Number": invoice.gst_number || "null",
                State: invoice.state || "null",
                "State Code": invoice.state_code || "null",
                "Invoice Date": formatDate(invoice.invoice_date) || "null",
                "Invoice Number": invoice.invoice_number || "null",
                "Taxable Value": invoice.taxable_value || "null",
                CGST: invoice.cgst || "null",
                SGST: invoice.sgst || "null",
                IGST: invoice.igst || "null",
                "Total GST": invoice.total_gst || "null",
                "Invoice Subtotal": invoice.invoice_subtotal || "null",
                "Due Date": formatDate(invoice.due_date) || "null",
                "Payment Status": invoice.payment_status || "null",
                "Received Date": formatDate(invoice.received_date) || "null",
                "TDS Percentage": invoice.tds_percentage || "null",
                "TDS Deducted": invoice.tds_deducted || "null",
                "Amount Received": invoice.ammount_received || "null",
                "Balance Payment": invoice.balance_payment || "null",
                "Payment Remarks": invoice.payment_remarks || "null",
            }))
            : [{ ...Object.fromEntries(tableHeaders.map((header) => [header, "null"])) }];

        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

        XLSX.writeFile(workbook, "Invoices.xlsx");
    };

    return (
        <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
            <div className="bg-white md:p-12 p-6 w-full mx-auto">
                <button
                    onClick={handleExportToExcel}
                    className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                    Export to Excel
                </button>
                <div className="md:flex space-x-4 mb-4">
                    <select
                        name="month"
                        value={filters.month}
                        onChange={handleFilterChange}
                        className="px-4 py-2 border md:w-auto w-full mb-4 md:mb-0 rounded"
                    >
                        <option value="">Select Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    <select
                        name="organizationName"
                        value={filters.organizationName}
                        onChange={handleFilterChange}
                        className="px-4 py-2 border md:w-auto w-full margin-l mb-4 md:mb-0 "
                    >
                        <option value="">Select Organization</option>
                        {uniqueOrganizations.map((org, index) => (
                            <option key={index} value={org}>
                                {org}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        name="taxableValue"
                        placeholder="Taxable Value"
                        value={filters.taxableValue}
                        onChange={handleFilterChange}
                        className="px-4 py-2 border md:w-auto w-full margin-l mb-4 md:mb-0"
                    />
                    <input
                        type="number"
                        name="invoiceSubtotal"
                        placeholder="Invoice Subtotal"
                        value={filters.invoiceSubtotal}
                        onChange={handleFilterChange}
                        className="px-4 py-2 border md:w-auto w-full margin-l mb-4 md:mb-0 "
                    />
                    <input
                        type="text"
                        name="paymentStatus"
                        placeholder="Payment Status"
                        value={filters.paymentStatus}
                        onChange={handleFilterChange}
                        className="px-4 py-2 border md:w-auto w-full margin-l mb-4 md:mb-0 "
                    />
                </div>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="border rounded-lg px-3 py-1 text-gray-700 bg-white mb-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                >
                    {optionsPerPage.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full border-collapse border border-black">
                            <thead className="bg-[#c1dff2]">
                                <tr className="whitespace-nowrap text-[#4d606b]">
                                    <th className="border border-black uppercase px-4 py-2">S.No</th>
                                    <th className="border border-black uppercase px-4 py-2">MONTH</th>
                                    <th className="border border-black uppercase px-4 py-2 ">Organization Name</th>
                                    <th className="border border-black uppercase px-4 py-2">GST Number</th>
                                    <th className="border border-black uppercase px-4 py-2">STATE</th>
                                    <th className="border border-black uppercase px-4 py-2">STATE CODE</th>
                                    <th className="border border-black uppercase px-4 py-2">Invoice Date</th>
                                    <th className="border border-black uppercase px-4 py-2">Invoice Number</th>
                                    <th className="border border-black uppercase px-4 py-2">Taxable Value</th>
                                    <th className="border border-black uppercase px-4 py-2">CGST</th>
                                    <th className="border border-black uppercase px-4 py-2">SGST</th>
                                    <th className="border border-black uppercase px-4 py-2">IGST</th>
                                    <th className="border border-black uppercase px-4 py-2">Total GST</th>
                                    <th className="border border-black uppercase px-4 py-2">Invoice Subtotal</th>
                                    <th className="border border-black uppercase px-4 py-2">Due Date</th>
                                    <th className="border border-black uppercase px-4 py-2">Payment Status</th>
                                    <th className="border border-black uppercase px-4 py-2">Received Date</th>
                                    <th className="border border-black uppercase px-4 py-2">TDS Percentage</th>
                                    <th className="border border-black uppercase px-4 py-2">TDS Deducted</th>
                                    <th className="border border-black uppercase px-4 py-2">Amount Received</th>
                                    <th className="border border-black uppercase px-4 py-2">Balance Payment</th>
                                    <th className="border border-black uppercase px-4 py-2">Payment Remarks</th>
                                    <th className="border border-black uppercase px-4 py-2">Action</th>
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
                                ) : paginatedInvoices.length > 0 ? (
                                    paginatedInvoices.map((invoice, index) => (
                                        <tr key={index} className="even:bg-gray-100">
                                            <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                                            <td className="border border-black px-4 py-2">
                                                {(() => {
                                                    const monthNames = {
                                                        "1": "January",
                                                        "2": "February",
                                                        "3": "March",
                                                        "4": "April",
                                                        "5": "May",
                                                        "6": "June",
                                                        "7": "July",
                                                        "8": "August",
                                                        "9": "September",
                                                        "10": "October",
                                                        "11": "November",
                                                        "12": "December"
                                                    };
                                                    return monthNames[invoice.month] || invoice.month; // Fallback to original value if no match
                                                })()}
                                            </td>

                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{invoice.customer_name}</td>
                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{invoice.gst_number}</td>
                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{invoice.state}</td>
                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{invoice.state_code}</td>
                                            <td className="border border-black px-4 py-2">{formatDate(invoice.invoice_date)}</td>
                                            <td className="border border-black px-4 py-2">{invoice.invoice_number}</td>
                                            <td className="border border-black px-4 py-2">{invoice.taxable_value}</td>
                                            <td className="border border-black px-4 py-2">{invoice.cgst}</td>
                                            <td className="border border-black px-4 py-2">{invoice.sgst}</td>
                                            <td className="border border-black px-4 py-2">{invoice.igst}</td>
                                            <td className="border border-black px-4 py-2">{invoice.total_gst}</td>
                                            <td className="border border-black px-4 py-2">{invoice.invoice_subtotal}</td>
                                            <td className="border border-black px-4 py-2">{formatDate(invoice.due_date)}</td>
                                            <td className="border border-black px-4 py-2">{invoice.payment_status}</td>
                                            <td className="border border-black px-4 py-2">{formatDate(invoice.received_date)}</td>
                                            <td className="border border-black px-4 py-2">{invoice.tds_percentage}</td>
                                            <td className="border border-black px-4 py-2">{invoice.tds_deducted}</td>
                                            <td className="border border-black px-4 py-2">{invoice.ammount_received}</td>
                                            <td className="border border-black px-4 py-2">{invoice.balance_payment}</td>
                                            <td className="border border-black px-4 py-2">{invoice.payment_remarks}</td>
                                            <td className="border border-black px-4 py-2 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-200"
                                                        onClick={() => handleUpdateClick(invoice)}
                                                    >
                                                        Update
                                                    </button>

                                                    <button
                                                        className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-200"
                                                        onClick={() => handleDeleteClick(invoice)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="15" className="text-center text-red-500 py-6">

                                            {responseError && responseError !== "" ? responseError : "No invoices available."}

                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4">
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

            {showModal && selectedInvoice && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-999 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg  w-[900px]"> {/* Adjust the width here */}
                        <h2 className="text-xl font-bold mb-4">Update Invoice</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-4"> {/* Grid layout for 50-50 width */}
                                <div className="mb-4">
                                    <label className="block mb-2">Month</label>
                                    <select
                                        className="w-full p-2 border"
                                        value={selectedInvoice.month}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, month: e.target.value })}
                                    >
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block mb-2">Year</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.year}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, year: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Due Date</label>
                                    <DatePicker
                                        selected={parseAndValidateDate(selectedInvoice.due_date)}
                                        onChange={(date) => {
                                            const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                            setSelectedInvoice((prev) => ({ ...prev, due_date: formattedDate }));
                                        }}
                                        onChangeRaw={(e) => {
                                            setSelectedInvoice((prev) => ({ ...prev, due_date: e.target.value }));
                                        }}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="Select Due Date"
                                        className="w-full p-2 border border-gray-300 rounded-md uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Payment Status <span className="text-red-500 text-xl" >*</span></label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.payment_status}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, payment_status: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Received Date</label>
                                    <DatePicker
                                        selected={parseAndValidateDate(selectedInvoice.received_date)}
                                        onChange={(date) => {
                                            const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                            setSelectedInvoice((prev) => ({ ...prev, received_date: formattedDate }));
                                        }}
                                        onChangeRaw={(e) => {
                                            setSelectedInvoice((prev) => ({ ...prev, received_date: e.target.value }));
                                        }}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="Select Received Date"
                                        className="w-full p-2 border border-gray-300 rounded-md uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">TDS Percentage</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.tds_percentage}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, tds_percentage: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">TDS Deducted</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.tds_deducted}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, tds_deducted: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Amount Received</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.ammount_received}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, ammount_received: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Balance Payment</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.balance_payment}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, balance_payment: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2">Payment Remarks<span className="text-red-500 text-xl" >*</span></label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border"
                                        value={selectedInvoice.payment_remarks}
                                        onChange={(e) => setSelectedInvoice({ ...selectedInvoice, payment_remarks: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md mb-2">
                                Update Invoice
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                            >
                                Close
                            </button>
                        </form>
                    </div>
                </div>
            )}



        </div>
    );
};

export default InvoiceMaster;
