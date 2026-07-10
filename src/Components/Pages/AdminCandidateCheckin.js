import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Swal from 'sweetalert2';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Modal from 'react-modal';
import { FaChevronLeft } from 'react-icons/fa';
import { useApiLoading } from '../ApiLoadingContext';
import axios from "axios";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import LogoBgv from "../../imgs/iso2.png"

import { saveAs } from "file-saver";
const AdminCandidateCheckin = () => {
    const [loadingRow, setLoadingRow] = useState(null);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [modalApplicationId, setModalApplicationId] = useState({});
    const [modalBranchId, setModalBranchId] = useState({});
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [selectedServiceData, setSelectedServiceData] = useState(null);
    const [fullName, setFullName] = useState({});
    const [createdDate, setCreatedDate] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const [itemsPerPage, setItemPerPage] = useState(10)
    const [applicantName, setApplicantName] = useState({});
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
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpenDoc, setIsModalOpenDoc] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const branch_id = queryParams.get('branchId');

    const clientId = queryParams.get('clientId');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    // Fetch data from the main API
    const fetchData = useCallback(() => {
        if (!branch_id || !adminId || !token) {
            return;
        } else {
            setLoading(true);
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`http://localhost:5000/candidate-master-tracker/applications-by-branch?branch_id=${branch_id}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then(response => {
                return response.json().then(result => {
                    const newToken = result._token || result.token || token;

                    // Save the token regardless of the response's success
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }

                    if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            // Redirect to admin login page
                            window.location.href = "/admin-login"; // Replace with your login route
                        });
                    }

                    if (!response.ok) {
                        // Show SweetAlert if response is not OK
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message || 'Failed to load data',
                        });
                        throw new Error(result.message || 'Failed to load data');
                    }

                    return result;
                });
            })
            .then((result) => {
                setLoading(false);
                setData(result.data.applications || []);
            })
            .catch((error) => {
                console.error('Fetch error:', error);
            })
            .finally(() => {
                setLoading(false);
            });

    }, [branch_id, adminId, token, setData]);
    const formatDatedmy = (isoString) => {
        if (!isoString || isNaN(new Date(isoString).getTime())) {
            return;  // Return "nill" if the date is invalid or null
        }
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear(); // full year (e.g., 2025)
        return `${day}-${month}-${year}`;
    };
    const fetchApplicationData = async (applicationId, branchId, returnInBlob = false) => {
        console.log("🚀 Starting fetchApplicationData...");
        setLoading(true);

        const MyToken = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        const admin_id = adminData?.id;

        console.log("🔐 Token:", MyToken);
        console.log("👤 Admin ID:", admin_id);
        console.log("📄 Application ID:", applicationId);
        console.log("🏢 Branch ID:", branchId);

        if (!MyToken || !admin_id || !applicationId || !branchId) {
            console.warn("⚠️ Missing required parameters.");
            setLoading(false);
            return returnInBlob ? undefined : null;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        try {
            const url = `http://localhost:5000/candidate-master-tracker/bgv-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${MyToken}`;
            console.log("🌐 Fetching URL:", url);

            const res = await fetch(url, requestOptions);
            console.log("📥 Fetch response status:", res.status);

            if (!res.ok) throw new Error(`Error fetching data: ${res.statusText}`);

            const data = await res.json();
            console.log("✅ Fetched data:", data);

            const serviceDataa = data.serviceData || {};
            const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
            const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];

            const serviceValueData = {};
            Object.values(serviceDataa).forEach(entry => {
                const key = entry.jsonData?.db_table;
                const value = entry.data;
                if (key) {
                    serviceValueData[key] = value;
                }
            });

            const customBgv = data.cefData?.is_custom_bgv || '';
            const cefData = data.CEFData || {};
            const applicationData = data.application;
            const companyName = applicationData?.customer_name || 'N/A';
            const fullName = cefData.full_name;
            const createdDate = formatDate(cefData.created_at);
            setFullName(fullName);
            setCreatedDate(createdDate);
            // Token Refresh
            if (data.token || data._token) {
                const newToken = data.token || data._token;
                localStorage.setItem("_token", newToken);
                console.log("🔁 Updated token in localStorage:", newToken);
            }

            // Call PDF generator
            console.log("🖨️ Calling generatePdf... returnInBlob =", returnInBlob);

            const pdfBlob = await generatePdf(
                jsonDataArray,
                jsonDataArray,
                serviceValueData,
                serviceValueDataArray,
                customBgv,
                cefData,
                applicationData,
                companyName,
                returnInBlob
            );

            if (returnInBlob) {
                if (pdfBlob instanceof Blob) {
                    console.log("✅ PDF Blob generated successfully:", pdfBlob);
                    return pdfBlob;
                } else {
                    console.error("❌ PDF Blob is not a valid Blob object:", pdfBlob);
                    return undefined;
                }
            }

            console.log("📄 PDF generated (not returning blob).");
            return null;

        } catch (err) {
            console.error("❌ Error in fetchApplicationData:", err.message || err);
            return returnInBlob ? undefined : null;
        } finally {
            const storedToken = localStorage.getItem('_token');
            if (storedToken) {
                localStorage.setItem("_token", storedToken);
                console.log("🔒 Token reset in localStorage (finally):", storedToken);
            }
            setLoading(false);
            console.log("🏁 Finished fetchApplicationData.");
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };
    const formatDateDMY = (isoString) => {
        if (!isoString || isNaN(new Date(isoString).getTime())) {
            return;  // Return "nill" if the date is invalid or null
        }
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear(); // full year (e.g., 2025)
        return `${day}-${month}-${year}`;
    };

    const generatePdf = async (serviceData, serviceDataForPdf, serviceValueDataForPDF, serviceValueDataForPdfArray, customBgv, cefData, applicationData, companyName, returnInBlob) => {


        try {
            // Create a new PDF document
            const doc = new jsPDF({ compress: true });
            let yPosition = 10;  // Initial y position
            const gapY = 8; // consistent gap between tables
            const formatDate = (value) => {
                if (!value) {
                    return null;  // Return null if the date doesn't exist
                }
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return null;  // Return null if the date is invalid
                }
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            };
            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Background Verification Form',
                    styles: {
                        halign: 'center',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80]
                    }
                }]],
                body: [[{
                    content: `Company name: ${companyName}`,
                    styles: { fontStyle: 'bold', halign: 'center' }
                }]],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                }
            });
            yPosition = doc.autoTable.previous.finalY + gapY;
            const pageWidth = doc.internal.pageSize.getWidth() - 30;


            const personalBody = [
                [{ content: "Full Name of Applicant", styles: { fontStyle: 'bold' } }, cefData.full_name || "N/A"],
                [{ content: "Pancard Number", styles: { fontStyle: 'bold' } }, cefData.pan_card_number || "N/A"],
                [{ content: "Aadhar Number", styles: { fontStyle: 'bold' } }, cefData.aadhar_card_number || "N/A"],
                [{ content: "Father's Name", styles: { fontStyle: 'bold' } }, cefData.father_name || "N/A"],
                [{ content: "Date of Birth (dd/mm/yy)", styles: { fontStyle: 'bold' } }, formatDateDMY(cefData.dob) || "N/A"],
                [{ content: "Husband's Name", styles: { fontStyle: 'bold' } }, cefData.husband_name || "N/A"],
                [{ content: "Gender", styles: { fontStyle: 'bold' } }, cefData.gender || "N/A"],
                [{ content: "Mobile Number", styles: { fontStyle: 'bold' } }, cefData.mb_no || "N/A"],
                [{ content: "Nationality", styles: { fontStyle: 'bold' } }, cefData.nationality || "N/A"],
                [{ content: "Marital Status", styles: { fontStyle: 'bold' } }, cefData.marital_status || "N/A"]
            ];


            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: "Personal Information",
                    colSpan: 2,
                    styles: {
                        halign: "center",
                        fontSize: 12,
                        fontStyle: "bold",
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80],
                        cellPadding: 2
                    }
                }]],
                body: personalBody,
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    font: 'helvetica',
                    textColor: [80, 80, 80],
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [197, 217, 241],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 11
                },
                columnStyles: {
                    0: { cellWidth: pageWidth * 0.4 },
                    1: { cellWidth: pageWidth * 0.6 }
                }
            });

            yPosition = doc.autoTable.previous.finalY + gapY;

            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Current Address',
                    colSpan: 2,
                    styles: {
                        halign: 'center',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80]
                    }
                }]],
                body: [
                    [
                        { content: 'Full Address', styles: { fontStyle: 'bold' } },
                        cefData.full_address || 'N/A'
                    ],
                    [
                        { content: 'Pin Code', styles: { fontStyle: 'bold' } },
                        cefData.pin_code || 'N/A'
                    ],
                    [
                        { content: 'State', styles: { fontStyle: 'bold' } },
                        cefData.current_address_state || 'N/A'
                    ],
                    [
                        { content: 'Prominent Landmark', styles: { fontStyle: 'bold' } },
                        cefData.current_prominent_landmark || 'N/A'
                    ],
                    [
                        { content: 'Nearest Police Station', styles: { fontStyle: 'bold' } },
                        cefData.nearest_police_station || 'N/A'
                    ],
                    [
                        { content: 'Period Of Stay(From Date)', styles: { fontStyle: 'bold' } },
                        formatDate(cefData.current_from_date) || 'N/A'
                    ],
                    [
                        { content: 'Period Of Stay(To Date)', styles: { fontStyle: 'bold' } },
                        formatDate(cefData.current_to_date) || 'N/A'
                    ],
                    [
                        { content: 'Residence Number', styles: { fontStyle: 'bold' } },
                        cefData.residence_number || 'N/A'
                    ],
                    [
                        { content: 'Alternate Mobile Number', styles: { fontStyle: 'bold' } },
                        cefData.alternate_mobile_number || 'N/A'
                    ],
                    [
                        { content: 'Current Landmark', styles: { fontStyle: 'bold' } },
                        cefData.current_prominent_landmark || 'N/A'
                    ]

                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    cellPadding: 2,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                },
                columnStyles: {
                    0: { cellWidth: pageWidth * 0.4 },
                    1: { cellWidth: pageWidth * 0.6 }
                }
            });
            yPosition = doc.autoTable.previous.finalY + gapY;

            // Start a new page for Permanent Address table
            doc.addPage();
            doc.autoTable({
                startY: 10,
                head: [[{
                    content: 'Permanent Address',
                    colSpan: 2,
                    styles: {
                        halign: 'center',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80]
                    }
                }]],
                body: [
                    [
                        { content: 'Full Address', styles: { fontStyle: 'bold' } },
                        cefData.permanent_full_address || 'N/A'
                    ],
                    [
                        { content: 'Pin Code', styles: { fontStyle: 'bold' } },
                        cefData.permanent_pin_code || 'N/A'
                    ],
                    [
                        { content: 'State', styles: { fontStyle: 'bold' } },
                        cefData.permanent_address_state || 'N/A'
                    ],
                    [
                        { content: 'Prominent Landmark', styles: { fontStyle: 'bold' } },
                        cefData.permanent_prominent_landmark || 'N/A'
                    ],
                    [
                        { content: 'Nearest Police Station', styles: { fontStyle: 'bold' } },
                        cefData.permanent_nearest_police_station || 'N/A'
                    ],
                    [
                        { content: 'Period Of Stay(From Date)', styles: { fontStyle: 'bold' } },
                        formatDate(cefData.permanent_from_date) || 'N/A'
                    ],
                    [
                        { content: 'Period Of Stay(To Date)', styles: { fontStyle: 'bold' } },
                        formatDate(cefData.permanent_to_date) || 'N/A'
                    ],
                    [
                        { content: 'Residence Number', styles: { fontStyle: 'bold' } },
                        cefData.permanent_residence_number || 'N/A'
                    ],
                    [
                        { content: 'Alternate Mobile Number', styles: { fontStyle: 'bold' } },
                        cefData.permanent_alternate_mobile_number || 'N/A'
                    ],
                    [
                        { content: 'Current Landmark', styles: { fontStyle: 'bold' } },
                        cefData.permanent_prominent_landmark || 'N/A'
                    ]

                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    fontSize: 10,
                    cellPadding: 2,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0]
                },
                columnStyles: {
                    0: { cellWidth: pageWidth * 0.4 },
                    1: { cellWidth: pageWidth * 0.6 }
                }
            });


            yPosition = doc.autoTable.previous.finalY - 2;


            if (!serviceData.length) return; // If no services, return early


            // const selectedServices = serviceData.slice(0, 2); // Get only the first 2 services

            for (let i = 0; i < serviceData.length; i++) {
                const service = serviceData[i];

                const isNonEmpty = (obj) => {
                    if (!obj || typeof obj !== 'object') return false;
                    return Object.values(obj).some(
                        (value) =>
                            value !== null &&
                            !(typeof value === 'string' && value.trim() === '')
                    );
                };

                const validEntries = Object.values(serviceValueDataForPDF).filter(isNonEmpty);

                let tableData = [];
                let shouldSkipEntireTable = false;

                for (const row of service.rows) {
                    for (const input of row.inputs) {
                        const isCheckbox = input.type === 'checkbox';
                        const value = serviceValueDataForPDF[service?.db_table]?.[input?.name];

                        if (
                            isCheckbox &&
                            (value === '1' || value === 1 || value === true || value === 'true')
                        ) {
                            shouldSkipEntireTable = true;
                            break;
                        }
                    }
                    if (shouldSkipEntireTable) break;
                }

                if (shouldSkipEntireTable) {
                    continue;
                }
                const isValidDate = (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && typeof value === 'string' && value.length >= 8;
                };
                service.rows.forEach((row) => {
                    row.inputs.forEach((input) => {
                        const rawValue = serviceValueDataForPDF[service?.db_table]?.[input?.name] || 'N/A';

                        if (input.type === 'file' || input.type === 'checkbox') return;

                        // Try to format if it's a valid date string
                        const value = isValidDate(rawValue) ? formatDate(rawValue) : rawValue;

                        tableData.push([
                            { content: input.label, styles: { fontStyle: 'bold' } },
                            value
                        ]);
                    });
                });

                // ✅ Add spacing bet
                if (tableData.length > 0 && i !== 0) {
                    yPosition -= 2;
                }
                if (tableData.length > 0) {
                    doc.setFontSize(16);
                    yPosition += 10;

                    const pageHeight = doc.internal.pageSize.getHeight();
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const tableWidth = pageWidth - 30;
                    const col1Width = tableWidth * 0.4;
                    const col2Width = tableWidth * 0.6;

                    const estimatedTableHeight = 10 + (tableData.length * 10); // Rough estimation, adjust if needed

                    // Check if space is sufficient, otherwise add a new page
                    if (yPosition + estimatedTableHeight > pageHeight) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.autoTable({
                        startY: yPosition,
                        head: [
                            [
                                {
                                    content: service.heading,
                                    colSpan: 2,
                                    styles: {
                                        halign: 'center',
                                        fontSize: 12,
                                        fontStyle: 'bold',
                                        fillColor: [197, 217, 241],
                                        textColor: [80, 80, 80]
                                    }
                                }
                            ]
                        ],
                        body: tableData,
                        theme: 'grid',
                        margin: { top: 10, left: 15, right: 15 },
                        styles: {
                            fontSize: 10,
                            cellPadding: 2,
                            lineWidth: 0.2,
                            lineColor: [0, 0, 0],
                        },
                        columnStyles: {
                            0: { cellWidth: col1Width },
                            1: { cellWidth: col2Width }
                        },
                        headStyles: {
                            fillColor: [197, 217, 241],
                            textColor: [80, 80, 80]
                        },
                        didDrawPage: (data) => {
                            // You can add a title or page number here if needed
                        },
                        // Avoid repeating head automatically
                        // only draw header on the first page of the table
                        didDrawCell: (data) => {
                            if (data.section === 'head' && data.row.index > 0) {
                                data.cell.styles.fillColor = null; // Skip redraw of header
                            }
                        }
                    });

                    yPosition = doc.lastAutoTable.finalY;
                }

            }

            let newYPosition = 20
            doc.addPage();
            const disclaimerButtonHeight = 8; // Button height (without padding)
            const disclaimerButtonWidth = doc.internal.pageSize.width - 20; // Full width minus margins

            // Constants for additional spacing
            const buttonBottomPadding = 5; // Padding below the button
            const backgroundColor = '#c5d9f1';

            let disclaimerY = 10; // Starting position
            const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;
            const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2;

            doc.setDrawColor(0, 0, 0); // Set border color to black
            doc.setFillColor(backgroundColor); // Fill color
            doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F'); // Fill
            doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D'); // Border

            doc.setTextColor(80, 80, 80); // Black text
            doc.setFontSize(13);

            // Calculate center Y of button for vertical alignment
            const disclaimerTextYPosition = disclaimerY + (disclaimerButtonHeight / 2) + (doc.getFontSize() / 8);
            doc.setFont('helvetica', 'bold'); // Set font to Helvetica Bold
            doc.text('Declaration and Authorization', doc.internal.pageSize.width / 2, disclaimerTextYPosition, {
                align: 'center',
            });


            const disclaimerTextPart1 = `I hereby authorize Screeningstar Solutions Private Limited and its representative to verify the information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.
                
                I authorize all persons who may have information relevant to this enquiry to disclose it to ScreeningStar HR Services Pvt Ltd or its representative. I release all persons from liability on account of such disclosure. I confirm that the above information is correct to the best of my knowledge. I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.`;

            const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);
            const lineHeight = 5
            const disclaimerTextHeight =
                disclaimerLinesPart1.length * lineHeight +
                lineHeight; // Extra space for anchor // Extra space for anchor
            const disclaimerTextTopMargin = 5; // Margin from top of the disclaimer text

            const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;
            let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;
            let maxLineWidth = 0;
            disclaimerLinesPart1.forEach((line) => {
                const lineWidth = doc.getTextWidth(line);
                if (lineWidth > maxLineWidth) {
                    maxLineWidth = lineWidth;
                }
            });
            const paragraphX = (doc.internal.pageSize.width - maxLineWidth - 14);
            const paragraphGap = 2; // smaller gap between paragraphs
            const paragraphs = disclaimerTextPart1.trim().split(/\n\s*\n/); // split into paragraphs
            doc.setFont('helvetica', 'normal'); // Reset to normal for following text

            paragraphs.forEach(paragraph => {
                const lines = doc.splitTextToSize(paragraph.trim(), disclaimerButtonWidth);

                lines.forEach((line, index) => {
                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'normal'); // Reset to normal for following text

                    const words = line.trim().split(' ');
                    const lineWidth = doc.getTextWidth(line);
                    const spaceWidth = doc.getTextWidth(' ');
                    const extraSpace = disclaimerButtonWidth - lineWidth;
                    const spacesToAdd = words.length - 1;

                    let spacing = 0;

                    // Apply spacing only if it's not the last line and enough words to space
                    if (index !== lines.length - 1 && spacesToAdd > 0) {
                        spacing = extraSpace / spacesToAdd;

                        // 👌 Control it — don’t let it stretch too much
                        const maxSpacing = 1.5; // You can tweak this to 1 or 2
                        spacing = Math.min(spacing, maxSpacing);
                    }

                    let x = paragraphX;
                    words.forEach((word, wordIndex) => {
                        doc.text(word, x, currentY);
                        x += doc.getTextWidth(word) + spaceWidth + (wordIndex < words.length - 1 ? spacing : 0);
                    });

                    currentY += lineHeight;
                });

                currentY += paragraphGap;
            });


            newYPosition = 100; // Adjusting for space from the last table




            const newPageWidth = pageWidth + 10;
            // Create a single row table
            const tableWidth = newPageWidth * 0.9; // Adjust this value for the desired table width
            const tableMargin = (newPageWidth - tableWidth) / 2; // Calculate the left margin to center the table

            doc.autoTable({
                startY: newYPosition,
                margin: { left: tableMargin }, // Apply the margin to center the table
                body: [
                    [
                        {
                            content: 'Full Name of Applicant',
                            styles: { fontStyle: 'bold', halign: 'center' } // Center align the first column
                        },
                        {
                            content: fullName,
                            styles: { fontStyle: 'normal', halign: 'center' } // Center align the second column
                        },
                        {
                            content: 'Date',
                            styles: { fontStyle: 'bold', halign: 'center' } // Center align the third column
                        },
                        {
                            content: createdDate,
                            styles: {
                                fontStyle: 'normal',
                                fillColor: [255, 255, 255], // white background
                                halign: 'center' // Center align the fourth column
                            }
                        }
                    ]
                ],
                theme: 'grid',
                styles: {
                    fontSize: 12,
                    halign: 'center', // Center align the entire table content
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    cellPadding: 2,
                },
                columnStyles: {
                    0: { cellWidth: newPageWidth * 0.3 },
                    1: { cellWidth: newPageWidth * 0.2 },
                    2: { cellWidth: newPageWidth * 0.3 },
                    3: { cellWidth: newPageWidth * 0.2 },
                }
            });

            console.log('cefData', cefData)



            // ✅ Return as Blob or Save
            if (returnInBlob) {
                const pdfBlob = doc.output('blob');
                console.log('📦 PDF Blob generated:', pdfBlob);
                return pdfBlob;
            } else {
                const fileName = `${applicationData?.employee_id || 'Employee'}-${companyName}.pdf`;
                doc.save(fileName);
                console.log('✅ PDF saved as:', fileName);
            }

        } catch (error) {
            // In case of error, close the Swal loading and show an error message
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong while generating the PDF.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const handleViewDocuments = (name, applicationId, branchId, attachments) => {
        console.log('attachments', attachments)

        setModalApplicationId(applicationId);
        setModalBranchId(branchId)
        setApplicantName(name)
        setSelectedAttachments(attachments);
        setSelectedServiceData(attachments);

        setIsModalOpenDoc(true);
    };

    const handleCloseModalDoc = () => {
        setIsModalOpenDoc(false);
        setSelectedServiceData(null);
        setSelectedAttachments([]);
    };

    const filteredItems = data.filter(item => {
        return (
            (item.application_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.employee_id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    });

    const tableRef = useRef(null); // Ref for the table container

    const filteredOptions = filteredItems?.filter(item =>
        (item?.name?.toLowerCase() || "").includes(selectedStatus.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOptions.slice(indexOfFirstItem, indexOfLastItem);

    const bgvPdfExportRows = filteredOptions.filter((item) => {
        const isBgvSubmitted = Number(item.cef_submitted) === 1 || Number(item.cef_id) > 0;
        return isBgvSubmitted && item.bgv_form_pdf;
    });

    const handleExportBgvPdfExcel = () => {
        if (bgvPdfExportRows.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Data Found',
                text: 'BGV submitted PDF entries are not available for export.',
            });
            return;
        }

        const excelRows = bgvPdfExportRows.map((item, index) => ({
            'SL NO': index + 1,
            'Full Name of the Applicant': item.name || 'NIL',
            'Employee ID': item.employee_id || 'NIL',
            'Mobile Number': item.mobile_number || 'NIL',
            'Email': item.email || 'NIL',
            'Initiation Date': formatDatedmy(item.created_at) || 'NIL',
            'BGV Filled Date': formatDatedmy(item.cef_filled_date) || 'NIL',
            'Application ID': item.applications_id || item.application_id || item.main_id || 'NIL',
            'BGV Form PDF': item.bgv_form_pdf,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'BGV Submitted PDFs');
        XLSX.writeFile(workbook, 'BGV-Submitted-PDF-Entries.xlsx');
    };
    const handleExportBgvPdfJson = () => {
        if (bgvPdfExportRows.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Data Found',
                text: 'BGV submitted PDF entries are not available for export.',
            });
            return;
        }

        const jsonRows = bgvPdfExportRows.map((item, index) => ({
            'SL NO': index + 1,
            'Full Name of the Applicant': item.name || 'NIL',
            'Employee ID': item.employee_id || 'NIL',
            'Mobile Number': item.mobile_number || 'NIL',
            'Email': item.email || 'NIL',
            'Initiation Date': formatDatedmy(item.created_at) || 'NIL',
            'BGV Filled Date': formatDatedmy(item.cef_filled_date) || 'NIL',
            'Application ID': item.applications_id || item.application_id || item.main_id || 'NIL',
            'BGV Form PDF': item.bgv_form_pdf,
        }));

        const jsonString = JSON.stringify(jsonRows, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        saveAs(blob, 'BGV-Submitted-PDF-Entries.json');
    };
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const showPrev = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const showNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };


    const renderPagination = () => (
        <div className="flex justify-between items-center w-full mt-4">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 ${currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    } rounded`}
            >
                Previous
            </button>
            <span className="text-gray-700">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 ${currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    } rounded`}
            >
                Next
            </button>
        </div>
    );
    useEffect(() => {
        fetchData();
    }, [clientId, branch_id]);

    const handleSelectChange = (e) => {

        const selectedValue = e.target.value;
        setItemPerPage(selectedValue)
        setCurrentPage(1);
    }

    const handleBGVClick = (cef_id, branch_id, applicationId) => {
        // Navigate to the Candidate BGV page with the cef_id
        navigate(`/admin-CandidateBGV?cef_id=${cef_id}&branch_id=${branch_id}&applicationId=${applicationId}`);
    };
    const handleDAVClick = (def_id, branch_id, applicationId) => {
        // Navigate to the Candidate BGV page with the cef_id
        navigate(`/admin-CandidateDAV?def_id=${def_id}&branch_id=${branch_id}&applicationId=${applicationId}`);
    };



    const handleSendLink = (applicationID, branch_id, customer_id, rowId) => {
        // Retrieve admin ID and token from localStorage
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        // Check if adminId or token is missing
        if (!adminId || !token) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Admin ID or token is missing. Please log in again.',
            });
            return;
        }
        setLoadingRow(rowId); // Set the loading row ID
        // Construct the URL dynamically with query parameters
        const url = `http://localhost:5000/candidate-master-tracker/send?application_id=${applicationID}&branch_id=${branch_id}&customer_id=${customer_id}&admin_id=${adminId}&_token=${token}`;

        const requestOptions = {
            method: "GET",
            redirect: "follow", // No body required for GET requests
        };

        fetch(url, requestOptions)
            .then((response) => response.json()) // Assuming the response is JSON
            .then((result) => {
                if (result.status) {
                    // Show success alert with message
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: result.message,
                        footer: `DAV Mail Sent: ${result.details.davMailSent} | BGV Mail Sent: ${result.details.cefMailSent}`,
                    });

                    // Optionally log the detailed mail sent status
                    console.log("Mail Sent Details:", result.details);
                } else {
                    // Show error alert with message
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.message,
                        footer: result.details ? `DAV Errors: ${result.details.davErrors} | CEF Errors: ${result.details.cefErrors}` : '',
                    });
                    if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            // Redirect to admin login page
                            window.location.href = "/admin-login"; // Replace with your login route
                        });
                    }

                    // Optionally log error details if available
                    if (result.details) {
                        console.log("DAV Errors:", result.details.davErrors);
                        console.log("BGV Errors:", result.details.cefErrors);
                    }
                }
            })
            .catch((error) => {
                // Handle errors that occur during the fetch
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong. Please try again later.',
                });
            })
            .finally(() => setLoadingRow(null));
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    console.log('currentItems', currentItems);
    const handleGoBack = () => {
        navigate('/admin-candidate-manager');  // Navigate to the /adminjkd path
    };
    const fetchImageToBase = async (imageUrls) => {
        console.log("📡 Sending request to /image-to-base API...");
        console.log("🧾 Payload image URLs:", imageUrls);

        setApiLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/utils/image-to-base",
                { image_urls: imageUrls },
                { headers: { "Content-Type": "application/json" } }
            );

            setApiLoading(false);

            console.log("✅ API response:", response);
            if (Array.isArray(response.data.images)) {
                console.log("📸 Base64 images received:", response.data.images);

                return response.data.images;
            } else {
                console.warn("⚠️ 'images' field missing or not an array in response:", response.data);
                return [];
            }
        } catch (error) {
            setApiLoading(false);
            console.error("❌ Error fetching images:", error);
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

    const handleDownloadAllFiles = async (applicantName, applicationId, branchId, attachments) => {
        console.log("🚀 Starting handleDownloadAllFiles...");
        const zip = new JSZip();
        let allUrls = [];

        try {
            // 📄 Step 0: Fetch Application PDF
            console.log("📄 Step 0: Fetching Application PDF...");
            const pdfBlob = await fetchApplicationData(applicationId, branchId, true);
            console.log(`pdfBlob - `, pdfBlob);

            if (pdfBlob) {
                zip.file(`${applicantName}-${applicationId}.pdf`, pdfBlob);
                console.log("✅ PDF added to zip!");
            } else {
                console.warn("⚠️ PDF blob is empty. Skipping PDF.");
            }

            // 📁 Step 1: Collect all image URLs
            console.log("📁 Step 1: Collecting image URLs...");
            for (const [category, files] of Object.entries(attachments)) {
                for (const attachment of files) {
                    const label = Object.keys(attachment)[0];
                    const fileUrls = attachment[label]?.split(",").map(url => url.trim()).filter(Boolean);

                    if (fileUrls && fileUrls.length > 0) {
                        allUrls.push({ category, label, urls: fileUrls });
                        console.log(`🗂️ Added URLs for ${category}/${label}:`, fileUrls);
                    }
                }
            }

            if (allUrls.length === 0) {
                console.warn("⚠️ No valid image URLs found. Skipping image processing.");
            } else {
                // 🔗 Step 2: Fetch Base64 for all image URLs
                console.log("🔗 Step 2: Fetching Base64 images...");
                const allImageUrls = allUrls.flatMap(item => item.urls);
                console.log("📦 Total image URLs to fetch:", allImageUrls.length);

                const base64Response = await fetchImageToBase(allImageUrls);
                const base64Images = base64Response || [];
                console.log('base64Response', base64Response)
                console.log('base64Images', base64Images)

                if (base64Images.length === 0) {
                    console.warn("⚠️ No images received from base64 API. Skipping image addition.");
                } else {
                    // 🖼️ Step 3: Add images to ZIP
                    // 🖼️ Step 3: Add images to ZIP...
                    console.log("🖼️ Step 3: Adding images to ZIP...");
                    let imageIndex = 0;

                    for (const item of allUrls) {
                        const category = item.category?.trim() || "new folder";
                        const label = item.label?.trim() || "new folder";

                        for (const url of item.urls) {
                            const imageData = base64Images.find(img => img.imageUrl === url);

                            if (imageData && imageData.base64?.startsWith("data:image")) {
                                const base64Data = imageData.base64.split(",")[1];
                                const blob = base64ToBlob(base64Data, imageData.type);

                                if (blob) {
                                    // Sanitize folder and file names
                                    const safeCategory = category.replace(/[<>:"/\\|?*]/g, "_");
                                    const safeLabel = label.replace(/[<>:"/\\|?*]/g, "_");

                                    const fileName = `${safeCategory}/${safeLabel}/image_${imageIndex + 1}.${imageData.type}`;
                                    zip.file(fileName, blob);
                                    console.log(`📥 Image added to ZIP: ${fileName}`);
                                } else {
                                    console.warn(`⚠️ Could not convert base64 to Blob for URL: ${url}`);
                                }
                            } else {
                                console.warn(`⚠️ Skipping invalid or missing image data for URL: ${url}`);
                            }
                            imageIndex++;
                        }
                    }

                }
            }

            // 📦 Step 4: Generate and trigger ZIP download
            console.log("📦 Step 4: Generating ZIP file...");
            const zipContent = await zip.generateAsync({ type: "blob" });

            saveAs(zipContent, `${applicantName}.zip`);
            console.log("✅ ZIP file downloaded successfully!");

        } catch (error) {
            console.error("❌ Error generating ZIP:", error);
        } finally {
            console.log("🏁 Finished handleDownloadAllFiles.");
        }
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentItems, loading]);

    const handleDownloadFile = async (url) => {
        try {
            console.log("Downloading file from:", url);

            const base64Response = await fetchImageToBase([url]);

            if (!base64Response || base64Response.length === 0) {
                throw new Error("No image data received.");
            }

            const imageData = base64Response.find(img => img.imageUrl === url);

            if (!imageData || !imageData.base64.startsWith("data:image")) {
                throw new Error("Invalid Base64 data.");
            }

            // Extract Base64 content
            const base64Data = imageData.base64.split(",")[1];

            // Convert Base64 to Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const blob = new Blob([byteNumbers], { type: `image/${imageData.type}` });

            // Extract filename from URL
            const fileName = url.split("/").pop() || `image.${imageData.type}`;

            // Trigger download
            saveAs(blob, fileName);
            console.log("✅ File downloaded successfully!");
        } catch (error) {
            console.error("❌ Error downloading file:", error);
        }
    };
    return (
        <div className="bg-[#c1dff2]">
            <div className="space-y-4 border border-black p-3 md:py-[30px] md:px-[51px] bg-white">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>

                <div className=" md:mx-4 bg-white">
                    <div className="md:flex justify-between items-center md:my-4  pb-2">

                        <div className="col">
                            <form action="">
                                <div className="flex gap-5 justify-between mb-2">
                                    <select name="options" id="" onChange={handleSelectChange} className='border rounded-lg px-3 py-1 text-gray-700 bg-white mt-2  shadow-sm focus:ring-2 focus:ring-blue-400'>
                                        <option value="10">10</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                        <option value="200">200</option>
                                    </select>

                                </div>
                            </form>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                                <button


                                    type="button"
                                    onClick={handleExportBgvPdfExcel}
                                    disabled={bgvPdfExportRows.length === 0}
                                    className={`bg-green-600 text-white px-4 py-2 rounded-md uppercase border border-white hover:border-green-600 hover:bg-white hover:text-green-600 ${bgvPdfExportRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Export Submitted BGV Entries
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportBgvPdfJson}
                                    disabled={bgvPdfExportRows.length === 0}
                                    className={`bg-blue-600 text-white px-4 py-2 rounded-md uppercase border border-white hover:border-blue-600 hover:bg-white hover:text-blue-600 mt-2 ${bgvPdfExportRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Export JSON
                                </button>
                            </div>            </div>
                        <div className="col md:flex justify-between ">

                            <form action="" className='w-96'>
                                <div className="flex md:items-stretch items-center  gap-3">
                                    <input
                                        type="search"
                                        className="outline-none border-2 p-2 rounded-md w-full my-4 md:my-0"
                                        placeholder="Search by Applicant Name, Employee Id"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />

                                </div>
                            </form>

                        </div>

                    </div>

                </div>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>                    <table ref={tableRef} className="min-w-full border-collapse border-black border overflow-scroll rounded-lg whitespace-nowrap">
                        <thead className='rounded-lg'>
                            <tr className="bg-[#c1dff2] text-[#4d606b]">
                                <th className="py-3 px-4 border-b border-black border-r-2 whitespace-nowrap uppercase">SL NO</th>
                                <th className="py-3 px-4 border-b border-black border-r-2 whitespace-nowrap uppercase">Full name of the applicant</th>
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">Employee ID</th>
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">Mobile Number</th>
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">Email</th>
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">Initiation Date</th>
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">View Documents</th>
                                {currentItems.some(item => item.cef_id) ? (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">BGV</th>
                                ) : (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">BGV</th>
                                )}
                                {currentItems.some(item => item.cef_filled_date) ? (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">BGV FILLED DATE</th>
                                ) : (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">BGV FILLED DATE</th>
                                )}
                                {currentItems.some(item => item.dav_id) ? (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">DAV</th>
                                ) : (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">DAV</th>
                                )}
                                {currentItems.some(item => item.dav_filled_date) ? (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">DAV FILLED DATE</th>
                                ) : (
                                    <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">DAV FILLED DATE</th>
                                )}
                                <th className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap uppercase">SEND LINK</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="py-6 text-center">
                                        <div className='flex justify-center items-center'>
                                            <Loader className="text-center" />
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((data, index) => (
                                    <React.Fragment key={data.id}>
                                        <tr className="text-center">
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">{index + 1}</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">{data.name || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">{data.employee_id || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap ">{data.mobile_number || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap ">{data.email || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">
                                                {data.created_at
                                                    ? (new Date(data.created_at))
                                                        .toLocaleDateString('en-GB')
                                                        .split('/')
                                                        .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                        .join('-')
                                                    : 'NIL'}
                                            </td>
                                            <td className="py-3 px-4 border border-black whitespace-nowrap">
                                                {data.service_data?.cef && (Object.keys(data.service_data.cef).length > 0) ? (
                                                    <button
                                                        className="px-4 py-2 bg-green-500 text-white rounded"
                                                        onClick={() => handleViewDocuments(data.name, data.id, data.branch_id, data.service_data.cef)}
                                                    >
                                                        View Documents
                                                    </button>
                                                ) : (
                                                    <span>No Attachments</span>
                                                )}

                                            </td>
                                            {/* <button className='bg-[#3e76a5] text-white p-3 rounded-md' type='button' onClick={() => fetchApplicationData(data.id, data.branch_id)}>Download PDF</button> */}

                                            {data.cef_id ? (
                                                <td className="border border-black  px-4 py-2">
                                                    <button
                                                        className="bg-blue-500 uppercase border border-white hover:border-blue-500  text-white px-4 py-2 rounded hover:bg-white hover:text-blue-500"
                                                        onClick={() => handleBGVClick(data.cef_id, data.branch_id, data.main_id)}
                                                    >
                                                        BGV
                                                    </button>
                                                </td>
                                            ) : (
                                                <td className="border border-black px-4 py-2">NIL</td>
                                            )}

                                            {currentItems.some(item => item.cef_filled_date) ? (
                                                <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">
                                                    {data.cef_filled_date
                                                        ? (new Date(data.cef_filled_date))
                                                            .toLocaleDateString('en-GB') // Format as DD/MM/YYYY
                                                            .split('/')
                                                            .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                            .join('-')
                                                        : 'NIL'}
                                                </td>
                                            ) : (
                                                <td className="border  border-black px-4 py-2">NIL</td>
                                            )}

                                            {data.dav_id ? (
                                                <td className="border  border-black px-4 py-2">
                                                    <button
                                                        className="bg-purple-500 uppercase border border-white hover:border-purple-500 text-white px-4 py-2 rounded hover:bg-white hover:text-purple-500"
                                                        onClick={() => handleDAVClick(data.dav_id, data.branch_id, data.main_id)}
                                                    >
                                                        DAV
                                                    </button>
                                                </td>
                                            ) : (
                                                <td className="border border-black px-4 py-2">NIL</td>
                                            )}
                                            {currentItems.some(item => item.dav_filled_date) ? (
                                                <td className="py-3 px-4 border-b border-r-2 border-black whitespace-nowrap capitalize">
                                                    {formatDatedmy(data.dav_filled_date)}
                                                </td>
                                            ) : (
                                                <td className="border  border-black px-4 py-2">NIL</td>
                                            )}
                                            {data.cef_submitted === 0 || (data.dav_exist === 1 && data.dav_submitted === 0) ? (
                                                <td className="border  border-black px-4 py-2">
                                                    <button
                                                        className={`bg-green-600 uppercase border border-white hover:border-green-500 text-white px-4 py-2 rounded hover:bg-white ${loadingRow === data.id ? "opacity-50 cursor-not-allowed hover:text-green-500 " : "hover:text-green-500"
                                                            }`}
                                                        onClick={() => handleSendLink(data.main_id, data.branch_id, data.customer_id, data.id)}
                                                        disabled={loadingRow} // Disable only the clicked button
                                                    >
                                                        {loadingRow === data.id ? "Sending..." : "SEND LINK"}
                                                    </button>
                                                </td>
                                            ) : <td className="border border-black px-4 py-2">NIL</td>}
                                        </tr>
                                        {isModalOpenDoc && (
                                            <Modal
                                                isOpen={isModalOpenDoc}
                                                onRequestClose={handleCloseModalDoc}
                                                className="custom-modal-content md:max-h-fit max-h-96 "
                                                overlayClassName="custom-modal-overlay"
                                            >
                                                <div className="modal-container md:overflow-y-auto overflow-y-scroll">
                                                    <h2 className="modal-title text-center my-4 text-2xl font-bold">Attachments</h2>
                                                    <div className='flex justify-end'>
                                                        <button
                                                            className="modal-download-all bg-blue-500 text-white p-2  text-end w-fit rounded-md mb-4"
                                                            onClick={() => handleDownloadAllFiles(applicantName, modalApplicationId, modalBranchId, selectedAttachments)}
                                                        >
                                                            Download All
                                                        </button>
                                                    </div>
                                                    <ul className="modal-list h-[400px] overflow-scroll">
                                                        {Object.entries(selectedAttachments).map(([category, attachments], idx) => (
                                                            <li key={idx} className="modal-list-category">
                                                                <h3 className="modal-category-title md:text-lg font-semibold my-2">{category}</h3>
                                                                <ul>
                                                                    {attachments.map((attachment, subIdx) => {
                                                                        const label = Object.keys(attachment)[0];
                                                                        const fileUrls = attachment[label]?.split(','); // Split URLs by comma
                                                                        return (
                                                                            <li key={subIdx} className="grid grid-cols-2 items-center border-b py-2">
                                                                                <span className="modal-list-text">{subIdx + 1}: {label}</span>
                                                                                <div className="modal-url-list grid md:me-7 gap-2 justify-end">
                                                                                    {fileUrls.map((url, urlIdx) => (
                                                                                        <div key={urlIdx} className="flex gap-2">
                                                                                            <a
                                                                                                href={url.trim()}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="modal-view-button w-auto m-0 bg-[#2c81ba] text-white p-2 rounded-md px-4 block text-center"
                                                                                            >
                                                                                                View {urlIdx + 1}
                                                                                            </a>
                                                                                            <button
                                                                                                onClick={() => handleDownloadFile(url.trim())}
                                                                                                className="modal-download-button w-auto m-0 bg-[#4caf50] text-white p-2 rounded-md px-4 block text-center"
                                                                                            >
                                                                                                Download {urlIdx + 1}
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}

                                                                                </div>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="modal-footer">
                                                        <button className="modal-close-button" onClick={handleCloseModalDoc}>
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="py-6 text-center">No Data Found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-md bg-white px-4 sm:px-6  ">
                    <div className="flex items-center justify-between w-full  ">
                        {renderPagination()}
                    </div>

                </div>
            </div>
        </div >
    );
};
export default AdminCandidateCheckin;