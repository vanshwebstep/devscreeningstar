import React, { useCallback, useEffect, useState ,useRef} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { FaChevronLeft } from 'react-icons/fa';

const DataCheckin = () => {
    const [applicationStatus, setApplicationStatus] = useState([]);
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

    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [expandedRow, setExpandedRow] = useState({ index: '', headingsAndStatuses: [] });
    const navigate = useNavigate();
    const [organisationName, setOrganisationName] = useState([]);

    const [loadingGenrate, setLoadingGenrate] = useState(null);
    const location = useLocation();
    const [adminTAT, setAdminTAT] = useState('');
    const [data, setData] = useState([]);

    const [serviceMatchId, setServiceMatchId] = useState([]);

    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(false);

    const [serviceresults, setServiceresults] = useState([]);

    const [servicesLoading, setServicesLoading] = useState(false);

    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [parentName, setParentName] = useState("N/A");


    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(data.length / rowsPerPage);
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

        fetch(`https://api.screeningstar.co.in/data-management/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setLoading(false);
                setData(result.customers || []);

                const newToken = result.token || result._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                setParentName(result.parentName);

            })
            .catch((error) => {
                console.error('Fetch error:', error);
            }).finally(() => {
                setLoading(true);
            });

    }, []);

    const fetchAdminList = useCallback(() => {
        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/data-management/list?admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                const tat_days = result.customers.map(spoc => spoc.tat_days);
                setAdminTAT(tat_days);
                const OrgName = result.customers.map(spoc => ({
                    main_id: spoc.main_id,
                    name: spoc.name
                }));
                setOrganisationName(OrgName);
            })
            .catch((error) => console.error(error)).finally(() => {
                setLoading(false);
            });
    }, []);



    const fetchServicesData = async (applicationId, servicesList, reportDownload = '0') => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");
        setServicesLoading(true);
        setLoading(true)
        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setServicesLoading(false);
            return [];
        }

        try {
            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList)}&report_download=${reportDownload}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;

            // Perform the fetch request
            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const result = await response.json();

            if (response.ok) {
                setServicesLoading(false);
                setLoading(false)
                // Update the token if a new one is provided
                const newToken = result.token || result._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item != null);
                setServiceresults(filteredResults);
                return filteredResults;
            } else {
                // Handle error and update token if provided
                setServicesLoading(false);
                const newToken = result.token || result._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            console.error("Error fetching service data:", error);
            setServicesLoading(false);
            setLoading(false)
            return [];
        }
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
    useEffect(() => {
        // Automatically populate the expandedRow when the component loads.
        if (data && data.length > 0) {
            setDefaultExpandedRow();
        }
    }, [data]);

    const setDefaultExpandedRow = async () => {
        const serviceMainIds = serviceresults;
        const applicationInfo = data;
        const updatedStatus = applicationInfo.map(application => {
            const serviceDetails = [];

            // Ensure services exist and split them into an array
            const serviceIds = application.services ? application.services.split(',') : [];

            // Check each serviceId in the application
            serviceIds.forEach(serviceId => {
                // Find the matching service in serviceMainIds
                const service = serviceMainIds.find(service => service.service_id === serviceId.trim());

                if (service) {
                    let heading = "Unknown Heading"; // Default heading in case of parsing failure
                    let status = "INITIATED"; // Default status

                    try {
                        if (service.reportFormJson && typeof service.reportFormJson.json === "string") {
                            const reportFormJson = JSON.parse(service.reportFormJson.json);
                            heading = reportFormJson.heading || heading; // Extract heading
                        }
                    } catch (error) {
                        console.error("Error parsing reportFormJson:", error);
                    }

                    // Assign status if annexureData exists
                    if (service.annexureData && service.annexureData.status) {
                        status = service.annexureData.status;
                    }

                    // Push the extracted details into the serviceDetails array
                    serviceDetails.push({ serviceId, heading, status });
                }
            });

            // Preserve existing application data while updating serviceDetails
            return { ...application, serviceDetails };
        });

        // Update the state with the new data
        setApplicationStatus(updatedStatus);


        const mainIds = applicationInfo.map(item => item.main_id);
        const services = applicationInfo.map(item => item.services);
        const servicesData = await fetchServicesData(mainIds, services);
        const headings = servicesData.map(service => {
            try {
                return JSON.parse(service.service_id);
            } catch (error) {
                console.error("Invalid JSON format:", service.service_id);
                return null;
            }
        });
        setServiceMatchId(headings);

        const uniqueHeadingsAndStatuses = new Map();

        servicesData.forEach((service) => {
            const parsedJson = JSON.parse(service?.reportFormJson?.json || '{}');
            const heading = parsedJson?.heading;
            const serviceId = service.service_id || null;
            if (heading) {
                let status = 'INITIATED';

                if (service.annexureData) {
                    status = service.annexureData.status || 'INITIATED';

                }

                status = formatStatus(status);

                uniqueHeadingsAndStatuses.set(`${heading}-${status}-${serviceId}`, { heading, status, serviceId });
            }
        });

        const uniqueHeadingsAndStatusesArray = Array.from(uniqueHeadingsAndStatuses.values());

        setExpandedRow({
            headingsAndStatuses: uniqueHeadingsAndStatusesArray,
        });
    };
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

    function addFooter(doc) {
        // Define the height of the footer and its position
        const footerHeight = 14; // Footer height (adjusted)
        const footerYPosition = doc.internal.pageSize.height - footerHeight; // Footer position at the bottom

        // Define page width and margins
        const pageWidth = doc.internal.pageSize.width;
        const margin = 10; // Margins on the left and right

        // Space between sections (adjust dynamically based on page width)
        const availableWidth = pageWidth - 2 * margin; // Usable width excluding margins
        const centerX = pageWidth / 2; // Center of the page

        // Insert images into the first column (left-aligned)
        const image1 = 'https://www.juran.com/wp-content/uploads/2018/01/iso.jpg'; // Replace with Base64 or URL
        const image2 = 'https://www.juran.com/wp-content/uploads/2018/01/iso.jpg'; // Replace with Base64 or URL
        const imageWidth = 10; // Image width
        const imageHeight = 10; // Image height
        const imageGap = 0; // Gap between images (adjusted)

        // Image positions
        const image1X = margin;
        const image1Y = footerYPosition - imageHeight + 11; // Adjusted Y position
        const image2X = image1X + imageWidth + imageGap;
        const image2Y = footerYPosition - imageHeight + 11; // Adjusted Y position

        // Add images to the first column
        doc.addImage(image1, 'JPEG', image1X, image1Y, imageWidth, imageHeight);
        doc.addImage(image2, 'JPEG', image2X, image2Y, imageWidth, imageHeight);

        // Insert text into the center column (centered)
        const footerText = "CONFIDENTIAL SCREENING REPORT";
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(footerText, centerX, footerYPosition + 8, { align: 'center' }); // Adjusted vertical position

        // Insert page number into the right column (right-aligned)
        const pageCount = doc.internal.getNumberOfPages(); // Get total number of pages
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber; // Get current page number
        const pageNumberText = `Page ${currentPage} / ${pageCount}`;
        const pageNumberWidth = doc.getTextWidth(pageNumberText); // Calculate text width

        // Right-align page number with respect to the page width
        const pageNumberX = pageWidth - margin - pageNumberWidth;
        doc.text(pageNumberText, pageNumberX, footerYPosition + 8); // Adjusted vertical position

        // Draw a line above the footer (closer to the content)
        doc.setLineWidth(0.3);
        doc.line(margin, footerYPosition - footerHeight + 13, pageWidth - margin, footerYPosition - footerHeight + 13); // Line closer to the content
    }
    const generatePDF = async (index) => {
        const applicationInfo = data[index];
        setLoadingGenrate(index);
        const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services, '1');
        const doc = new jsPDF({ compress: true });
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPosition = 10;

        const sideMargin = 10;

        const mainTitle = "BACKGROUND VERIFICATION REPORT";
        doc.addImage("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pjlypcpvDuukOgwksTjmVQZgP8pYTl9gmsRhtTtjv1/psD45106F+VeYJjBQ2pQ4335voBwiIiIiIiIiIiIyiAks03QgY1dNZaCkeVQx/66BcmLz1I3ghrlS5S7HdVId2P+HY3Fygo/ein24hel4qHXYh/th4bpV4wzY/184rVEHm2F+q4GSXsd5diED5RAREREREREREZFhTGCZpoO/Ym6iO619VDFfNlBOS6rlgnSltYbDKp/IlSpDHNZHDSRoicWWVxmC/fceFnM4rPJh7HuX54uQDq7GfJiBki7FeXZ3A+UQERERERERERGRYUxgmaYDU93w3aOK+fUNlNOSarmwAxZXOa52sVypYqLrRTKghSQWx7zKEOy3NbF4wHG12+M7cK3jOuU8Ky1FpzVQ0hY4z5poyUVERERERERERESGMYFlmg7mxPyfBkoag2lqVcz/10BZsVXLhSmw+BLTxA6rvSFXqmzjsD5qIkYSiy2vMgb77FkslnFY5U+YpsN34AeHdco5dnHMRxoqbRqcY78xVBYREREREREREREZxASWDTr4CPM/GShpbVXMu25RIQ/CJTmxkeNqB+VKldGO66QG8D04EIsz6/wvtrzKGOyr1bB42HG1t+B7sKXjOuX8ejTmxxso6Q2cXxc0UA4RERERERERERFZwASWDTq4HPOdDZR0pSrmTZTTkmq5sK6SLgzdOjVXqhzuuE5qAt+FbbHo20XcldhPzr+T1Bj201NYLO+42vXxXXB9npDzq6mWZufj/LqvgXKIiIiIiIiIiIjIAiawbNDBppjfZqCkANP0qph33k1btVyoYDHIYZWyrjPnSpWqwzopBnwXJFlwJKansH9O8x0PjQv7ZwgWjzmu9it8F0yMQdUaHcyA+WfKzG/Xxji33mGgHCIiIiIiIiIiIrKACSwbdDAV5l8rM9t3LVXMP2ignJZUy4XjsDjGcbX75kqV8x3XSdTWcKxK8mqI42pPx7F6qOM65dxaUtJyKr3fME2Bc+sYA2URERERERERERGRBUxg2aKDJzFfwUBJvroR/CMWnyq33xFphfWnXKnCh8pEMUSt4551XK0kf2bBcfqJ43pNnldfwHl1KQPlEBERERERERERkSVMYNmig6MwP8FAST67EbxfSQswt07IlSquW34RtSUco49gsarjau/BMbq+4zpNdx94Is6pRxso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t8bP4jMj9wYAAAAA2CVZYMFy5HLTNCyzDo7ca87dXpv67nFz7rH25PLBqPecc5e6tDo9DUurT865FwAAAAAAm7HAgpXKZfeod0nDIqsutW464w53TX334Rk/59qXy6NSve/UbNVTbvW1/lDkLCetAAAAAADassCCWcll7zQssurpoIMie63i2S5MfTfm5QrXjlwWon5vBs90buTMyAfjtT57Bs8HAAAAAMCMWGDBvORy66j3iNw9cqfIVZbx1Selvjt6LnPtDHL566hHLPOrvpbqsiql96bhlFWZ9VgAAAAAAMyGBRaMJZf9oh4QucOmx9tEfnUr//XNU999fqzR1pxc6gm3s7bxX1yYhhNWP0/ffWWM0QAAAAAAWD0LLGgll8unYYl1+8jtNj3W+2h9NvXdbVqONnm51N9ddSF17cgX0i8uq/7F6SoAAAAAgLXNAgumZLi/016p777cepTJy2XfqBvjtZrF/bAAAAAAAJgQCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJiU/wX1BOTgEvIMowAAAABJRU5ErkJggg==", 'PNG', 20, 10, 50, 20);
        const imgBoxX = pageWidth - 40;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.rect(imgBoxX, 10, 30, 23);

        doc.setLineWidth(1);
        doc.line(10, 45, pageWidth - 10, 45);
        const titleWidth = pageWidth - 2 * sideMargin; // Adjust width for equal margins
        const titleHeight = 7.5; // Height of the rectangle
        const titleY = 55; // Y position of the rectangle

        // Draw background rectangle
        doc.setFillColor(246, 246, 246);
        doc.rect(sideMargin, titleY, titleWidth, titleHeight, 'F'); // Centered background rectangle with equal side gaps

        // Draw border rectangle
        doc.setDrawColor(62, 118, 165);
        doc.setLineWidth(0.3);
        doc.rect(sideMargin, titleY, titleWidth, titleHeight); // Centered border rectangle with equal side gaps

        // Set font and size for the title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        // Calculate text height to align it vertically in the rectangle
        const textHeight = doc.getTextDimensions(mainTitle).h;
        const verticalCenter = titleY + titleHeight / 2 + textHeight / 4; // Center text vertically

        // Add text centered horizontally and vertically
        doc.text(mainTitle, pageWidth / 2, verticalCenter, { align: 'center' });

        addFooter(doc);
        const headerTableData = [
            ["NAME OF ORGANISATION", parentName || 'null', "NAME OF APPLICANT", applicationInfo.name || "N/A"],
            ["SCREENINGSTAR REF ID", applicationInfo.application_id, "DATE OF BIRTH", formatDate(applicationInfo.dob) || "N/A"],
            ["EMPLOYEE ID", applicationInfo.employee_id || "N/A", "INSUFF CLEARED", formatDate(applicationInfo.first_insuff_reopened_date) || "N/A"],
            ["VERIFICATION INITIATED", formatDate(applicationInfo.initiation_date) || "N/A", "FINAL REPORT DATE", formatDate(applicationInfo.report_date) || "N/A"],
            ["VERIFICATION PURPOSE", applicationInfo.verification_purpose?.toUpperCase() || "Employment", "VERIFICATION STATUS", applicationInfo.final_verification_status?.toUpperCase() || "N/A"],
            ["REPORT TYPE", applicationInfo.report_type?.toUpperCase() || "Employment", "REPORT STATUS", applicationInfo.report_status?.toUpperCase() || "N/A"]
        ];

        doc.autoTable({
            body: headerTableData,
            startY: 65,
            styles: {
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0],
                lineWidth: 0.3,  // Set the width of the border
                lineColor: [62, 118, 165],  // Set the color of the border (black in this case)
            },
            columnStyles: {
                0: { fontStyle: "bold" },
                2: { fontStyle: "bold" },
            },
            theme: 'grid', // 'grid' theme already applies cell borders
            headStyles: {
                fillColor: [62, 118, 165],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            tableLineColor: [62, 118, 165],
            tableLineWidth: 0.3,
            margin: { left: sideMargin, right: sideMargin, bottom: 20 }
        });
        addFooter(doc);

        addFooter(doc);

        const SummaryTitle = "SUMMARY OF THE VERIFICATION CONDUCTED";
        const backgroundColor = '#f5f5f5';
        const borderColor = '#3d75a6';
        const xsPosition = 10;
        const ysPosition = 120;
        const fullWidth = pageWidth - 20;
        const rectHeight = 10;

        // Set background color and border for the rectangle
        doc.setFillColor(backgroundColor);
        doc.setDrawColor(62, 118, 165);
        doc.rect(xsPosition, ysPosition, fullWidth, rectHeight, 'FD');

        // Set font to bold and size
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        // Calculate the vertical center of the rectangle (center of the rectangle)
        const verticalCenterY = ysPosition + (rectHeight / 2);

        // Calculate the horizontal center of the page (center of the page)
        const horizontalCenterX = pageWidth / 2;

        // Add text with proper centering
        doc.text(SummaryTitle, horizontalCenterX, verticalCenterY, { align: 'center', baseline: 'middle' });

        // Add footer
        addFooter(doc);

        const marginTop = 5;
        const nextContentYPosition = ysPosition + rectHeight + marginTop;

        doc.autoTable({
            head: [
                [
                    {
                        content: 'SCOPE OF SERVICES / COMPONENT',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Ensure header text doesn't wrap
                            cellWidth: 'auto' // Allow the header to dynamically adjust width
                        }
                    },
                    {
                        content: 'INFORMATION VERIFIED BY',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Ensure header text doesn't wrap
                            cellWidth: 'auto' // Allow the header to dynamically adjust width
                        }
                    },
                    {
                        content: 'VERIFIED DATE',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Ensure header text doesn't wrap
                            cellWidth: 'auto' // Allow the header to dynamically adjust width
                        }
                    },
                    {
                        content: 'VERIFICATION STATUS',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Ensure header text doesn't wrap
                            cellWidth: 'auto' // Allow the header to dynamically adjust width
                        }
                    },
                ]
            ],
            body: servicesData.map(service => {
                const colorMapping = {
                    Yellow: 'yellow',
                    Red: 'red',
                    Blue: 'blue',
                    Green: 'green',
                    Orange: 'orange',
                    Pink: 'pink',
                    // Add more colors as needed
                };
                const notstatusContent = service.annexureData.status || "Not Verified";
                const statusContent = notstatusContent
                    .replace(/_/g, ' ') // Replaces underscores with spaces
                    .replace(/[^a-zA-Z0-9 ]/g, '') // Removes special characters
                    .replace(/\b\w/g, char => char.toUpperCase());




                let textColorr = 'black';
                for (let color in colorMapping) {
                    if (statusContent.includes(color)) {
                        textColorr = colorMapping[color];
                    }

                }

                return [
                    {
                        content: JSON.parse(service.reportFormJson.json).heading, // Adjust as needed based on the JSON structure
                        styles: { fontStyle: 'bold' },
                    },
                    {
                        content: service.annexureData[
                            Object.keys(service.annexureData).find(
                                key =>
                                    key.endsWith('info_source') ||
                                    key.endsWith('information_source') ||
                                    key.startsWith('info_source') ||
                                    key.startsWith('information_source')
                            )
                        ] || "N/A",

                        styles: { fontStyle: 'bold' }, // Bold content for the cell
                    },
                    {
                        content: service.annexureData.created_at
                            ? new Date(service.annexureData.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })
                            : "N/A", // Format date as "12 Jan 2024" or "N/A" if missing
                        styles: { fontStyle: 'bold' }, // Bold content for the cell
                    },
                    {
                        content: formatStatus(statusContent),
                        styles: {
                            fontStyle: 'bold',
                            textColor: textColorr, // Apply the color based on the presence of a color name in the status
                        },
                    }
                ];
            }),

            startY: nextContentYPosition,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.3,
                lineColor: [62, 118, 165],
                textColor: [0, 0, 0], // This will set the text color to black for body cells
            },
            theme: 'grid',
            headStyles: {
                fillColor: backgroundColor,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center', // Centering the text in header
                valign: 'middle', // Vertical alignment of header text
            },
            tableLineColor: [62, 118, 165],
            tableLineWidth: 0.3,
            textColor: [0, 0, 0],
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'center' }, // Align content to center
                1: { cellWidth: 'auto', halign: 'center' }, // Align content to center
                2: { cellWidth: 'auto', halign: 'center' }, // Align content to center
                3: { cellWidth: 'auto', halign: 'center' }, // Align content to center
            },
        });




        addFooter(doc);

        doc.autoTable({
            head: [
                [
                    {
                        content: "COLOR CODE / ADJUDICATION MATRIX",
                        colSpan: 5,
                        styles: {
                            halign: 'center',
                            fontSize: 10,
                            fontStyle: 'bold',
                            fillColor: [246, 246, 246],
                            whiteSpace: 'nowrap', // Prevent wrapping of header text
                            maxWidth: 200, // Limit max width for the heading
                            overflow: 'ellipsis' // Optional: Add ellipsis if the content exceeds max width
                        }
                    }
                ],
                [
                    {
                        content: 'MAJOR DISCREPANCY',
                        styles: {
                            halign: 'center',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Prevent text wrapping
                            maxWidth: 50, // Control width of the header cell
                            overflow: 'ellipsis' // Optional: Add ellipsis if text exceeds width
                        }
                    },
                    {
                        content: 'MINOR DISCREPANCY',
                        styles: {
                            halign: 'center',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Prevent text wrapping
                            maxWidth: 50, // Control width of the header cell
                            overflow: 'ellipsis' // Optional: Add ellipsis if text exceeds width
                        }
                    },
                    {
                        content: 'UNABLE TO VERIFY',
                        styles: {
                            halign: 'center',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Prevent text wrapping
                            maxWidth: 50, // Control width of the header cell
                            overflow: 'ellipsis' // Optional: Add ellipsis if text exceeds width
                        }
                    },
                    {
                        content: 'PENDING FROM SOURCE',
                        styles: {
                            halign: 'center',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Prevent text wrapping
                            maxWidth: 50, // Control width of the header cell
                            overflow: 'ellipsis' // Optional: Add ellipsis if text exceeds width
                        }
                    },
                    {
                        content: 'ALL CLEAR',
                        styles: {
                            halign: 'center',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap', // Prevent text wrapping
                            maxWidth: 50, // Control width of the header cell
                            overflow: 'ellipsis' // Optional: Add ellipsis if text exceeds width
                        }
                    }
                ]
            ],
            body: [
                [
                    { content: '', styles: { cellPadding: 5, cellHeight: 15, halign: 'center', valign: 'middle' } },
                    { content: '', styles: { cellPadding: 5, cellHeight: 15, halign: 'center', valign: 'middle' } },
                    { content: '', styles: { cellPadding: 5, cellHeight: 15, halign: 'center', valign: 'middle' } },
                    { content: '', styles: { cellPadding: 5, cellHeight: 15, halign: 'center', valign: 'middle' } },
                    { content: '', styles: { cellPadding: 5, cellHeight: 15, halign: 'center', valign: 'middle' } }
                ]
            ],
            startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 10,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.3,
                lineColor: [62, 118, 165],
            },
            theme: 'grid',
            headStyles: {
                fillColor: [246, 246, 246],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                whiteSpace: 'nowrap',  // Prevent text wrapping in header
                halign: 'center', // Center the header text
                maxWidth: 200, // Control width of the header cell
            },
            tableLineColor: [62, 118, 165],
            tableLineWidth: 0.3,
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 38, cellMargin: 5 },
                1: { cellWidth: 38, cellMargin: 5 },
                2: { cellWidth: 38, cellMargin: 5 },
                3: { cellWidth: 38, cellMargin: 5 },
                4: { cellWidth: 38, cellMargin: 5 }
            },
            didDrawCell: function (data) {
                // Log to check if the function is triggered

                const boxWidth = 25;  // Inner box width
                const boxHeight = 8; // Inner box height
                const cellX = data.cell.x + (data.cell.width - boxWidth) / 2;  // Center box horizontally
                const cellY = data.cell.y + (data.cell.height - boxHeight) / 2;  // Center box vertically

                // Convert the cell text to a string and trim any spaces
                let cellText = data.cell.text;
                if (Array.isArray(cellText)) {
                    cellText = cellText.join(''); // Join array elements if the text is an array
                }

                if (data.row.index === 0) {
                    if (cellText.trim() === '') { // Check for empty or whitespace
                        switch (data.column.index) {
                            case 0:
                                doc.setFillColor(255, 0, 0);  // Red
                                doc.rect(cellX, cellY, boxWidth, boxHeight, 'F');
                                break;
                            case 1:
                                doc.setFillColor(255, 255, 0);  // Yellow
                                doc.rect(cellX, cellY, boxWidth, boxHeight, 'F');
                                break;
                            case 2:
                                doc.setFillColor(255, 165, 0);  // Orange
                                doc.rect(cellX, cellY, boxWidth, boxHeight, 'F');
                                break;
                            case 3:
                                doc.setFillColor(255, 192, 203);  // Pink
                                doc.rect(cellX, cellY, boxWidth, boxHeight, 'F');
                                break;
                            case 4:
                                doc.setFillColor(0, 128, 0);  // Green
                                doc.rect(cellX, cellY, boxWidth, boxHeight, 'F');
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        });

        addFooter(doc);


        yPosition = 10; // Initialize yPosition for the first page
        let annexureIndex = 1;

        for (const service of servicesData) {
            doc.addPage();
            addFooter(doc);

            let yPosition = 10; // Reset yPosition to the top margin

            const reportFormJson = JSON.parse(service.reportFormJson.json);
            const rows = reportFormJson.rows || [];
            const serviceData = [];

            // Process each row to build service data
            rows.forEach((row) => {
                const inputLabel = row.label || "";
                const valuesObj = {};

                row.inputs.forEach((input) => {
                    const inputName = input.name;
                    let verifiedInputName = `verified_${inputName}`;

                    // Handle "verified_" prefix adjustments
                    verifiedInputName = verifiedInputName.replace("verified_verified_", "verified_");
                    if (input.label && typeof input.label === "string") {
                        input.label = input.label.replace(/:/g, ""); // Remove colons from labels
                    }

                    // Fetch value and verified value from annexureData
                    const value = service.annexureData[inputName] || "";
                    const verifiedValue = service.annexureData[verifiedInputName] || "";

                    valuesObj[inputName] = value;
                    if (verifiedValue) {
                        valuesObj[verifiedInputName] = verifiedValue;
                        valuesObj["isVerifiedExist"] = true;
                    } else {
                        valuesObj["isVerifiedExist"] = false;
                    }

                    valuesObj["name"] = inputName.replace("verified_", ""); // Simplify the name
                });

                serviceData.push({
                    label: inputLabel,
                    values: valuesObj,
                });
            });

            // Build table data
            const tableData = serviceData
                .map((data) => {
                    if (!data || !data.values) return null;

                    const name = data.values.name;
                    if (!name || name.startsWith("annexure")) return null;

                    const isVerifiedExist = data.values.isVerifiedExist;
                    const value = data.values[name];
                    const verified = data.values[`verified_${name}`];

                    if (value === undefined) return null;

                    // Return appropriate row based on verified status
                    return verified
                        ? [data.label, value, verified]
                        : [data.label, value];
                })
                .filter((item) => item !== null);

            // Validate table data
            if (tableData.length === 0) {
                console.error("No valid data found for table rendering.");
            } else {
            }

            const pageWidth = doc.internal.pageSize.width;

            // Add heading
            const headingText = reportFormJson.heading.toUpperCase();
            const backgroundColor = "#f5f5f5";
            const borderColor = "#3d75a6";
            const xsPosition = 10;
            const rectHeight = 10;

            doc.setFillColor(backgroundColor);
            doc.setDrawColor(borderColor);
            doc.rect(xsPosition, yPosition, pageWidth - 20, rectHeight, "FD");

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");

            // Calculate text height to properly center it vertically in the rectangle
            const textHeight = doc.getTextDimensions(headingText).h;
            const verticalCenter = yPosition + rectHeight / 2 + textHeight / 4; // Adjust using text height

            doc.text(headingText, pageWidth / 2, verticalCenter, { align: "center" });

            yPosition += rectHeight + 0; // Adjust yPosition for the next section
            // Adjust yPosition after heading

            // Add table
            doc.autoTable({
                head: [[{ content: "PARTICULARS", styles: { halign: "left" } },
                    "APPLICANT DETAILS", "VERIFIED DETAILS"]],
                body: tableData.map((row) => {
                    if (row.length === 2) {
                        // Merge columns for "Applicant Details" if no "Verified Details"
                        return [
                            { content: row[0], styles: { halign: "left" } },
                            { content: row[1], colSpan: 2, styles: { halign: "left" } },
                        ];
                    } else {
                        // Normal row with all columns
                        return [
                            { content: row[0], styles: { halign: "left" } },
                            { content: row[1], styles: { halign: "left" } },
                            { content: row[2], styles: { halign: "left" } },
                        ];
                    }
                }),
                startY: yPosition,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineWidth: 0.3,
                    lineColor: [62, 118, 165],
                },
                columnStyles: {
                    0: { cellWidth: "auto", halign: "left" },
                    1: { cellWidth: "auto", halign: "left" },
                    2: { cellWidth: "auto", halign: "left" },
                },
                theme: "grid",
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    halign: "center",
                    fontSize: 10,
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    halign: "left",
                },
                tableLineColor: [62, 118, 165],
                tableLineWidth: 0.3,
                margin: { horizontal: 10 },
            });

            yPosition = doc.lastAutoTable.finalY + 10; // Update Y position for next section

            // Add Remarks
            const remarksData = serviceData.find((data) => data.label === "Remarks");
            if (remarksData) {
                const remarks = remarksData.values.name || "No remarks available.";
                doc.setFont("helvetica", "italic");
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Remarks: ${remarks}`, 10, yPosition);
                yPosition += 10;
            }


            const annexureImagesKey = Object.keys(service.annexureData).find(key =>
                key.toLowerCase().startsWith('annexure') && !key.includes('[') && !key.includes(']')
            );

            if (annexureImagesKey) {
                const annexureImagesStr = service.annexureData[annexureImagesKey];
                const annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(',') : [];

                if (annexureImagesSplitArr.length === 0) {
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.text("No annexure images available.", 10, yPosition);
                    yPosition -= 5;
                } else {
                    for (const [index, imageUrl] of annexureImagesSplitArr.entries()) {
                        const imageUrlFull = `${imageUrl.trim()}`;
                        const imageFormat = getImageFormat(imageUrlFull);

                        if (!(await checkImageExists(imageUrlFull))) continue;

                        const img = await validateImage(imageUrlFull);
                        if (!img) continue;

                        try {
                            const pageWidth = doc.internal.pageSize.width;
                            const maxBoxWidth = pageWidth - 20; // Full width with 10px padding on each side
                            const maxBoxHeight = 120; // Set the maximum height for the box
                            const padding = 5; // Padding inside the border box
                            const { width, height } = scaleImage(img, maxBoxWidth - 2 * padding, maxBoxHeight - 2 * padding);

                            // Check if a new page is needed
                            if (yPosition + maxBoxHeight > doc.internal.pageSize.height - 15) {
                                doc.addPage();
                                yPosition = 10;
                            }

                            const annexureText = `Annexure ${annexureIndex} (${String.fromCharCode(97 + index)})`;
                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(10);
                            doc.text(annexureText, 10, yPosition);
                            yPosition += 10;

                            // Draw border box with light color and specific border color
                            const boxX = 10; // Left margin
                            const boxY = yPosition;
                            doc.setDrawColor(61, 117, 166); // RGB equivalent of #3d75a6
                            doc.setLineWidth(0.3); // Lighter border (smaller line width)
                            doc.rect(boxX, boxY, maxBoxWidth, maxBoxHeight);

                            // Center the image within the box
                            const centerXImage = boxX + padding + (maxBoxWidth - width - 2 * padding) / 2;
                            const centerYImage = boxY + padding + (maxBoxHeight - height - 2 * padding) / 2;

                            // Add the image
                            doc.addImage(img.src, imageFormat, centerXImage, centerYImage, width, height);

                            yPosition += maxBoxHeight + 10; // Move down for the next image
                        } catch (error) {
                            console.error(`Failed to add image to PDF: ${imageUrlFull}`, error);
                        }
                    }
                }
            } else {
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;

                doc.setFont("helvetica", "italic");
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);

                const text = "No annexure images available.";
                const textWidth = doc.getTextWidth(text);
                const centerX = (pageWidth - textWidth) / 2; // Center horizontally
                const centerY = pageHeight / 2; // Center vertically

                doc.text(text, centerX, centerY);
            }
            addFooter(doc);
            annexureIndex++;
            yPosition += 0;
        }
        doc.addPage();
        yPosition = 20;
        // addFooter(doc);

        const disclaimerButtonHeight = 10; // Button height (without padding)
        const disclaimerButtonWidth = doc.internal.pageSize.width - 20; // Full width minus margins

        // Constants for additional spacing
        const buttonBottomPadding = 5; // Padding below the button
        const disclaimerTextTopMargin = 5; // Margin from top of the disclaimer text

        // Adjusted Disclaimer Button Height (includes padding)
        const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;

        // Define Disclaimer Text
        const disclaimerTextPart1 = `This report is confidential and is meant for the exclusive use of the Client. This report has been prepared solely for the purpose set out pursuant to our letter of engagement (LoE)/Agreement signed with you and is not to be used for any other purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on the information provided. The Client is responsible for employment decisions based on the information provided in this report.You can mail us at `;
        const anchorText = "compliance@screeningstar.com";
        const disclaimerTextPart2 = " for any clarifications.";
        // Dynamically calculate disclaimer text height
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Set text color to #000 (black)
        const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);
        const disclaimerLinesPart2 = doc.splitTextToSize(disclaimerTextPart2, disclaimerButtonWidth);

        // Adjusted Y position for disclaimer text
        const lineHeight = 7; // Increased line height for better readability
        const disclaimerTextHeight =
            disclaimerLinesPart1.length * lineHeight +
            disclaimerLinesPart2.length * lineHeight +
            lineHeight; // Include space for anchor

        // Calculate total space required for the disclaimer (button + text)
        const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;

        // Calculate the available space from top to bottom
        const availableSpace = doc.internal.pageSize.height - 40; // Total page height minus some margin

        // Calculate the starting position for the content to be centered vertically
        // Calculate the starting position for the content to be centered vertically
        let disclaimerY = 20 // Add top margin (20)


        if (disclaimerY < 20) {
            doc.addPage();
            addFooter(doc);
            disclaimerY = 20;
        }

        // Draw Disclaimer Button (centered horizontally)
        const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2; // Centering horizontally
        doc.setDrawColor(62, 118, 165); // Set border color
        doc.setFillColor(backgroundColor); // Set fill color
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F'); // Fill the rectangle
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D'); // Draw the border
        doc.setTextColor(0, 0, 0); // Set text color to black
        doc.setFont("helvetica", "bold");

        // Center the 'DISCLAIMER' text inside the button both horizontally and vertically
        const disclaimerButtonTextWidth = doc.getTextWidth('DISCLAIMER'); // Width of the button text
        const buttonTextHeight = doc.getFontSize(); // Height of the text (font size)

        // Horizontal centering of text inside the button
        const disclaimerTextXPosition =
            disclaimerButtonXPosition + disclaimerButtonWidth / 2 - disclaimerButtonTextWidth / 2 - 1;
        // Vertical centering of text inside the button
        const disclaimerTextYPosition = disclaimerY + disclaimerButtonHeight / 2 + buttonTextHeight / 4 - 1;

        // Add 'DISCLAIMER' text to the button, centered both horizontally and vertically
        doc.text('DISCLAIMER', disclaimerTextXPosition, disclaimerTextYPosition);

        // Draw Disclaimer Text (Split parts)
        let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;

        // Draw Part 1 of the Disclaimer (Black Text)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        disclaimerLinesPart1.forEach((line) => {
            doc.text(line, 10, currentY);
            currentY += lineHeight;
        });

        // Add Anchor Text (Blue and Clickable)
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(anchorText, 10 + doc.getTextWidth(disclaimerLinesPart1[disclaimerLinesPart1.length - 1]), currentY - lineHeight, {
            url: "mailto:compliance@screeningstar.com",
        });

        // Draw Part 2 of the Disclaimer (Black Text)
        doc.setTextColor(0, 0, 0);
        disclaimerLinesPart2.forEach((line) => {
            doc.text(line, 10, currentY);
            currentY += lineHeight;
        });

        // Place company details at the top of the page, before the "END OF DETAIL REPORT" button
        let companyDetailsY = currentY + disclaimerTextTopMargin;

        // Set font for company details
        doc.setFont("helvetica");
        doc.setFontSize(14);

        // Center company name with a bolder style
        const companyTextWidth1 = doc.getTextWidth("Screeningstar Solutions Pvt Ltd");
        const companyTextXPosition1 = (doc.internal.pageSize.width - companyTextWidth1) / 2;

        // Add company name (Bold and Larger)
        doc.setTextColor(62, 118, 165); // Using a soft blue color for the company name
        doc.setFont("helvetica", "bold");
        doc.text("Screeningstar Solutions Pvt Ltd", companyTextXPosition1, companyDetailsY);

        // Set smaller font for the address with better line spacing
        // Set smaller font for the address with better line spacing
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black color for the address

        // Combine the address into two lines
        const addressLine1 = "No 93/9, Varthur Main Road, Marathahalli, Bangalore, Karnataka";
        const addressLine2 = "India, Pin Code - 560037";

        // Calculate the X position to center both lines
        const addressLine1Width = doc.getTextWidth(addressLine1);
        const addressLine2Width = doc.getTextWidth(addressLine2);

        const addressLine1XPosition = (doc.internal.pageSize.width - addressLine1Width) / 2;
        const addressLine2XPosition = (doc.internal.pageSize.width - addressLine2Width) / 2;

        // Add address details with proper spacing
        doc.text(addressLine1, addressLine1XPosition, companyDetailsY + 10);
        doc.text(addressLine2, addressLine2XPosition, companyDetailsY + 20);

        currentY = companyDetailsY + 30;

        // Draw "END OF DETAIL REPORT" Button (centered horizontally)
        let endOfDetailY = currentY;
        if (endOfDetailY + disclaimerButtonHeight > doc.internal.pageSize.height - 20) {
            doc.addPage();
            endOfDetailY = 20; // Start from the top of the new page
        }


        const endButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2; // Centering horizontally
        doc.setDrawColor(62, 118, 165);
        doc.setFillColor(backgroundColor);
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
        doc.setTextColor(0, 0, 0); // Set text color to black for the button text
        doc.setFont("helvetica", "bold");

        // Center the 'END OF DETAIL REPORT' text inside the button both horizontally and vertically
        const endButtonTextWidth = doc.getTextWidth('END OF DETAIL REPORT'); // Width of the button text
        const endButtonTextHeight = doc.getFontSize(); // Height of the text (font size)

        const endButtonTextXPosition =
            endButtonXPosition + disclaimerButtonWidth / 2 - endButtonTextWidth / 2 - 1;
        // Vertical centering of text inside the button
        const endButtonTextYPosition = endOfDetailY + disclaimerButtonHeight / 2 + endButtonTextHeight / 4 - 1;

        // Add 'END OF DETAIL REPORT' text to the button, centered both horizontally and vertically
        doc.text('END OF DETAIL REPORT', endButtonTextXPosition, endButtonTextYPosition);

        // Ensure footer is added
        addFooter(doc);

        doc.save('report.pdf');
        setLoadingGenrate(null);
    }

    const handleUpload = (applicationId, branchid) => {
        navigate(`/admin-DataGenerateReport?applicationId=${applicationId}&branchid=${branchid}&clientId=${clientId}`);
    };

    function sanitizeText(text) {
        if (!text) return text;
        return text.replace(/_[^\w\s]/gi, ''); // Removes all non-alphanumeric characters except spaces.
    }

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
    console.log('applicationStatus', applicationStatus)


    const handleGoBack = () => {
        navigate('/admin-data-management');
    };
    useEffect(() => {
        const initialize = async () => {
            try {
                await fetchData(); // Fetch main data first
                await fetchAdminList(); // Fetch admin list after data
                await fetchServicesData(); // Fetch services data after admin list
            } catch (error) {
                console.error('An error occurred:', error.message);
            }
        };

        initialize();
    }, []);

     useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [filteredData, loading]); 

    return (
        <div className="bg-[#c1dff2]">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">DATA CHECKIN - {parentName}</h2>
            <div className="space-y-4 py-[30px] px-[51px] bg-white">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                {/* <div className='text-center flex justify-center items-center mb-6 '>
                    <button
                        className={`bg-[#2c81ba] text-white  transition-all duration-300 ease-in-out transform hover:scale-105 rounded px-4 ${servicesLoading ? 'opacity-50 cursor-not-allowed' : ''} py-2 hover:bg-[#073d88]`}
                        onClick={() => handleViewMore()}
                    >
                        {expandedRow && expandedRow.headingsAndStatuses.length > 0 ? 'Hide' : 'Show Servces'}
                    </button>

                </div> */}
                <div className='flex justify-between items-baseline mb-6 '>

                    <div className=" text-left">
                        <button
                            className="bg-green-500 hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105  text-white px-6 py-2 rounded"
                            onClick={handleExportToExcel}
                        >
                            Export to Excel
                        </button>
                    </div>
                    <div className=" w-1/2 text-right">
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
                                    <th className="uppercase border border-black px-4 py-2">Applicant Employee Id</th>
                                    <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                                    <th className="uppercase border border-black px-4 py-2">Photo</th>
                                    <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
                                    <th className="uppercase border border-black px-4 py-2">Report Data</th>

                                    {/* Dynamic Headings for each service */}
                                    {applicationStatus[0]?.serviceDetails?.map((service, index) => (
                                        <th key={index} className="uppercase border border-black px-4 py-2">
                                            {service.heading}
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
                                                    <td className="border border-black px-4 py-2">
                                                        {new Date(data.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                                    <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                                    <td className="border border-black px-4 py-2 text-center">
                                                        <div className='flex justify-center items-center'>
                                                            <img src={`${data.photo}`} alt={data.name} className="w-10 h-10 rounded-full" />
                                                        </div>
                                                    </td>
                                                    <td className="border border-black px-4 py-2">{data.name || 'NIL'}</td>

                                                    {/* Report Data Button */}
                                                    <td className="border border-black px-4 py-2">
                                                        <button
                                                            className="bg-white border border-[#073d88] text-[#073d88] px-4 py-2 rounded hover:bg-[#073d88] hover:text-white"
                                                            onClick={() => handleUpload(data.id, data.branch_id)}
                                                        >
                                                            BASIC ENTRY
                                                        </button>
                                                    </td>

                                                    {/* Service Statuses */}
                                                    {applicationStatus.map((application, idx) => (
                                                        application.serviceDetails.map((service, index) => (
                                                            <td key={`${idx}-${index}`} className="border border-black px-4 py-2">
                                                                {service.status || 'INITIATED'}
                                                            </td>
                                                        ))
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
        </div >
    );

};

export default DataCheckin;
