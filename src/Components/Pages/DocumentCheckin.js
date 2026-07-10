import React, { useCallback, useEffect, useState,useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { FaChevronLeft } from 'react-icons/fa';
import Modal from 'react-modal';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Default from "../../imgs/default.png"
import axios from "axios";
import { useApiLoading } from '../ApiLoadingContext';

const DocumentCheckin = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [expandedRow, setExpandedRow] = useState({ index: '', headingsAndStatuses: [] });
    const navigate = useNavigate();
    const [loadingGenrate, setLoadingGenrate] = useState(null);
    const location = useLocation();
    const [adminTAT, setAdminTAT] = useState('');
    const [data, setData] = useState([]);
    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedServiceData, setSelectedServiceData] = useState(null);
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

    const [serviceresults, setServiceresults] = useState([]);

    const [servicesLoading, setServicesLoading] = useState(null);

    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [parentName, setParentName] = useState("N/A");


    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const colorNames = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink'];
    const getColorStyle = (status) => {
        // Check if the status contains any color name
        for (let color of colorNames) {
            if (status.toLowerCase().includes(color)) {
                return { color: color, fontWeight: 'bold' };  // Return the style with the matching color
            }
        }
        return {}; // Default if no color is found
    };
    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }

    const queryParams = new URLSearchParams(location.search);
    const clientId = queryParams.get('clientId');
    const branchId = queryParams.get('branchId');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    // Fetch data from the main API
    const fetchData = useCallback(() => {
        if (!branchId || !adminId || !token) {
            return;
        }
        else {
            setLoading(true);
        }
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/document-check-in/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setData(result.customers || []);

                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                setParentName(result.branchName);

            })
            .catch((error) => {
                console.error('Fetch error:', error);
            }).finally(() => {
                setLoading(false);
            });

    }, [branchId, adminId, token, setData]);



    const fetchServicesData = async (applicationId, servicesList, reportDownload = '0') => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");
        setServicesLoading(applicationId);

        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setServicesLoading(null);
            return [];
        }

        try {
            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList)}&report_download=${reportDownload}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;

            // Perform the fetch request
            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const result = await response.json();

            if (response.ok) {
                setServicesLoading(null);

                // Update the token if a new one is provided
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item != null);
                setServiceresults(filteredResults);
                console.log('filteredResults', filteredResults);
                return filteredResults;
            } else {
                // Handle error and update token if provided
                setServicesLoading(applicationId);
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            console.error("Error fetching service data:", error);
            setServicesLoading(applicationId);
            return [];
        }
    };

    const hasAnnexureDocuments = (serviceData) => {
        if (!serviceData || Object.keys(serviceData).length === 0) {
            return null;
        }
        return true;
    };
    const downloadFile = (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop(); // Extract the file name from the URL
        link.click();
    };
    async function checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok; // Returns true if HTTP status is 200-299
        } catch (error) {
            console.error(`Error checking image existence at ${url}:`, error);
            return false;
        }
    }

    // Helper function to load and validate the image
    async function validateImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Image fetch failed for URL: ${url}`);
                return null;
            }

            const blob = await response.blob();
            const img = new Image();
            img.src = URL.createObjectURL(blob);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            return img; // Return the validated image
        } catch (error) {
            console.error(`Error validating image from ${url}:`, error);
            return null;
        }
    }


    // Function to handle image format
    const getImageFormat = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (ext === 'png') return 'PNG';
        if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
        if (ext === 'webp') return 'WEBP';
        return 'PNG'; // Default to PNG if not recognized
    };

    // Image load function with promise
    function loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error loading image: ' + imageUrl));
            img.src = imageUrl;
        });
    }

    // Function to scale the image
    function scaleImage(img, maxWidth, maxHeight) {
        const imgWidth = img.width;
        const imgHeight = img.height;

        let width = imgWidth;
        let height = imgHeight;

        // Scale image to fit within maxWidth and maxHeight
        if (imgWidth > maxWidth) {
            width = maxWidth;
            height = (imgHeight * maxWidth) / imgWidth;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = (imgWidth * maxHeight) / imgHeight;
        }

        return { width, height };
    }
    function formatStatus(status) {
        // Step 1: Replace all special characters with a space
        let formatted = status.replace(/[^a-zA-Z0-9 ]/g, ' ');

        // Step 2: Trim extra spaces from start and end, and then split into words
        formatted = formatted.trim().replace(/\s+/g, ' ');

        // Step 3: Capitalize based on length
        if (formatted.length < 6) {
            // Capitalize the whole string
            return formatted.toUpperCase();
        } else {
            // Capitalize only the first letter of each word
            return formatted.replace(/\b\w/g, function (char) {
                return char.toUpperCase();
            });
        }
    }



    useEffect(() => {
        fetchData();
    }, [clientId, branchId]);
    // useEffect(() => {
    //     fetchAdminList();
    // }, [fetchAdminList]);


    // Refresh the table data by fetching from the generatereport API after generating a report
    const handleViewMore = async (id) => {
        if (expandedRow.index === id) {
            console.log("Row is already expanded. Collapsing the row.");
            setExpandedRow({ index: '', headingsAndStatuses: [] }); // Collapse the row by resetting expandedRow
            return;
        }

        console.log("Row is not expanded. Expanding the row.");

        const filteredData = data.filter(item => item.main_id === id);

        if (filteredData.length === 0) {
            console.error("No data found for the specified id:", id);
            return;
        }

        const mainIds = filteredData.map(item => item.main_id);
        const services = filteredData.map(item => item.services);
        const servicesData = await fetchServicesData(mainIds, services);

        const headingsAndStatuses = [];
        const uniqueHeadingsAndStatuses = new Map(); // Use Map to ensure uniqueness

        servicesData.forEach((service, idx) => {
            const parsedJson = JSON.parse(service?.reportFormJson?.json || '{}');
            const heading = parsedJson?.heading;

            if (heading) {
                let status = 'INITIATED';

                if (service.annexureData) {
                    status = service.annexureData.status || 'INITIATED';
                }

                if (!status) {
                    status = 'INITIATED';
                } else if (status.length < 4) {
                    status = status.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase() || 'N/A';
                } else {
                    status = status
                        .replace(/[^a-zA-Z0-9\s]/g, "")
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'N/A';
                }

                uniqueHeadingsAndStatuses.set(`${heading}-${status}`, { heading, status });
            }
        });

        const uniqueHeadingsAndStatusesArray = Array.from(uniqueHeadingsAndStatuses.values());

        // Update state with the expanded row data
        setExpandedRow({
            index: id, // Set the clicked row's id as the expanded row
            headingsAndStatuses: uniqueHeadingsAndStatusesArray,
        });
    };


    const handleViewDocuments = (serviceData) => {
        const commaSeparatedData = Object.values(serviceData).join(', ');
        console.log('Comma Separated serviceData:', commaSeparatedData);

        setSelectedServiceData(serviceData);
        setIsModalOpen(true);
    };
    const fetchImageToBase = async (imageUrls) => {
        setApiLoading(true);
        try {
            const response = await axios.post(
                "https://api.screeningstar.co.in/utils/image-to-base",
                { image_urls: imageUrls },
                { headers: { "Content-Type": "application/json" } }
            );
            setApiLoading(false);

            // Ensure we return an array
            return Array.isArray(response.data.images) ? response.data.images : [];
        } catch (error) {
            setApiLoading(false);

            console.error("Error fetching images:", error);
            return [];
        }
    };
    const base64ToBlob = (base64) => {
        try {
            // Convert Base64 string to binary
            const byteCharacters = atob(base64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return new Blob([byteNumbers], { type: "image/png" });
        } catch (error) {
            console.error("Error converting base64 to blob:", error);
            return null;
        }
    };
    const handleDownloadAllFiles = async (attachments) => {
        const zip = new JSZip();
        console.log("📁 Initialized new JSZip instance.");

        try {
            // Step 1: Convert comma-separated string to array
            const fileUrls = attachments
                .split(",")
                .map(url => url.trim())
                .filter(Boolean);
            console.log("🔗 Extracted file URLs:", fileUrls);

            if (fileUrls.length === 0) {
                console.warn("⚠️ No valid image URLs found.");
                return;
            }

            // Step 2: Fetch Base64 for all image URLs
            console.log("📡 Fetching Base64 representations of images...");
            const base64Response = await fetchImageToBase(fileUrls);
            const base64Images = base64Response || [];
            console.log("🖼️ Received Base64 images:", base64Images);

            if (base64Images.length === 0) {
                console.error("❌ No images received from API.");
                return;
            }

            // Step 3: Add each image to ZIP
            for (let i = 0; i < fileUrls.length; i++) {
                const url = fileUrls[i];
                const imageData = base64Images.find(img => img.url === url);
                console.log('base64Images', base64Images)

                console.log('url', url)
                console.log(`🔍 Processing image ${i + 1}/${fileUrls.length} - URL: ${url}`);
                console.log("📦 Matched image data:", imageData);

                if (imageData && imageData.base64) {
                    const base64Data = imageData.base64.split(",")[1];
                    const blob = base64ToBlob(base64Data, imageData.type);

                    if (blob) {
                        const fileName = `${imageData.fileName}`;
                        zip.file(fileName, blob);
                        console.log(`✅ Added to ZIP: ${fileName}`);
                    } else {
                        console.warn(`⚠️ Failed to create blob for: ${url}`);
                    }
                } else {
                    console.warn(`⚠️ Skipping invalid or missing Base64 data for URL: ${url}`);
                }
            }

            // Step 4: Generate and trigger ZIP download
            console.log("🛠️ Generating ZIP file...");
            const zipContent = await zip.generateAsync({ type: "blob" });
            saveAs(zipContent, "attachments.zip");
            console.log("✅ ZIP file downloaded successfully!");

        } catch (error) {
            console.error("❌ Error generating ZIP:", error);
        }
    };



    const handleDownloadFile = async (url) => {
        try {
            console.log("🔄 Starting download process...");
            console.log("📥 Downloading file from:", url);

            const base64Response = await fetchImageToBase([url]);
            console.log("✅ Received base64 response:", base64Response);

            if (!base64Response || base64Response.length === 0) {
                throw new Error("No image data received.");
            }

            const imageData = base64Response.find(img => img.url === url);
            console.log("🔍 Found image data:", imageData);

            if (!imageData || !imageData.base64) {
                throw new Error("Invalid Base64 data.");
            }

            const base64Data = imageData.base64.split(",")[1];
            console.log("📦 Extracted base64 content.");

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Uint8Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            console.log("🧱 Converted base64 to byte array.");

            const blob = new Blob([byteNumbers], { type: `image/${imageData.type}` });
            console.log("🗂️ Created Blob object.");

            const fileName = imageData.fileName;
            console.log("📄 Extracted file name:", fileName);

            saveAs(blob, fileName);
            console.log("✅ File download triggered successfully!");
        } catch (error) {
            console.error("❌ Error during download process:", error);
        }
    };


    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedServiceData(null);
    };
    function sanitizeText(text) {
        if (!text) return text;
        return text.replace(/_[^\w\s]/gi, ''); // Removes all non-alphanumeric characters except spaces.
    }
    const selectedAttachments = {
        "Category 1": [
            { "Document A": "https://example.com/docA1, https://example.com/docA2" },
            { "Document B": "https://example.com/docB1" },
        ],
        "Category 2": [
            { "Image X": "https://example.com/imageX1" },
            { "Image Y": "https://example.com/imageY1, https://example.com/imageY2" },
        ],
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const isValidDate = (date) => {
        const datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
        return datePattern.test(date);
    };

    // Function to format the date to "Month Day, Year" format
    const formatDate = (date) => {
        const dateObj = new Date(date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options); // This gives "November 30, 1899"
    };
    console.log('adminTAT', adminTAT)
    const handleExportToExcel = () => {
        const exportData = filteredData.map((data, index) => ({
            "SL NO": index + 1,
            "TAT Days": adminTAT[index] || 'NIL',
            "Location": data.location || 'NIL',
            "Name": data.name || 'NIL',
            "Reference Id": data.application_id || 'NIL',
            "Photo": data.photo || 'NIL',
            "Applicant Employee Id": data.employee_id || 'NIL',
            "Initiation Date": new Date(data.created_at).toLocaleDateString(),
            "Deadline Date": new Date(data.updated_at).toLocaleDateString(),
            "Report Data": "Generate Report", // Adjust if you want this to reflect actual data
            "Download Status": data.overall_status === 'completed' ?
                (data.is_verify === 'yes' ? 'DOWNLOAD' : 'QC PENDING') :
                (data.overall_status === 'wip' ? 'WIP' : 'NOT READY')
        }));

        // Add any additional dynamic columns from expandedRow
        expandedRow?.headingsAndStatuses?.forEach((item, idx) => {
            exportData.forEach(data => {
                const key = item.status;  // Use status or heading to name the new column
                data[key] = item.status;  // Add this dynamically to each row
            });
        });

        // Convert to worksheet and create workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, "report_data.xlsx");
    };
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredData = paginatedData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('filteredData', filteredData)
        useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [filteredData, loading]); 

    const handleGoBack = () => {
        navigate('/admin-documents');
    };
    console.log('selectedServiceData-- ', selectedServiceData)
    return (
        <div className="bg-[#c1dff2]">
            <h2 className="md:text-2xl text-xl font-bold py-3 text-left text-[#4d606b] px-3 border">APPLICATION DOCUMENT CHECKIN - {parentName}</h2>
            <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className='md:flex justify-between items-baseline mb-6 '>

                    <div className=" text-left md:mb-0 mb-4">
                        <div>
                            <button
                                className="bg-green-500 hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105  text-white px-6 py-2 rounded"
                                onClick={handleExportToExcel}
                            >
                                Export to Excel
                            </button>
                        </div>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-2  shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className=" md:w-1/2 text-right">
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />

                    </div>
                </div>

              <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
                            <thead className='rounded-lg'>
                                <tr className="bg-[#c1dff2] text-[#4d606b]">
                                    <th className="uppercase border border-black px-4 py-2">SL NO</th>
                                    <th className="uppercase border border-black px-4 py-2">Date of Initiation</th>
                                    <th className="uppercase border border-black px-4 py-2">Employe Id</th>
                                    <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                                    <th className="uppercase border border-black px-4 py-2">Photo</th>
                                    <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
                                    <th className="uppercase border border-black px-4 py-2">View Docs</th>
                                    <th className="uppercase border border-black px-4 py-2">SCOPE OF SERVICES</th>
                                    {expandedRow && expandedRow.headingsAndStatuses && expandedRow.headingsAndStatuses.length > 0 && expandedRow.headingsAndStatuses.map((item, idx) => (
                                        <th key={idx} className="border border-black px-4 py-2 uppercase" style={getColorStyle(item.heading)}>
                                            {isValidDate(item.heading) ? formatDate(item.heading) : sanitizeText(item.heading)}
                                        </th>
                                    ))}

                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (

                                    <tr>
                                        <td colSpan={17} className="py-4 text-center text-gray-500">
                                            <Loader className="text-center" />
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={17} className="py-4 text-center text-gray-500">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {filteredData.map((data, index) => (
                                            <React.Fragment key={data.id}>
                                                <tr className="text-center">
                                                    <td className="border border-black px-4 py-2">{index + 1}</td>
                                                    <td className="border border-black px-4 py-2">{new Date(data.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                                                    <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                                    <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                                    <td className="border border-black px-4 py-2">
                                                        <div className='flex justify-center'>
                                                            <img src={data.photo ? data.photo : `${Default}`}
                                                                alt={data.name || 'No name available'}
                                                                className="w-10 h-10 rounded-full" />
                                                        </div>
                                                    </td>
                                                    <td className="border border-black px-4 py-2">{data.name || 'NIL'}</td>
                                                    <td className="border border-black px-4 text-center py-2">

                                                        <button
                                                            className={`px-4 py-2 rounded ${hasAnnexureDocuments(data.attach_documents)
                                                                ? 'bg-[#073d88] text-white hover:bg-[#05275c]'
                                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                }`}
                                                            onClick={() =>
                                                                hasAnnexureDocuments(data.attach_documents) &&
                                                                handleViewDocuments(data.attach_documents)
                                                            }
                                                            disabled={!hasAnnexureDocuments(data.attach_documents)}
                                                        >
                                                            View Docs
                                                        </button>

                                                    </td>
                                                    <td className="border border-black px-4 text-center py-2">
                                                        <button
                                                            className={`bg-[#2c81ba]     ${expandedRow.index === data.main_id ? ' bg-red-600 hover:bg-red-800 ' : 'bg-[#2c81ba] hover:bg-[#073d88] '} text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded px-4 py-2 ${servicesLoading == data.main_id ? 'opacity-50 cursor-not-allowed' : ''} `}
                                                            onClick={() => !servicesLoading && handleViewMore(data.main_id)} // Prevent clicks during loading
                                                            disabled={servicesLoading == data.main_id} // Disable button when loading
                                                        >
                                                            {expandedRow.index === data.main_id
                                                                ? 'Hide Scope Of Services'
                                                                : 'Show Scope Of Services'}
                                                        </button>
                                                    </td>


                                                    {expandedRow.index === data.main_id && expandedRow.headingsAndStatuses.length > 0 && expandedRow.headingsAndStatuses.map((item, idx) => (
                                                        <th
                                                            key={idx} // Ensure unique key for each element
                                                            className="border border-black px-4 py-2 uppercase"
                                                            style={getColorStyle(item.status)} // Apply dynamic styles based on status
                                                        >
                                                            {isValidDate(item.status)
                                                                ? formatDate(item.status)
                                                                : sanitizeText(item.status)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
            </div>
            {isModalOpen && selectedServiceData && (

                <Modal
                    isOpen={true}
                    className="custom-modal-content md:max-h-fit max-h-96"
                    overlayClassName="custom-modal-overlay"
                    onRequestClose={handleCloseModal}
                >
                    <div className="modal-container md:overscroll-none md:overflow-y-auto  overflow-y-scroll ">
                        <h2 className="modal-title text-center my-4 text-2xl font-bold">Attachments</h2>
                        <div className='flex justify-end'>
                            <button
                                className="modal-download-all bg-blue-500 text-white p-2  text-end w-fit rounded-md mb-4"
                                onClick={() => handleDownloadAllFiles(selectedServiceData)}
                            >
                                Download All
                            </button>
                        </div>
                        <ul className="modal-list h-[400px] overflow-scroll">
                            {selectedServiceData.split(',').map((url, idx) => (
                                <li key={idx} className="grid  items-center border-b py-2">
                                    <div className="flex justify-between gap-2">
                                        <a
                                            href={url.trim()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="modal-view-button w-auto m-0 bg-[#2c81ba] text-white p-2 rounded-md px-4 block text-center"
                                        >
                                            View {idx + 1}
                                        </a>
                                        <button
                                            onClick={() => handleDownloadFile(url.trim())}
                                            className="modal-download-button w-auto m-0 bg-[#4caf50] text-white p-2 rounded-md px-4 block text-center"
                                        >
                                            Download {idx + 1}
                                        </button>
                                    </div>
                                </li>
                            ))}

                        </ul>
                        <div className="modal-footer">
                            <button
                                className="modal-close-button bg-red-500 text-white p-2 rounded-md mt-4"
                                onClick={handleCloseModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div >


    );

};

export default DocumentCheckin;
