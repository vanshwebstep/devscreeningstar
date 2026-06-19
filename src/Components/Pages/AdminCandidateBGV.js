import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useApiLoading } from '../ApiLoadingContext';
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import LogoBgv from "../../imgs/iso2.png"

const CandidateBGV = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [error, setError] = useState(null);
    const [customBgv, setCustomBgv] = useState('');
    const [cefData, setCefData] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [serviceData, setServiceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [serviceValueData, setServiceValueData] = useState([]);
    const [serviceValueDataForPDF, setServiceValueDataForPDF] = useState([]);
    const [applicationData, setApplicationData] = useState([]);
    const [hiddenRows, setHiddenRows] = useState({});

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };
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

    const location = useLocation();
    const currentURL = location.pathname + location.search;

    const queryParams = new URLSearchParams(location.search);

    // Extract the branch_id and applicationId
    const branchId = queryParams.get('branch_id');
    const applicationId = queryParams.get('applicationId');
    const getValuesFromUrl = (currentURL) => {
        const result = {};
        const keys = [
            "YXBwX2lk",
            "YnJhbmNoX2lk",
            "Y3VzdG9tZXJfaWQ="
        ];

        keys.forEach(key => {
            const regex = new RegExp(`${key}=([^&]*)`);
            const match = currentURL.match(regex);
            result[key] = match && match[1] ? match[1] : null;
        });

        const isValidBase64 = (str) => {
            const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
            return base64Pattern.test(str) && (str.length % 4 === 0);
        };

        const decodeKeyValuePairs = (obj) => {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const decodedKey = isValidBase64(key) ? atob(key) : key;
                const decodedValue = value && isValidBase64(value) ? atob(value) : null;
                acc[decodedKey] = decodedValue;
                return acc;
            }, {});
        };

        return decodeKeyValuePairs(result);
    };


   
    const decodedValues = getValuesFromUrl(currentURL);

    const fullName = cefData.full_name;
    const createdDate = formatDate(cefData.created_at);
    const generatePdf = async () => {
        const swalLoading = Swal.fire({
            title: 'Generating PDF...',
            text: 'Please wait a moment.',
            showConfirmButton: false,
            allowOutsideClick: false,
            // didOpen: () => {
            //     Swal.showLoading();
            // }
        });

        try {
            // Create a new PDF document
            const doc = new jsPDF({ compress: true });
            let yPosition = 10;
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


            // Table 1: Header
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

            console.log('cefData', cefData);
            const personalBody = [
                [{ content: "Full Name of the Applicant", styles: { fontStyle: 'bold' } }, cefData.full_name || "N/A"],
                [{ content: "Pancard Number", styles: { fontStyle: 'bold' } }, cefData.pan_card_number || "N/A"],
                [{ content: "Aadhar Number", styles: { fontStyle: 'bold' } }, cefData.aadhar_card_number || "N/A"],
                [{ content: "Father's Name", styles: { fontStyle: 'bold' } }, cefData.father_name || "N/A"],
                [{ content: "Date of Birth (dd/mm/yy)", styles: { fontStyle: 'bold' } }, formatDatedmy(cefData.dob) || "N/A"],
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

            // Table 3: Current Address
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
            (async () => {
                if (!serviceData.length) return; // If no services, return early

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
                            const value = serviceValueDataForPDF[service?.db_table]?.[input?.name] || 'N/A';

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



                doc.save(`${applicationData?.employee_id}-${applicationData?.customer_name}`);
                console.log('cefData', cefData)
                swalLoading.close();

                // Optionally, show a success message
                Swal.fire({
                    title: 'PDF Generated!',
                    text: 'Your PDF has been successfully generated.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            })();
        } catch (error) {
            // In case of error, close the Swal loading and show an error message
            swalLoading.close();
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong while generating the PDF.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const fetchData = useCallback(() => {
        setLoading(true); // Start loading

        const MyToken = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        const admin_id = adminData?.id;

        if (!MyToken || !admin_id || !applicationId || !branchId) {
            setError('Missing required parameters or authentication token.');
            setLoading(false);
            return;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            `https://api.screeningstar.co.in/candidate-master-tracker/bgv-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${MyToken}`,
            requestOptions
        )
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Error fetching data: ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                setCompanyName(data.application?.customer_name || 'N/A');
                setCefData(data.CEFData || {});
                setApplicationData(data.application);

                const serviceDataa = data.serviceData || {};
                const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];
                console.log(`serviceDataa - `, serviceDataa);
                setServiceData(jsonDataArray);
                setServiceValueData(serviceValueDataArray);

                // Transform data
                const serviceValueData = {};

                Object.values(serviceDataa).forEach(entry => {
                    const key = entry.jsonData?.db_table;
                    const value = entry.data;
                    if (key) {
                        serviceValueData[key] = value;
                    }
                });
                setServiceValueDataForPDF(serviceValueData);

                setCustomBgv(data.cefData?.is_custom_bgv || '');

                // Always update token if present in the response
                if (data.token || data._token) {
                    localStorage.setItem("_token", data.token || data._token);
                }
            })
            .catch(err => {
                setError(err.message || 'An unexpected error occurred.');
            })
            .finally(() => {
                // Ensure we keep the latest token if it exists
                const storedToken = localStorage.getItem('_token');
                if (storedToken) {
                    localStorage.setItem("_token", storedToken);
                }
                setLoading(false); // End loading
            });
    }, [applicationId, branchId]);



    useEffect(() => {

        fetchData();
    }, [fetchData]);
    const getFileExtension = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        return ext;
    };
    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) {
            return <p>No file provided</p>; // Handle undefined fileUrl
        }

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();

        const renderIframe = (url) => (
            <iframe
                src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                width="100%"
                height="100%"
                title="File Viewer"
            />
        );

        const fileExtension = getFileExtension(fileUrl);

        // Determine the type of file and render accordingly
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{}} />;
        }

        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const handleGoBack = () => {
        navigate(`/admin-CandidateCheckin?clientId=${cefData.customer_id}&branchId=${cefData.branch_id}&BranchName=${applicationData.customer_name}`);

    };
    return (
        <>
            {
                loading ? (
                    <div className='flex justify-center items-center p-6 ' >
                        <Loader className="text-center" />
                    </div >
                ) :
                    <form className='py-6 md:px-10  bg-[#c1dff2] border border-black ' id='bg-form'>
                        <div
                            onClick={handleGoBack}
                            className="flex items-center w-36 md:mx-0 mx-4 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Go Back</span>
                        </div>

                        <h4 className="text-Black md:text-3xl  text-2xl mb-6 text-center mt-5  uppercase font-bold">Background Verification Form</h4>
                        <div className="md:p-6 rounded md:w-9/12 m-auto">
                            <div className="md:mb-6 mb-2 p-6 rounded-md bg-orange-400 shadow-md flex justify-center items-center">
                                <h5 className="text-xl font-bold uppercase  text-white">Company name: <span className="text-xl font-bold text-white uppercase">{companyName}</span></h5>
                            </div>

                            <div className="md:grid grid-cols-1  border-orange-500 md:grid-cols-1 bg-white shadow-md gap-4 mb-6 border  rounded-md  p-6">
                                <div className="form-group col-span-2">
                                    <label className='font-bold'>Applicant’s CV: </label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">

                                        <FileViewer fileUrl={cefData?.resume_file} className="w-full max-w-xs" />
                                    </div>

                                </div>
                                <div className="form-group col-span-2">
                                    <label className='font-bold'>Upload Photo:</label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.govt_id ? (
                                            cefData.govt_id.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>

                                </div>
                                {/* <div className="form-group col-span-2">
                                   <label className='font-bold'>Passport: </label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.passport ? (
                                            cefData.passport.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>

                                </div>
                                <div className="form-group col-span-2">
                                   <label className='font-bold'>PAN Card: </label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.pan_card ? (
                                            cefData.pan_card.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>

                                </div>
                                <div className="form-group col-span-2">
                                   <label className='font-bold'>Driving Licence: </label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.driving_licence ? (
                                            cefData.driving_licence.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>

                                </div>
                                <div className="form-group col-span-2">
                                   <label className='font-bold'>Aadhaar Card: </label>
                                    <div className="md:grid grid-cols-5 gap-4 border-orange-500  border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.aadhaar_card ? (
                                            cefData.aadhaar_card.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>
                                </div> */}
                            </div>

                            <div className='border bg-white shadow-md border-orange-500   p-6 rounded-md'>
                                <h4 className="md:text-center text-left text-xl md:text-2xl my-6 font-bold ">Personal Information</h4>

                                <div className="md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ">
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="full_name">Full Name as per Govt ID Proof (first, middle, last): <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.full_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="full_name"
                                            name="full_name"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="former_name">Former Name/ Maiden Name (if applicable)<span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.former_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="former_name"
                                            name="former_name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="mob_no">Mobile Number: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.mb_no}
                                            type="tel"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="mb_no"
                                            id="mob_no"
                                            minLength="10"
                                            maxLength="10"

                                        />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="father_name">Father's Name: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.father_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="father_name"
                                            name="father_name"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="husband_name">Spouse's Name</label>
                                        <input
                                            value={cefData?.husband_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="husband_name"
                                            name="husband_name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="dob">DOB: <span className="text-red-500">*</span></label>
                                        <input
                                            value={formatDatedmy(cefData?.dob)}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="dob"
                                            id="dob"
                                        />

                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="gender">
                                            Gender: <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            disabled
                                            value={cefData?.gender}
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="gender"
                                            id="gender"
                                        >
                                            <option value="" disabled>
                                                Select gender
                                            </option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>


                                    <div className='form-group'>
                                        <label className="font-bold" >Aadhar card No</label>
                                        <input
                                            type="text"
                                            name="aadhar_card_number"
                                            value={cefData?.aadhar_card_number}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>
                                    <div className='form-group'>
                                        <label className="font-bold" >Pan card No</label>
                                        <input
                                            type="text"
                                            name="pan_card_number"
                                            value={cefData?.pan_card_number}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="nationality">Nationality: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.nationality}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="nationality"
                                            id="nationality"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="font-bold" htmlFor="marital_status">Marital Status: <span className="text-red-500">*</span></label>
                                        <select
                                            disabled
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="marital_status"
                                            id="marital_status"

                                        >
                                            <option value="">Not Filled</option>
                                            <option value="Dont wish to disclose">Don't wish to disclose</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Widowed">Widowed</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Separated">Separated</option>
                                        </select>
                                    </div>
                                </div>
                                < div className='bordershadow-md bg-gray-100  border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                    <h3 className='md:text-center text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                    < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                        <div className="form-group" >
                                            <label className="font-bold" htmlFor="full_name" > Full Address < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.full_address}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="full_address"
                                                name="full_address"

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="pin_code" > Pin Code < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.pin_code}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="pin_code"
                                                name="pin_code"

                                            />
                                        </div>

                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_address_state" > State < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.current_address_state}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_state"
                                                name="current_address_state"

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_prominent_landmark" > Prominent Landmark < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.current_prominent_landmark}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_prominent_landmark"
                                                name="current_prominent_landmark"

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="nearest_police_station" > Nearest Police Station.< span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.nearest_police_station}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="nearest_police_station"
                                                name="nearest_police_station"

                                            />
                                        </div>
                                    </div>
                                    <div className='my-10 mb-6'>
                                        <label htmlFor="" className=' font-bold' >Period Of Stay < span className="text-red-500" >*</span></label >
                                    </div>
                                    < div className="grid grid-c ols-1 md:grid-cols-2 gap-4" >
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_from_date"> From Date< span className="text-red-500" >* </span></label >
                                            <input

                                                value={formatDatedmy(cefData?.current_from_date)}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_from_date"
                                                name="current_from_date"


                                            />
                                        </div>
                                        <div className="form-group" >
                                            <label className="font-bold" htmlFor="current_to_date" > To Date < span className="text-red-500" >* </span></label >
                                            <input

                                                value={formatDatedmy(cefData?.current_to_date)}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_to_date"
                                                name="current_to_date"
                                            // Attach ref here

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="residence_number"> Residence Number< span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.residence_number}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="residence_number"
                                                name="residence_number"
                                            // Attach ref here

                                            />

                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="alternate_mobile_number" > Alternate Mobile Number < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.alternate_mobile_number}
                                                type="number"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="alternate_mobile_number"
                                                name="alternate_mobile_number"

                                            />
                                        </div>
                                    </div>
                                </div>
                                < div className='bordershadow-md bg-gray-100  border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                    <h3 className='md:text-center text-start md:text-2xl text-sm font-bold my-5' > Permanent Address </h3>
                                    < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                        <div className="form-group" >
                                            <label className="font-bold" htmlFor="full_name" > Full Address < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_full_address}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="full_address"
                                                name="full_address"
                                                readOnly

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="pin_code" > Pin Code < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_pin_code}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="pin_code"
                                                name="pin_code"

                                            />
                                        </div>

                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_address_state" > State < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_address_state}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_state"
                                                name="current_address_state"

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_prominent_landmark" > Prominent Landmark < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_prominent_landmark}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_prominent_landmark"
                                                name="current_prominent_landmark"

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="nearest_police_station" > Nearest Police Station.< span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_nearest_police_station}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="nearest_police_station"
                                                name="nearest_police_station"

                                            />
                                        </div>
                                    </div>
                                    <div className='my-10 mb-6'>
                                        <label htmlFor="" className=' font-bold' >Period Of Stay < span className="text-red-500" >*</span></label >
                                    </div>
                                    < div className="grid grid-c ols-1 md:grid-cols-2 gap-4" >
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="current_from_date"> From Date< span className="text-red-500" >* </span></label >
                                            <input

                                                value={formatDatedmy(cefData?.permanent_from_date)}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_from_date"
                                                name="current_from_date"


                                            />
                                        </div>
                                        <div className="form-group" >
                                            <label className="font-bold" htmlFor="current_to_date" > To Date < span className="text-red-500" >* </span></label >
                                            <input

                                                value={formatDatedmy(cefData?.permanent_to_date)}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_to_date"
                                                name="current_to_date"
                                            // Attach ref here

                                            />
                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="residence_number"> Residence Number< span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_residence_number}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="residence_number"
                                                name="residence_number"
                                            // Attach ref here

                                            />

                                        </div>
                                        < div className="form-group" >
                                            <label className="font-bold" htmlFor="alternate_mobile_number" > Alternate Mobile Number < span className="text-red-500" >* </span></label >
                                            <input

                                                value={cefData?.permanent_alternate_mobile_number}
                                                type="number"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="alternate_mobile_number"
                                                name="alternate_mobile_number"

                                            />
                                        </div>
                                    </div>
                                </div>



                            </div>
                            {customBgv === 1 && (
                                <>
                                    <div className='border bg-white shadow-md border-gray-300 md:p-6 p-2 rounded-md mt-5 hover:transition-shadow duration-300'>

                                        <label className="font-bold" >Blood Group</label>
                                        <div className='form-group'>
                                            <input
                                                type="text"
                                                name="blood_group"
                                                value={cefData?.blood_group}
                                                readOnly className="form-control border rounded w-full p-2 mt-2"
                                            />
                                        </div>




                                        <div className='form-group'>
                                            <label className="font-bold" >Declaration Date<span className='text-red-500'>*</span></label>
                                            <input
                                                type="text"
                                                name="declaration_date"
                                                value={formatDatedmy(cefData?.declaration_date)}
                                                className="form-control border rounded w-full p-2 mt-2"
                                            />
                                        </div>

                                        <div className='border rounded-md p-3 my-5 '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Add Emergency Contact Details</h3>
                                            <div className='md:grid grid-cols-3 gap-3 '>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Name<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_name"
                                                        value={cefData?.emergency_details_name}
                                                        readOnly

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Relation<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_relation"
                                                        value={cefData?.emergency_details_relation}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Contact Number<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_contact_number"
                                                        value={cefData?.emergency_details_contact_number}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='border rounded-md p-3  my-5'>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Add PF Details</h3>
                                            <div className='md:grid grid-cols-3 gap-3'>
                                                <div className='form-group'>
                                                    <label className="font-bold" >PF Number</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pf_number"
                                                        value={cefData?.pf_details_pf_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >PF Type</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pf_type"
                                                        value={cefData?.pf_details_pf_type}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >PF Nominee</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pg_nominee"
                                                        value={cefData?.pf_details_pg_nominee}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='border rounded-md p-3   mt-3'>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Do you have an NPS Account? If yes</h3>
                                            <div className='md:grid grid-cols-3 gap-3'>
                                                <div className='form-group '>
                                                    <label className="font-bold" >PRAN (Permanent Retirement Account Number).</label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_pran_number"
                                                        value={cefData?.nps_details_details_pran_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Enter Nominee Details of NPS. </label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_nominee_details"
                                                        value={cefData?.nps_details_details_nominee_details}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Enter your contribution details of NPS</label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_nps_contribution"
                                                        value={cefData?.nps_details_details_nps_contribution}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <label className='mt-5 font-bold block'>Do you have an ICICI Bank A/c<span className='text-red-500'>*</span></label>

                                        <div className='flex gap-6 mb-4  '>
                                            <div className='form-group pt-2 flex  gap-2'>

                                                <input
                                                    type="radio"
                                                    name="icc_bank_acc"
                                                    value='yes'
                                                    readOnly className="form-control border rounded p-2 "
                                                />
                                                <label className="font-bold" >Yes</label>
                                            </div>
                                            <div className='form-group pt-2 flex  gap-2'>
                                                <input
                                                    type="radio"
                                                    name="icc_bank_acc"
                                                    value='no'
                                                    readOnly className="form-control border rounded p-2 "
                                                />
                                                <label className="font-bold" >No</label>
                                            </div>

                                        </div>

                                        <div className='border rounded-md p-3 my-6  '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-2'>Banking Details: </h3>
                                            <span className='text-sm md:text-center text-left block'> Note: If you have an ICICI Bank account, please provide those details. If not, feel free to share your banking information from any other bank.</span>
                                            <div className='form-group mt-4'>
                                                <label className="font-bold" >Bank Account Number<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_account_number"
                                                    value={cefData?.bank_details_account_number}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label className="font-bold" >Bank Name<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_bank_name"
                                                    value={cefData?.bank_details_bank_name}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label className="font-bold" >Bank Branch Name<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_branch_name"
                                                    value={cefData?.bank_details_branch_name}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label className="font-bold" >IFSC Code<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_ifsc_code"
                                                    value={cefData?.bank_details_ifsc_code}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div className='border rounded-md p-3 mt-3  '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-2'> Insurance Nomination Details:- (A set of parent either Parents or Parents in Law, 1 child, Spouse Nominee details) </h3>
                                            <div className='md:grid grid-cols-2 gap-3'>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Name(s)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_name"
                                                        value={cefData?.insurance_details_name}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Nominee Relationship
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_nominee_relation"
                                                        value={cefData?.insurance_details_nominee_relation}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <lalbel>Nominee Date of Birth
                                                    </lalbel>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_nominee_dob"
                                                        value={formatDatedmy(cefData?.insurance_details_nominee_dob)}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label className="font-bold" >Contact No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_contact_number"
                                                        value={cefData?.insurance_details_contact_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <label className='mt-5 font-bold block'>Do you want to opt for a Food Coupon?<span className='text-red-500'>*</span></label>

                                        <div className='flex gap-6 mb-4  '>
                                            <div className='form-group pt-2 flex gap-2'>
                                                <input
                                                    type="radio"
                                                    name="food_coupon"
                                                    value="Yes"
                                                    readOnly className="form-control border rounded p-2"
                                                />
                                                <label className="font-bold" >Yes</label>
                                            </div>
                                            <div className='form-group pt-2 flex gap-2'>
                                                <input
                                                    type="radio"
                                                    name="food_coupon"
                                                    value="No"
                                                    readOnly className="form-control border rounded p-2"
                                                />
                                                <label className="font-bold" >No</label>
                                            </div>
                                        </div>


                                        <p className='text-left '>Food coupons are vouchers or digital meal cards given to employees to purchase food and non-alcoholic beverages. Specific amount as per your requirement would get deducted from your Basic Pay. These are tax free, considered as a non-monetary benefit and are exempt from tax up to a specified limit.</p>
                                    </div>
                                </>
                            )}

                            {
                                serviceData?.length > 0 ? (
                                    serviceData.map((service, serviceIndex) => (
                                        <div
                                            key={serviceIndex}
                                            className="border border-orange-500 bg-white p-6 rounded-md mt-5 hover:transition-shadow duration-300"
                                        >
                                            <div className='border shadow-md p-6 rounded-md bg-gray-100'>
                                                <h2 className="md:text-center bg-[#c1dff2] text-left py-4 text-xl md:text-2xl font-bold mb-6 text-black">
                                                    {service.heading}
                                                </h2>
                                                <div className="space-y-6">
                                                    {service.rows.map((row, rowIndex) => {
                                                        return (
                                                            <div key={rowIndex}>
                                                                {row.row_heading && (
                                                                    <h3 className="text-lg font-semibold mb-4">{row.row_heading}</h3>
                                                                )}
                                                                {row.inputs && row.inputs.length > 0 ? (
                                                                    <div className="space-y-4">
                                                                        <div
                                                                            className={`md:grid grid-cols-${row.inputs.length === 1
                                                                                ? '1'
                                                                                : row.inputs.length === 2
                                                                                    ? '2'
                                                                                    : '3'
                                                                                } gap-3`}
                                                                        >
                                                                            {row.inputs.map((input, inputIndex) => {
                                                                                const prefilledValue =
                                                                                    Array.isArray(serviceValueData) &&
                                                                                    serviceValueData.find(
                                                                                        (item) => item && item[input.name]
                                                                                    ) || {};

                                                                                const inputValue = prefilledValue[input.name] || '';

                                                                                return (
                                                                                    <div
                                                                                        key={inputIndex}
                                                                                        className={`flex flex-col space-y-3 ${row.inputs.length === 1
                                                                                            ? 'col-span-1'
                                                                                            : row.inputs.length === 2
                                                                                                ? 'col-span-1'
                                                                                                : ''
                                                                                            }`}
                                                                                    >
                                                                                        <label className="block font-bold text-sm mb-2 text-gray-700 capitalize">
                                                                                            {input.label.replace(/[\/\\]/g, '')}
                                                                                        </label>

                                                                                        {input.type === 'input' && (
                                                                                            <input
                                                                                                readOnly
                                                                                                type="text"
                                                                                                name={input.name}
                                                                                                value={inputValue}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'textarea' && (
                                                                                            <textarea
                                                                                                readOnly
                                                                                                name={input.name}
                                                                                                rows={1}
                                                                                                value={inputValue}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'datepicker' && (
                                                                                            <input
                                                                                                readOnly
                                                                                                type="text"
                                                                                                name={input.name}
                                                                                                value={formatDatedmy(inputValue)}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'number' && (
                                                                                            <input
                                                                                                readOnly
                                                                                                type="number"
                                                                                                name={input.name}
                                                                                                value={inputValue}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'email' && (
                                                                                            <input
                                                                                                readOnly
                                                                                                type="email"
                                                                                                name={input.name}
                                                                                                value={inputValue}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'select' && (
                                                                                            <input
                                                                                                readOnly
                                                                                                type="text"
                                                                                                name={input.name}
                                                                                                value={inputValue}
                                                                                                className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        )}

                                                                                        {input.type === 'file' && inputValue && typeof inputValue === 'string' && (
                                                                                            <div className="md:grid grid-cols-4 gap-4 border p-3 fileViewer_service rounded-md">
                                                                                                {inputValue.split(',').map((fileUrl, index) => (
                                                                                                    <FileViewer
                                                                                                        key={index}
                                                                                                        fileUrl={fileUrl.trim()}
                                                                                                        className="w-full max-w-xs mb-4"
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        )}

                                                                                        {input.type === 'checkbox' && (
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <input
                                                                                                    disabled
                                                                                                    type="checkbox"
                                                                                                    name={input.name}
                                                                                                    defaultChecked={
                                                                                                        inputValue === 'on' || inputValue === '1'
                                                                                                    }
                                                                                                    className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                                <span className="text-sm text-gray-700">
                                                                                                    {input.label}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className='text-sm'>No inputs available for this row.</p>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="md:text-center text-left md:text-xl text-gray-500">No services available.</p>
                                )
                            }

                            <button className='bg-[#3e76a5] mt-4 text-white p-3 rounded-md' type='button' onClick={generatePdf}>Download PDF</button>


                        </div>
                    </form>
            }

        </>
    );
};

export default CandidateBGV;