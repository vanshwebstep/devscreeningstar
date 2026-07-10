import React, { useCallback, useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
// import "pdfjs-dist/build/pdf.worker.entry";
import Signature from "../../imgs/servicesSeal.jpg";
import signatureDemo from "../../imgs/signaturex-demo.png";
import JSZip from "jszip";

import {
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableCell,
    TableRow,
    AlignmentType,
    WidthType,
    Media,
    HeadingLevel,
    Document,
    ImageRun,
    BorderStyle
} from "docx";

import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Default from "../../imgs/default.png"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

const InactiveClients = () => {
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [responseError, setResponseError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isUnblockLoading, setIsUnblockLoading] = useState(false);
    const navigate = useNavigate();
    const [inactiveClients, setInactiveClients] = useState([]);
    const [data, setData] = useState([]);
    const [policeData, setPoliceData] = useState([]);
    const [courtData, setCourtData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [isFileValid, setIsFileValid] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const storedToken = localStorage.getItem('token');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [activeId, setActiveId] = useState(null);
    const formatDate = (date = new Date()) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
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


    const [selectedRows, setSelectedRows] = useState([]);

    // Toggle single row
    const handleCheckboxChange = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    // Toggle all rows
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = paginatedData.map((row) => row.id);
            setSelectedRows(allIds);
        } else {
            setSelectedRows([]);
        }
    };
    console.log('policeData', policeData);
    console.log('courtData', courtData);
    const openModal = (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString); // parse JSON safely
            setModalData(parsed);
        } catch (e) {
            setModalData({ error: "Invalid JSON", raw: jsonString });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalData(null);
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const totalPages = Math.ceil(data.length / entriesPerPage);

    const [selectedService, setSelectedService] = useState("");
    const defaultCourtRows = [
        { courtCheckType: "Civil", jurisdiction: "", location: "", verificationResult: "" },
        { courtCheckType: "Magistrate", jurisdiction: "", location: "", verificationResult: "" },
        { courtCheckType: "Sessions", jurisdiction: "", location: "", verificationResult: "" },
        { courtCheckType: "High Court", jurisdiction: "", location: "", verificationResult: "" },
    ];

    const [formData, setFormData] = useState({
        court: {
            courtTable: defaultCourtRows
        }
    });
    const [courtExtraRows, setCourtExtraRows] = useState([]);
    const formRef = useRef(null);

    function addJustifiedText(doc, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        words.forEach(word => {
            const testLine = line + word + ' ';
            const testWidth = doc.getTextWidth(testLine);
            if (testWidth > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = testLine;
            }
        });
        lines.push(line.trim());

        lines.forEach((line, i) => {
            const lineWords = line.split(' ');
            if (lineWords.length === 1 || i === lines.length - 1) {
                // Last line: left-align
                doc.text(line, x, y + i * lineHeight);
            } else {
                // Justify this line
                const lineText = lineWords.join(' ');
                const textWidth = doc.getTextWidth(lineText);
                const spaceCount = lineWords.length - 1;
                const extraSpace = (maxWidth - textWidth) / spaceCount;
                let offsetX = x;

                lineWords.forEach((word, index) => {
                    doc.text(word, offsetX, y + i * lineHeight);
                    if (index < lineWords.length - 1) {
                        offsetX += doc.getTextWidth(word + ' ') + extraSpace;
                    }
                });
            }
        });
    }
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1)
    };
    const filteredData = data.filter((item) => {
        const term = (searchTerm || "").toLowerCase();

        let name = "";
        try {
            name = item?.data ? JSON.parse(item.data)?.full_name || "" : "";
        } catch (e) {
            name = "";
        }

        const id = item?.id ? item.id.toString() : "";
        const type = typeof item?.type === "string" ? item.type.toLowerCase() : "";
        const format = typeof item?.export_format === "string" ? item.export_format.toLowerCase() : "";

        return (
            name.toLowerCase().includes(term) ||
            id.includes(term) ||
            type.includes(term) ||
            format.includes(term)
        );
    });


    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    function navbar(doc) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 5;

        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;

        const qrCodeBase64 = "/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateDetails = [
            "NAVA NAYANA LEGAL CHAMBERS",
            "MANJUNATHA H S (HSM), B.B.M., LL.B.",
            "ADVOCATE AND LEGAL CONSULTANT",
            "ENROLLMENT NUMBER: KAR/4765/2023",
            "MOBILE NUMBER : +91 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const advocateX = pageWidth - 20;
        let advocateY = blockY + 5; // Start below top edge of image

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 5, { align: 'right' });
            advocateY += lineHeight;
        });

        // Horizontal line under block
        const hrY = blockY + blockHeight + 5;
        doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);

        // Return updated Y for next content
        return hrY + 10;
    }

    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }

    const handleServiceChange = (e) => {
        const service = e.target.value;

        setSelectedService(e.target.value);
        setFileName('');

        setFormData({
            selectedService: service,
            [service]: service === "court"
                ? { courtTable: defaultCourtRows || [] }
                : {} // police has no table
        });
    };

    const formatKey = (key) => {
        // Convert to lowercase, remove special characters, replace spaces with underscores, and double underscores with a single one
        return key
            .toLowerCase()                    // Convert to lowercase
            .replace(/[^a-z0-9\s_]/g, '')      // Remove special characters
            .replace(/\s+/g, '_')              // Replace spaces with underscores
            .replace(/__+/g, '_');             // Replace double underscores with single
    };

    const toSnakeCase = (str) =>
        str
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_'); // Replace spaces with underscores

    /* -----------------------
       Utilities / CSV Parser
       ----------------------- */

    const normalizeKey = (str = '') =>
        str
            .trim()
            .toLowerCase()
            .replace(/^\uFEFF/, '')               // drop BOM if present
            .replace(/'/g, '')                    // remove apostrophes
            .replace(/[^a-z0-9]+/g, '_')         // non-alphanumeric -> underscore
            .replace(/^_+|_+$/g, '')             // trim leading/trailing underscores
            .replace(/_+/g, '_');                // collapse multiple underscores

    // Low-level CSV-to-rows parser: RFC-like handling for quotes, escaped quotes, commas and newlines.
    const parseCSVToRows = (text = '') => {
        if (typeof text !== 'string') return [];
        // Normalize line endings and strip BOM
        text = text.replace(/\uFEFF/g, '');
        const rows = [];
        let cur = '';
        let row = [];
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];

            if (ch === '"') {
                // Escaped quote -> add one quote and skip next char
                if (inQuotes && next === '"') {
                    cur += '"';
                    i++; // skip the escaped quote
                } else {
                    inQuotes = !inQuotes; // toggle quoting state
                }
                continue;
            }

            if (ch === ',' && !inQuotes) {
                row.push(cur);
                cur = '';
                continue;
            }

            // handle CR LF or lone CR or LF when not inside quotes
            if ((ch === '\n' || ch === '\r') && !inQuotes) {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = '';
                // skip LF after CR (CRLF)
                if (ch === '\r' && next === '\n') i++;
                continue;
            }

            // ordinary character
            cur += ch;
        }

        // push final token/row
        // if the source ended with a newline, last row will be [''] — we'll filter later
        row.push(cur);
        rows.push(row);

        // Remove rows that are completely empty (every cell empty / whitespace)
        return rows.filter(r => !(r.length === 1 && r[0].trim() === '')).map(r => r.map(c => c === undefined ? '' : String(c)));
    };

    // High-level CSV parser -> returns array of objects keyed by normalized headers
    const parseCSV = (text = '') => {
        const rows = parseCSVToRows(text);
        if (!rows || rows.length === 0) return [];

        // Header row (raw header strings trimmed)
        const rawHeaders = rows.shift().map(h => (h === undefined ? '' : String(h).trim().replace(/^"|"$/g, '')));
        const normalizedHeaders = rawHeaders.map(h => normalizeKey(h) || '__blank_column__');

        // Build objects, ensuring missing columns become ''
        const data = rows.map(row => {
            const obj = {};
            for (let i = 0; i < normalizedHeaders.length; i++) {
                const key = normalizedHeaders[i];
                const rawVal = row[i] !== undefined ? row[i] : '';
                // remove surrounding quotes (in case), then trim
                obj[key] = String(rawVal).replace(/^"|"$/g, '').trim();
            }
            return obj;
        });

        return data;
    };

    // Return the original headings (human readable)
    const csvHeadings = (text = '') => {
        const rows = parseCSVToRows(text);
        if (!rows || rows.length === 0) return [];
        return rows[0].map(h => (h === undefined ? '' : String(h).trim().replace(/^"|"$/g, '')));
    };

    /* -----------------------
       Field cleaning helper
       ----------------------- */

    const cleanFieldNames = (row = {}) => {
        const cleaned = {};
        Object.entries(row).forEach(([k, v]) => {
            let val = v == null ? '' : String(v).trim();
            // collapse multiple spaces
            val = val.replace(/\s+/g, ' ');
            // treat explicit "null"/"undefined" strings as empty
            if (/^(null|undefined)$/i.test(val)) val = '';
            cleaned[k] = val;
        });
        return cleaned;
    };

    /* -----------------------
       File Upload Handler
       ----------------------- */

    const isCSVFile = (file = {}) => {
        if (!file || !file.name) return false;
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        return (
            type === 'text/csv' ||
            type === 'application/vnd.ms-excel' || // some browsers/Excel
            type.includes('csv') ||
            name.endsWith('.csv')
        );
    };



    const handleChange = (e) => {
        const { name, type, files, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [selectedService]: {
                ...(prev[selectedService] || {}),
                [name]: type === "file" ? files[0] : value,
            },
        }));
    };



    const handleFileUpload = (e, type) => {
        const file = e?.target?.files?.[0];
        if (!file) return;

        if (!isCSVFile(file)) {
            console.log("Invalid file type selected:", file.type, file.name);
            setIsFileValid(false);
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please upload a valid CSV file.' });
            return;
        }

        console.log("File selected:", file.name);
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const fileContent = reader.result;
                if (typeof fileContent !== 'string') throw new Error('Unable to read file content as text.');

                setFileName(file.name);
                setIsFileValid(true);

                const parsedData = parseCSV(fileContent);
                const csvHeadersArr = csvHeadings(fileContent);
                console.log("Headers:", csvHeadersArr);
                console.log("parsedData (first few):", parsedData.slice(0, 5));

                if (parsedData.length === 0) {
                    Swal.fire({ icon: 'error', title: 'Empty CSV', text: 'CSV contains no data rows.' });
                    setIsFileValid(false);
                    return;
                }

                // Ensure at least the required header (reference_id) exists
                const normalizedHeaders = csvHeadersArr.map(h => normalizeKey(h));
                if (!normalizedHeaders.includes('reference_id')) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Missing Header',
                        text: 'CSV must include a "Reference ID" column (header).',
                    });
                    setIsFileValid(false);
                    return;
                }

                const newData = [];
                let hasError = false;

                parsedData.forEach((row, idx) => {
                    // idx = 0 -> first data row; CSV line number = idx + 2 (header is line 1)
                    const csvLineNumber = idx + 2;
                    const values = Object.values(row).map(v => (v == null ? '' : String(v).trim()));
                    const allEmpty = values.every(v => v === '');
                    if (allEmpty) {
                        console.log(`Skipping CSV line ${csvLineNumber}: empty row.`);
                        return; // skip entirely empty rows
                    }

                    if (!row.reference_id || String(row.reference_id).trim() === '') {
                        // invalid row
                        console.log('Invalid row (missing reference_id):', row);
                        setIsFileValid(false);
                        hasError = true;
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            // report the CSV line number for clarity
                            text: `CSV line ${csvLineNumber} is incomplete. "Reference ID" is required.`,
                        });
                        return;
                    }

                    // Clean keys/values
                    let cleaned = cleanFieldNames(row);

                    if (type === 'court') {
                        cleaned = {
                            courtTable: [
                                {
                                    courtCheckType: "Civil",
                                    jurisdiction: cleaned.civil_jurisdiction || "City Civil Court",
                                    location: cleaned.civil_location || '',
                                    verificationResult: cleaned.civil_verification_result || ''
                                },
                                {
                                    courtCheckType: "Magistrate",
                                    jurisdiction: cleaned.magistrate_jurisdiction || "Chief Judicial Magistrate",
                                    location: cleaned.magistrate_location || '',
                                    verificationResult: cleaned.magistrate_verification_result || ''
                                },
                                {
                                    courtCheckType: "Sessions",
                                    jurisdiction: cleaned.sessions_jurisdiction || "District & Session Court",
                                    location: cleaned.sessions_location || '',
                                    verificationResult: cleaned.sessions_verification_result || ''
                                },
                                {
                                    courtCheckType: "High Court",
                                    jurisdiction: cleaned.high_court_jurisdiction || "Karnataka High Court",
                                    location: cleaned.high_court_location || '',
                                    verificationResult: cleaned.high_court_verification_result || ''
                                }
                            ],
                            reference_id: cleaned.reference_id,
                            full_name: cleaned.full_name || '',
                            fathers_name: cleaned.fathers_name || '',
                            date_of_birth: cleaned.date_of_birth || '',
                            permanent_address: cleaned.permanent_address || '',
                            current_address: cleaned.current_address || '',
                            number_of_years_search: cleaned.number_of_years_search || '',
                            date_of_verification: cleaned.date_of_verification || '',
                            verification_status: cleaned.verification_status || ''
                        };
                    }

                    newData.push(cleaned);
                });

                if (hasError) {
                    console.log("Errors found. Not processing file further.");
                    return;
                }

                if (type === "court") {
                    setCourtData(newData);
                } else {
                    setPoliceData(newData);
                }

                console.log("Processed and set valid data:", newData);
            } catch (err) {
                console.error("Failed to read/parse CSV:", err);
                setIsFileValid(false);
                Swal.fire({ icon: 'error', title: 'Parsing Error', text: 'There was a problem parsing the CSV file. Please ensure it is well-formed.' });
            }
        };

        reader.onerror = (err) => {
            console.error('FileReader error:', err);
            setIsFileValid(false);
            Swal.fire({ icon: 'error', title: 'Read Error', text: 'Unable to read file. Try again.' });
        };

        reader.readAsText(file, 'UTF-8');
    };
    const downloadSampleFile = () => {
        const sampleFile = "/police-record.csv"; // make sure this file exists in public/

        const link = document.createElement("a");
        link.href = sampleFile;
        link.download = "police-record.csv"; // name of the downloaded file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const downloadSampleFileCourt = () => {
        const sampleFile = "/court-records.csv"; // make sure this file exists in public/

        const link = document.createElement("a");
        link.href = sampleFile;
        link.download = "court-records.csv"; // name of the downloaded file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleRowChange = (index, fieldKey, value) => {
        const updatedRows = [...(formData.court?.courtTable || [])];

        updatedRows[index] = {
            ...updatedRows[index],
            [fieldKey]: value
        };

        setFormData((prev) => ({
            ...prev,
            court: {
                ...prev.court,
                courtTable: updatedRows
            }
        }));
    };



    const addRow = () => {
        const updatedRows = [...(formData.court?.courtTable || [])];

        if (updatedRows.length >= 15) {
            return; // Do nothing if limit reached
        }

        updatedRows.push({
            courtCheckType: "",
            jurisdiction: "",
            location: "",
            verificationResult: "",
        });

        setFormData((prev) => ({
            ...prev,
            court: {
                ...prev.court,
                courtTable: updatedRows,
            },
        }));
    };

    const removeRow = (indexToRemove) => {
        setFormData((prev) => {
            const updatedRows = [...(prev.court?.courtTable || [])];
            updatedRows.splice(indexToRemove, 1); // remove that specific row
            return {
                ...prev,
                court: {
                    ...prev.court,
                    courtTable: updatedRows,
                },
            };
        });
    };


    const policeFields = [
        "Reference ID",
        "Full Name",
        "Father's Name",
        "Date of Birth",
        "Address",
        "Name of the Police Station",
        "Locality / Jurisdiction",
        "Name of the Station House Officer",
        "Designation of the officer / SHO",
        "Phone Number of Police Station",
        "Number of Years covered in the station",
        "Date of Verification at Station",
        "Verification Status from Station",
        "Overall Track Records Status",
    ];

    const courtFields = [
        "Reference ID",
        "Full Name",
        "Father's Name",
        "Date of Birth",
        "Permanent Address",
        "Current Address",
        "Number of Years Search",
        "Date of Verification",
        "Verification Status",
    ];



    const generatePolicePDF = async (policeData, shouldSave = true) => {
        const doc = new jsPDF({ compress: true });
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 5;
        const marginLeft = 20;
        const marginRight = 20;
        const maxWidth = pageWidth - marginLeft - marginRight;
        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;
        const fontSizeSmall = 8;
        const fontSizeHeading = 13;
        const fontSizeParagraph = 10;

        const qrCodeBase64 = "/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Draw vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight; // Enough for image + details

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateX = pageWidth - 20;
        let advocateY = blockY;

        // old is 10
        doc.setFontSize(9);
        const advocateDetails = [
            "NAVA NAYANA LEGAL CHAMBERS",
            "MANJUNATHA H S (HSM), B.B.M., LL.B.",
            "ADVOCATE AND LEGAL CONSULTANT",
            "ENROLLMENT NUMBER: KAR/4765/2023",
            "MOBILE NUMBER : +91 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 10, { align: 'right' });
            advocateY += lineHeight;
        });


        // Horizontal line below the block
        const hrY = blockY + blockHeight + 5;
        doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);


        let y = hrY + 4;

        // ---- TITLE ----
        doc.setFont('helvetica', 'bold'); // closest to semibold
        doc.setFontSize(fontSizeHeading);
        doc.text('POLICE RECORD REPORT [LAW FIRM]', pageWidth / 2, y, { align: 'center' });

        y += lineHeight * 3 - 3;

        // ---- INTRO ----
        // ---- TITLE ----
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSizeParagraph);
        const intro = `This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.`;
        const introLines = doc.splitTextToSize(intro, pageWidth - 35);
        doc.text(introLines, 20, y - 6, { align: 'left' });
        y += introLines.length * lineHeight;

        // ---- DATA TABLE ----
        doc.setFontSize(fontSizeParagraph);
        const colWidth = (pageWidth - 40) / 2;
        const rowHeight = lineHeight + 1;
        const tableX = 20;

        const entries = [
            ['Reference ID', policeData.reference_id || ''],
            ['Full Name', policeData.full_name || ''],
            ["Father's Name", policeData["fathers_name"] || ''],
            ['Date of Birth', policeData.date_of_birth || ''],
            ['Address', policeData.address || ''],
            ['Name of the Police Station', policeData.name_of_the_police_station || ''],
            ['Locality / Jurisdiction', policeData["locality_jurisdiction"] || ''],
            ['Name of the Station House Officer', policeData.name_of_the_station_house_officer || ''],
            ['Designation of the officer / SHO', policeData["designation_of_the_officer_sho"] || ''],
            ['Phone Number of Police Station', policeData.phone_number_of_police_station || ''],
            ['Number of Years covered in the station', policeData.number_of_years_covered_in_the_station || ''],
            ['Date of Verification at Station', policeData.date_of_verification_at_station || ''],
            ['Verification Status from Station', policeData.verification_status_from_station || ''],
            ['Overall Track Records Status', policeData.overall_track_records_status || ''],
        ];
        doc.setLineWidth(0.1);
        const mymaxwidth = colWidth - 4;
        entries.forEach(([label, value]) => {
            const wrappedLabel = doc.splitTextToSize(label, mymaxwidth);
            const wrappedValue = doc.splitTextToSize(String(value), mymaxwidth);

            const linesCount = Math.max(wrappedLabel.length, wrappedValue.length);
            const dynamicRowHeight = linesCount * 6; // 7 is approx line height

            // Borders
            doc.rect(tableX, y - 8, colWidth, dynamicRowHeight);
            doc.rect(tableX + colWidth, y - 8, colWidth, dynamicRowHeight);

            // Text
            wrappedLabel.forEach((line, idx) => {
                doc.text(line, tableX + 2, y - 4 + (idx * 5));
            });

            wrappedValue.forEach((line, idx) => {
                doc.text(line, tableX + colWidth + 2, y - 4 + (idx * 5));
            });

            y += dynamicRowHeight;

            // Page break logic
            if (y > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                y = 20;
            }
        });

        // ---- DISCLAIMER ----
        y -= 2;
        doc.setFontSize(fontSizeParagraph);
        const disclaimer = `The search results are based on the available registers maintained in respect of criminal case/s and suit registers in respect of civil case/s maintained in the above-mentioned Court / Police Station having jurisdiction over the address where the candidate was said to be residing. Due care has been taken in conducting the search. The records are public records and the search has been conducted on behalf of your good self and the undersigned is not responsible for any errors, inaccuracies, omissions or deletions if any in the said court or police records. The above report is based on the verbal confirmation of the concerned authority as on the date on which it is confirmed, hence this verification is subjective. Please do contact the Local Police for Candidate Police Clearance Certificate (PCC) / Police Verification Certificate.`;
        // adjust spacing after

        // 2. Main disclaimer paragraph
        doc.setFont('helvetica', 'normal');
        const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
        // doc.text(disclaimerLines, 20, y, { align: 'left' });
        addJustifiedText(doc, disclaimer, 20, y, 170, 5); // x, y, maxWidth, lineHeight

        y += disclaimerLines.length * 5 + 6; // adjust y for next block
        doc.setFontSize(fontSizeParagraph);
        doc.setFont('helvetica', 'bold');
        doc.text('DISCLAIMER', pageWidth / 2, y - 5, { align: 'center' });
        y += 1;
        // 3. 'Note:' block
        const noteLines = [
            [
                { text: 'Note:', bold: true },
                { text: ' This report is provided for informational purposes only and does not constitute an official police clearance or certificate.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: '“Nava Nayana Legal Chambers”', bold: true },
                { text: ' does not guarantee the completeness, accuracy, or finality of the information and shall not be held liable for any decisions or actions taken by third parties based on this report.', bold: false },
            ],
            [
                { text: 'This document is confidential and intended solely for the authorized recipient. Any unauthorized use, reproduction, or dissemination is strictly prohibited without prior written consent.', bold: false },
            ],
        ];

        doc.setFontSize(fontSizeParagraph);

        const wordSpacing = 1.5; // adjust as needed

        noteLines.forEach(lineArray => {
            // If blank line, add vertical space
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                y += lineHeight - 4;
                return;
            }

            // Merge all parts into a single line string for splitting
            let lineText = '';
            let styleMap = [];

            lineArray.forEach(part => {
                const words = part.text.split(' ');
                words.forEach(word => {
                    styleMap.push({ word, bold: part.bold });
                });
            });

            // Build lines within maxWidth
            let lines = [];
            let currentLine = [];
            let currentWidth = 0;

            styleMap.forEach(item => {
                doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                const wordWidth = doc.getTextWidth(item.word + ' ');

                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [item];
                    currentWidth = wordWidth;
                } else {
                    currentLine.push(item);
                    currentWidth += wordWidth;
                }
            });
            if (currentLine.length) lines.push(currentLine);

            // Render each line
            lines.forEach((lineWords, index) => {
                let totalWordsWidth = 0;
                lineWords.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    totalWordsWidth += doc.getTextWidth(item.word + ' ');
                });

                const gaps = lineWords.length - 1;
                let extraSpace = gaps > 0 ? (maxWidth - totalWordsWidth) / gaps : 0;

                // Don't justify last line
                if (index === lines.length - 1) extraSpace = 0;

                let x = marginLeft;

                lineWords.forEach((item, i) => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    doc.text(item.word, x, y);

                    let wordWidth = doc.getTextWidth(item.word + ' ');
                    x += wordWidth;

                    if (i < lineWords.length - 1) {
                        x += extraSpace;
                    }
                });

                y += lineHeight;
            });
        });

        const imgHeightt = 25;
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginBottom = 0; // Optional: add a little buffer

        // Check if the image would overflow the current page
        if (y + imgHeightt + marginBottom > pageHeight) {
            doc.addPage();
            y = 10; // Reset Y for new page (or your desired top margin)
        }

        const qrCodeBase64w = Signature;
        doc.addImage(qrCodeBase64w, "PNG", imgX, y, 60, imgHeightt);


        if (shouldSave) {
            doc.save(`${formData.police.reference_id} Police Report.pdf`);
        } else {
            return doc;
        }

    }
    const generateAddressPDF = async (address, shouldSave = true) => {
        const doc = new jsPDF({ compress: true });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginLeft = 20;
        const marginRight = 20;
        const maxWidth = pageWidth - marginLeft - marginRight;
        const colWidth = maxWidth / 2;
        const lineHeight = 4; // Smaller font, smaller spacing
        const myMaxWidth = colWidth - 4;
        let y = 20;

        // ---- HEADING ----
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');

        const headingText = 'ADDRESS VERIFICATION';
        const textWidth = doc.getTextWidth(headingText);
        const centerX = pageWidth / 2;
        const yOffset = y;

        // Set line color (optional)
        doc.setDrawColor(255, 204, 0); // yellow-orange like in your image
        doc.setLineWidth(1);

        // Left line: from left margin to left of text
        const linePadding = 4;
        const lineLeftStartX = marginLeft;
        const lineLeftEndX = centerX - textWidth / 2 - linePadding;
        doc.line(lineLeftStartX, yOffset, lineLeftEndX, yOffset);

        // Right line: from right of text to right margin
        const lineRightStartX = centerX + textWidth / 2 + linePadding;
        const lineRightEndX = pageWidth - marginRight;
        doc.line(lineRightStartX, yOffset, lineRightEndX, yOffset);

        // Draw heading text in center
        doc.setTextColor(33, 64, 154); // Optional: dark blue (like in your image)
        doc.text(headingText, centerX, yOffset - 1, { align: 'center' });

        // Optional: reset text color if you change it
        doc.setTextColor(0, 0, 0);

        // Move down for next content
        y += 10;

        y += 10;

        // ---- TABLE DATA ----
        doc.setFontSize(9); // Reduced font size
        doc.setFont('helvetica', 'normal');
        doc.setDrawColor(0, 0, 0); // yellow-orange like in your image

        doc.setLineWidth(0.1);

        const entries = [
            ['Reference ID', address.reference_id || ''],
            ['Full Name of The Candidate/Applicant/Job Seeker', address.candidateName || ''],
            ['Date of Address Verification', address.verificationDate || ''],
            ['Address as provided by the candidate/Applicant', address.providedAddress || ''],
            ['Does physically verified address match with the above? (Yes or No)', address.addressMatch || ''],
            ['Verifier remarks (if address does not match)', address.verifierRemarks || ''],
            ['Mode of communication', address.communicationMode || ''],
            ['Full Name of the Respondent', address.respondentName || ''],
            ['Relationship with the candidate/Applicant', address.relationship || ''],
            ['Number of Years staying at present/Current residence', address.yearsAtResidence || ''],
            ['Status', address.residenceStatus || ''],
            ['Details of the Respondent Address proof Verified', address.respondentProof || ''],
            ['If the residence is locked, has the address been confirmed with neighbors?', address.confirmedWithNeighbors || ''],
            ['Nature of Location', address.locationClass || ''],
            ['Prominent Landmark in 1KM radius (Mandatory)', address.landmark || ''],
            ['Nearby Name of the Police Station Location', address.policeStation || ''],
            ['Any Comment regarding the Address verification', address.comments || ''],
            ['Name of the Representative with date', address.representativeNameDate || ''],
            // ['Signature of Respondent', signatureDemo || '']
        ];

        for (const [label, value] of entries) {
            const isSignatureRow = label === 'Signature of Respondent';

            const wrappedLabel = doc.splitTextToSize(label, myMaxWidth);
            const linesCount = wrappedLabel.length;
            let dynamicRowHeight = linesCount * lineHeight + 2;

            if (isSignatureRow) dynamicRowHeight = 30; // Fixed height for image

            // Draw table cells
            doc.rect(marginLeft, y - 4, colWidth, dynamicRowHeight);
            doc.rect(marginLeft + colWidth, y - 4, colWidth, dynamicRowHeight);

            // Label cell
            wrappedLabel.forEach((line, i) => {
                doc.text(line, marginLeft + 2, y + (i * lineHeight));
            });

            if (isSignatureRow) {
                try {
                    const base64Image = await loadImageAsBase64(signatureDemo); // or use signatureDemo directly if already base64
                    doc.addImage(base64Image, "PNG", marginLeft + colWidth + 2, y, 50, 25);
                } catch (error) {
                    doc.text("Signature not available", marginLeft + colWidth + 2, y + 5);
                }
            } else {
                const wrappedValue = doc.splitTextToSize(String(value), myMaxWidth);
                wrappedValue.forEach((line, i) => {
                    doc.text(line, marginLeft + colWidth + 2, y + (i * lineHeight));
                });
            }

            y += dynamicRowHeight;

            // Add page if needed
            if (y > pageHeight - 30) {
                doc.addPage();
                y = 20;
            }
        }

        // ---- Save or Return ----
        if (shouldSave) {
            doc.save(`${address.reference_id}_Address_Verification.pdf`);
        } else {
            return doc;
        }
    };



    async function loadImageAsBase64(url) {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // base64 string
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    const formFields = [
        { name: "reference_id", label: "Reference ID", type: "text" },
        { name: "candidateName", label: "Full Name of The Candidate/Applicant/Job Seeker", type: "text" },
        { name: "verificationDate", label: "Date of Address Verification", type: "date" },
        { name: "providedAddress", label: "Address as provided by the candidate/Applicant", type: "textarea" },

        // 👇 SELECT field: Yes/No
        {
            name: "addressMatch",
            label: "Does physically verified address match with the above? (Yes or No)",
            type: "select",
            options: ["Yes", "No"]
        },

        { name: "verifierRemarks", label: "Verifier remarks (if address does not match)", type: "textarea" },

        // 👇 SELECT field: communication mode
        {
            name: "communicationMode",
            label: "Mode of communication",
            type: "select",
            options: ["Verbal", "Written", "Digitally"]
        },

        { name: "respondentName", label: "Full Name of the Respondent", type: "text" },
        { name: "relationship", label: "Relationship with the candidate/Applicant", type: "text" },
        { name: "yearsAtResidence", label: "Number of Years staying at present/Current residence", type: "text" },

        // 👇 SELECT field: residence status
        {
            name: "residenceStatus",
            label: "Status",
            type: "select",
            options: ["Ownership", "Rental", "Hostel", "PG"]
        },

        { name: "respondentProof", label: "Details of the Respondent Address proof Verified", type: "textarea" },
        {
            name: "confirmedWithNeighbors",
            label: "If the residence is locked, has the address been confirmed with neighbors?",
            type: "select",
            options: ["Yes", "No"]
        },

        // 👇 SELECT field: location class
        {
            name: "locationClass",
            label: "Nature of Location",
            type: "select",
            options: ["Lower", "Middle", "Upper"]
        },

        { name: "landmark", label: "Prominent Landmark in 1KM radius (Mandatory)", type: "text" },
        { name: "policeStation", label: "Nearby Name of the Police Station Location", type: "text" },
        { name: "comments", label: "Any Comment regarding the Address verification", type: "textarea" },
        { name: "representativeNameDate", label: "Name of the Representative with date", type: "text" },
        // {
        //     name: "respondentSignature",
        //     label: "Signature of Respondent",
        //     type: "file"
        // }
    ];

    function imageToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file || !(file instanceof Blob)) {
                return reject(new Error("Invalid file input"));
            }

            const reader = new FileReader();

            reader.onloadend = () => {
                resolve(reader.result); // Base64 string
            };

            reader.onerror = () => {
                reject(new Error("Error reading file"));
            };

            reader.readAsDataURL(file);
        });
    }


    const generateCourtPDF = async (courtData, shouldSave = true) => {
        const doc = new jsPDF({ compress: true });
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 6;

        // ---- IMAGE + | + ADVOCATE DETAILS ----
        const blockY = 2;
        const imgWidth = 35;
        const imgHeight = 35;
        const imgX = 20;

        const qrCodeBase64 = "/advocate.png";
        doc.addImage(qrCodeBase64, "PNG", imgX, blockY, imgWidth, imgHeight);

        // Draw vertical line next to image
        const lineX = pageWidth / 2;
        const blockHeight = imgHeight; // Enough for image + details

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(lineX, blockY + 5, lineX, blockY + blockHeight - 5);

        // Advocate Details
        const advocateX = pageWidth - 20;
        let advocateY = blockY;

        doc.setFontSize(10);
        const advocateDetails = [
            // "NAVA NAYANA LEGAL CHAMBERS",
            // "MANJUNATHA H S (HSM), B.B.M., LL.B.",
            // "ADVOCATE AND LEGAL CONSULTANT",
            // "ENROLLMENT NUMBER: KAR/4765/2023",
            // "MOBILE NUMBER : +91 9738812694",
            // "MANJUNATH.9738812694@GMAIL.COM",
        ];

        advocateDetails.forEach(line => {
            doc.text(line, advocateX, advocateY + 10, { align: 'right' });
            advocateY += lineHeight;
        });

        // Horizontal line below the block
        const hrY = blockY + blockHeight + 5;
        doc.line(20, hrY - 2, pageWidth - 20, hrY - 2);


        let y = hrY + 7;

        // ---- TITLE ----
        doc.setFont('helvetica', 'bold'); // closest to semibold
        doc.setFontSize(15);
        doc.text('COURT RECORD REPORT', pageWidth / 2, y, { align: 'center' });

        y += lineHeight * 3 - 5;



        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        // Intro
        const intro = `This information is given with regard to search conducted at the Jurisdictional Court. `;
        const introLines = doc.splitTextToSize(intro, pageWidth - 30);
        doc.text(introLines, 20, y);
        y += introLines.length * lineHeight + 5;

        // === Civil Proceedings ===
        const civilTitle = 'Civil Proceedings:';
        const civilText = ' Original Suit / Miscellaneous Suit / Execution / Arbitration Cases before the Civil Court and High Court in its Original and Appellate Stage.';

        // Combine and split for wrapping
        const civilCombined = civilTitle + civilText;
        const civilLines = doc.splitTextToSize(civilCombined, pageWidth - 40);

        // First line: separate bold and normal
        const firstLine = civilLines[0];
        if (firstLine.startsWith(civilTitle)) {
            const normalPart = firstLine.slice(civilTitle.length);

            doc.setFont('helvetica', 'bold');
            doc.text(civilTitle, 20, y);

            const boldWidth = doc.getTextWidth(civilTitle);
            doc.setFont('helvetica', 'normal');
            doc.text(normalPart, 20 + boldWidth, y);
        } else {
            // fallback
            doc.setFont('helvetica', 'normal');
            doc.text(firstLine, 20, y);
        }

        y += lineHeight;

        // Other lines: normal font
        for (let i = 1; i < civilLines.length; i++) {
            doc.setFont('helvetica', 'normal');
            doc.text(civilLines[i], 20, y);
            y += lineHeight;
        }

        y += 4;

        // === Criminal Proceedings ===
        const criminalTitle = 'Criminal Proceedings:';
        const criminalText = ' Criminal Petition / Criminal Appeal / Sessions Case / Special Sessions Case / Criminal Miscellaneous Petition / Criminal Revision Appeal before the Magistrate Court, Sessions Court and High Court in its Criminal Cases, Private Complaint Report, Criminal Appeals, respectively.';

        const criminalCombined = criminalTitle + criminalText;
        const criminalLines = doc.splitTextToSize(criminalCombined, pageWidth - 40);

        // First line: separate bold and normal
        const firstCriminalLine = criminalLines[0];
        if (firstCriminalLine.startsWith(criminalTitle)) {
            const normalPart = firstCriminalLine.slice(criminalTitle.length);

            doc.setFont('helvetica', 'bold');
            doc.text(criminalTitle, 20, y);

            const boldWidth = doc.getTextWidth(criminalTitle);
            doc.setFont('helvetica', 'normal');
            doc.text(normalPart, 20 + boldWidth, y);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.text(firstCriminalLine, 20, y);
        }

        y += lineHeight;

        // Other lines
        for (let i = 1; i < criminalLines.length; i++) {
            doc.setFont('helvetica', 'normal');
            doc.text(criminalLines[i], 20, y);
            y += lineHeight;
        }



        y += 6;

        // ---- DATA TABLE ----
        doc.setFontSize(12);
        const colWidth = (pageWidth - 40) / 2;
        const rowHeight = lineHeight + 1;
        const tableX = 20;

        const entries = [
            ['Reference ID', courtData.reference_id || ''],
            ['Full Name', courtData.full_name || ''],
            ["Father's Name", courtData["fathers_name"] || ''],
            ['Date of Birth', courtData.date_of_birth || ''],
            ['Permanent Address', courtData.permanent_address || ''],
            ['Current Address', courtData.current_address || ''],
            ['Number of Years Search', courtData.number_of_years_search || ''],
            ['Date of Verification', courtData.date_of_verification || ''],
            ['Verification Status', courtData.verification_status || ''],

        ];
        doc.setLineWidth(0.1);
        const mymaxwidth = colWidth - 4;

        entries.forEach(([label, value]) => {
            const wrappedLabel = doc.splitTextToSize(label, mymaxwidth);
            const wrappedValue = doc.splitTextToSize(String(value), mymaxwidth);

            const linesCount = Math.max(wrappedLabel.length, wrappedValue.length);
            const dynamicRowHeight = linesCount * 7; // 7 is approx line height

            // Borders
            doc.rect(tableX, y - 6, colWidth, dynamicRowHeight);
            doc.rect(tableX + colWidth, y - 6, colWidth, dynamicRowHeight);

            // Text
            wrappedLabel.forEach((line, idx) => {
                doc.text(line, tableX + 2, y - 1 + (idx * 7));
            });

            wrappedValue.forEach((line, idx) => {
                doc.text(line, tableX + colWidth + 2, y - 1 + (idx * 7));
            });

            y += dynamicRowHeight;

            // Page break logic
            if (y > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                y = 20;
            }
        });
        y += 2;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('RESULT', pageWidth / 2, y, { align: 'center' });
        // ---- DISCLAIMER ----
        y += 8;

        const tableColumn = [
            "COURT/CHECK TYPE",
            "JURISDICTION",
            "LOCATION",
            "VERIFICATION RESULT"
        ];

        const courtTableData = courtData.courtTable;
        const tableRows = courtTableData.map(item => [
            item.courtCheckType,
            item.jurisdiction,
            item.location,
            item.verificationResult
        ]);
        const margin = 20; // left/right margin

        const tableWidth = pageWidth - 2 * margin;

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: y,
            styles: {
                halign: 'center',
                valign: 'middle',
                fontSize: 10,
                lineColor: [0, 0, 0], // black borders
                lineWidth: 0.1,
            },
            didDrawPage: function (data) {
                navbar(doc);
            },
            headStyles: {
                fillColor: [200, 200, 200], // white header background
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                cellPadding: 1, // smaller padding for header
            },

            bodyStyles: {
                cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }, // extra left padding
                fillColor: [255, 255, 255], // white background for rows
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255] // sets fill for all rows
            },
            columnStyles: {
                0: { halign: 'left' },   // First column left
                1: { halign: 'left' }, // Second column center (optional)
                2: { halign: 'center' }, // Third column center (optional)
                3: { halign: 'center' }  // Fourth column center
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.1,
            margin: { left: margin, right: margin }, // set left/right margin
            tableWidth: tableWidth, // this is optional since margin already controls it
        });



        doc.addPage();
        navbar(doc)
        y = hrY + 5;



        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');

        doc.text('DISCLAIMER', pageWidth / 2, y, { align: 'center' });




        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            navbar(doc)
            y = hrY + 5;
        }
        else {
            y += 8;
        }

        const noteLines = [
            [
                { text: 'It has been verified that the above individual has', bold: false },
                { text: 'no case pending or disposed of', bold: true },
                { text: 'in his/her name within the jurisdiction of the court, as per available data.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: `No adverse court records were found against the applicant as of ${courtData.date_of_verification}.`, bold: false },],
            [
                { text: '', }
            ],
            [
                { text: 'If certified or physical records are required, the same can be obtained through the appropriate legal process as per the relevant court or authority.', }
            ],
            [
                { text: '', }
            ],
            [
                { text: 'This report is issued based on data retrieved from', },
                { text: 'public domain sources, e-Courts portals, and/or officially permitted access.', bold: true },
            ],
            [
                { text: '', }
            ],
            [
                { text: '“Nava Nayana Legal Chambers” ', bold: true },
                { text: 'does not guarantee the completeness or finality of the information and shall not be held liable for any actions taken by third parties based on this report.', bold: false },
            ],
            [
                { text: '', }
            ],
            [
                { text: 'This document is confidential and intended solely for the authorized recipient. Any unauthorized sharing, copying, or reliance is not permitted without prior written consent.', bold: false },
            ],
        ];

        doc.setFontSize(12);
        const marginLeft = 20;
        const marginRight = 20;
        const maxWidth = pageWidth - marginLeft - marginRight;
        const wordSpacing = 1.5; // adjust as needed

        // --- 1) Measure total height ---
        let totalNoteHeight = 0;
        const tempY = y;  // Current position
        const tempLineHeight = lineHeight;
        doc.setFontSize(12);
        noteLines.forEach(lineArray => {
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                totalNoteHeight += tempLineHeight;
            } else {
                // Estimate line splits
                let styleMap = [];
                lineArray.forEach(part => {
                    const words = part.text.split(' ');
                    words.forEach(word => {
                        styleMap.push({ word, bold: part.bold });
                    });
                });

                let currentWidth = 0;
                let lineCount = 1;

                styleMap.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    const wordWidth = doc.getTextWidth(item.word + ' ');
                    if (currentWidth + wordWidth > maxWidth) {
                        lineCount++;
                        currentWidth = wordWidth;
                    } else {
                        currentWidth += wordWidth;
                    }
                });

                totalNoteHeight += lineCount * tempLineHeight;
            }
        });

        // --- 2) Add new page if needed ---
        if (y + totalNoteHeight > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            doc.setFontSize(12);
            navbar(doc);
            y = hrY + 5;  // or whatever top Y you use
        }
        doc.setFontSize(12);
        // --- 3) Now render noteLines as usual ---
        noteLines.forEach(lineArray => {
            if (lineArray.length === 1 && lineArray[0].text.trim() === '') {
                y += lineHeight;
                return;
            }

            let styleMap = [];
            lineArray.forEach(part => {
                const words = part.text.split(' ');
                words.forEach(word => {
                    styleMap.push({ word, bold: part.bold });
                });
            });

            let lines = [];
            let currentLine = [];
            let currentWidth = 0;

            styleMap.forEach(item => {
                doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                const wordWidth = doc.getTextWidth(item.word + ' ');

                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [item];
                    currentWidth = wordWidth;
                } else {
                    currentLine.push(item);
                    currentWidth += wordWidth;
                }
            });
            if (currentLine.length) lines.push(currentLine);

            lines.forEach((lineWords, index) => {
                let totalWordsWidth = 0;
                lineWords.forEach(item => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    totalWordsWidth += doc.getTextWidth(item.word + ' ');
                });

                const gaps = lineWords.length - 1;
                let extraSpace = gaps > 0 ? (maxWidth - totalWordsWidth) / gaps : 0;

                if (index === lines.length - 1) extraSpace = 0;

                let x = marginLeft;

                lineWords.forEach((item, i) => {
                    doc.setFont('helvetica', item.bold ? 'bold' : 'normal');
                    doc.text(item.word, x, y);

                    let wordWidth = doc.getTextWidth(item.word + ' ');
                    x += wordWidth;

                    if (i < lineWords.length - 1) {
                        x += extraSpace;
                    }
                });

                y += lineHeight;
            });
        });


        const qrCodeBase64w = Signature;
        doc.addImage(qrCodeBase64w, "PNG", imgX, y, 60, 25);
        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            doc.setFontSize(12);
            navbar(doc)
            y = hrY + 5;
        }
        else {
            y += 8;
        }

        if (shouldSave) {
            doc.save(`${courtData.reference_id} Court Report.pdf`);
        } else {
            return doc;
        }
    }

    const generateCourtDOCX = async (courtData) => {
        const advocateDetails = [
            "NAVA NAYANA LEGAL CHAMBERS",
            "MANJUNATHA H S (HSM), B.B.M., LL.B.",
            "ADVOCATE AND LEGAL CONSULTANT",
            "ENROLLMENT NUMBER: KAR/4765/2023",
            "MOBILE NUMBER : +91 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];




        const headerImageUrl = "/advocate.png";
        const stampImageUrl = Signature;

        const fetchImageBuffer = async url => {
            const res = await fetch(url);
            return res.arrayBuffer();
        };

        const headerImage = await fetchImageBuffer(headerImageUrl);
        const stampImage = await fetchImageBuffer(stampImageUrl);

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        // === Logo Cell ===
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE }, // roughly ~80px on A4
                            borders: noBorders,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new ImageRun({
                                            data: headerImage,
                                            transformation: { width: 80, height: 80 },
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // === Spacer Cell (~200px) ===
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [new Paragraph("")],
                        }),

                        // === Vertical Line Cell ===
                        new TableCell({
                            width: { size: 1, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: {
                                    style: BorderStyle.SINGLE,
                                    size: 4,
                                    color: "000000",
                                },
                            },
                            children: [new Paragraph("")],
                        }),

                        // === Advocate Details Cell ===
                        new TableCell({
                            width: { size: 59, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: advocateDetails.map(line =>
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: line, size: 20 })],
                                })
                            ),
                        }),
                    ],
                }),
            ],
        });




        const tableEntries = [
            ['Reference ID', courtData.reference_id],
            ['Full Name', courtData.full_name],
            ["Father's Name", courtData["father's_name"]],
            ['Date of Birth', courtData.date_of_birth],
            ['Permanent Address', courtData.permanent_address],
            ['Current Address', courtData.current_address],
            ['Number of Years Search', courtData.number_of_years_search],
            ['Date of Verification', courtData.date_of_verification],
            ['Verification Status', courtData.verification_status],
        ];

        const doc = new Document({
            sections: [{
                children: [

                    // === HEADER TABLE ===
                    headerTable,

                    // === HR LINE ===
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 6,
                                color: "000000",
                            },
                        },
                        children: [new TextRun("")],
                    }),


                    // === TITLE ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "COURT RECORD REPORT", bold: true, size: 28 })],
                        spacing: { after: 300 },
                    }),

                    // === INTRO ===
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "This information is given with regard to search conducted at the Jurisdictional Court. ",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Civil Proceedings:", bold: true, size: 22 }),
                            new TextRun({
                                text: " Original Suit / Miscellaneous Suit / Execution / Arbitration Cases before the Civil Court and High Court in its Original and Appellate Stage.",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 100 },
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Criminal Proceedings:", bold: true, size: 22 }),
                            new TextRun({
                                text: " Criminal Petition / Criminal Appeal / Sessions Case / Special Sessions Case / Criminal Miscellaneous Petition / Criminal Revision Appeal before the Magistrate Court, Sessions Court and High Court in its Criminal Cases, Private Complaint Report, Criminal Appeals, respectively.",
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 },
                    }),

                    // === PERSONAL DETAILS TABLE ===
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: tableEntries.map(([label, value]) =>
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        margins: { left: 100, right: 100 },
                                        children: [new Paragraph(label)],
                                    }),
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        margins: { left: 100, right: 100 },
                                        children: [new Paragraph(String(value || ''))],
                                    }),
                                ],
                            })
                        ),
                    }),

                    new Paragraph({ spacing: { after: 300 }, text: "" }),

                    // === RESULT TITLE ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "RESULT", bold: true, size: 28 })],
                        spacing: { after: 200 },
                    }),

                    // === COURT RESULT TABLE ===
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: [
                            // Header row with padding
                            new TableRow({
                                children: ["COURT/CHECK TYPE", "JURISDICTION", "LOCATION", "VERIFICATION RESULT"].map(
                                    heading =>
                                        new TableCell({
                                            margins: { left: 100, right: 100 },
                                            children: [new Paragraph({ text: heading, bold: true })],
                                        })
                                ),
                            }),
                            // Data rows with padding
                            ...(courtData.courtTable || []).map(row =>
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            margins: { left: 100, right: 100 },
                                            children: [new Paragraph(row.courtCheckType || '')],
                                        }),
                                        new TableCell({
                                            margins: { left: 100, right: 100 },
                                            children: [new Paragraph(row.jurisdiction || '')],
                                        }),
                                        new TableCell({
                                            margins: { left: 100, right: 100 },
                                            children: [new Paragraph(row.location || '')],
                                        }),
                                        new TableCell({
                                            margins: { left: 100, right: 100 },
                                            children: [new Paragraph(row.verificationResult || '')],
                                        }),
                                    ],
                                })
                            ),
                        ],
                    }),

                    new Paragraph({ spacing: { after: 300 }, text: "" }),

                    // === DISCLAIMER HEADING ===
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "DISCLAIMER", bold: true, size: 22 })],
                        spacing: { after: 200 },
                    }),

                    // === DISCLAIMER PARAGRAPHS ===
                    ...[
                        ["It has been verified that the above individual has ", "no case pending or disposed of", " in his/her name within the jurisdiction of the court, as per available data."],
                        [{ text: `No adverse court records were found against the applicant as of ${courtData.date_of_verification_at_station}.` }]
                        ["If certified or physical records are required, the same can be obtained through the appropriate legal process as per the relevant court or authority."],
                        ["This report is issued based on data retrieved from ", "public domain sources, e-Courts portals, and/or officially permitted access."],
                        ["“Nava Nayana Legal Chambers” ", "does not guarantee the completeness or finality of the information and shall not be held liable for any actions taken by third parties based on this report."],
                        ["This document is confidential and intended solely for the authorized recipient. Any unauthorized sharing, copying, or reliance is not permitted without prior written consent."]
                    ].map(parts => new Paragraph({
                        children: parts?.map((part, i) =>
                            new TextRun({ text: part, bold: i === 1 })
                        ),
                        spacing: { after: 150 },
                    })),

                    // === STAMP IMAGE ===
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: stampImage,
                                transformation: { width: 150, height: 70 },
                            }),
                        ],
                        spacing: { before: 300 },
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${formData.court.referenceId} Court Report.docx`);
    };


    const generatePoliceDOCX = async (policeData) => {
        const advocateDetails = [
            "NAVA NAYANA LEGAL CHAMBERS",
            "MANJUNATHA H S (HSM), B.B.M., LL.B.",
            "ADVOCATE AND LEGAL CONSULTANT",
            "ENROLLMENT NUMBER: KAR/4765/2023",
            "MOBILE NUMBER : +91 9738812694",
            "MANJUNATH.9738812694@GMAIL.COM",
        ];

        const headerImageUrl = "/advocate.png";
        const stampImageUrl = Signature;

        const fetchImageBuffer = async url => {
            const res = await fetch(url);
            return res.arrayBuffer();
        };

        const headerImage = await fetchImageBuffer(headerImageUrl);
        const stampImage = await fetchImageBuffer(stampImageUrl);

        // Header section: Image + vertical line + advocate info in two columns
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        // === Logo Cell ===
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE }, // roughly ~80px on A4
                            borders: noBorders,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    children: [
                                        new ImageRun({
                                            data: headerImage,
                                            transformation: { width: 80, height: 80 },
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // === Spacer Cell (~200px) ===
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [new Paragraph("")],
                        }),

                        // === Vertical Line Cell ===
                        new TableCell({
                            width: { size: 1, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: {
                                    style: BorderStyle.SINGLE,
                                    size: 4,
                                    color: "000000",
                                },
                            },
                            children: [new Paragraph("")],
                        }),

                        // === Advocate Details Cell ===
                        new TableCell({
                            width: { size: 59, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: advocateDetails.map(line =>
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: line, size: 20 })],
                                })
                            ),
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            sections: [{
                children: [
                    headerTable,

                    // Thin horizontal rule
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 4,
                                color: "000000",
                            },
                        },
                        children: [new TextRun("")],
                    }),

                    // Title
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "POLICE RECORD REPORT [LAW FIRM]", bold: true, size: 28 })],
                        spacing: { after: 200 },
                    }),

                    // Intro paragraph
                    new Paragraph({
                        children: [new TextRun({
                            text: "This is with regard to the search conducted in the Police Station referred below with regard to any criminal cases filed against the person detailed below.",
                            size: 22,
                        })],
                        spacing: { after: 300 },
                    }),

                    // Data table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            ...[
                                ['Reference ID', policeData.reference_id],
                                ['Full Name', policeData.full_name],
                                ["Father's Name", policeData["father's_name"]],
                                ['Date of Birth', policeData.date_of_birth],
                                ['Address', policeData.address],
                                ['Name of the Police Station', policeData.name_of_the_police_station],
                                ['Locality / Jurisdiction', policeData["locality_/_jurisdiction"]],
                                ['Name of the Station House Officer', policeData.name_of_the_station_house_officer],
                                ['Designation of the officer / SHO', policeData["designation_of_the_officer_/_sho"]],
                                ['Phone Number of Police Station', policeData.phone_number_of_police_station],
                                ['Number of Years covered in the station', policeData.number_of_years_covered_in_the_station],
                                ['Date of Verification at Station', policeData.date_of_verification_at_station],
                                ['Verification Status from Station', policeData.verification_status_from_station],
                                ['Overall Track Records Status', policeData.overall_track_records_status],
                            ].map(([label, value]) => new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                                    }),
                                    new TableCell({
                                        children: [new Paragraph(String(value || ''))],
                                    }),
                                ]
                            }))
                        ]
                    }),

                    // Disclaimer heading
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "DISCLAIMER", bold: true, size: 24 })],
                        spacing: { before: 300, after: 200 },
                    }),

                    // Full disclaimer body
                    new Paragraph({
                        children: [new TextRun({
                            text: "The search results are based on the available registers maintained in respect of criminal case/s and suit registers in respect of civil case/s maintained in the above-mentioned Court / Police Station having jurisdiction over the address where the candidate was said to be residing. Due care has been taken in conducting the search. The records are public records and the search has been conducted on behalf of your good self and the undersigned is not responsible for any errors, inaccuracies, omissions or deletions if any in the said court or police records. The above report is based on the verbal confirmation of the concerned authority as on the date on which it is confirmed, hence this verification is subjective. Please do contact the Local Police for Candidate Police Clearance Certificate (PCC) / Police Verification Certificate.",
                            size: 20,
                        })],
                        spacing: { after: 300 },
                    }),

                    // Notes
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Note:", bold: true, size: 20 }),
                            new TextRun({ text: " This report is provided for informational purposes only and does not constitute an official police clearance or certificate.", size: 20 }),
                        ],
                        spacing: { after: 150 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "“Nava Nayana Legal Chambers”", bold: true, size: 20 }),
                            new TextRun({ text: " does not guarantee the completeness, accuracy, or finality of the information and shall not be held liable for any decisions or actions taken by third parties based on this report.", size: 20 }),
                        ],
                        spacing: { after: 150 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "This document is confidential and intended solely for the authorized recipient. Any unauthorized use, reproduction, or dissemination is strictly prohibited without prior written consent.", size: 20 }),
                        ],
                        spacing: { after: 300 },
                    }),

                    // Stamp image
                    new Paragraph({
                        children: [
                            new ImageRun({ data: stampImage, transformation: { width: 150, height: 70 } }),
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${formData.court.reference_id} Police Report.docx`);
    };

    const noBorders = {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
    };


    const generateAddressDOCX = async (addressData) => {
        const headingRow = new TableRow({
            children: [
                // Left Yellow Line Cell
                new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'FFC000' }, // Yellow underline
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                    },
                    children: [new Paragraph('')],
                }),

                // Center Heading Cell
                new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                    },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "ADDRESS VERIFICATION TEMPLATE",
                                    bold: true,
                                    color: "21409A", // Deep Blue
                                    size: 28,        // 14pt
                                    font: "Arial",
                                }),
                            ],
                        }),
                    ],
                }),

                // Right Yellow Line Cell
                new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'FFC000' },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                    },
                    children: [new Paragraph('')],
                }),
            ],
        });

        const headingTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headingRow],
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
            },
        });




        const dataRows = [
            ["Reference ID", addressData.reference_id || ""],
            ["Full Name of The Candidate", addressData.candidateName || ""],
            ["Date of Address Verification", addressData.verificationDate || ""],
            ["Address Provided", addressData.providedAddress || ""],
            ["Does Address Match?", addressData.addressMatch || ""],
            ["Verifier Remarks", addressData.verifierRemarks || ""],
            ["Mode of Communication", addressData.communicationMode || ""],
            ["Full Name of the Respondent", addressData.respondentName || ""],
            ["Relationship", addressData.relationship || ""],
            ["Years at Residence", addressData.yearsAtResidence || ""],
            ["Status", addressData.residenceStatus || ""],
            ["Respondent Address Proof", addressData.respondentProof || ""],
            ["Confirmed with Neighbors?", addressData.confirmedWithNeighbors || ""],
            ["Nature of Location", addressData.locationClass || ""],
            ["Prominent Landmark", addressData.landmark || ""],
            ["Nearby Police Station", addressData.policeStation || ""],
            ["Comments", addressData.comments || ""],
            ["Representative Name & Date", addressData.representativeNameDate || ""],
        ];

        const textRows = dataRows.map(([label, value]) =>
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: label, bold: true, size: 20 }), // smaller font
                                ],
                            }),
                        ],
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(value), size: 20 }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        );

        // Signature row
        // let signatureRow;
        // const signaturePath = signatureDemo;

        // try {
        //     const base64String = await fetchImageAsBase64(signaturePath);
        //     const imageBuffer = base64ToArrayBuffer(base64String);

        //     signatureRow = new TableRow({
        //         children: [
        //             new TableCell({
        //                 children: [
        //                     new Paragraph({
        //                         children: [new TextRun({ text: "Signature of Respondent", bold: true })],
        //                     }),
        //                 ],
        //             }),
        //             new TableCell({
        //                 children: [
        //                     new Paragraph({
        //                         children: [
        //                             new ImageRun({
        //                                 data: imageBuffer,
        //                                 transformation: { width: 120, height: 60 },
        //                             }),
        //                         ],
        //                     }),
        //                 ],
        //             }),
        //         ],
        //     });
        // } catch (error) {
        //     console.error("Error loading signature image:", error);
        //     signatureRow = new TableRow({
        //         children: [
        //             new TableCell({
        //                 children: [
        //                     new Paragraph({
        //                         children: [new TextRun({ text: "Signature of Respondent", bold: true })],
        //                     }),
        //                 ],
        //             }),
        //             new TableCell({
        //                 children: [new Paragraph("Failed to load signature image")],
        //             }),
        //         ],
        //     });
        // }

        const dataTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [...textRows],
        });

        const doc = new Document({
            sections: [
                {
                    children: [
                        headingTable,
                        new Paragraph({ text: "", spacing: { after: 300 } }), // spacer
                        dataTable,
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${addressData.reference_id || "address"}_verification.docx`);
    };


    async function fetchImageAsBase64(url) {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // base64 string
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }



    function base64ToArrayBuffer(base64) {
        const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");
        const binary = atob(cleaned);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes; // return Uint8Array (docx supports this)
    }
    const generatePolicePDFBlob = async (policeData) => {
        const doc = await generatePolicePDF(policeData, false);
        return doc.output('blob');   // <-- returns Blob only
    };

    const generateAddressPDFBlob = async (addressData) => {
        const doc = await generateAddressPDF(addressData, false);
        return doc.output('blob');
    };
    const generateCourtPDFBlob = async (courtData) => {
        const doc = await generateCourtPDF(courtData, false); // don't auto-save
        return doc.output("blob"); // return as Blob
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");


        try {
            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/integrated-service/list?admin_id=${adminId}&_token=${token}`;

            const response = await fetch(url, requestOptions);

            if (response.ok) {
                setLoading(false);

                const result = await response.json();
                setData(result.services || []);

                // Update the token if a new one is provided
                const newToken = result.token || result._token || localStorage.getItem("_token") || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
            } else {

                setLoading(false);
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            setLoading(false);
            console.error("Error fetching service data:", error);
            return [];
        }


    },
        []);



    const submitRecords = (type, isEdit) => {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");

        // Determine request type and URL
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit
            ? `https://api.screeningstar.co.in/integrated-service/update`
            : `https://api.screeningstar.co.in/integrated-service/create`;

        console.log('formDatasubmit', formData)

        const bodyData = isEdit
            ? {
                id: editData?.id, // fetch id from editData
                type: selectedService, // just use the selectedService value
                export_format: type, // the format you want to export
                data: JSON.stringify(
                    selectedService === "police"
                        ? formData.police
                        : selectedService === "address"
                            ? formData.address
                            : formData.court
                ),

                admin_id: adminData?.id,
                _token: token
            }
            : {
                type: formData.selectedService,
                data: JSON.stringify(formData[formData.selectedService]),
                export_format: type,
                admin_id: adminData?.id,
                _token: token
            };

        const requestOptions = {
            method,
            headers: myHeaders,
            body: JSON.stringify(bodyData),
            redirect: "follow"
        };

        Swal.showLoading(); // optional: show loading before fetch

        fetch(url, requestOptions)
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then((result) => {
                Swal.close();
                if (result?.status) {
                    setSelectedService("");
                    setFormData({});
                    setIsEdit(false);
                    setEditData(null);
                    fetchData(); // refresh data
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: result.message || "Your request was processed successfully."
                    });
                    if (isEdit) setEditData(null); // reset edit mode
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: result.message || "Something went wrong. Please try again."
                    });
                }
            })
            .catch((error) => {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Request Failed",
                    text: error.message || "Network error occurred."
                });
            });
    };
    const submitRecordsBulk = async (type) => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");

        if (!adminData || !token) {
            Swal.fire({
                icon: "error",
                title: "Missing Credentials",
                text: "Admin data or token is missing. Please login again."
            });
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const records = type === "policeBulk" ? policeData : courtData;

        // Remove duplicate records by reference_id
        const uniqueRecords = Array.from(
            new Map(records.map(r => [r.reference_id, r])).values()
        );

        const url = `https://api.screeningstar.co.in/integrated-service/create`;

        Swal.fire({
            title: "Processing...",
            text: "Please wait while we process your records.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            for (const record of uniqueRecords) {
                const bodyData = {
                    type: formData.selectedService,
                    data: JSON.stringify(record), // single object
                    export_format: "png",
                    admin_id: adminData.id,
                    _token: token
                };

                const requestOptions = {
                    method: "POST",
                    headers: myHeaders,
                    body: JSON.stringify(bodyData),
                    redirect: "follow"
                };

                const response = await fetch(url, requestOptions);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const result = await response.json();
                if (!result?.status) {
                    throw new Error(result.message || "Error processing record");
                }
            }

            Swal.close();
            setSelectedService("");
            setFileName("");
            setCourtData([]);
            setPoliceData([]);
            fetchData();
            if (isEdit) setEditData(null);

            Swal.fire({
                icon: "success",
                title: "Success!",
                text: "All records were processed successfully."
            });

        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Request Failed",
                text: error.message || "Something went wrong."
            });
        }
    };


    const handleDownload = async (type) => {
        if (!formRef.current) return;

        Swal.fire({
            title: 'Please wait...',
            text: 'Preparing your file...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            // PDF
            if (type === "pdf") {
                if (selectedService === "court") {
                    await generateCourtPDF(formData.court);
                } else if (selectedService === "police") {
                    await generatePolicePDF(formData.police);

                } else if (selectedService === "address") {
                    await generateAddressPDF(formData.address);
                }
            }

            // PNG or JPG
            else if (type === "png" || type === "jpg") {
                let blob;
                if (selectedService === "court") {
                    blob = await generateCourtPDFBlob(formData.court);
                } else if (selectedService === "police") {
                    blob = await generatePolicePDFBlob(formData.police);
                }
                else if (selectedService === "address") {
                    blob = await generateAddressPDFBlob(formData.address);
                }

                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
                const page = await pdf.getPage(1);

                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d");

                await page.render({ canvasContext: context, viewport }).promise;

                const imageDataURL = canvas.toDataURL(type === "jpg" ? "image/jpeg" : "image/png");

                const a = document.createElement("a");
                a.href = imageDataURL;
                const referenceId =
                    selectedService === "court"
                        ? formData?.court?.reference_id || "Unknown"
                        : selectedService === "address"
                            ? formData?.address?.candidateName || "Unknown"
                            : formData?.police?.reference_id || "Unknown";

                // Construct download name
                const downloadName =
                    selectedService === "court"
                        ? `${formData?.court?.reference_id || "Unknown"} Court Report`
                        : selectedService === "address"
                            ? `${formData?.address?.reference_id || "Unknown"} Address Report`
                            : `${formData?.police?.reference_id || "Unknown"} Police Report`;

                // Set download attribute and trigger click
                a.download = `${referenceId} ${downloadName}.${type || "pdf"}`;
                a.click();

            }

            // Word
            else if (type === "word") {
                if (selectedService === "court") {
                    await generateCourtDOCX(formData.court);
                } else if (selectedService === "police") {
                    await generatePoliceDOCX(formData.police);
                }
                else if (selectedService === "address") {
                    await generateAddressDOCX(formData.address);
                }
            }

            // Optional API call after download
            if (typeof submitRecords === "function") {
                await submitRecords(type, isEdit);
            }

            Swal.close();
        } catch (error) {
            console.error('Download failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while generating the file.'
            });
        }
    };

    const generateAddressPDFBlobSave = async (addressData) => {
        const doc = await generateAddressPDF(addressData, false);
        return doc.output("blob");
    };
    const generateCourtPDFBlobSave = async (courtData) => {
        const doc = await generateCourtPDF(courtData, false);
        return doc.output("blob");
    };
    const generatePolicePDFBlobSave = async (policeData) => {
        const doc = await generatePolicePDF(policeData, false);
        return doc.output("blob");
    };

    const handleSave = async (row) => {

        try {
            const parsedData = row?.data ? JSON.parse(row.data) : {};

            let blob;

            switch (row?.type) {
                case "court":
                    blob = await generateCourtPDFBlobSave(parsedData);
                    break;
                case "police":
                    blob = await generatePolicePDFBlobSave(parsedData);
                    break;
                case "address":
                    blob = await generateAddressPDFBlobSave(parsedData);
                    break;
                default:
                    return;
            }

            // Load PDF.js
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            // Convert first page of PDF to JPG
            const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            const imageDataURL = canvas.toDataURL("image/jpeg", 1.0);

            // Trigger download
            const a = document.createElement("a");
            a.href = imageDataURL;
            a.download = `${parsedData?.reference_id || "report"}-${row.type}.jpg`;
            a.click();

        } catch (error) {
            console.error("❌ Error in handleSave:", error);
        }
    };



    useEffect(() => {
        fetchData();
    }, [])
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
                const url = `https://api.screeningstar.co.in/integrated-service/delete?id=${id}&admin_id=${adminId}&_token=${token}`;
                fetch(url, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((result) => {
                        // console.log("Delete success:", result);
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
                Swal.fire('Cancelled', '', 'info');
            }
        });
    };
    const handleEdit = (row) => {
        if (editData === row) {
            setSelectedService("");
            setFormData({});
            setIsEdit(false);
            setEditData(null);
        } else {
            setEditData(row);
            setIsEdit(true);
            console.log('row', row)

            const parsedData = JSON.parse(row.data || "{}");
            console.log('parsedData', parsedData)
            if (row.type === "police") {
                setSelectedService("police");
                setFormData((prev) => ({ ...prev, police: parsedData }));
            } if (row.type === "court") {
                setSelectedService("court");
                setFormData((prev) => ({
                    ...prev,
                    court: { ...parsedData, courtTable: parsedData.courtTable || [] },
                }));
            }
            if (row.type === "address") {
                setSelectedService("address");
                setFormData((prev) => ({
                    ...prev,
                    address: { ...parsedData, address: parsedData.address || [] },
                }));
            }
        }
    };


    // Bulk download JPG for selected rows

    const handleBulkSaveJPGZip = async () => {
        if (selectedRows.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No rows selected",
                text: "Please select at least one row to download.",
            });
            return;
        }

        Swal.fire({
            title: "Please wait...",
            text: "Generating files...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const zip = new JSZip();

            for (const rowId of selectedRows) {
                const row = paginatedData.find((r) => r.id === rowId);
                if (!row) continue;

                console.log("🔵 Processing row:", row);

                // --- Generate PDF blob first ---
                let blob;
                const parsedData = row?.data ? JSON.parse(row.data) : {};

                switch (row?.type) {
                    case "court":
                        blob = await generateCourtPDFBlobSave(parsedData);
                        break;
                    case "police":
                        blob = await generatePolicePDFBlobSave(parsedData);
                        break;
                    case "address":
                        blob = await generateAddressPDFBlobSave(parsedData);
                        break;
                    default:
                        continue;
                }

                // --- PDF → JPG ---
                const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
                const page = await pdf.getPage(1); // first page only
                const viewport = page.getViewport({ scale: 2 });

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport }).promise;

                // Convert canvas to Blob
                const jpgBlob = await new Promise((resolve) => {
                    canvas.toBlob(resolve, "image/jpeg", 1.0);
                });

                // Add JPG to ZIP
                const fileName = `${parsedData?.reference_id || "report"}-${row.type}.jpg`;
                zip.file(fileName, jpgBlob);
            }

            // Generate ZIP
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "reports.zip"); // triggers download

            Swal.close();
            Swal.fire({
                icon: "success",
                title: "Done!",
                text: "All selected reports downloaded as ZIP.",
            });
        } catch (error) {
            console.error("❌ Bulk ZIP download failed:", error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Something went wrong during ZIP download.",
            });
        }
    };

    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [paginatedData, loading]);

    {
        loading && (
            <div className="flex w-full bg-white  justify-center items-center h-20">
                <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
            </div>
        )
    }



    return (
        <div className="">
            <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto">
                <div className='md:flex justify-between items-center'>
                    <div className="bg-white p-8 rounded-lg border border-gray-300 shadow-md w-full max-w-5xl mx-auto">
                        <div className="py-6 max-w-5xl mx-auto">
                            <div ref={formRef} className="bg-white p-8 rounded-lg border border-gray-300 shadow-md">
                                {/* Service dropdown */}
                                <div className="mb-6">
                                    <label className="block mb-2 font-semibold text-gray-700">Select Service</label>
                                    <select
                                        value={selectedService}
                                        onChange={handleServiceChange}
                                        className="w-full border border-gray-300 rounded-md p-3 bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">-- Select a Service --</option>
                                        <option value="police">Police Record Report [LAW FIRM]</option>
                                        <option value="court">Court Record Report</option>
                                        <option value="address">Address Verification</option>
                                    </select>
                                </div>

                                {/* Police Report Fields */}
                                {selectedService === "police" && (
                                    <>
                                        <div className="border border-gray-200 p-3 rounded-md mb-3">
                                            <div className='font-bold text-lg'>Bulk Upload Police Records</div>
                                            <div className="file-upload-wrapper text-left">

                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById("fileInput").click()}
                                                    className="upload-button bg-green-500 mt-2  transition-all duration-200 hover:bg-green-600 hover:scale-105"
                                                >
                                                    Upload CSV
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={downloadSampleFile}
                                                    className="upload-button bg-blue-500 mt-2 ms-2  transition-all duration-200 hover:bg-blue-600 hover:scale-105"
                                                >
                                                    Download Sample File
                                                </button>

                                                {/* Hidden Input */}
                                                <input
                                                    id="fileInput"
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={(e) => handleFileUpload(e, 'police')}
                                                    className="hidden"
                                                />

                                                {/* Display File Name Conditionally */}
                                                <input
                                                    type="text"
                                                    value={isFileValid ? fileName : ""}
                                                    placeholder="No file selected"
                                                    readOnly
                                                    className="file-name-input mb-4 mt-2 p-3 border rounded w-full"
                                                />
                                                <button
                                                    type="submit"
                                                    onClick={() => submitRecordsBulk('policeBulk')}
                                                    className={`p-6 mb-3 py-3 bg-[#2c81ba]  transition-all duration-200 hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Submit

                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {policeFields.map((field) => {
                                                const name = field.toLowerCase().replace(/[^a-z0-9\s_]/g, '')      // Remove special characters
                                                    .replace(/\s+/g, '_')              // Replace spaces with underscores
                                                    .replace(/__+/g, '_');;
                                                return (
                                                    <>

                                                        <div key={field} className="w-full">
                                                            <label className="block mb-1 font-medium text-gray-700">{field}</label>
                                                            <input
                                                                type="text"
                                                                name={name}
                                                                placeholder={`Enter ${field}`}
                                                                value={formData[selectedService]?.[name] || ""}
                                                                onChange={handleChange}
                                                                className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                {/* Court Report Fields */}
                                {selectedService === "address" && (
                                    <div className="grid md:grid-cols-2 gap-6">

                                        {formFields.map(({ name, label, type, options }) => (
                                            <div key={name} className="mb-1">
                                                <label className="block mb-1 font-medium">{label}</label>

                                                {type === "textarea" ? (
                                                    <textarea
                                                        name={name}
                                                        value={formData[selectedService]?.[name] || ""}
                                                        onChange={handleChange}
                                                        rows={1}
                                                        className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"

                                                    />
                                                ) : type === "select" ? (
                                                    <select
                                                        name={name}
                                                        value={formData[selectedService]?.[name] || ""}
                                                        onChange={handleChange}
                                                        className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"

                                                    >
                                                        <option value="">-- Select --</option>
                                                        {(options || []).map((opt) => (
                                                            <option key={opt} value={opt}>
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : type === "file" ? (
                                                    <input
                                                        type="file"
                                                        name={name}
                                                        onChange={handleChange}
                                                        className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"

                                                        accept="image/*"
                                                    />
                                                ) : (
                                                    <input
                                                        type={type}
                                                        name={name}
                                                        value={formData[selectedService]?.[name] || ""}
                                                        onChange={handleChange}
                                                        className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"

                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                )}
                                {selectedService === "court" && (
                                    <>
                                        <div className="border border-gray-200 p-3 rounded-md mb-3">
                                            <div className='font-bold text-lg'>Bulk Upload Court Records</div>
                                            <div className="file-upload-wrapper text-left">

                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById("fileInput").click()}
                                                    className="upload-button bg-green-500 mt-2  transition-all duration-200 hover:bg-green-600 hover:scale-105"
                                                >
                                                    Upload CSV
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={downloadSampleFileCourt}
                                                    className="upload-button bg-blue-500 mt-2 ms-2  transition-all duration-200 hover:bg-blue-600 hover:scale-105"
                                                >
                                                    Download Sample File
                                                </button>

                                                {/* Hidden Input */}
                                                <input
                                                    id="fileInput"
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={(e) => handleFileUpload(e, 'court')}
                                                    className="hidden"
                                                />

                                                {/* Display File Name Conditionally */}
                                                <input
                                                    type="text"
                                                    value={isFileValid ? fileName : ""}
                                                    placeholder="No file selected"
                                                    readOnly
                                                    className="file-name-input mb-4 mt-2 p-3 border rounded w-full"
                                                />
                                                <button
                                                    type="submit"
                                                    onClick={() => submitRecordsBulk('courtBulk')}
                                                    className={`p-6 mb-3 py-3 bg-[#2c81ba]  transition-all duration-200 hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Submit

                                                </button>
                                            </div></div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {courtFields.map((field) => {
                                                const name = field.toLowerCase().replace(/[^a-z0-9\s_]/g, '')      // Remove special characters
                                                    .replace(/\s+/g, '_')              // Replace spaces with underscores
                                                    .replace(/__+/g, '_');;
                                                return (
                                                    <>

                                                        <div key={field} className="w-full">
                                                            <label className="block mb-1 font-medium text-gray-700">{field}</label>
                                                            <input
                                                                type="text"
                                                                name={name}
                                                                placeholder={`Enter ${field}`}
                                                                value={formData[selectedService]?.[name] || ""}
                                                                onChange={handleChange}
                                                                className="w-full rounded-md p-3 border border-gray-300 bg-[#f7f6fb] focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            })}
                                        </div>

                                        {/* Dynamic Table */}
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Court Details Table</h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border border-gray-300">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 border">COURT/CHECK TYPE</th>
                                                            <th className="px-4 py-2 border">JURISDICTION</th>
                                                            <th className="px-4 py-2 border">LOCATION</th>
                                                            <th className="px-4 py-2 border">VERIFICATION RESULT</th>
                                                            <th className="px-4 py-2 border">ACTION</th> {/* New column */}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(formData.court?.courtTable || []).map((row, index) => (
                                                            <tr key={index} className="bg-white">
                                                            {["courtCheckType", "jurisdiction", "location", "verificationResult"].map(
  (fieldKey) => (
    <td key={fieldKey} className="border px-2 py-2">
      <input
        type="text"
        placeholder="Enter"
        value={row[fieldKey]}
        onChange={(e) => handleRowChange(index, fieldKey, e.target.value)}
        className="w-full rounded-md p-2 border border-gray-300 bg-[#f7f6fb]"
      />
    </td>
  )
)}


                                                                <td className="border px-2 py-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeRow(index)}
                                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {(formData.court?.courtTable || []).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                                                    No rows added yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>

                                                </table>

                                            </div>
                                            <div className="flex justify-left gap-4">
                                                {(formData.court?.courtTable?.length || 0) < 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={addRow}
                                                        className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        Add Row
                                                    </button>
                                                )}


                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>

                            {/* Download buttons */}
                            <div className="flex flex-wrap gap-4 mt-8">
                                <button
                                    onClick={() => handleDownload("pdf")}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => handleDownload("word")}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Download Word
                                </button>
                                <button
                                    onClick={() => handleDownload("png")}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Download PNG
                                </button>
                                <button
                                    onClick={() => handleDownload("jpg")}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                >
                                    Download JPG
                                </button>
                                {selectedRows.length > 0 && (
                                    <button
                                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        onClick={handleBulkSaveJPGZip}
                                    >
                                        Download Selected as JPG
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3  mb-3 items-stretch">
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border rounded-lg w-3/12  px-3 py-2 text-gray-700 bg-white mt-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                            >
                                {optionsPerPage.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Search by Reference ID, Name,Type and Format"
                                className="rounded-md p-2.5 w-9/12 border border-gray-300"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>

                        <div className="table-container rounded-lg">
                            {/* Top Scroll */}
                            <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                                <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                            </div>

                            {/* Actual Table Scroll */}
                            <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>

                                <table className="min-w-full border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>

                                            <th className="px-4 me-2 py-2 border"><input
                                                type="checkbox"
                                                checked={
                                                    paginatedData.length > 0 &&
                                                    selectedRows.length === paginatedData.length
                                                }
                                                onChange={handleSelectAll}
                                            /> SR.</th>
                                            <th className="px-4 py-2 border">Full Name</th>
                                            <th className="px-4 py-2 border">Reference Id</th>
                                            <th className="px-4 py-2 border">EXPORT FORMAT</th>
                                            <th className="px-4 py-2 border">TYPE</th>
                                            <th className="px-4 py-2 border">DATA</th>
                                            <th className="px-4 py-2 border">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((row, index) => {
                                            const parsedData = JSON.parse(row.data);
                                            return (
                                                <tr key={row.id} className="bg-white">

                                                    <td className="border text-center px-2 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.includes(row.id)}
                                                            onChange={() => handleCheckboxChange(row.id)}
                                                        />  {index + 1 + (currentPage - 1) * rowsPerPage}
                                                    </td>
                                                    <td className="border text-center px-2 py-2">
                                                        {parsedData.full_name || parsedData.candidateName || "N/A"}
                                                    </td>
                                                    <td className="border text-center px-2 py-2">
                                                        {parsedData.reference_id || "N/A"}
                                                    </td>
                                                    <td className="border px-2 uppercase py-2 text-center">
                                                        {row.export_format || "N/A"}
                                                    </td>
                                                    <td className="border px-2 py-2 text-center">
                                                        {row.type || "N/A"}
                                                    </td>
                                                    <td className="border px-2 py-2 text-center">
                                                        <button
                                                            className="p-6 py-3 font-bold whitespace-nowrap transition duration-200 text-white rounded-md bg-sky-500 hover:bg-sky-600 hover:scale-105"
                                                            onClick={() => handleSave(row)}
                                                        >
                                                            Save
                                                        </button>
                                                    </td>
                                                    <td className="border px-2 py-2 text-center">
                                                        <div className="flex gap-4 justify-center items-center">
                                                            <button
                                                                onClick={() => handleEdit(row)}
                                                                className={`p-6 py-3 font-bold whitespace-nowrap transition duration-200 text-white rounded-md
                        ${editData === row
                                                                        ? "bg-orange-500 hover:bg-orange-600 hover:scale-105"
                                                                        : "bg-green-500 hover:bg-green-600 hover:scale-105"
                                                                    }`}
                                                            >
                                                                {editData === row ? "Cancel" : "Edit"}
                                                            </button>

                                                            <button
                                                                onClick={() => handleApplicationDelete(row.id)}
                                                                className={`p-6 py-3 font-bold whitespace-nowrap transition duration-200 text-white rounded-md bg-red-500 hover:bg-red-600 hover:scale-105 ${deleteLoading === row.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                                    }`}
                                                                disabled={deleteLoading === row.id}
                                                            >
                                                                {deleteLoading === row.id ? " Deleting..." : " Delete"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedData.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-gray-500">
                                                    No rows added yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
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
                        {isModalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative max-h-[80vh] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4">JSON Data</h2>
                                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(modalData, null, 2)}
                                    </pre>
                                    <button
                                        onClick={closeModal}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>



        </div>

    );
};
export default InactiveClients;