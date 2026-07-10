import React, { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import { useApiLoading } from '../ApiLoadingContext';
import { useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

const DataModal = ({ isOpen, data, onClose }) => {
    if (!isOpen) return null;

    let parsedData = {};
    try {
        // Check if data is a string and parse it; if it's already an object, use it directly
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-999">
                <div className="bg-white p-6 rounded-lg w-1/2">
                    <h2 className="text-xl font-semibold mb-4">Error</h2>
                    <p className="text-red-500">Invalid data format</p>
                    <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
                        Close
                    </button>
                </div>
            </div>
        );
    }


    const cleanValue = (val) => {
        try {
            if (typeof val === "string") {
                // Step 1: Normalize common escape sequences
                val = val
                    // Replace multiple backslashes with one (e.g. fix double-escaping)
                    .replace(/\\\\/g, "\\")
                    // Replace escaped double quotes with a plain double quote
                    .replace(/\\"/g, "\"")
                    // Convert escaped newlines and carriage returns to actual characters
                    .replace(/\\n/g, "\n")
                    .replace(/\\r/g, "\r");

                // Step 2: Recursively parse JSON if the string appears to be stringified JSON
                while (
                    typeof val === "string" &&
                    (val.startsWith("{") || val.startsWith("[") || val.startsWith('"'))
                ) {
                    try {
                        // JSON.parse may return an object, number, array, etc.
                        const parsed = JSON.parse(val);
                        val = parsed;
                    } catch (e) {
                        // If parsing fails, break out of the loop
                        break;
                    }
                }

                // Step 3: If we still have a string, perform additional cleaning
                if (typeof val === "string") {
                    val = val
                        // Remove any leftover backslashes
                        .replace(/\\+/g, "")
                        // Remove any leftover double quotes
                        .replace(/"+/g, "")
                        // Replace underscores with spaces
                        .replace(/_+/g, " ")
                        // Remove any characters other than letters, digits, spaces, commas, and newlines.
                        // (You can adjust the allowed characters inside the brackets as needed.)
                        .replace(/[^a-zA-Z0-9 ,\n]/g, "")
                        // Trim extra whitespace at beginning and end
                        .trim();
                }
            }

            // If the final value is an object, return a prettified JSON string
            return typeof val === "object" ? JSON.stringify(val, null, 2) : val;
        } catch (e) {
            // In case of any unexpected errors, return the original value.
            return val;
        }
    };


    const formatJson = (inputJson) => {
        let formattedJson = {};

        Object.keys(inputJson).forEach((key) => {
            let formattedValue = inputJson[key];

            if (typeof formattedValue === "string") {
                formattedValue = formattedValue
                    .replace(/\\+/g, "") // Remove backslashes
                    .replace(/"+/g, "") // Remove double quotes
                    .replace(/_+/g, " ") // Replace underscores with spaces
                    .replace(/[^a-zA-Z0-9 ,:-]/g, "") // Remove special characters except letters, digits, spaces, commas, colons, and dashes
                    .trim(); // Trim leading and trailing spaces

                // Add extra spacing between the values if you want more space
                if (key === "new") {
                    formattedValue = formattedValue.replace(/, /g, ",\n\n"); // Add two new lines after each comma
                }
            }

            formattedJson[key] = formattedValue;
        });

        return formattedJson;
    };



    // Example JSON object
    const inputJson = {
        old: "2005-07-10T00:00:00000Z",
        new: "2005-07-10, address verified successfully"
    };

    // Format the JSON
    const formattedJson = formatJson(inputJson);

    // Convert to JSON string and log output
    console.log(JSON.stringify(formattedJson, null, 2));


    // Example JSON object

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-1/2 h-96 overflow-scroll">
                <h2 className="text-xl font-semibold mb-4">Update Data</h2>

                {/* Table to display data */}
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Field</th>
                            <th className="border px-4 py-2">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(parsedData).map(([key, value], index) => (
                            <tr key={index}>
                                <td className="border px-4 py-2 font-semibold">{key}</td>
                                <td className="border px-4 py-2">
                                    {typeof value === "object" ? (
                                        <pre>{JSON.stringify(formatJson(value))}</pre>
                                    ) : (
                                        JSON.stringify(formatJson(value))
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
                    Close
                </button>
            </div>
        </div>
    );
};

const ViewUser = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
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


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const log_admin_id = queryParams.get('log_admin_id');
    const log_id = queryParams.get('log_id');

    const openModal = (data) => {
        setModalData(data);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalData(null);
    };

    const fetchData = useCallback(() => {
        setLoading(true);
        setApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Missing admin_id or _token");
            setLoading(false);
            setApiLoading(false);
            return;
        }

        const url = `https://api.screeningstar.co.in/user-history/activity?admin_id=${admin_id}&_token=${storedToken}&log_admin_id=${log_admin_id}&log_date=${log_id}`;

        fetch(url, {
            method: "GET",
            redirect: "follow",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((result) => {
                const newToken = result.token || result._token || storedToken || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setTableData(result.activities || []);
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                setTableData([]);
            })
            .finally(() => {
                setApiLoading(false);
                setLoading(false);
            });
    }, [log_admin_id, log_id]);

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin();
                    await fetchData();
                }
            } catch (error) {
                console.error(error.message);
                navigate("/admin-login");
            }
        };

        initialize();
    }, [navigate, fetchData]);

    const filteredData = Array.isArray(tableData)
        ? tableData.filter(
            (row) =>
                (row?.action?.toLowerCase().includes(searchTerm.toLowerCase()) || !row?.action) ||
                (row?.error?.toString()?.includes(searchTerm.toLowerCase()) || row?.error === null) ||
                (row?.module?.toString()?.includes(searchTerm.toLowerCase()) || row?.module === null)
        )
        : [];


    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Acknowledgement");
        XLSX.writeFile(wb, "Acknowledgement.xlsx");
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [filteredData, loading]);

    const Loader = () => (
        <tr>
            <td colSpan="7">
                <div className="flex w-full justify-center items-center h-20">
                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                </div>
            </td>
        </tr>
    );
    const handleGoBack = () => {
        navigate('/admin-user-history');
    };
    return (
        <div className="bg-[#c1dff2] border border-black">
            <div className="bg-white  p-12 w-full mx-auto">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className="py-4 ">
                    {/* <div className="mb-4 flex justify-between">
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 border"
                    >
                        Export to Excel
                    </button>
                    <input
                        type="text"
                        placeholder="Search by Action, Error, or Module"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border p-2 rounded w-1/3"
                    />
                </div> */}

                    <DataModal isOpen={isModalOpen} data={modalData} onClose={closeModal} />
                    <div className="table-container rounded-lg">
                        {/* Top Scroll */}
                        <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                        </div>

                        {/* Actual Table Scroll */}
                        <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>

                            <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
                                <thead className="rounded-lg">
                                    <tr className="bg-[#c1dff2] text-[#4d606b] rounded-lg">
                                        <th className="border border-black px-4 uppercase py-2">SL</th>
                                        <th className="border border-black px-4 uppercase py-2">Action</th>
                                        <th className="border border-black px-4 uppercase py-2">Result</th>
                                        <th className="border border-black px-4 uppercase py-2">Error</th>
                                        <th className="border border-black px-4 uppercase py-2">Ip Address</th>
                                        <th className="border border-black px-4 uppercase py-2">Module</th>
                                        <th className="border border-black px-4 uppercase py-2">Update</th>
                                        <th className="border border-black px-4 uppercase py-2">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="flex justify-center items-center h-24">
                                                    <Loader />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {filteredData.length > 0 ? (
                                                filteredData.map((row, index) => {
                                                    let updateData = null;
                                                    try {
                                                        updateData = typeof row.update === 'string' ? JSON.parse(row.update) : row.update;
                                                    } catch (error) {
                                                        updateData = row.update; // If parsing fails, keep the original value
                                                    }
                                                    const showButton = updateData && Object.keys(updateData).length > 1; // More than just an 'id'

                                                    return (
                                                        <tr className="text-center" key={index}>
                                                            <td className="border border-black px-4 py-2">{index + 1}</td>
                                                            <td className="border border-black capitalize px-4 py-2">
                                                                {row.action ? row.action : "No Result"}
                                                            </td>
                                                            <td className="border border-black px-4 py-2">
                                                                {row.result === '1' ? (
                                                                    <span className="text-green-500">Success</span>
                                                                ) : (
                                                                    <span className="text-red-500">Failed</span>
                                                                )}
                                                            </td>
                                                            <td className="border border-black capitalize px-4 py-2">
                                                                {row.error !== null && row.error !== undefined ? row.error : "No Error"}
                                                            </td>

                                                            <td className="border border-black capitalize px-4 py-2">
                                                                {row.client_ip !== null && row.client_ip !== undefined ? row.client_ip : "No Ip Found"}
                                                            </td>
                                                            <td className="border border-black capitalize px-4 py-2">
                                                                {row.module !== null && row.module !== undefined ? row.module : "No Module"}
                                                            </td>
                                                            <td className="border border-black px-4 py-2">
                                                                {updateData ? (
                                                                    typeof updateData === 'object' ? (
                                                                        <button
                                                                            onClick={() => openModal(updateData)}
                                                                            className="bg-blue-500 text-white px-4 py-2 rounded"
                                                                        >
                                                                            View Update
                                                                        </button>
                                                                    ) : (
                                                                        updateData
                                                                    )
                                                                ) : (
                                                                    "No Update"
                                                                )}
                                                            </td>
                                                            <td className="border border-black px-4 py-2">
                                                                {new Date(row.created_at).toLocaleString().replace(/\//g, '-') || 'Undefined'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="border border-black px-4 py-2 text-center">
                                                        No data available in table
                                                    </td>
                                                </tr>
                                            )}

                                        </>
                                    )}
                                </tbody>

                            </table>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewUser;
