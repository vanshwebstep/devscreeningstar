import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import PDFuser from "../../imgs/PDFuser.png"
import isoLogo from "../../imgs/iso.png"
import Default from "../../imgs/default.png"
import { useApiLoading } from '../ApiLoadingContext';

import imageCompression from "browser-image-compression";
import { FaFlag } from 'react-icons/fa';
import { FaChevronLeft } from 'react-icons/fa';
const AdminChekin = () => {
    const [activeId, setActiveId] = useState(null);
    const [selectedValue, setSelectedValue] = useState("");
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [downloadingIndex, setDownloadingIndex] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loadingIndex, setLoadingIndex] = useState(null);
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [expandedRow, setExpandedRow] = useState({ index: '', headingsAndStatuses: [] });
    const navigate = useNavigate();
    const location = useLocation();
    const [adminTAT, setAdminTAT] = useState('');
    const [data, setData] = useState([]);
    const [reportData, setReportData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [branchName, setBranchName] = useState("N/A");
    const [companyName, setCompanyName] = useState("N/A");
    const [organisationName, setOrganisationName] = useState([]);


    const [viewLoading, setViewLoading] = useState(false);


    const [isHighlightLoading, setIsHighlightLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [loadingGenrate, setLoadingGenrate] = useState(null);
    const [filterData, setFilterData] = useState([]);




    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200,500,1000];
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
    const fetchData = useCallback((filterStatus = null) => {
        console.log('flsts', filterStatus)
        if (!branchId || !adminId || !token) {
            return;
        } else {
            setApiLoading(true)
            setLoading(true);
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        function toCamelCase(str) {
            return str
                .toLowerCase()
                .split(' ')
                .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
        }

        const baseUrl = `https://api.screeningstar.co.in/client-master-tracker/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`;

        // Initialize URLSearchParams for parameters
        const parameters = new URLSearchParams();

        // If filterStatus exists, append it to the parameters
        if (filterStatus) {
            parameters.append('filter_status', toCamelCase(filterStatus));
        }

        const finalUrl = `${baseUrl}&${parameters.toString()}`;

        fetch(finalUrl, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                setApiLoading(false)
                setLoading(false);
                setData(result.customers || []);

                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setFilterData(result?.filterOptions || []);
                setBranchName(result.branchName);
                setAdminTAT(result.tatDays);
                setCompanyName(result.customerName);
            })
            .catch((error) => {
                console.error('Fetch error:', error);
            })
            .finally(() => {
                setApiLoading(false)
                setLoading(false);
            });
    }, [branchId, adminId, token, setData]);




    const fetchServicesData = async (applicationId, servicesList, reportDownload = '0') => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");
        setViewLoading(true);

        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setViewLoading(false);
            return [];
        }

        try {
            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList)}&report_download=${encodeURIComponent(reportDownload)}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;

            // Perform the fetch request
            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const result = await response.json();

            if (response.ok) {
                setViewLoading(false);
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item != null);
                console.log('filteredResults', filteredResults);
                return filteredResults;
            } else {
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                console.error("Failed to fetch service data:", response.statusText);
                setViewLoading(false);
                setApiLoading(false)
                setLoadingIndex(null);

                return [];
            }
        } catch (error) {
            console.error("Error fetching service data:", error);
            setViewLoading(false);
            setLoadingIndex(null);
            setApiLoading(false)

            return [];
        }
    };


    const checkImageExists = async (url) => {
        try {
            const response = await fetch(url, { method: "HEAD" });
            return response.ok; // Returns true if HTTP status is 200-299
        } catch (error) {
            console.error(`Error checking image existence at ${url}:`, error);
            return false;
        }
    };

    const getImageFormat = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (ext === 'png') return 'PNG';
        if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
        if (ext === 'webp') return 'WEBP';
        return 'PNG'; // Default to PNG if not recognized
    };
    function loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error loading image: ' + imageUrl));
            img.src = imageUrl;
        });
    }

    const fetchImageAsBase64 = async (imageUrl) => {
        try {
            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
            const imageType = getImageFormat(imageUrl).toLowerCase();
            return `data:image/${imageType};base64,${Buffer.from(response.data, "binary").toString("base64")}`;
        } catch (error) {
            console.error("Error fetching or converting image:", error.message);
            return null;
        }
    };

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

    const fetchImageToBase = async (imageUrls) => {
        if (!imageUrls || imageUrls.length === 0) {
            console.warn("No image URLs provided.");
            return null; // Return null if imageUrls is empty
        }

        try {
            const headers = {
                "Content-Type": "application/json",
            };

            const raw = { image_urls: imageUrls };

            const response = await axios.post(
                "https://api.screeningstar.co.in/utils/image-to-base",
                raw,
                { headers }
            );

            return response.data.images || [];
        } catch (error) {
            console.error("Error fetching images:", error);

            if (error.response) {
                console.error("Response error:", error.response.data);
            } else {
                console.error("Request error:", error.message);
            }

            return null;
        }
    };

    const formatAddress = (address, groupSize = 3) => {
        if (!address?.trim()) return []; // Handle empty, null, or undefined input

        const parts = address.split(",").map(part => part.trim());
        let formattedAddress = [];

        for (let i = 0; i < parts.length; i += groupSize) {
            formattedAddress.push(parts.slice(i, i + groupSize).join(", "));
        }

        return formattedAddress;
    };
    function addFooter(doc) {
        const footerHeight = 14;
        const footerYPosition = doc.internal.pageSize.height - footerHeight;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 10;
        const centerX = pageWidth / 2;

        // ISO Logos
        const image1 = isoLogo;
        const image2 = isoLogo;
        const imageWidth = 10;
        const imageHeight = 10;
        const imageGap = 0;

        // Image positions
        const image1X = margin;
        const image1Y = footerYPosition - imageHeight + 11;
        const image2X = image1X + imageWidth + imageGap;
        const image2Y = footerYPosition - imageHeight + 11;

        doc.addImage(image1, 'JPEG', image1X, image1Y, imageWidth, imageHeight);
        doc.addImage(image2, 'JPEG', image2X, image2Y, imageWidth, imageHeight);

        // **Centered Footer Text (Perfect Alignment)**
        const footerText = "CONFIDENTIAL SCREENING REPORT";
        doc.setFont("helvetica", "normal"); // Make it bold for better visibility
        doc.setFontSize(10);

        const textWidth = doc.getTextWidth(footerText); // Get text width for centering
        const textX = centerX - textWidth / 2; // Perfect horizontal centering
        const textY = footerYPosition + 6; // Adjusted vertical alignment

        doc.text(footerText, textX, textY);

        // Page Number (Right-Aligned)
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        const pageNumberText = `Page ${currentPage} / ${pageCount}`;
        doc.setFont("helvetica", "normal"); // Regular font for page number
        const pageNumberWidth = doc.getTextWidth(pageNumberText);
        const pageNumberX = pageWidth - margin - pageNumberWidth;
        doc.text(pageNumberText, pageNumberX, footerYPosition + 8);

        // **Upper Horizontal Line (Same Blue Color)**
        doc.setLineWidth(0.3);
        doc.setDrawColor(61, 117, 166); // Blue color (#3d75a6)
        doc.line(margin, footerYPosition - footerHeight + 13, pageWidth - margin, footerYPosition - footerHeight + 13);

        // **Thin & Light Gray Vertical Line Near ISO Logo**
        doc.setLineWidth(0.1);
        doc.setDrawColor(200, 200, 200); // Light gray color

        const lineX = image2X + imageWidth + 0.1; // **0.1 space next to the second logo**
        const lineStartY = image2Y;
        const lineEndY = image2Y + imageHeight;

        doc.line(lineX, lineStartY, lineX, lineEndY);
    }
    const generatePDF = async (index) => {
        let isFirstLoad = true;
        
        const applicationInfo = data[index];
        setLoadingGenrate(index);
        setApiLoading(true)
     
        //    console.log('applicationInfo.custom_logo',)  
        const servicesData = (await fetchServicesData(applicationInfo.main_id, applicationInfo.services, '1')) || [];
        const doc = new jsPDF({ compress: true });
            const timesNewRomanBase64 ="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AaABogGmAaoBrgGuAa4BsAGwAAAAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAHoAewB8AH0AfgB/AIAAgQCCAIMAhACFAIYAhwCIAIkAigCLAIwAjQCOAI8AkACRAJIAkwCUAJUAlgCXAJgAmQCaAJsAnACdAJ4AnwCgAKEAogCjAKQApQCmAKcAqACpAKoAqwCsAK0ArgCvALAAsQCyALMAtAC1ALYAtwC4ALkAugC7ALwAvQC+AL8AwADBAMIAwwDEAMUAxgDHAMgAyQDKAMsAzADNAM4AzwDQANEA0gDTANQA1QDWANcA2ABsAHgAagB2AHkAYwBoAHQAcgBzAG0AbgBiAG8AcABkAGYAZwBxAGUAaQBrAHcAdQCQ/yoDAQAwAAAAAAEAAAABAAAAAN4AHgHPACgB9AAUAgoAHgMoABcDFwAaAOAAKAE9ABoBPQAKAdQAKAI6ABIBBgAoAU0AGADyACgBFv/9AfQAKAH0AD4B9AAkAfQAIgH0ACEB9AAkAfQAIAH0ABwB9AAkAfQAIgDyACgBBgAoAjoAEgI6ABICOgASAa0AFAOOABgCvv/2ApYADQKwABQCyAANAmoADQJaAA0C+gAYAvkADQF2AA0B9wAAAwoADQJ8AA0DmgANAsEADQL2ABQCTAANAvEAFALWAA0CCgAeAncADQLNAAsCrv/4A9n/+AK3AAACo//2AooABgEAACgBFv/9AQAAAAHKAAoCBAAAAOwAEAHgABwCCwAKAaYAFAIRABQBqwAUASoAEgHtABQCCQANAQoADQEN/6YCJAAKAQoADQMaAA0CEQANAdQAFAISAAoCCQAUAZwADQFqABoBSAAQAfsACgHY//gCuv/4AdUACAHlAAwBvQAQAWIAKADcAE4BYgAoAggAEwEGACgB9P//AdsAKAPoAFYB0QAcAbsAGAFNAAoEjwAXAgoAHgFNAC0D2AAmARwALwEcAC8B7AAvAewAGgFeACMCLwAUBB4AFAFNAAkEMwAqAWQAEQFNACwC0gAkAtIACQH0AAAA3gAeAfQAPwH0ABECCgAUAjoAGwDcAE4B3wAhAU0ACgLrABcBPQARAfQAEQI6ABIC6wAXAU0ACgGQAB8COgASASgADgEoAAwA9QAXAjAAFgIuABMA+gAsAU0AKwEsACMBSgANAfQAEQLuACMC7gAjAu4ACwGtABQCvv/2AnYADQKaAA0CTQANAsEAAQJqAA0D6gAIAe0ADAMjAA0DEwANAs8ADQLQAAADmgANAvkADQLyABgC9gANAkwADQKgABoCdwANAqQAAAMEABICtwAAAyEADQLgAAAEbQANBHIADQLEAAwD1gANAnEADQJ4AA0EMgANAroAAAHgABwB6QAgAdQADQGeAA0B4gAAAasAFAK6AAoBkgAKAfIADQHyAA0B2wANAeMAAAKKAA0CAAANAdQAFAH6AA0CEgAKAaYAFgG7AAoB5QAMAuoAFAHVAAgB/AANAeoAAALuAA0C9QANAfsADAKmAA0BwAANAaMACgLIAA0B1gAAAqcCtwHRAJcAAQJMARMC5v+xAnYBJQGbA58CWgKQA2ICOAG5A3IAAP/z/x//4wFX/zD/RgDV/4kBOwFpAF4A6wINAE8BAQIhAXoBTQAzAfkAuQEl/33/wgCCABIAYAAHAJsAKQBnAOAB2AEqAQ4BogDrALgARwCRAH0AYAFNATwAVAB4ABwAuACjAIwAXwAnADUAawDEAEUACQCXAEIAAAAAAZgCvAAFAAECvAKKAAAAjwK8AooAAAHFADIBAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBbHRzACAAICIZAwEA5wAAA58A5wAAAAAAEAAAANwJCwcAAgICBAUFBwcCAwMEBQIDAgMFBQUFBQUFBQUFAgIFBQUECAYGBgYGBQcHAwUHBggGBwUHBwUGBgYJBgYGAgMCBAUCBAUEBQQDBAUCAgUCBwUEBQUEAwMFBAYEBAQDAgMFAgUECQQEAwsFAwkDAwQEAwUJAwoDAwYGBQIFBQUFAgQDBwMFBQcDBAUDAwIFBQIDAwMFBwcHBAYGBgUGBgkEBwcGBggHBwcFBgYGBwYHBwoKBgkGBgoGBAQEBAQEBgQEBAQEBgUEBQUEBAQHBAUEBwcFBgQEBgQACgwIAAMDAgUFBQgIAgMDBQYDAwIDBQUFBQUFBQUFBQIDBgYGBAkHBwcHBgYICAQFCAYJBwgGCAcFBgcHCgcHBwMDAwUFAgUFBAUEAwUFAwMFAwgFBQUFBAQDBQUHBQUEBAIEBQMFBQoFBAMMBQMKAwMFBQQGCwMLBAMHBwUCBQUFBgIFAwcDBQYHAwQGAwMCBgYDAwMDBQgICAQHBgcGBwYKBQgIBwcJCAgIBgcGBwgHCAcLCwcKBgYLBwUFBQQFBAcEBQUFBQcFBQUFBAQFBwUFBQgIBQcEBAcFAAsNCAADAwIFBgYJCQIDAwUGAwQDAwYGBgYGBgYGBgYDAwYGBgUKCAcICAcHCAgEBgkHCggIBggIBgcICAsIBwcDAwMFBgMFBgUGBQMFBgMDBgMJBgUGBgUEBAYFCAUFBQQCBAYDBgULBQUEDQYECwMDBQUEBgwEDAQECAgGAgYGBgYCBQQIAwYGCAQEBgMDAwYGAwQDBAYICAgFCAcHBggHCwUJCQgICggICAYHBwcICAkIDA0ICwcHDAgFBQUFBQUIBAUFBQUHBgUGBgUFBQgFBgUICAYHBQUIBQAMDgkAAwMDBgYGCgkDBAQGBwMEAwMGBgYGBgYGBgYGAwMHBwcFCwgICAkHBwkJBAYJCAsICQcJCQYICQgMCAgIAwMDBQYDBgYFBgUEBgYDAwcDCgYGBgYFBAQGBggGBgUEAwQGAwYGDAYFBA4GBAwDAwYGBAcNBA0EBAkJBgMGBgYHAwYECQQGBwkEBQcEBAMHBwMEBAQGCQkJBQgICAcIBwwGCgkJCQsJCQkHCAgICQgKCQ4OCAwICA0IBgYGBQYFCAUGBgYGCAYGBgYFBQYJBgYGCQkGCAUFCQYADQ8KAAMDAwYHBwsKAwQEBgcDBAMEBwcHBwcHBwcHBwMDBwcHBgwJCQkJCAgKCgUHCggMCQoICgkHCAkJDQkJCAMEAwYHAwYHBQcGBAYHAwMHAwoHBgcHBQUEBwYJBgYGBQMFBwMHBg0GBgQPBwQNBAQGBgUHDgQOBQQJCQcDBwcHBwMGBAoEBwcKBAUHBAQDBwcDBAQEBwoKCgYJCAkICQgNBgoKCQkMCgoKCAkICQoJCgoPDwkNCAgOCQYGBgUGBgkFBgYGBggHBgcHBQYGCgYHBgoKBwkGBQkGAA4QCwAEBAMGBwcLCwMEBAcIBAUDBAcHBwcHBwcHBwcDBAgICAYNCgkKCgkICwsFBwsJDQoLCAsKBwkKCg4KCQkEBAQGBwMHBwYHBgQHBwQECAQLBwcHBwYFBQcHCgcHBgUDBQcEBwcOBwYFEAcFDgQEBwcFCA8FDwUFCgoHAwcHBwgDBwUKBAcICgUGCAQEAwgIBAUEBQcLCwsGCgkJCAoJDgcLCwoKDQsLCwgJCQkLCgsKEBAKDgkJDwoHBwcGBwYKBgcHBwcJBwcHBwYGBwoHBwcLCwcJBgYKBwAPEgwABAQDBwgIDAwDBQUHCQQFBAQICAgICAgICAgIBAQJCQkGDgsKCgsJCQsLBggMCg4LCwkLCwgJCwoPCgoKBAQEBwgEBwgGCAYEBwgEBAgEDAgHCAgGBQUIBwoHBwcFAwUIBAgHDwcHBRIIBQ8EBAcHBQgQBRAFBQsLCAMICAgJAwcFCwUICQsFBgkEBAQICAQFBQUICwsLBgsJCgkLCQ8HDAwLCw4LCwsJCgkKDAoMCxERCw8JCRAKBwcHBgcGCgYHBwcHCggHCAgGBwcLBwgHCwsICgcGCwcAEBMMAAQEBAcICA0NBAUFBwkEBQQECAgICAgICAgICAQECQkJBw8LCwsLCgoMDAYIDAoPCwwJDAwICgsLEAsLCgQEBAcIBAgIBwgHBQgIBAQJBA0IBwgIBwYFCAgLCAgHBgQGCAQICBAHBwUTCAUQBQUICAYJEQURBgUMDAgECAgICQQIBQwFCAkMBQYJBQUECQkEBQUFCAwMDAcLCgsJCwoQCA0NDAwPDAwMCQsKCwwLDQwSEgsQCgoRCwgIBwcIBwsGCAgICAoIBwgIBwcIDAgICAwMCAsHBwsIABEUDQAEBAQICQkODQQFBQgKBAYEBQkJCQkJCQkJCQkEBAoKCgcPDAsMDAsKDQ0GCQ0LEAwNCg0MCQsMDBEMCwsEBQQICQQICQcJBwUICQUFCQUNCQgJCQcGBgkIDAgICAYEBgkECQgRCAgGFAkGEQUFCAgGChIGEgYGDAwJBAkJCQoECAYNBQkKDQYHCgUFBAoJBAYFBgkNDQ0HDAsLCgwLEQgODQwMEA0NDQoLCwsNDA4NExMMEQsLEgwICAgHCAcMBwgICAgLCQgJCQcICA0ICQgNDQkMCAcMCAASFQ4ABQUECAkJDw4EBgYICgUGBAUJCQkJCQkJCQkJBAUKCgoIEA0MDA0LCw4OBwkOCxENDgsODQkLDQwSDQwMBQUFCAkECQkICggFCQkFBQoFDgoICgkHBwYJCA0ICQgGBAYJBQkJEggIBhUJBhIFBQkJBgoTBhMGBg0NCQQJCQkKBAkGDQYJCg0GBwoFBQQKCgUGBQYJDg4OCA0LDAsNCxIJDg4NDREODg4LDAsMDg0ODRQUDRILCxMNCQkIBwkIDQcJCQkJDAkICQoICAkNCAkJDg4JDAgIDQgAExYPAAUFBAkKCg8PBAYGCQsFBgUFCgoKCgoKCgoKCgUFCwsLCBENDQ0ODAsODgcKDwwSDQ4LDg4KDA4NEw0NDAUFBQkKBAkKCAoIBgkKBQUKBQ8KCQoKCAcGCgkNCQkIBwQHCgUKCRMJCAYWCgYTBQUJCQcLFAYUBwYODgoECgoKCwQJBg4GCgsOBggLBgYFCwsFBgYGCg4ODggNDA0LDQwTCQ8PDg4SDg4OCw0MDQ8NDw4WFg0TDAwUDQkJCQgJCA0ICQkJCQwKCQoKCAgJDgkKCQ4OCg0JCA4JABQXDwAFBQQJCgoQEAQGBgkLBQcFBgoKCgoKCgoKCgoFBQsLCwkSDg0ODgwMDw8HChANEg4PDA8PCg0ODhQODg0FBgUJCgUKCggLCQYKCgUFCwUQCwkLCggHBwoJDgkKCQcEBwoFCgoUCQkHFwoHFAYGCgoHCxUHFgcHDg4KBAoKCgsECgcPBgoLDwcICwYGBQsLBQcGBwoPDw8JDg0NDA4MFAoQEA4OEg8PDwwNDQ4PDhAPFxcOFA0NFQ4KCgkICgkOCAoKCgoNCgkKCwgJCg8JCgoPDwoOCQgOCQAVGRAABQUFCgsLEREFBwcKDAYHBQYLCwsLCwsLCwsLBQYMDAwJEw8ODg8NDRAQCAsQDRMPEAwQDwsNDw4VDw4OBQYFCgsFCgsJCwkGCgsGBgwGEQsKCwsJCAcLCg8KCgkHBQcLBgsKFQoJBxkLBxUGBgoKBwwWBxcHBw8PCwULCwsMBQoHEAcLDBAHCAwGBgUMDAUHBgcLEBAQCQ8NDgwPDRUKEREPDxMQEBAMDg0OEA8RDxgYDxUNDRcPCgoKCQoJDwgKCgoKDgsKCwsJCQoQCgsKEBALDgkJDwoAFhoRAAYGBQoLCxIRBQcHCg0GBwUGCwsLCwsLCwsLCwUGDQ0NCRQPDw8QDg0REQgLEQ4UEBENERALDhAPFg8PDgYGBgoLBQsMCQwJBwsLBgYMBhEMCgwLCQgHCwoPCgsKCAUICwYLChYKCgcaCwcWBgYLCwgMFwcYCAcQEAsFCwsLDQULBxAHCw0QBwkNBwcFDAwGBwcHCxEREQkPDg8NEA4WCxIREBAUERERDQ8ODxEPEhAZGRAWDg4YDwsLCgkLCQ8JCwsKCw4LCgsMCQoLEAoLCxERCw8KCRAKABcbEgAGBgULDAwTEgUHBwsNBggGBgwMDAwMDAwMDAwGBg0NDQoVEA8QEA4OEhIJDBIPFRARDhERDA8QEBcQEA8GBgYLDAULDAoMCgcLDAYGDQYSDAsMDAkICAwLEAsLCggFCAwGDAsXCwoIGwwIFwcHCwsIDRgIGQgIEREMBQwMDA0FCwgRBwwNEQgJDQcHBg0NBggHCAwREREKEA4PDhAOFwsSEhERFRIREQ4PDxASEBIRGhoQFw4PGRALCwsKCwoQCQsLCwsPDAsMDAoKCxELDAsREQwQCgoQCwAYHBIABgYFCwwNExMFCAgLDgYIBgcMDAwMDAwMDAwMBgYODg4KFhEQEREPDhISCQwTDxYREg4SEQ0PERAYERAQBgcGCwwGDA0KDQoHDA0GBg0GEw0LDQ0KCQgMCxELDAsIBQgMBgwLGAsLCBwNCBgHBwwMCA0ZCBoJCBERDAUMDA0OBQsIEggMDhIICg4HBwYNDQYIBwgMEhISChEPEA4RDxgMExMRERYSEhIOEA8QExETEhsbERgPDxoRDAwLCgwKEQoMDAsMEAwLDA0KCwwSCwwMEhIMEAsKEQsAAAAAAQAACvoAAQHSADAACAq8ACQACv+5AC8ACv+fAEkACgB9AJkACv+pACcADP+1ACkAD/+tAC0AD//bACYAD//iADIAD//IADMAD/+tADQAD//bADYAD//bADcAD/+tADgAD/+9ADkAD/+RADoAD/+fADwAD/+DACUAD//bAFUAD/+7AFYAD//iAFcAD//5AFkAD/+7AFoAD/+7AFwAD/+7ACcAD//TAJwAD/+EAKsAD/+cAKwAD/9eALwAD/+1AMsAD//OACYAEP/iADMAEP/kADkAEP+tAC4AEP+fADoAEP/IADsAEP/IACQAEP/IAJwAEP/CAJ8AEP/OADwAEP+RAKsAEP/OACkAEP/IAKwAEP/CAK4AEP/OAEkAEP/yADcAEP+7AC0AEf/bADMAEf+tAFkAEf+7ADkAEf+RAFoAEf+6ACUAEf/qAFwAEf+7ADQAEf/EADoAEf+fACYAEf/iAJwAEf+DADYAEf/bACkAEf+tADwAEf+DAKsAEf+cADIAEf/JADcAEf+sAKwAEf9eACcAEf/UAFUAEf+7ALwAEf+1ADgAEf+9AMsAEf+1AJwAHf/OACkAHf/WAKwAHf+1ADkAHf+tADoAHf+sADwAHf+fAKsAHf/bADcAHf/WADcAHv/WADwAHv+fAKwAHv+cADkAHv+tACkAHv/WAKsAHv/OAJwAHv/OADoAHv+tADkAJP9qAEoAJP/5ACYAJP/CAC0AJP/CADMAJP+IADcAJP+qACcAJP/CADoAJP93ACUAJP/iADgAJP+pADQAJP/bACkAJP+pACoAJP/OADIAJP+kADwAJP9nAEMAJP9ZABAAJP/IAC4AJv+8ADoAJv/bACQAJv+1ADwAJv+7ADsAJv/WADcAJv/wADUAJv/bADkAJv/EAC8AJ//5ADoAKv/iADkAKv/MACQAKv/CADUAKv/qACkAKv/iADwAKv/bAEMALf/kABAALf/IADIALf/qADcALf/BAC8AMv/7ADgAMv/xAC4AMv/TADkAMv/IADoAMv/RADUAMv/qADwAMv+9ADcAMv/wADsAMv/IACQAMv/aACkAMv/iAC8AM//qACkANP/iADoANP/bAC8ANP/iACQANP/CADkANP+9ADsANP/iADgANP/xADwANP/EAC4ANP/EADgANv/qADcANv/qADwANv/TACoANv/qADoANv/iADYAN//bACQAN/+1AC8AN//DADUAN//WABAAN/+7ADIAN//kAC8AOP+9ACQAOP/CADUAOP/bACUAOP/bADQAOP/xADIAOP/xADYAOP/bADMAOP/xABAAOf+tACQAOf92ADMAOf/qAC8AOf+nADUAOf/EADIAOf/TACoAOf/MACcAOf+1ADQAOf/aADYAOf+9ACUAOf/MADIAOv/WACQAOv+cACYAOv/xADUAOv+tABAAOv/IACoAOv/yADQAOv/bAC8AOv+AACUAOv/TADYAOv/iADMAOv/qADIAO//IABAAO/+7ADQAO//UACcAO//iACYAO//kACcAPP/OABAAPP+tADUAPP/KADIAPP/UADQAPP/qADMAPP/yACoAPP/iACQAPP93AC8APP+kADYAPP/TACUAPP/bADEARP/iADMARP/kADwARP+7ADoARP/fACkARP/YADcARP/dADkARP+7AFoARP/xAC4ARP/iADgARP/xAFwARP/qACQARv/kAFkARv/xAFwARv/qAFoARv/qADcARv/KACkAR//bADoAR//iAFoAR//qACQAR//kADgAR//yADcAR//iAFkAR//xAFwAR//qADMAR//xADwAR/+9AFoASP/xAFsASP/qADkASP+7AC0ASP/xACQASP/kADwASP+eADcASP/WAFwASP/qACkASP/LAFkASP/qADoASP/KADgASP/xADMASP/kAC4ASP/kADUASP/qABAASf/yACQASv/xADoASv+9ADcASv/MADgASv/qAFkASv/iAFoASv/iACkASv/TADwATP/WADkATP/WACkATP/qADoATP/kADoAUP/4ADgAUv/xADwAUv+fAC0AUv/xADEAUv/qADoAUv/KAFkAUv/qAC4AUv/kAFwAUv/qADUAUv/qADkAUv+tADMAUv/kADcAUv/WACkAUv/LACQAUv/WAFoAUv/xACQAVP/kADwAVP+uADkAVP/EACkAVP/qADoAVf/mACkAVf/nADcAVf/iADkAVf/WADgAVv/iADcAVv/vADMAVv/wAEkAVwAeADUAV//qACQAV//iADUAWP/qACkAWP/nADcAWP/qACQAWP/kADwAWP+7ADoAWP/kADkAWP/kAC4AWP/iAC8AWP/iAC0AWP/xACUAWP/xADEAWP/iADEAWf/bACoAWf/bAFIAWf/qADUAWf/TACsAWf/qAFwAWf/bAC8AWf+mADwAWf+9AFgAWf/xADcAWf/MACkAWf/bAEYAWf/xACQAWf+rACgAWf/bACsAWv/qACQAWv+4ADUAWv/iAFIAWv/xACkAWv/iAEQAWv/xAC8AWv/MAEYAWv/qAEgAWv/xACgAWv/iADcAWv/WADcAW//bACUAXP/xACQAXP+dACkAXP/ZAC4AXP+7ACsAXP/qADkAXP+7AC8AXP/IACgAXP/iAEgAXP/qADoAXP+3ADcAXP/IAKwAmf9bAK0Amf/CAKcAmf+9ALYAmf/CALcAmf/BAKkAmf+DAKoAmf/MAJwAmf+JAKsAmf+0AJwAnf/bAKkAnf/CALYAnf/bAKsAnf/PALcAnf/CAKcAnf/PAKwAnf+5AKoAnf/nAK0Anf/O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ABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAegB7AHwAfQB+AH8AgACBAIIAgwCEAIUAhgCHAIgAiQCKAIsAjACNAI4AjwCQAJEAkgCTAJQAlQCWAJcAmACZAJoAmwCcAJ0AngCfAKAAoQCiAKMApAClAKYApwCoAKkAqgCrAKwArQCuAK8AsACxALIAswC0ALUAtgC3ALgAuQC6ALsAvAC9AL4AvwDAAMEAwgDDAMQAxQDGAMcAyADJAMoAywDMAM0AzgDPANAA0QDSANMA1ADVANYA1wDYAGwAeABqAHYAeQBjAGgAdAByAHMAbQBuAGIAbwBwAGQAZgBnAHEAZQBpAGsAdwB1AJD/KgCZAJoAmwCcAJ0AngCfAKAAoQCiAKMApAClAKYApwCoAKkAqgCrAKwArQCuAK8AsACxALIAswC0ALUAtgC3ALgAuQC6ALsAvAC9AL4AvwDAAMEAwgDDAMQAxQDGAMcAyADJAMoAywDMAM0AzgDPANAA0QDSANMA1ADVANYA1wDY"
        // doc.addFileToVFS('TimesNewRoman.ttf', timesNewRomanBase64);
        // doc.addFont('TimesNewRoman.ttf', 'TimesNewRoman', 'normal');
        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');

        const pageWidth = doc.internal.pageSize.getWidth();

        let yPosition = 10;

        const sideMargin = 10;

        const mainTitle = "BACKGROUND VERIFICATION REPORT";
        let customLogo;
        if (applicationInfo?.custom_template == "yes") {
            if (applicationInfo?.custom_logo?.trim()) {
                customLogo = await fetchImageToBase(applicationInfo.custom_logo.trim());
                console.log(customLogo); // Print the fetched image
            } else {
                console.log("No custom logo");
            }
        }
        // Ensure customLogo is defined before using it in doc.addImage

        const screeningLogo = "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pjlypcpvDuukOgwksTjmVQZgP8pYTl9gmsRhtTtjv1/psD45106F+VeYJjBQ2pQ4335voBwiIiIiIiIiIiIyiAks03QgY1dNZaCkeVQx/66BcmLz1I3ghrlS5S7HdVId2P+HY3Fygo/ein24hel4qHXYh/th4bpV4wzY/184rVEHm2F+q4GSXsd5diED5RAREREREREREZFhTGCZpoO/Ym6iO619VDFfNlBOS6rlgnSltYbDKp/IlSpDHNZHDSRoicWWVxmC/fceFnM4rPJh7HuX54uQDq7GfJiBki7FeXZ3A+UQERERERERERGRYUxgmaYDU93w3aOK+fUNlNOSarmwAxZXOa52sVypYqLrRTKghSQWx7zKEOy3NbF4wHG12+M7cK3jOuU8Ky1FpzVQ0hY4z5poyUVERERERERERESGMYFlmg7mxPyfBkoag2lqVcz/10BZsVXLhSmw+BLTxA6rvSFXqmzjsD5qIkYSiy2vMgb77FkslnFY5U+YpsN34AeHdco5dnHMRxoqbRqcY78xVBYREREREREREREZxASWDTr4CPM/GShpbVXMu25RIQ/CJTmxkeNqB+VKldGO66QG8D04EIsz6/wvtrzKGOyr1bB42HG1t+B7sKXjOuX8ejTmxxso6Q2cXxc0UA4RERERERERERFZwASWDTq4HPOdDZR0pSrmTZTTkmq5sK6SLgzdOjVXqhzuuE5qAt+FbbHo20XcldhPzr+T1Bj201NYLO+42vXxXXB9npDzq6mWZufj/LqvgXKIiIiIiIiIiIjIAiawbNDBppjfZqCkANP0qph33k1btVyoYDHIYZWyrjPnSpWqwzopBnwXJFlwJKansH9O8x0PjQv7ZwgWjzmu9it8F0yMQdUaHcyA+WfKzG/Xxji33mGgHCIiIiIiIiIiIrKACSwbdDAV5l8rM9t3LVXMP2ignJZUy4XjsDjGcbX75kqV8x3XSdTWcKxK8mqI42pPx7F6qOM65dxaUtJyKr3fME2Bc+sYA2URERERERERERGRBUxg2aKDJzFfwUBJvroR/CMWnyq33xFphfWnXKnCh8pEMUSt4551XK0kf2bBcfqJ43pNnldfwHl1KQPlEBERERERERERkSVMYNmig6MwP8FAST67EbxfSQswt07IlSquW34RtSUco49gsarjau/BMbq+4zpNdx94Is6pRxso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t8bP4jMj9wYAAAAA2CVZYMFy5HLTNCyzDo7ca87dXpv67nFz7rH25PLBqPecc5e6tDo9DUurT865FwAAAAAAm7HAgpXKZfeod0nDIqsutW464w53TX334Rk/59qXy6NSve/UbNVTbvW1/lDkLCetAAAAAADassCCWcll7zQssurpoIMie63i2S5MfTfm5QrXjlwWon5vBs90buTMyAfjtT57Bs8HAAAAAMCMWGDBvORy66j3iNw9cqfIVZbx1Selvjt6LnPtDHL566hHLPOrvpbqsiql96bhlFWZ9VgAAAAAAMyGBRaMJZf9oh4QucOmx9tEfnUr//XNU999fqzR1pxc6gm3s7bxX1yYhhNWP0/ffWWM0QAAAAAAWD0LLGgll8unYYl1+8jtNj3W+2h9NvXdbVqONnm51N9ddSF17cgX0i8uq/7F6SoAAAAAgLXNAgumZLi/016p777cepTJy2XfqBvjtZrF/bAAAAAAAJgQCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJgUCywAAAAAAAAmxQILAAAAAACASbHAAgAAAAAAYFIssAAAAAAAAJiU/wX1BOTgEvIMowAAAABJRU5ErkJggg=="

        doc.addImage(customLogo?.[0]?.base64 || screeningLogo, 'PNG', 10, 10, 60, 15);
        const imgBoxX = pageWidth - 33; // Adjust as required
        const imgUrl = applicationInfo.photo ? applicationInfo.photo : PDFuser;

        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        const imageWidth = 20; // Width of the image
        const imageHeight = 20; // Height of the image
        const padding = 3; // Padding around the image

        const borderX = imgBoxX - padding; // Shift left by padding
        const borderY = 10 - padding; // Shift up by padding
        const borderWidth = imageWidth + 2 * padding; // Add padding to width
        const borderHeight = imageHeight + 2 * padding; // Add padding to height

        if (applicationInfo?.photo) {
            const imgUrl = await fetchImageToBase(applicationInfo?.photo.trim());
            doc.addImage(imgUrl?.[0]?.base64 || PDFuser, "JPEG", imgBoxX, 10, imageWidth, imageHeight);
        } else {
            doc.addImage(PDFuser, "JPEG", imgBoxX, 10, imageWidth, imageHeight);
        }

        // Add a larger square border with padding
        doc.rect(borderX, borderY, borderWidth, borderHeight);

        // Draw line and title width setup
        doc.setLineWidth(0.3);
        doc.setDrawColor(62, 118, 165);
        // doc.line(10, 40, pageWidth - 10, 40);
        const titleWidth = pageWidth - 2 * sideMargin; // Adjust width for equal margins

        const titleHeight = 7.5; // Height of the rectangle
        const titleY = 40; // Y position of the rectangle

        doc.setFillColor(246, 246, 246);
        doc.rect(sideMargin, titleY, titleWidth, titleHeight, 'F'); // Centered background rectangle with equal side gaps
        const headerTableDataOne = [
            ["NAME OF ORGANISATION", companyName || 'null'],
            ["NAME OF APPLICANT", applicationInfo.name || "N/A"],
        ];
        doc.autoTable({
            body: headerTableDataOne,
            startY: 52,
            styles: {
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0],
                lineWidth: 0.3,  // Set the width of the border
                lineColor: [62, 118, 165],  // Set the color of the border (black in this case)
            },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 50 },
                2: { fontStyle: "bold", cellWidth: 50 },
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

        doc.setDrawColor(62, 118, 165);
        doc.setLineWidth(0.1);
        doc.rect(sideMargin, titleY, titleWidth, titleHeight);

        // Set font and size for the title
        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        const textHeight = doc.getTextDimensions(mainTitle).h;
        const verticalCenter = titleY + titleHeight / 1.8 + textHeight / 6;

        // Add text centered horizontally and vertically
        doc.text(mainTitle, pageWidth / 2, verticalCenter, { align: 'center' });


        const headerTableData = [
            ["REFERENCE ID", String(applicationInfo.application_id).toUpperCase(), "DATE OF BIRTH", formatDate(applicationInfo.dob) || "N/A"],
            ["EMPLOYEE ID", String(applicationInfo.employee_id || "N/A").toUpperCase(), "INSUFF CLEARED", formatDate(applicationInfo.first_insuff_reopened_date) || "N/A"],
            ["VERIFICATION INITIATED", formatDate(applicationInfo.initiation_date).toUpperCase() || "N/A", "FINAL REPORT DATE", formatDate(applicationInfo.report_date) || "N/A"],
            ["VERIFICATION PURPOSE", (applicationInfo.verification_purpose || "EMPLOYMENT").toUpperCase(), "VERIFICATION STATUS", (applicationInfo.final_verification_status || "N/A").toUpperCase()],
            ["REPORT TYPE", (applicationInfo.report_type || "EMPLOYMENT").replace(/_/g, " ").toUpperCase(), "REPORT STATUS", (applicationInfo.report_status || "N/A").toUpperCase()]
        ];



        doc.autoTable({
            body: headerTableData,
            startY: 70,
            styles: {
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0],
                lineWidth: 0.3,  // Set the width of the border
                lineColor: [62, 118, 165],  // Set the color of the border (black in this case)
            },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 50 },
                2: { fontStyle: "bold", cellWidth: 50 },
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




        const SummaryTitle = "SUMMARY OF THE VERIFICATION CONDUCTED";
        const backgroundColor = '#f5f5f5';
        const borderColor = '#3d75a6';
        const xsPosition = 10;
        const ysPosition = 120;
        const fullWidth = pageWidth - 20;
        const rectHeight = 8;

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



        const marginTop = 6;
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
                            whiteSpace: 'nowrap',
                            cellWidth: 'auto'
                        }
                    },
                    {
                        content: 'INFORMATION VERIFIED BY',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap',
                            cellWidth: 'auto'
                        }
                    },
                    {
                        content: 'VERIFIED DATE',
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap',
                            cellWidth: 'auto'
                        }
                    },
                    {
                        content: 'VERIFICATION STATUS'.toUpperCase(),
                        styles: {
                            halign: 'center',
                            valign: 'middle',
                            fontStyle: 'bold',
                            whiteSpace: 'nowrap',
                            cellWidth: 'auto'
                        }
                    },
                ]
            ],
            body: servicesData
                .filter(service => service?.annexureData?.status) // Filter out rows with no status value
                .slice(0, 10) // Limit to the first 10 services
                .map(service => {
                    const colorMapping = {
                        Yellow: 'yellow',
                        Red: 'red',
                        Blue: 'blue',
                        Green: 'green',
                        Orange: 'orange',
                        Pink: 'pink',
                    };
                    const notstatusContent = service?.annexureData?.status || "Not Verified";
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
                            content: service?.reportFormJson?.json
                                ? JSON.parse(service.reportFormJson.json)?.heading
                                : null,
                            styles: {
                                fontStyle: 'normal',
                                halign: 'left',
                                fontStyle: 'bold',


                            },
                        },
                        {
                            content:
                                service?.annexureData &&
                                    Object.keys(service.annexureData).find(
                                        key =>
                                            key.endsWith('info_source') ||
                                            key.endsWith('information_source') ||
                                            key.startsWith('info_source') ||
                                            key.startsWith('information_source')
                                    )
                                    ? service.annexureData[
                                    Object.keys(service.annexureData).find(
                                        key =>
                                            key.endsWith('info_source') ||
                                            key.endsWith('information_source') ||
                                            key.startsWith('info_source') ||
                                            key.startsWith('information_source')
                                    )
                                    ]
                                    : null,
                            styles: {
                                fontStyle: 'normal',
                                halign: 'left',
                                fontStyle: 'bold',
                            },
                        },
                        {
                            content: service?.annexureData?.created_at
                                ? new Date(service.annexureData.created_at)
                                    .toLocaleDateString('en-GB')
                                    .replace(/\//g, '-')
                                : 'N/A',

                            styles: {
                                fontStyle: 'normal',
                                fontStyle: 'bold',
                            },
                        },
                        {
                            content: formatStatus(statusContent).toUpperCase(),
                            styles: {
                                fontStyle: 'bold',
                                textColor: textColorr, // Apply the color based on the status
                            },
                        },
                    ];
                }),

            startY: nextContentYPosition - 2,
            styles: {
                fontSize: 9,
                cellPadding: 2,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.3,
                lineColor: [62, 118, 165],
                textColor: [0, 0, 0],
            },
            theme: 'grid',
            headStyles: {
                fillColor: backgroundColor,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
            },
            tableLineColor: [62, 118, 165],
            tableLineWidth: 0.3,
            textColor: [0, 0, 0],
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'center' },
                1: { cellWidth: 'auto', halign: 'center' },
                2: { cellWidth: 'auto', halign: 'center' },
                3: { cellWidth: 'auto', halign: 'center' },
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
            startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : 10,
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
                console.log(data);

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

        const remainingServices = servicesData
            .filter(service => service?.annexureData?.status) // Filter out rows with no status value
            .slice(10); // Get the remaining services (from 11 onwards)

        if (remainingServices.length > 0) {
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
                                whiteSpace: 'nowrap',
                                cellWidth: 'auto'
                            }
                        },
                        {
                            content: 'INFORMATION VERIFIED BY',
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fontStyle: 'bold',
                                whiteSpace: 'nowrap',
                                cellWidth: 'auto'
                            }
                        },
                        {
                            content: 'VERIFIED DATE',
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fontStyle: 'bold',
                                whiteSpace: 'nowrap',
                                cellWidth: 'auto'
                            }
                        },
                        {
                            content: 'VERIFICATION STATUS'.toUpperCase(),
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fontStyle: 'bold',
                                whiteSpace: 'nowrap',
                                cellWidth: 'auto'
                            }
                        },
                    ]
                ],
                body: remainingServices.map(service => {
                    const colorMapping = {
                        Yellow: 'yellow',
                        Red: 'red',
                        Blue: 'blue',
                        Green: 'green',
                        Orange: 'orange',
                        Pink: 'pink',
                    };
                    const notstatusContent = service?.annexureData?.status || "Not Verified";
                    const statusContent = notstatusContent
                        .replace(/_/g, ' ') // Replaces underscores with spaces
                        .replace(/[^a-zA-Z0-9 ]/g, '') // Removes special characters
                        .toUpperCase();

                    let textColorr = 'black';
                    for (let color in colorMapping) {
                        if (statusContent.includes(color)) {
                            textColorr = colorMapping[color];
                        }
                    }

                    return [
                        {
                            content: service?.reportFormJson?.json
                                ? JSON.parse(service.reportFormJson.json)?.heading
                                : null,
                            styles: { fontStyle: 'normal' },
                        },
                        {
                            content:
                                service?.annexureData &&
                                    Object.keys(service.annexureData).find(
                                        key =>
                                            key.endsWith('info_source') ||
                                            key.endsWith('information_source') ||
                                            key.startsWith('info_source') ||
                                            key.startsWith('information_source')
                                    )
                                    ? service.annexureData[
                                    Object.keys(service.annexureData).find(
                                        key =>
                                            key.endsWith('info_source') ||
                                            key.endsWith('information_source') ||
                                            key.startsWith('info_source') ||
                                            key.startsWith('information_source')
                                    )
                                    ]
                                    : null,
                            styles: { fontStyle: 'normal' },
                        },
                        {
                            content: service?.annexureData?.created_at
                                ? new Date(service.annexureData.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })
                                : 'N/A',
                            styles: { fontStyle: 'normal' },
                        },
                        {
                            content: formatStatus(statusContent),
                            styles: {
                                fontStyle: 'normal',
                                textColor: textColorr,
                            },
                        },
                    ];
                }),

                startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 20 : 20,
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    halign: 'center',
                    valign: 'middle',
                    lineWidth: 0.3,
                    lineColor: [62, 118, 165],
                    textColor: [0, 0, 0],
                },
                theme: 'grid',
                headStyles: {
                    fillColor: backgroundColor,
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                },
                tableLineColor: [62, 118, 165],
                tableLineWidth: 0.3,
                textColor: [0, 0, 0],
                margin: { left: 10, right: 10 },
                tableWidth: 'auto',
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'center' },
                    1: { cellWidth: 'auto', halign: 'center' },
                    2: { cellWidth: 'auto', halign: 'center' },
                    3: { cellWidth: 'auto', halign: 'center' },
                },
            });

            addFooter(doc);
        }


        yPosition = 10;
        let annexureIndex = 1;

        for (const service of servicesData) {
            let yPosition = 10; // Reset yPosition to the top margin

            const reportFormJson = service?.reportFormJson?.json
                ? JSON.parse(service.reportFormJson.json)
                : null;
            const headingText = reportFormJson?.heading.toUpperCase() || null;
            const rows = reportFormJson?.rows || [];
            const serviceData = [];

            if (headingText) {
                doc.addPage();
                addFooter(doc);

                rows.forEach((row) => {
                    const inputLabel = row.label || "";
                    const valuesObj = {};

                    row.inputs.forEach((input) => {
                        const inputName = input.name;
                        let verifiedInputName = `verified_${inputName}`;

                        verifiedInputName = verifiedInputName.replace("verified_verified_", "verified_");

                        const value = service?.annexureData?.[inputName] || "";
                        const verifiedValue = service?.annexureData?.[verifiedInputName] || "";

                        valuesObj[inputName] = value;
                        valuesObj["isVerifiedExist"] = !!verifiedValue;
                        if (verifiedValue) valuesObj[verifiedInputName] = verifiedValue;

                        valuesObj["name"] = inputName.replace("verified_", "");
                    });

                    serviceData.push({
                        label: inputLabel,
                        values: valuesObj,
                    });
                });

                const tableData = serviceData
                    .map((data) => {
                        if (!data || !data.values) return null;

                        const name = data.values.name;
                        if (!name || name.startsWith("annexure")) return null;

                        const isVerifiedExist = data.values.isVerifiedExist;
                        const value = data.values[name];
                        const verified = data.values[`verified_${name}`];

                        if (value === undefined) return null;

                        return verified ? [data.label, value, verified] : [data.label, value];
                    })
                    .filter((item) => item !== null);

                if (tableData.length > 0) {
                    const pageWidth = doc.internal.pageSize.width;
                    const backgroundColor = "#f5f5f5";
                    const borderColor = "#3d75a6";
                    const xsPosition = 10;
                    const rectHeight = 8;

                    doc.setFillColor(backgroundColor);
                    doc.setDrawColor(borderColor);
                    doc.rect(xsPosition, yPosition, pageWidth - 20, rectHeight, "FD");

                    doc.setFontSize(10);
                    // doc.setFont('TimesNewRoman');
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);

                    const textHeight = doc.getTextDimensions(headingText).h + 1;
                    const verticalCenter = yPosition + rectHeight / 2 + textHeight / 4;

                    doc.text(headingText, pageWidth / 2, verticalCenter, { align: "center" });

                    yPosition += rectHeight;

                    doc.autoTable({
                        head: [[
                            { content: "PARTICULARS", styles: { halign: "left" } },
                            "APPLICANT DETAILS",
                            "VERIFIED DETAILS"
                        ]],
                        body: tableData.map((row) => row.length === 2
                            ? [{ content: row[0], styles: { halign: "left" } },
                            { content: row[1], colSpan: 2, styles: { halign: "left" } }]
                            : [{ content: row[0], styles: { halign: "left" } },
                            { content: row[1], styles: { halign: "left" } },
                            { content: row[2], styles: { halign: "left" } }]
                        ),
                        startY: yPosition,
                        styles: { fontSize: 10, cellPadding: 2, lineWidth: 0.3, lineColor: [62, 118, 165] },
                        columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: "auto" }, 2: { cellWidth: "auto" } },
                        theme: "grid",
                        headStyles: {
                            fillColor: backgroundColor, // Apply background color to the entire header
                            textColor: [0, 0, 0],
                            fontSize: 10,
                            halign: "left"
                        },
                        bodyStyles: { textColor: [0, 0, 0] },
                        margin: { horizontal: 10 },
                    });


                    yPosition = doc.lastAutoTable.finalY + 10;

                    const remarksData = serviceData.find((data) => data.label === "Remarks");
                    if (remarksData) {
                        const remarks = remarksData.values.name || "No remarks available.";
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Remarks: ${remarks}`, 10, yPosition);
                        yPosition += 5;
                    }

                    const annexureImagesKey = Object.keys(service?.annexureData || {}).find(
                        key => key.toLowerCase().startsWith('annexure') && !key.includes('[') && !key.includes(']')
                    );
                    const checkboxKey = Object.keys(service?.annexureData || {}).find(
                        key => key.toLowerCase().startsWith('checkbox_annexure') && !key.includes('[') && !key.includes(']')
                    );
                    const value = service?.annexureData[checkboxKey]; // Define 'value' before using it

                    if (checkboxKey) {
                        const value = service?.annexureData[checkboxKey]; // Get the value of the checkbox key
                        if (value === true || value === 'true' || value === 1 || value === '1') {
                            console.log("This is true or 1");

                            // When checkbox is true or 1, adjust image handling logic
                            if (annexureImagesKey) {
                                const annexureImagesStr = service?.annexureData[annexureImagesKey];
                                const annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(',') : [];

                                if (annexureImagesSplitArr.length === 0) {
                                    doc.setFont("helvetica", "italic");
                                    doc.setFontSize(10);
                                    doc.setTextColor(150, 150, 150);
                                    doc.text("No annexure images available.", 10, yPosition);
                                    yPosition += 10;
                                } else {
                                    const imageBases = await fetchImageToBase(annexureImagesStr.trim());
                                    if (imageBases) {
                                        for (const [index, image] of imageBases.entries()) {
                                            if (!image.base64 || !image.base64.startsWith('data:image/')) {
                                                console.error(`Invalid base64 data for image ${index + 1}`);
                                                continue;
                                            }

                                            try {
                                                // Full width logic for the image
                                                const maxBoxWidth = doc.internal.pageSize.width - 20;
                                                const maxBoxHeight = doc.internal.pageSize.height - 50; // Adjust height to full page

                                                // If a new page is required, add it
                                                if (yPosition + maxBoxHeight > doc.internal.pageSize.height - 15) {
                                                    doc.addPage();
                                                    yPosition = 10;
                                                }

                                                // doc.setFont('TimesNewRoman');
                                                doc.setFont('helvetica', 'bold');
                                                doc.setFontSize(8);
                                                doc.text(`Annexure ${index + 1}`, 10, yPosition);
                                                yPosition += 5;

                                                // Draw image box (full width)
                                                const padding = 5;
                                                doc.setDrawColor(61, 117, 166);
                                                doc.setLineWidth(0.3);
                                                doc.rect(10, yPosition, maxBoxWidth, maxBoxHeight);

                                                // Center the image
                                                const width = maxBoxWidth - 2 * padding;
                                                const height = (width * image.height) / image.width; // Maintain aspect ratio

                                                const centerXImage = 10 + padding;
                                                const centerYImage = yPosition + padding + (maxBoxHeight - height - 2 * padding) / 2;

                                                doc.addImage(image.base64, image.type, centerXImage, centerYImage, width, height);

                                                yPosition += maxBoxHeight + 10; // Move down for the next image or content
                                            } catch (error) {
                                                console.error(`Error adding image ${index + 1}:`, error);
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            console.log("Checkbox is not true or 1, no changes to layout");
                        }
                    } else {
                        console.log("No checkbox key found");
                    }

                    if (!checkboxKey || !value || (value !== true && value !== 'true' && value !== 1 && value !== '1')) {
                        // Default handling when no checkbox is true (same as original logic for images)
                        if (annexureImagesKey) {
                            const annexureImagesStr = service?.annexureData[annexureImagesKey];
                            const annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(',') : [];

                            const maxBoxWidth = doc.internal.pageSize.width - 20;
                            const maxBoxHeight = 120;
                            const padding = 5;

                            if (annexureImagesSplitArr.length === 0) {
                                doc.setFont("helvetica", "italic");
                                doc.setFontSize(10);
                                doc.setTextColor(150, 150, 150);
                                doc.text("No annexure images available.", 10, yPosition);
                                yPosition += 10;
                            } else {
                                const imageBases = await fetchImageToBase(annexureImagesStr.trim());
                                if (imageBases) {
                                    for (const [index, image] of imageBases.entries()) {
                                        if (!image.base64 || !image.base64.startsWith('data:image/')) {
                                            console.error(`Invalid base64 data for image ${index + 1}`);
                                            continue;
                                        }

                                        try {
                                            const width = maxBoxWidth - 2 * padding;
                                            const height = maxBoxHeight - 2 * padding;

                                            if (yPosition + maxBoxHeight > doc.internal.pageSize.height - 15) {
                                                doc.addPage();
                                                yPosition = 10;
                                            }

                                            // doc.setFont('TimesNewRoman');
                                            doc.setFont('helvetica', 'bold');
                                            doc.setFontSize(10);
                                            doc.text(`Annexure ${index + 1}`, 10, yPosition);
                                            yPosition += 5;

                                            doc.setDrawColor(61, 117, 166);
                                            doc.setLineWidth(0.3);
                                            doc.rect(10, yPosition, maxBoxWidth, maxBoxHeight);

                                            const centerXImage = 10 + padding + (maxBoxWidth - width - 2 * padding) / 2;
                                            const centerYImage = yPosition + padding + (maxBoxHeight - height - 2 * padding) / 2;

                                            console.log('checkboxKey', checkboxKey)
                                            doc.addImage(image.base64, image.type, centerXImage, centerYImage, width, height);

                                            yPosition += maxBoxHeight + 10;
                                        } catch (error) {
                                            console.error(`Error adding image ${index + 1}:`, error);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    function scaleImageForPDF(imageWidth, imageHeight, maxWidth, maxHeight) {
                        let width = imageWidth;
                        let height = imageHeight;

                        // Scale the width if it exceeds maxWidth
                        if (imageWidth > maxWidth) {
                            width = maxWidth;
                            height = (imageHeight * maxWidth) / imageWidth;
                        }

                        // Scale the height if it exceeds maxHeight
                        if (height > maxHeight) {
                            height = maxHeight;
                            width = (imageWidth * maxHeight) / imageHeight;
                        }

                        return { width, height };
                    }

                    addFooter(doc);
                }
            }
        }

        doc.addPage();
        yPosition = 20;
        // addFooter(doc);

        const disclaimerButtonHeight = 8; // Button height (without padding)
        const disclaimerButtonWidth = doc.internal.pageSize.width - 20; // Full width minus margins

        // Constants for additional spacing
        const buttonBottomPadding = 5; // Padding below the button
        const disclaimerTextTopMargin = 5; // Margin from top of the disclaimer text

        // Adjusted Disclaimer Button Height (includes padding)
        const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;

        // Define Disclaimer Text
        const disclaimerTextPart1 = `This report is confidential and is meant for the exclusive use of the Client. This report has been prepared solely for the
purpose set out pursuant to our letter of engagement (LoE)/Agreement signed with you and is not to be used for any other
purpose.The Client recognizes that we are not the source of the data gathered and our reports are based on the
information provided. The Client is responsible for employment decisions based on the information provided in this
report.For any clarifications you can mail us at`;


        const anchorText = " compliance@screeningstar.com";

        // doc.setFont("TimesNewRoman",);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Black text

        // Splitting text for proper wrapping
        const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);


        const lineHeight = 7;
        const disclaimerTextHeight =
            disclaimerLinesPart1.length * lineHeight +
            lineHeight; // Extra space for anchor

        const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;
        const availableSpace = doc.internal.pageSize.height - 40; // Ensuring margin
        let disclaimerY = 20; // Starting position

        if (disclaimerY < 20) {
            doc.addPage();
            addFooter(doc);
            disclaimerY = 20;
        }

        // Draw Disclaimer Button (Centered)
        const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2;
        doc.setDrawColor(62, 118, 165); // Border color
        doc.setFillColor(backgroundColor); // Fill color
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F'); // Fill
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D'); // Border
        doc.setTextColor(0, 0, 0); // Black text
        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');

        // Center the 'DISCLAIMER' text
        const disclaimerButtonTextWidth = doc.getTextWidth('DISCLAIMER');
        const buttonTextHeight = doc.getFontSize();
        const disclaimerTextXPosition = disclaimerButtonXPosition + disclaimerButtonWidth / 2 - disclaimerButtonTextWidth / 2 - 1;
        const disclaimerTextYPosition = disclaimerY + disclaimerButtonHeight / 2 + buttonTextHeight / 4 - 1;
        doc.text('DISCLAIMER', disclaimerTextXPosition, disclaimerTextYPosition);

        // Draw Disclaimer Text
        let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        disclaimerLinesPart1.forEach((line) => {
            doc.text(line, 10, currentY);
            currentY += lineHeight;
        });

        // Add Email Anchor Text
        doc.setTextColor(0, 0, 255); // Blue color
        const part2X = 10 + doc.getTextWidth(disclaimerLinesPart1[disclaimerLinesPart1.length - 1]);
        doc.textWithLink(anchorText, part2X, currentY - lineHeight, { url: "mailto:compliance@screeningstar.com" });

        // Company Details Section
        let companyDetailsY = currentY + disclaimerTextTopMargin;

        // Company Name Section
        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12); // Reduced font size for the company name
        doc.setTextColor(62, 118, 165); // Soft blue color
        const companyText = "ScreeningStar Solutions Private Limited";
        const leftMargin = 10; // Left alignment margin
        doc.text(companyText, leftMargin, companyDetailsY - 2);

        // Address Section
        companyDetailsY -= 3; // Add spacing below the company name
        doc.setFontSize(10); // Reduced font size for the address section
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        let customAddress
        if (applicationInfo.custom_template == "yes") {
            customAddress = formatAddress(applicationInfo.custom_address)
        }
        const addressLines = [
            "No - 19/4 & 27, IndiQube Alpha, 1st Floor, B4,",
            "Outer Ring Road Kadubeesanahalli,",
            "Marathahalli Panathur Junction, Bangalore,",
            "Karnataka, India, Pincode - 560103"
        ];

        companyDetailsY += 10;
        const addressToUse = customAddress && customAddress.length > 0 ? customAddress : addressLines;

        addressToUse.forEach((line) => {
            doc.text(line, leftMargin, companyDetailsY);
            companyDetailsY += 8; // Adjust spacing between lines
        });


        // Draw "END OF DETAIL REPORT" Button
        let endOfDetailY = companyDetailsY + 10;
        if (endOfDetailY + disclaimerButtonHeight > doc.internal.pageSize.height - 20) {
            doc.addPage();
            endOfDetailY = 20;
        }


        const endButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2; // Centering horizontally
        doc.setDrawColor(62, 118, 165);
        doc.setFillColor(backgroundColor);
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
        doc.setTextColor(0, 0, 0); // Set text color to black for the button text
        // doc.setFont('TimesNewRoman');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        // Center the 'END OF DETAIL REPORT' text inside the button both horizontally and vertically
        const endButtonTextWidth = doc.getTextWidth('END OF DETAIL REPORT'); // Width of the button text
        const endButtonTextHeight = doc.getFontSize(); // Height of the text (font size)

        const endButtonTextXPosition =
            endButtonXPosition + disclaimerButtonWidth / 2 - endButtonTextWidth / 2;
        // Vertical centering of text inside the button
        const endButtonTextYPosition = endOfDetailY + disclaimerButtonHeight / 2 + endButtonTextHeight / 4.8 - 1;

        // Add 'END OF DETAIL REPORT' text to the button, centered both horizontally and vertically
        doc.text('END OF DETAIL REPORT', endButtonTextXPosition, endButtonTextYPosition);

        // Ensure footer is added
        addFooter(doc);

        doc.save(
            applicationInfo.application_id + '-' +
            applicationInfo.name + '-' +
            applicationInfo.employee_id + '_Final_Report'
        );
        setApiLoading(false)

        setLoadingGenrate(null);
    }


    useEffect(() => {
        fetchData();
    }, [clientId, branchId]);



    // Refresh the table data by fetching from the generatereport API after generating a report
    const handleViewMore = async (index) => {
        console.log(`handleViewMore called with index: ${index}`);

        // Check if the clicked row is already expanded
        if (expandedRow && expandedRow.index === index) {
            console.log("Row is already expanded. Collapsing the row.");
            setExpandedRow(null);
            return;
        }
        setApiLoading(true)

        setLoadingIndex(index); // Set the loading index when the button is clicked

        const applicationInfo = data[index];
        console.log("Fetched applicationInfo:", applicationInfo);

        // Assuming fetchServicesData is an async function that returns services data
        const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services);
        console.log("Fetched servicesData:", servicesData);

        // Initialize an empty array to store headings and statuses
        const headingsAndStatuses = [];

        // Loop through servicesData and extract the heading and status
        servicesData.forEach((service, idx) => {
            console.log(`Processing service at index ${idx}:`, service);
            const parsedJson = JSON.parse(service?.reportFormJson?.json || 'null');
            const heading = parsedJson?.heading || "null";
            console.log("Parsed heading:", heading);

            if (heading) {
                let status = 'INITIATED';

                if (service.annexureData) {
                    status = service.annexureData.status;
                }

                console.log("Initial status:", status);

                // If status is null or an empty string, set it to 'N/A'
                if (!status) {
                    status = 'INITIATED';
                }
                // If the length of the status is less than 4
                else if (status.length < 4) {
                    status = status.replace(/[^a-zA-Z0-9\s]/g, " ").toUpperCase() || 'N/A'; // Remove special chars and make uppercase
                }
                // If the length of the status is 4 or more but less than 6
                else {
                    status = status.replace(/[^a-zA-Z0-9\s]/g, " ") // Remove special chars
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'N/A'; // Capitalize first letter of each word
                }

                console.log(`Formatted status for heading "${heading}":`, status);

                // Push the heading and formatted status into the array
                headingsAndStatuses.push({ heading, status });
            }
        });

        console.log("Final headingsAndStatuses array:", headingsAndStatuses);

        // Set the expanded row with new data
        setExpandedRow({
            index: index,
            headingsAndStatuses: headingsAndStatuses,
        });

        console.log(`Expanded row set for index ${index}:`, {
            index,
            headingsAndStatuses,
        });

        // Clear the loading index after data is fetched
        setApiLoading(false)
        setLoadingIndex(null);
    };



    const handleUpload = (applicationId, branchid) => {
        navigate(`/admin-generate-report?applicationId=${applicationId}&branchid=${branchid}&clientId=${clientId}`);
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
    if (!date) return "NOT APPLICABLE"; // Check for null, undefined, or empty
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Nill"; // Check for invalid date
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
};




    const handleExportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, "report_data.xlsx");
    };
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredData = paginatedData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.client_spoc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.status.toLowerCase().includes(searchTerm.toLowerCase())

    );
    const statusList = Object.keys(filterData).map(key => ({
        status: key.replace(/([A-Z])/g, ' $1').toLowerCase(),  // Formatting the status name
        count: filterData[key]
    }));

    // Filtered data based on the search query
    const filteredDropdownData = statusList.filter((item) =>
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const handleHighlightClick = (id, highlightId) => {
        setIsHighlightLoading(true); // Start loading
        setActiveId(id);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');
        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        const url = `https://api.screeningstar.co.in/client-master-tracker/application-highlight?application_id=${id}&admin_id=${adminId}&_token=${token}&highlight=${highlightId}`;

        fetch(url, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((result) => {
                console.log("Highlight success:", result);
                if (result.status) {
                    Swal.fire('Success', result.message, 'success');
                    fetchData(); // Refresh the data after success
                } else {
                    Swal.fire('Error', result.message, 'error');
                }
            })
            .catch((error) => {
                console.error("Error highlighting application:", error);

                // Extract or set dynamic error message based on the error
                const errorMessage = error.message.includes('HTTP error')
                    ? `Failed to highlight application. Server returned status ${error.message.split(': ')[1]}`
                    : 'Failed to highlight application. Please try again.';

                Swal.fire('Error', errorMessage, 'error');
            })
            .finally(() => {
                setIsHighlightLoading(false);
                setActiveId(null);// Stop loading in all cases
            });
    };

    const handleApplicationDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this application? This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel!",
        }).then((result) => {
            if (result.isConfirmed) {
                // If user clicks "Yes"
                setDeleteLoading(id);
                setActiveId(id);
                const formdata = new FormData();

                const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
                const token = localStorage.getItem('_token');
                const requestOptions = {
                    method: "DELETE",
                    body: formdata,
                    redirect: "follow"
                };
                const url = `https://api.screeningstar.co.in/client-master-tracker/application-delete?application_id=${id}&admin_id=${adminId}&_token=${token}`;
                fetch(url, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((result) => {
                        console.log("Delete success:", result);
                        if (result.status) {
                            Swal.fire('Deleted!', result.message, 'success');
                            fetchData(); // Refresh the data after success
                        } else {
                            Swal.fire('Error', result.message, 'error');
                        }
                    })
                    .catch((error) => {
                        console.error("Error Deleting application:", error);

                        // Extract or set dynamic error message based on the error
                        const errorMessage = error.message.includes('HTTP error')
                            ? `Failed to Delete application. Server returned status ${error.message.split(': ')[1]}`
                            : 'Failed to Delete application. Please try again.';

                        Swal.fire('Error', errorMessage, 'error');
                    })
                    .finally(() => {
                        setDeleteLoading(null);
                        setActiveId(null);
                    });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // If user clicks "No"
                Swal.fire('Cancelled', 'The application was not deleted.', 'info');
            }
        });
    };

    const handleGoBack = () => {
        navigate('/admin-admin-manager');  // Navigate to the /adminjkd path
    };


    const statusCount = filteredData.reduce((acc, item) => {
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
        const status = item.status;
        if (acc[status]) {
            acc[status] += 1;  // Increment count if status already exists
        } else {
            acc[status] = 1;  // Initialize count if status is new
        }
        return acc;
    }, {});
    const formatedJson = (delayReason) => {
        if (!delayReason) return ""; // Handle empty, null, or undefined inputs
        return delayReason
            // Remove backslashes
            .replace(/\\+/g, "")
            // Remove double quotes
            .replace(/"+/g, "")
            // Replace underscores with spaces
            .replace(/_+/g, " ")
            // Remove any special characters except letters, digits, spaces, and commas
            .replace(/[^a-zA-Z0-9 ,]/g, "")
            // Trim leading and trailing whitespace
            .trim();
    };

    const handleDownload = async (index) => {
        setDownloadingIndex(index); // Show loader
        try {
            await generatePDF(index); // Simulating the download function\
            
        } catch (error) {
            console.error("Download failed", error);
        } finally {
            setDownloadingIndex(null); // Hide loader after completion
        }
    };
    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="md:text-2xl text-xl font-bold py-3 text-left text-[#4d606b] px-3 border">ADMIN CHECKIN - {
                branchName === companyName ? branchName : `${branchName} (${companyName})`}</h2>

            <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">

                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>


                <div className='md:flex justify-between items-baseline mb-6 '>
                    <div className=" text-left">
                        <div>   <button
                            className="bg-green-500 hover:scale-105 mb-2 hover:bg-green-600 text-white px-6 py-2 rounded"
                            onClick={handleExportToExcel}
                        >
                            Export to Excel
                        </button> </div>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className=" md:w-1/2 text-right">
                        <div className="text-left flex md:justify-end">
                            <div className="relative w-1/2 mb-2">
                                {/* Dropdown button */}
                                <div
                                    className="w-full rounded-md p-2.5 border border-gray-300 bg-white cursor-pointer uppercase"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    {selectedValue ? (
                                        <>
                                            {selectedValue.replace(/count/gi, '').charAt(0).toUpperCase() + selectedValue.replace(/count/gi, '').slice(1)}
                                        </>
                                    ) : (
                                        "Select Status"
                                    )}
                                </div>

                                {/* Dropdown options */}
                                {showDropdown && (
                                    <div className="absolute w-full bg-white border uppercase border-gray-300 rounded-md max-h-60 overflow-y-auto z-10">
                                        {filteredDropdownData.length > 0 ? (
                                            <>
                                                {/* Clear Selection Option */}
                                                <div
                                                    className={`p-2 hover:bg-red-100 cursor-pointer font-semibold ${selectedValue === null ? "bg-red-200" : ""
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedValue(null); // Reset selection
                                                        fetchData(null); // Fetch data without filter
                                                        setShowDropdown(false); // Close dropdown
                                                    }}
                                                >
                                                    Clear Selection
                                                </div>

                                                {/* Dropdown Options */}
                                                {filteredDropdownData.map((item) => (
                                                    <div
                                                        key={item.status}
                                                        className={`p-2 hover:bg-gray-100 cursor-pointer ${selectedValue === item.status ? "bg-gray-200" : ""
                                                            }`}
                                                        onClick={() => {
                                                            setSelectedValue(item.status);
                                                            fetchData(item.status); // Fetch data with selected filter
                                                            setShowDropdown(false); // Close dropdown
                                                        }}
                                                    >
                                                        {`${item.status.replace(/\bcount\b/gi, '').trim().charAt(0).toUpperCase() + item.status.replace(/\bcount\b/gi, '').trim().slice(1)} (${item.count})`}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-2 text-gray-500">No results found</div>
                                        )}

                                    </div>
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Employee ID, Sub Client, Reference ID, Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />

                    </div>
                </div>

                <div className="rounded-lg overflow-scroll">
                    <table className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
                        <thead className='rounded-lg'>
                            <tr className="bg-[#c1dff2] text-[#4d606b]">
                                <th className="uppercase border border-black px-4 py-2">SL NO</th>
                                <th className="uppercase border border-black px-4 py-2">TAT Days</th>
                                <th className="uppercase border border-black px-4 py-2">Location</th>
                                <th className="uppercase border border-black px-4 py-2">Name Of Organisation</th>
                                <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                                <th className="uppercase border border-black px-4 py-2">Photo</th>
                                <th className="uppercase border border-black px-4 py-2">Applicant Employe Id</th>
                                <th className="uppercase border border-black px-4 py-2">Initiation Date</th>
                                <th className="uppercase border border-black px-4 py-2">Deadline Date</th>
                                <th className="uppercase border border-black px-4 py-2">Report Data</th>
                                <th className="uppercase border border-black px-4 py-2">Download Status</th>
                                <th className="uppercase border border-black px-4 py-2">View More</th>
                                <th className="uppercase border border-black px-4 py-2">Overall Status</th>
                                <th className="uppercase border border-black px-4 py-2">Report Type</th>
                                <th className="uppercase border border-black px-4 py-2">Report Date</th>
                                <th className="uppercase border border-black px-4 py-2">Report Generated By</th>
                                <th className="uppercase border border-black px-4 py-2">QC Done By</th>
                                <th className="uppercase border border-black px-4 py-2 " colSpan={1}>Action</th>
                                <th className="uppercase border border-black px-4 py-2 ">HIGHLIGHT</th>


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
                                            <tr
                                                className={`text-center ${data.is_highlight === 1 ? 'highlight' : ''}`}
                                                style={{
                                                    borderColor: data.is_highlight === 1 ? 'yellow' : 'transparent',
                                                }}
                                            >
                                                <td className="border border-black px-4 py-2">{index + 1}</td>
                                                <td className="border border-black px-4 py-2">{adminTAT || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">{data.location || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">
                                                    {companyName || branchName || 'NIL'}
                                                </td>

                                                <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">
                                                    <div className='flex justify-center items-center'>
                                                        <img src={data.photo ? data.photo : `${Default}`}
                                                            alt={data.name} className="w-10 h-10 rounded-full" />
                                                    </div>
                                                </td>
                                                <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                                <td className="border border-black px-4 py-2">
                                                    {data.created_at
                                                        ? new Date(data.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                        : 'NIL'}
                                                </td>
                                                <td className="border border-black px-4 py-2">
                                                    {data.updated_at
                                                        ? new Date(data.updated_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                        : 'NIL'}
                                                </td>
                                                <td className="border border-black px-4 py-2">
                                                    <button
                                                        className="  border border-[#073d88] text-[#073d88] px-4 py-2 rounded hover:bg-[#073d88] hover:text-white"
                                                        onClick={() => handleUpload(data.id, data.branch_id)}
                                                    >
                                                        Generate Report
                                                    </button>
                                                </td>

                                                <td className="border border-black px-4 py-2">
                                                    {(() => {
                                                        let buttonText = "";
                                                        let buttonDisabled = false;

                                                        if (data.overall_status === "completed") {
                                                            if (data.is_verify === "yes") {
                                                                buttonText = "DOWNLOAD";
                                                            } else {
                                                                buttonText = "NOT READY";
                                                                buttonDisabled = true;
                                                            }
                                                        } else {
                                                            buttonText = "NOT READY";
                                                            buttonDisabled = true;
                                                        }

                                                        return buttonDisabled ? (
                                                            <button
                                                                className="bg-gray-500 text-white px-4 py-2 rounded cursor-not-allowed"
                                                                disabled
                                                            >
                                                                {buttonText}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDownload(index)}
                                                                disabled={downloadingIndex}
                                                                className={`bg-green-500 hover:scale-105 uppercase border border-white hover:border-whit text-white px-4 py-2 rounded hover:bg-green-300  ${downloadingIndex === index ? "opacity-50 cursor-not-allowed " : ""
                                                                    }`}
                                                            >
                                                                {downloadingIndex === index ? (
                                                                    <span className="flex items-center gap-2">
                                                                        <svg
                                                                            className="animate-spin h-5 w-5 text-white hover:text-green-500"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                        >
                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"
                                                                            ></circle>
                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8v8H4z"
                                                                            ></path>
                                                                        </svg>
                                                                        Downloading...
                                                                    </span>
                                                                ) : (
                                                                    buttonText
                                                                )}
                                                            </button>
                                                        );
                                                    })()}
                                                </td>


                                                <td className="border border-black px-4  py-2" >
                                                    <button
                                                        className={`bg-orange-500 hover:scale-105 *:uppercase border border-white hover:border-orange-500 text-white px-4 py-2 
    ${loadingIndex === index ? 'opacity-50 cursor-not-allowed' : ''} rounded hover:bg-white hover:text-orange-500`}
                                                        onClick={() => handleViewMore(index)}
                                                        disabled={loadingIndex === index} // Disable the button only for the loading row
                                                    >
                                                        {expandedRow && expandedRow.index === index ? 'Less' : 'View'}
                                                    </button>

                                                </td>
                                                <td className="border border-black px-4 uppercase py-2">{(data.overall_status || 'WIP').replace(/_/g, ' ')}
                                                </td>
                                                <td className="border border-black px-4 uppercase py-2">{data.report_type?.replace(/_/g, " ") || 'N/A'}</td>
                                                <td className="border border-black px-4 py-2">

                                                    {data.report_date
                                                        ? new Date(data.report_date).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                        : 'NIL'}
                                                </td>

                                                <td className="border border-black px-4 py-2">{data.report_generated_by_name || 'N/A'}</td>
                                                <td className="border border-black px-4 py-2">{data.qc_done_by_name || 'N/A'}</td>
                                                <td className="border border-black px-4 py-2">
                                                    <button
                                                        className={`text-white rounded px-4 py-2 bg-red-500 hover:bg-red-600 ${deleteLoading === data.main_id ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                        onClick={() => handleApplicationDelete(data.main_id)}
                                                        disabled={deleteLoading === data.main_id}
                                                    >

                                                        {deleteLoading === data.main_id ? ' Deleting...' : ' Delete'}
                                                    </button>

                                                </td>
                                                <td className="border border-black text-center px-4 py-2">
                                                    <div className="flex items-center justify-center">
                                                        <FaFlag
                                                            style={{
                                                                color: data.is_highlight === 1 ? 'orange' : 'gray', // Change color based on highlight state
                                                                textAlign: 'center',
                                                                fontSize: '30px',
                                                                cursor: 'pointer',
                                                                boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.5)', // Shadow effect
                                                                padding: '4px', // Adds spacing inside the border
                                                                borderRadius: '4px', // Rounds the border corners
                                                                transition: 'transform 0.2s, color 0.2s', // Smooth animation
                                                            }}
                                                            onClick={() =>
                                                                !isHighlightLoading &&
                                                                handleHighlightClick(data.main_id, data.is_highlight === 1 ? 0 : 1)
                                                            }
                                                            onMouseEnter={(e) => {
                                                                e.target.style.color = 'gold'; // Highlight on hover
                                                                e.target.style.transform = 'scale(1.1)'; // Slightly enlarge on hover
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.color = data.is_highlight === 1 ? 'orange' : 'gray'; // Revert color
                                                                e.target.style.transform = 'scale(1)'; // Reset size
                                                            }}
                                                        />
                                                        {isHighlightLoading && data.main_id === activeId && (
                                                            <span className="ml-2 text-gray-500">Loading...</span> // Show loading indicator
                                                        )}
                                                    </div>
                                                </td>

                                            </tr>

                                            {expandedRow && expandedRow.index === index && (
                                                <>
                                                    <tr>
                                                        <td colSpan="100%" className="text-center p-4 w-1/4">
                                                            {/* Table structure to display headings in the first column and statuses in the second column */}
                                                            <table className="w-1/4">
                                                                <tbody>

                                                                    {expandedRow.headingsAndStatuses &&
                                                                        expandedRow.headingsAndStatuses.map((item, idx) => (
                                                                            <>
                                                                                <tr key={`row-${idx}`}>
                                                                                    <td
                                                                                        className="text-left p-2 border border-black capitalize bg-gray-200">
                                                                                        {sanitizeText(item.heading)}
                                                                                    </td>
                                                                                    <td className="text-left p-2 border font-bold border-black uppercase " style={getColorStyle(item.status)}>
                                                                                        {isValidDate(item.status) ? formatDate(item.status) : sanitizeText(item.status)}
                                                                                    </td>
                                                                                </tr>
                                                                            </>
                                                                        ))
                                                                    }
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200  ref={clientSubmitRef}" id="clientSubmit">First Level Insuff</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{formatedJson(data.first_insufficiency_marks) || ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">First Level Insuff Date</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{data.first_insuff_date ? (isValidDate(data.first_insuff_date) ? formatDate(data.first_insuff_date) : sanitizeText(data.first_insuff_date)) : ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">First Level Insuff Reopen Date</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{data.first_insuff_reopened_date ? (isValidDate(data.first_insuff_reopened_date) ? formatDate(data.first_insuff_reopened_date) : sanitizeText(data.first_insuff_reopened_date)) : ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Second Level Insuff</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{formatedJson(data.second_insufficiency_marks) || ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Second Level Insuff Date</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{data.second_insuff_date ? (isValidDate(data.second_insuff_date) ? formatDate(data.second_insuff_date) : sanitizeText(data.second_insuff_date)) : ""}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Third Level Insuff Marks</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{formatedJson(data.third_insufficiency_marks) || ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Third Level Insuff Date</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{data.third_insuff_date ? (isValidDate(data.third_insuff_date) ? formatDate(data.third_insuff_date) : sanitizeText(data.third_insuff_date)) : ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Third Level Insuff Reopen Date</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{data.third_insuff_reopened_date ? (isValidDate(data.third_insuff_reopened_date) ? formatDate(data.third_insuff_reopened_date) : sanitizeText(data.third_insuff_reopened_date)) : ""}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="text-left p-2 border border-black uppercase bg-gray-200">Reason For Delay</td>
                                                                        <td className="text-left p-2 border border-black capitalize font-bold">{formatedJson(data.delay_reason) || ''}</td>
                                                                    </tr>

                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
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
        </div>
    );

};

export default AdminChekin;
