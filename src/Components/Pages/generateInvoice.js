import { React, useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { State } from "country-state-city";

import SelectSearch from "react-select-search";
import "react-select-search/style.css";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from '../ApiLoadingContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
const GenerateInvoice = () => {
  const [activeList, setActiveList] = useState([]);
  const [clientCode, setClientCode] = useState("");
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

  const states = State.getStatesOfCountry("IN"); // Gets all Indian states

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [overAllAmountWithTax, setoverAllAmountWithTax] = useState("");
  const [taxableValue, setTaxableValue] = useState("");
  const [totalGst, setTotalGst] = useState("");
  const [serviceInfo, setServiceInfo] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationData, setApplicationData] = useState([]);
  const [overallServiceAmount, setOverallServiceAmount] = useState([]);
  const [cgst, setCgst] = useState([]);
  const getStateNameFromCode = (code) => {
    const state = states.find((st) => st.isoCode === code.toUpperCase());
    return state ? state.name : "N/A";
  };
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [sgst, setSgst] = useState([]);
  const [totalTax, setTotalTax] = useState([]);
  const [totalAmount, setTotalAmount] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const navigate = useNavigate();
  console.log('years', years)
  const [formData, setFormData] = useState({
    client_code: '',
    invoice_number: "",
    invoice_date: "",
    month: "",
    year: "",
  });
  useEffect(() => {
    try {
      if (customer && customer.services) {
        // Parse the `services` string safely
        const parsedServices = JSON.parse(customer.services);

        // Extract service data
        const extractedServices = parsedServices.flatMap((group) =>
          group.services.map(
            ({ serviceId, serviceTitle, serviceCode, price }) => ({
              serviceId,
              serviceTitle,
              serviceCode,
              price,
            })
          )
        );

        // Update state with the extracted data
        setServicesData(extractedServices);
      }
    } catch (error) {
      console.error("Error parsing customer services:", error.message);
    }
  }, [customer.services]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    // Clear the error message for the specific field as soon as the user types
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };




  const options = activeList.map((client) => ({
    name: client.name + `(${client.client_unique_id})`,
    value: client.id,
  }));

  const fetchActiveAccounts = useCallback(async () => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    setApiLoading(true);
    if (!admin_id || !storedToken) {
      setApiLoading(false);
      console.error("Admin ID or token not found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/customer/list-with-basic-info?admin_id=${admin_id}&_token=${storedToken}`,
        {
          method: "GET",
          redirect: "follow",
        }
      );

      if (!response.ok) {
        setApiLoading(false);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      setApiLoading(false);

      const result = await response.json();
      const newToken = result.token || result._token || storedToken;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }
      setActiveList(result.customers);
    } catch (error) {
      setApiLoading(false);

      console.error("Failed to fetch active accounts:", error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin(); // Verify admin first
          await fetchActiveAccounts();
        }// Fetch data after verification
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login"); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [navigate, fetchActiveAccounts]);
  function addFooter(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); // Go to each page

      // Clear previous footer space (optional: if overlapping still happens)
      // doc.setFillColor(255, 255, 255); // white
      // doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

      // Set font for footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);

      // Footer text
      const footerText = `Page ${i} of ${totalPages}`;

      // Print centered footer at the bottom
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
    }
  }



  const fetchPdfData = useCallback(async (overAllCgstTaxs, overAllSgstTaxs, overAllIGSTTaxs, totalGsts, totalAmounts, taxableValuess, overAllAmountWithTaxs, companynames, customer) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      console.error("No token found. Please log in.");
      return;
    }

    // Ensure formData and customer are properly defined before using them
    const { month, year, invoice_date, invoice_number } = formData || {};
    const { gst_number, state, state_code } = customer || {};

    const raw = JSON.stringify({
      admin_id,
      _token: storedToken,
      customer_id: formData.client_code,
      month: month,
      year: year,
      orgenization_name: companynames,
      gst_number: customer.gst_number,
      state: customer.state,
      state_code: customer.state_code,
      invoice_date: formData.invoice_date,
      invoice_number: formData.invoice_number,
      taxable_value: taxableValuess,
      cgst: overAllCgstTaxs,
      sgst: overAllSgstTaxs,
      igst: overAllIGSTTaxs,
      total_gst: totalGsts,
      invoice_subtotal: totalAmounts
    });

    try {
      const response = await axios.post(
        `https://api.screeningstar.co.in/invoice-master/send-data`,
        raw,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          }
        }
      );

      const result = response.data;
      const newToken = result.token || result._token || storedToken;

      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (result.status) {
        // handle success here
        console.log("Data successfully sent");
      } else {
        console.error("Failed to fetch packages. Status:", result.status);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      // Ensure loading is set to false in the finally block (if you have a loading state)
      // Example: setLoading(false);
    }
  }, [formData, customer, companyName, taxableValue, totalGst,]);







  const handleSubmit = async (e) => {
    e.preventDefault();
    // Set loading state to true
    setLoading(true);
    // Validate form data
    const validationErrors = {};
    if (!formData.client_code) validationErrors.client_code = 'Client Code is required';
    if (!formData.invoice_number) validationErrors.invoice_number = 'Invoice Number is required';
    if (!formData.invoice_date) validationErrors.invoice_date = 'Invoice Date is required';
    if (!formData.month) validationErrors.month = 'Month is required';
    if (!formData.year) validationErrors.year = 'Year is required';

    // If there are validation errors, update the error state and stop further processing
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Extract data for API request
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    const { month, year } = formData;
    const customer_id = formData.client_code;

    console.log("Admin ID:", admin_id);
    console.log("Stored Token:", storedToken);
    console.log("Customer ID:", customer_id);
    console.log("Month:", month);
    console.log("Year:", year);

    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    try {
      console.log("Sending fetch request...");
      const response = await fetch(
        `https://api.screeningstar.co.in/generate-invoice?customer_id=${customer_id}&admin_id=${admin_id}&_token=${storedToken}&month=${month}&year=${year}`,
        requestOptions
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      console.log("Response data:", data);

      // Update the token if available
      const newToken = data.token || data._token || storedToken;
      if (newToken) {
        console.log("New token received:", newToken);
        localStorage.setItem("_token", newToken);
      }
      // setClientCode(formData.client_code);

      // Update state with response data
      setServiceInfo(data.finalArr.serviceInfo);
      setOverallServiceAmount(data.finalArr.costInfo.overallServiceAmount);
      setCgst(data.finalArr.costInfo.cgst);
      setSgst(data.finalArr.costInfo.sgst);
      setTotalTax(data.finalArr.costInfo.totalTax);
      setTotalAmount(data.finalArr.costInfo.totalAmount);
      setCustomer(data.customer || []);
      setApplications(data.applications);

      /*
      setFormData({
        client_code: '',
        invoice_number: "",
        invoice_date: "",
        month: "",
        year: "",
      });
      */

      if (applications.length > 0) {
        Swal.fire({
          icon: "success",
          title: "Invoice Generated Successfully",
          text: "Your invoice data is ready. Proceeding to generate the PDF...",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Success alert when there are no applications
        Swal.fire({
          icon: "success",
          title: "Success",
          text: " But You don't have any applications to process.",
          timer: 3000,
          timerProgressBar: true,
        });
      }


      // Proceed with PDF generation if the data is ready
      if (data.status) {
        console.log("PDF available, generating...");
        await generatePdf(
          data.serviceNames,
          data.finalArr.serviceInfo,
          data.finalArr.costInfo.overallServiceAmount,
          data.finalArr.costInfo.cgst,
          data.finalArr.costInfo.sgst,
          data.finalArr.costInfo.totalTax,
          data.customer || [],
          data.applications,
          data.finalArr.costInfo.totalAmount,
          data.companyInfo
        );
      } else {
        Swal.fire({
          icon: "warning",
          title: "PDF Not Available",
          text: "Unable to generate the PDF. Please try again later.",
        });
      }
    } catch (error) {
      // Error alert
      // Swal.fire({
      //   icon: "error",
      //   title: "Error",
      //   text: `An error occurred: ${error.message}`,
      // });
      console.error("Fetch error:", error);
    } finally {
      // Turn off loading state
      setLoading(false);
    }
  };

  function numberToWords(num) {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    }

    const [whole, decimal] = num.toFixed(2).split('.');
    let words = inWords(Number(whole)) + ' Rupees';
    if (Number(decimal) > 0) {
      words += ' and ' + inWords(Number(decimal)) + ' Paise';
    }
    return words + ' Only';
  }

  const generatePdf = (serviceNames, serviceInfo, overallServiceAmount, cgst, sgst, totalTax, customer, applications, totalAmounts, companyInfo) => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const leftMargin = 10;
    const topMargin = 10;
    const padding = 5; // Padding between content and borders
    const columnHeight = 50;
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date)) return "Invalid Date";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    };

    // Define column widths (Ensure total = pageWidth - margins)
    const firstColumnWidth = (pageWidth - 2 * leftMargin) * 0.25; // 25% of available width
    const secondColumnWidth = (pageWidth - 2 * leftMargin) * 0.50; // 50% of available width
    const thirdColumnWidth = (pageWidth - 2 * leftMargin) * 0.25; // 25% of available width
    const logoBase64 = "/screeningLogoNew.png";
    doc.rect(leftMargin, topMargin, firstColumnWidth, columnHeight); // Add border around first column
    doc.addImage(
      logoBase64,
      "PNG",
      leftMargin + padding,
      topMargin + padding,
      60, // Set width to 60px
      20  // Set height to 60px
    );

    // Second column (Company Details)
    const secondColumnX = leftMargin + firstColumnWidth;
    doc.rect(secondColumnX, topMargin, secondColumnWidth, columnHeight); // Add border around second column

    const textX = secondColumnX + secondColumnWidth / 2; // Center the text horizontally in the column
    const textY = topMargin + 8.5; // Start position for the text

    const companyName = companyInfo?.name || 'N/A';
    setCompanyName(companyName);
    const companynames = companyName;

    // if (companyInfo?.address) {
    //   addressLines = companyInfo.address.split(",");
    // }
    const addressLines = [
      "No-19/4 & 27",
      " IndiQube Alpha",
      " ",
      " 1st Floor B4",
      " Outer Ring Road Kadubeesanahalli",
      "Panathur Junction",
      " Bangalore",
      " Pin code – 560103",
      " Karnataka",
      " India"
    ];

    let formattedLine1 = "";
    let formattedLine2 = "";
    let formattedLine3 = "";

    // Loop through the address array
    for (let i = 0; i < addressLines.length; i++) {
      if (i <= 2) {
        // Combine first three parts into one line
        if (formattedLine1) {
          formattedLine1 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine1 = addressLines[i].trim();
        }
      } else if (i >= 3 && i <= 5) {
        // Next few for line 2
        if (formattedLine2) {
          formattedLine2 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine2 = addressLines[i].trim();
        }
      } else {
        // Remaining for line 3 (e.g., pincode etc.)
        if (formattedLine3) {
          formattedLine3 += `, ${addressLines[i].trim()}`;
        } else {
          formattedLine3 = addressLines[i].trim();
        }
      }
    }



    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('SCREENINGSTAR SOLUTIONS PRIVATE LIMITED', textX, textY, { align: "center" });
    // addFooter(doc); // Add footer for this page

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    // Check and add formatted lines if they are not empty
    if (formattedLine1) {
      const textWidth = doc.getTextWidth(formattedLine1);
      doc.text(formattedLine1, textX, textY + 5, { align: "center", maxWidth: secondColumnWidth - 2 });
    }
    if (formattedLine2) {
      doc.text(formattedLine2, textX, textY + 10, { align: "center" });
    }
    if (formattedLine3) {
      doc.text(formattedLine3, textX, textY + 15, { align: "center" });
    }

    // Check and add company info if it's available
    if (companyInfo?.phone_number && companyInfo?.email) {
      doc.text(
        `PH: 9980004953 | Email: ${companyInfo.email}`,
        textX,
        textY + 20,
        { align: "center" }
      );
    }
    if (companyInfo?.website) {
      doc.text(`Web: www.screeningstar.com`, textX, textY + 25, { align: "center" });
    }

    // Check and add tax information if available
    if (companyInfo?.pan && companyInfo?.gstin) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(
        `PAN: ${companyInfo.pan}, GSTIN: ${companyInfo.gstin}`,
        textX,
        textY + 30,
        { align: "center" }
      );
    }

    if (companyInfo?.udhyam_number) {
      doc.text(
        `Udhyam Aadhar Number: ${companyInfo.udhyam_number}`,
        textX,
        textY + 35,
        { align: "center" }
      );
    }


    // Third column (QR Code)
    const thirdColumnX = secondColumnX + secondColumnWidth; // Correct position for third column
    const qrCodeBase64 =
      "/screeningstarqr-9654317.webp"; // Replace with your base64-encoded image or a URL
    doc.rect(thirdColumnX, topMargin, thirdColumnWidth, columnHeight); // Add border around third column

    // Set image size to 60px by 60px
    doc.addImage(
      qrCodeBase64,
      "PNG",
      thirdColumnX + (thirdColumnWidth - 35) / 2, // Center the QR code horizontally
      topMargin + (columnHeight - 35) / 2, // Center the QR code vertically
      35, // Set width to 60px
      35  // Set height to 60px
    );

    // Add "TAX INVOICE" text
    const taxInvoiceHeight = 6; // Background height
    const taxInvoiceY = topMargin + columnHeight + 5; // Position below the columns

    // Draw background rectangle
    doc.setFillColor(193, 223, 242);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.rect(leftMargin, taxInvoiceY, pageWidth - 2 * leftMargin, taxInvoiceHeight, "FD");

    // Add centered "TAX INVOICE" text
    const taxInvoiceX = pageWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.setTextColor(77, 96, 107); // Equivalent to #4d606b
    doc.text("TAX INVOICE", taxInvoiceX, taxInvoiceY + taxInvoiceHeight / 2 + 1, { align: "center" });
    const rowHeight = 6; // Height of the new row
    const rowY = taxInvoiceY + taxInvoiceHeight - 5; // Position below the "TAX INVOICE" background

    const columnWidth = (pageWidth - 2 * leftMargin) / 2; // 50% width
    const column1X = leftMargin; // Left column start
    const column2X = leftMargin + columnWidth; // Right column start

    // Column 1 (Invoice Details)

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0); // Black text
    // Column 2 (Details of Service Recipient)
    // Add second row (for "Bill To", "Attention", etc.)
    const rowHeightNext = 35; // Height of the new row
    const rowYNext = rowY + rowHeight + 5; // Position below the first row

    const column1XNext = leftMargin; // Left column start
    const column2XNext = leftMargin + columnWidth; // Right column start

    // Column 1 (Bill To and Attention)
    doc.rect(column1XNext, rowYNext, columnWidth, rowHeightNext); // Add border
    doc.setFont("helvetica", "normal");

    // Labels and Values in the first column (Bill To and Attention)

    let labelY = rowYNext + padding; // Start Y position for labels in the first column

    // --- Bill To ---
    const orgName = customer.name || "N/A";
    const address = customer.address || "N/A";

    // Set font for the label and content
    doc.setFont("helvetica", "normal");

    // Print "To," on the first line
    doc.text("To,", column1XNext + padding, labelY);

    // Move to next line for company name
    labelY += 7;
    doc.text(orgName, column1XNext + padding, labelY);

    // Move to next line for address, with wrapping if needed
    labelY += 7;
    const wrappedAddress = doc.splitTextToSize(`${address}`, columnWidth - 7);
    doc.text(wrappedAddress, column1XNext + padding, labelY);

    // Update Y position after the address
    labelY += wrappedAddress.length * 7;

    doc.setFont("helvetica", "normal");

    doc.rect(column2XNext, rowYNext, columnWidth, rowHeightNext); // Add border

    // Labels and Values in the second column (Client GST NO, Invoice Number, etc.)
    let labelYSecondColumn = rowYNext + padding; // Start Y position for labels in the second column
    doc.text("GSTIN", column2XNext + padding, labelYSecondColumn); // Client GST NO label
    doc.text(customer.gst_number || "Not Registered", column2XNext + 40, labelYSecondColumn); // Value for Client GST NO
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("Invoice Number", column2XNext + padding, labelYSecondColumn); // Invoice Number label
    doc.text(formData.invoice_number, column2XNext + 40, labelYSecondColumn); // Value for Invoice Number
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("State", column2XNext + padding, labelYSecondColumn); // State label
    doc.text(getStateNameFromCode(customer.state) || "N/A", column2XNext + 40, labelYSecondColumn); // Value for State
    labelYSecondColumn += 7; // Move to next row with 5px gap
    const formattedDateInvoice = formatDate(formData.invoice_date);

    doc.text("Date Of Invoice", column2XNext + padding, labelYSecondColumn); // Date Of Service label
    doc.text(formattedDateInvoice, column2XNext + 40, labelYSecondColumn); // Value for Date Of Service
    labelYSecondColumn += 7; // Move to next row with 5px gap

    doc.text("State Code", column2XNext + padding, labelYSecondColumn); // State Code label
    doc.text(customer.state_code || "N/A", column2XNext + 40, labelYSecondColumn); // Value for State Code
    // Calculate Y position for the table, just below the second column's labels
    const tableStartY = labelYSecondColumn + 10; // Adjust as needed for spacing

    const serviceCodes = serviceInfo.map((service) => {
      const matchedService = serviceNames.find(
        (some) => Number(some.id) === Number(service.serviceId)
      );
      return matchedService ? matchedService.shortCode : null;
    });

    let totalSubPrice = 0;

    const overAllCgstPercentage = parseInt(cgst.percentage, 10);
    const overAllSgstPercentage = parseInt(sgst.percentage, 10);
    const overAllTotalTaxPercentage = overAllCgstPercentage + overAllSgstPercentage;

    // Dynamic Table Rows for Annexure
    let overallApplicationsAdditionalFeeSum = 0;
    let overallApplicationsServicePricesSum = 0;
    let overallApplicationsTotalPricing = 0;
    let overallApplicationsTotalTax = 0;
    let overallApplicationsTotalPriceWithTax = 0;
    let overallServicePricingByService = [];
    let result;
    const tableBody2 = applications.flatMap((applicationArr) => {
      return applicationArr.applications.map((app) => {
        const servicePrices = serviceInfo.map((service) => {
          const matchedService = app.statusDetails.find(
            (status) => Number(status.serviceId) === Number(service.serviceId)
          );
          if (matchedService) {
            const existingService = overallServicePricingByService.find(
              (item) => item.id === service.serviceId
            );

            if (existingService) {
              existingService.totalPrice += service.price || 0;
              existingService.price = service.price || 0;
              existingService.qty += 1;
            } else {
              overallServicePricingByService.push({
                id: service.serviceId,
                totalPrice: service.price || 0,
                price: service.price || 0,
                qty: 1,
                totalAddFee: 0,
              });
            }

            return (service.price || 0).toFixed(2); // Format service price to 2 decimal places
          }

          return "0.00"; // Ensure the return value is formatted
        });

        const serviceAdditionalFee = serviceInfo.map((service) => {
          const matchedService = app.statusDetails.find(
            (status) => Number(status.serviceId) === Number(service.serviceId)
          );

          if (matchedService) {
            const existingService = overallServicePricingByService.find(
              (item) => item.id === service.serviceId
            );

            const additionalFeeValue = Number(matchedService.additionalFee);
            const validAdditionalFee = isNaN(additionalFeeValue)
              ? 0
              : additionalFeeValue;

            if (existingService) {
              existingService.totalAddFee += validAdditionalFee || 0;
            } else {
              overallServicePricingByService.push({
                id: service.serviceId,
                totalPrice: 0,
                totalAddFee: validAdditionalFee || 0,
                price: service.price || 0,
                qty: 1,
              });
            }

            return (validAdditionalFee || 0).toFixed(2);
          }
          return "NIL";
        });
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

        const additionalFeeSum = serviceAdditionalFee
          .filter((item) => !isNaN(item))
          .reduce((acc, curr) => acc + parseFloat(curr), 0)
          .toFixed(2);

        const servicePricesSum = servicePrices
          .filter((item) => !isNaN(item))
          .reduce((acc, curr) => acc + parseFloat(curr), 0)
          .toFixed(2);

        const appTotalPricing = (
          parseFloat(additionalFeeSum) + parseFloat(servicePricesSum)
        ).toFixed(2); // Format total pricing to 2 decimal places
        const appTotalTax = (
          parseFloat(appTotalPricing) * (overAllTotalTaxPercentage / 100)
        ).toFixed(2);

        overallApplicationsAdditionalFeeSum += parseFloat(additionalFeeSum);
        overallApplicationsServicePricesSum += parseFloat(servicePricesSum);
        overallApplicationsTotalPricing += parseFloat(appTotalPricing);
        overallApplicationsTotalTax += parseFloat(appTotalTax);

        overallApplicationsTotalPriceWithTax +=
          parseFloat(appTotalPricing) + parseFloat(appTotalTax);

        // Create an object dynamically for each service code with corresponding service price
        const servicePriceDetails = serviceCodes.reduce((acc, code, index) => {
          acc[`serviceCode${code}`] = servicePrices[index] || "0.00"; // Default to "0.00" if price is missing
          return acc;
        }, {});

        result = {
          serviceDescription: app.application_id || "NIL",
          hsnCode: app.employee_id || "NIL",
          ...(clientCode === 'SS-OROC' ? {
            check_id: app.check_id,
            ticket_id: app.ticket_id
          } : {}),
          qty: formatDate(app.created_at) || "NIL",
          rate: app.name || "NIL",
          ...Object.fromEntries(Object.entries(servicePriceDetails).map(([key, val]) => [
            key,
            parseFloat(val) % 1 === 0 ? parseInt(val).toString() : parseFloat(val).toString()
          ])),
          additionalFee: parseFloat(additionalFeeSum) % 1 === 0
            ? parseInt(additionalFeeSum).toString()
            : parseFloat(additionalFeeSum).toString(),
          taxableAmount: parseFloat(appTotalPricing) % 1 === 0
            ? parseInt(appTotalPricing).toString()
            : parseFloat(appTotalPricing).toString(),
          reportDate: formatDate(app.report_date) || "Nil",
        };
        return result;

      });
    });
    const taxableValuess = result?.taxableAmount;

    let totalServiceQty = 0;

    const formatAmount = (value) => {
      const num = parseFloat(value);
      return num % 1 === 0 ? String(parseInt(num)) : num.toFixed(2);
    };
    const serviceTableBody = overallServicePricingByService.map((item) => {
      const serviceName = serviceNames.find((name) => name.id === item.id);
      const hsnCode = serviceName ? serviceName.hsnCode : "N/A";
      const title = serviceName ? serviceName.title : "N/A";

      // const price = formatAmount(item.price);
      const price = parseFloat(item.price);
      const totalPrice = parseFloat(item.totalPrice);
      const totalAddFee = parseFloat(item.totalAddFee);
      const formattedTaxableAmount = formatAmount(parseFloat(item.totalPrice) + parseFloat(item.totalAddFee));

      totalServiceQty += item.qty;
      totalSubPrice += price;

      return {
        serviceDescription: title,
        hsnCode: hsnCode,
        qty: item.qty || 0,
        rate: price,
        additionalFee: totalAddFee,
        taxableAmount: formattedTaxableAmount,
      };
    });


    const overallApplicationsTotalPricingWithAdditionalFee = overallApplicationsTotalPricing + overallApplicationsAdditionalFeeSum;

    // ✅ Add Sub Total Row after the map
    serviceTableBody.push({
      serviceDescription: "Sub Total",
      hsnCode: "",
      qty: "", // String(totalServiceQty)
      rate: "", // formatAmount(totalSubPrice)
      additionalFee: formatAmount(overallApplicationsAdditionalFeeSum),
      taxableAmount: formatAmount(overallApplicationsTotalPricing),
    });


    const columns = [
      { header: 'SERVICE DESCRIPTION', dataKey: 'serviceDescription' },
      { header: 'HSN CODE', dataKey: 'hsnCode' },
      { header: 'QTY', dataKey: 'qty' },
      { header: 'RATE', dataKey: 'rate' },
      { header: 'ADDITIONAL FEE', dataKey: 'additionalFee' },
      { header: 'TAXABLE AMOUNT', dataKey: 'taxableAmount' },
    ];
    let tablecontt = 0;

    doc.autoTable({
      columns: columns,
      body: serviceTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        textColor: "#000",
        lineWidth: 0.4,
      },
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const isLastRow = rowIndex === serviceTableBody.length - 1;
        if (isLastRow) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 0) {
          data.cell.styles.halign = 'left';
        }
      },
      // Apply startY only to the first page
      startY: tableStartY, // For example: 40
      margin: { left: leftMargin, right: leftMargin }, // remove top margin override
      tableWidth: 'auto',
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,

      // 👇 This controls page layout on each new page
      didDrawPage: function (data) {
        if (data.pageNumber > 1) {
          tablecontt = 0;
          doc.setFontSize(12);
        }
        else if (data.pageNumber == 1) {
          tablecontt = 1;
        }
      }
    });

    if (tablecontt == 1) {
      doc.addPage();
    }
    // Constants for layout
    // addFooter(doc); // Add footer for this page

    // doc.addPage();
    // addFooter(doc); // Add footer for this page
    let overAllCgstTax = 0;
    let overAllSgstTax = 0;
    let overAllIGSTTax = 0;

    // Check if intra-state (same state, e.g., state_code "29")
    if (customer.state_code === "29") {
      overAllCgstTax = overallApplicationsTotalPricingWithAdditionalFee * (overAllCgstPercentage / 100);
      overAllSgstTax = overallApplicationsTotalPricingWithAdditionalFee * (overAllSgstPercentage / 100);
      overAllIGSTTax = 0; // No IGST for intra-state
    } else {
      overAllIGSTTax = overallApplicationsTotalPricingWithAdditionalFee * (18 / 100); // IGST applied in inter-state
      overAllCgstTax = 0;
      overAllSgstTax = 0;
    }

    // Total GST
    const overAllTotalTax = overAllCgstTax + overAllSgstTax + overAllIGSTTax;

    // Total amount including tax
    const overAllAmountWithTax = overallApplicationsTotalPricingWithAdditionalFee + overAllTotalTax;
    setoverAllAmountWithTax(overAllAmountWithTax);
    const overAllAmountWithTaxs = overAllAmountWithTax;

    const bankDetails = [
      { label: 'Bank Name', value: String(companyInfo?.bank_name || "N/A") },
      { label: 'Bank A/C No', value: String(companyInfo?.bank_account_number || "N/A") },
      { label: 'Bank Branch', value: String(companyInfo?.bank_branch_name || "N/A") },
      { label: 'Bank IFSC/ NEFT/ RTGS', value: String(companyInfo?.bank_ifsc || "N/A") },
      { label: 'MICR', value: String(companyInfo?.bank_micr || "N/A") },
    ];

    // Ensure all values are strings
    const taxDetails = [
      { label: `CGST ${overAllCgstPercentage}%`, value: formatAmount(overAllCgstTax) },
      { label: `SGST ${overAllSgstPercentage}%`, value: formatAmount(overAllSgstTax) },
      {
        label: `IGST ${overAllTotalTaxPercentage}%`,
        value: customer.state_code === "29" ? formatAmount(0) : formatAmount(overAllIGSTTax)
      },
      { label: 'Total GST', value: formatAmount(overAllTotalTax) },
      { label: 'Total Amount with Tax (Round off)', value: formatAmount(overAllAmountWithTax) },
    ];

    const overAllCgstTaxs = overAllCgstTax;
    const overAllSgstTaxs = overAllSgstTax;
    const overAllIGSTTaxs = overAllIGSTTax;
    const totalGsts = overAllTotalTax;


    const bankDetailsWidth = (pageWidth - leftMargin * 2) * 0.4; // 40% width for Bank Details
    const taxDetailsWidth = (pageWidth - leftMargin * 2) * 0.6; // 60% width for Tax Details
    let tableStartYNew = doc.lastAutoTable.finalY + 10; // Starting Y position right below the page margin
    let currentY = tableStartYNew + 12; // Starting position after headers

    if (tablecontt == 1) {
      console.log('tablecontt', tablecontt)
      currentY = 32; // Starting position after headers
      tableStartYNew = 20;
    }

    // Title
    doc.setFont("helvetica", "bold");

    doc.setFontSize(10);
    doc.setFillColor(193, 223, 242); // Sky blue
    doc.setDrawColor(77, 96, 107);   // Border color
    doc.setTextColor(77, 96, 107);   // Text color
    doc.rect(leftMargin, tableStartYNew, bankDetailsWidth, 12, 'FD'); // Bank Details Header
    doc.text("SCREENINGSTAR BANK ACCOUNT AND TAX DETAILS", leftMargin + 5, tableStartYNew + 7);
    // Defines the height of the header row

    doc.setDrawColor(0); // Black border (grayscale)

    doc.setFillColor(193, 223, 242); // Sky blue
    doc.rect(leftMargin + bankDetailsWidth, tableStartYNew, taxDetailsWidth, 12, 'FD'); // Tax Details Header
    const headerHeight = 12;
    const labelWidths = taxDetailsWidth * 0.6; // 60% width for the label
    const valueWidths = taxDetailsWidth * 0.4; // 40% width for the value

    // Start position for the "TOTAL AMOUNT BEFORE TAX" to align with bankDetailsWidth
    const startX = leftMargin + bankDetailsWidth;  // This makes sure it starts after the bank details column
    doc.setFillColor(193, 223, 242); // Sky blue
    doc.setDrawColor(77, 96, 107);   // Border color
    doc.setTextColor(77, 96, 107);
    const totalBeforeTaxLabel = "TOTAL AMOUNT BEFORE TAX";
    const labelXPosition = startX + (labelWidths / 2) - (doc.getTextDimensions(totalBeforeTaxLabel).w / 2);
    doc.rect(startX, tableStartYNew, labelWidths, headerHeight, 'FD');
    doc.text(totalBeforeTaxLabel, labelXPosition, tableStartYNew + 7);

    function formatAmountInt(amount) {
      const num = parseFloat(amount);
      return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    }

    const valueXPosition = startX + labelWidths + (valueWidths / 2) - (doc.getTextDimensions(formatAmountInt(overallApplicationsTotalPricingWithAdditionalFee.toFixed(2))).w / 2); // Centered

    doc.setFillColor(193, 223, 242); // Sky blue
    doc.rect(startX + labelWidths, tableStartYNew, valueWidths, headerHeight); // Draw value column
    doc.text(formatAmountInt(overallApplicationsTotalPricingWithAdditionalFee.toFixed(2)), valueXPosition, tableStartYNew + 7);

    const getRowHeight = (label, value) => {
      const labelHeight = doc.getTextDimensions(label).h;
      const valueHeight = doc.getTextDimensions(value).h;
      return Math.max(labelHeight, valueHeight, 12);
    };

    const maxRows = Math.max(bankDetails.length, taxDetails.length);
    doc.setTextColor(0, 0, 0);
    for (let i = 0; i < maxRows; i++) {
      const bankItem = bankDetails[i] || { label: "", value: "" };
      const taxItem = taxDetails[i] || { label: "", value: "" };
      const rowHeight = 7;

      doc.setFont("helvetica", "normal");
      doc.rect(leftMargin, currentY, bankDetailsWidth / 2, rowHeight);
      doc.text(bankItem.label, leftMargin + 5, currentY + 5);

      doc.rect(leftMargin + bankDetailsWidth / 2, currentY, bankDetailsWidth / 2, rowHeight);
      doc.text(bankItem.value, leftMargin + bankDetailsWidth / 2 + 5, currentY + 5);

      const taxLabelWidth = taxDetailsWidth * 0.6;
      const taxValueWidth = taxDetailsWidth * 0.4;

      const labelXPosition = leftMargin + bankDetailsWidth + (taxLabelWidth / 2) - (doc.getTextDimensions(taxItem.label).w / 2);
      doc.rect(leftMargin + bankDetailsWidth, currentY, taxLabelWidth, rowHeight);
      doc.text(taxItem.label, labelXPosition, currentY + 5);

      const valueXPosition = leftMargin + bankDetailsWidth + taxLabelWidth + (taxValueWidth / 2) - (doc.getTextDimensions(taxItem.value).w / 2);
      doc.rect(leftMargin + bankDetailsWidth + taxLabelWidth, currentY, taxValueWidth, rowHeight);
      doc.text(taxItem.value, valueXPosition, currentY + 5);

      currentY += rowHeight;
    }

    // Special formatting for Total Tax Amount
    const lastRowHeight = getRowHeight("Total Tax Amount :", "Zero Rupees Only");
    doc.setFont("helvetica", "bold");
    doc.rect(leftMargin, currentY, bankDetailsWidth + taxDetailsWidth, lastRowHeight);
    const labelText = 'Total Tax Amount :';
    const taxAmountInWords = numberToWords(overAllAmountWithTax);

    // Set bold font and black color for label
    doc.setFont('helvetica', 'bold');
    doc.text(labelText, leftMargin + 5, currentY + 7);

    // Measure width of the label to calculate where to start the value
    const labelWidth = doc.getTextWidth(labelText);

    // Set normal font and light gray color for value
    doc.setFont('helvetica', 'normal');
    doc.text(taxAmountInWords, leftMargin + 5 + labelWidth + 2, currentY + 7); // 2 is small padding

    doc.setFont('helvetica', 'normal');

    currentY += lastRowHeight;

    // Build headers
    const serviceCodeHeaders = serviceCodes.map(code => ({
      header: `${code}`,
      dataKey: `serviceCode${code}`
    }));

    const annexureHeight = 6; // Background height
    let annexureY = topMargin + currentY - 5; // Position below the columns

    // Draw background rectangle
    doc.setFillColor(193, 223, 242);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.rect(leftMargin, annexureY, pageWidth - 2 * leftMargin, annexureHeight, "FD");

    // Add centered "TAX INVOICE" text
    const annexureX = pageWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setDrawColor(0); // Black border (grayscale)

    doc.setTextColor(77, 96, 107); // Equivalent to #4d606b
    doc.text("Annexure", annexureX, annexureY + annexureHeight / 2 + 1, { align: "center" });




    const header = [
      { header: 'Ref ID', dataKey: 'serviceDescription' },
      { header: 'Emp ID', dataKey: 'hsnCode' },
      ...(clientCode === 'SS-OROC' ? [
        { header: 'Check ID', dataKey: 'check_id' },
        { header: 'Ticket ID', dataKey: 'ticket_id' }
      ] : []),
      { header: 'Case Received', dataKey: 'qty' },
      { header: 'Applicant Full Name', dataKey: 'rate' },
      ...serviceCodeHeaders,
      { header: 'Add Fee', dataKey: 'additionalFee' },
      { header: 'Pricing', dataKey: 'taxableAmount' },
      { header: 'Report Date', dataKey: 'reportDate' }
    ];

    // Calculate totals
    const totals = {};
    serviceCodes.forEach(code => {
      totals[`serviceCode${code}`] = 0;
    });
    let totalAdditionalFee = 0;
    let totalTaxableAmount = 0;

    tableBody2.forEach(row => {
      serviceCodes.forEach(code => {
        const key = `serviceCode${code}`;
        totals[key] += parseFloat(row[key]) || 0;
      });
      totalAdditionalFee += parseFloat(row.additionalFee) || 0;
      totalTaxableAmount += parseFloat(row.taxableAmount) || 0;
    });
    const grandTotalRow = {
      serviceDescription: 'Total',
      hsnCode: '',
      ...(clientCode === 'SS-OROC' ? {
        check_id: '',
        ticket_id: ''
      } : {}),
      qty: '',
      rate: '',
      ...Object.fromEntries(serviceCodes.map(code => {
        const total = totals[`serviceCode${code}`];
        return [
          `serviceCode${code}`,
          total % 1 === 0 ? parseInt(total).toString() : total.toFixed(2)
        ];
      })),
      additionalFee: totalAdditionalFee % 1 === 0
        ? parseInt(totalAdditionalFee).toString()
        : totalAdditionalFee.toFixed(2),
      taxableAmount: totalTaxableAmount % 1 === 0
        ? parseInt(totalTaxableAmount).toString()
        : totalTaxableAmount.toFixed(2),
      reportDate: ''
    };

    tableBody2.push(grandTotalRow);

    // Add the table
    doc.autoTable({
      columns: header,
      body: tableBody2,
      theme: 'grid',
      startY: annexureY += 10, // Only for the first table position
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        textColor: "#000",
      },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: 'auto',
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,

      didParseCell: function (data) {
        if (data.row.raw === grandTotalRow) {
          if (data.column.dataKey === 'serviceDescription') {
            data.cell.colSpan = 4;
            data.cell.styles.fontStyle = 'bold';
          }
          if (['hsnCode', 'qty', 'rate'].includes(data.column.dataKey)) {
            data.cell.colSpan = 0;
          }

        }
      }
    });
    // addFooter(doc); // Add footer for this page

    let services = [];
    let tempArray = [];

    // Loop through serviceNames
    serviceNames.forEach((service, index) => {
      // Create an object for each service with serviceDescription and hsnCode
      const serviceObject = {
        serviceDescription: service.title,  // Assuming 'title' corresponds to serviceDescription
        hsnCode: service.shortCode         // Assuming 'shortCode' corresponds to hsnCode
      };

      // Push the service object into tempArray
      tempArray.push(serviceObject);

      // When tempArray reaches 6 items or it's the last service, push it to services
      if (tempArray.length === 6 || index === serviceNames.length - 1) {
        services.push(...tempArray);  // Use spread operator to push individual objects
        tempArray = [];  // Reset tempArray
      }
    });


    // Determine how many entries per row (in this case, 3 per row)
    const entriesPerRow = 3;

    // Dynamically generate columns based on entries per row
    const header2 = [];
    for (let i = 1; i <= entriesPerRow; i++) {
      header2.push({ header: `S CODE ${i}`, dataKey: `serviceDescription${i}` });
      header2.push({ header: `VERIFICATION SERVICES ${i}`, dataKey: `hsnCode${i}` });
    }

    // Function to dynamically generate rows based on the service data
    const row2 = [];
    for (let i = 0; i < services.length; i += entriesPerRow) {
      const row = {};
      for (let j = 0; j < entriesPerRow; j++) {
        const index = i + j;
        if (services[index]) {
          row[`hsnCode${j + 1}`] = services[index].hsnCode;
          row[`serviceDescription${j + 1}`] = services[index].serviceDescription;
        } else {
          row[`hsnCode${j + 1}`] = '';
          row[`serviceDescription${j + 1}`] = '';
        }
      }
      row2.push(row);
    }


    // Constants
    const margin = 10;
    const headerHeightNew = 8;
    const annexureText = "ANNEXURE - SCOPE OF SERVICES NAME AND CODES";
    const estimatedTableHeight = row2.length * 8 + 20; // estimate ~8px per row + padding
    const totalHeightNeeded = headerHeightNew + estimatedTableHeight;

    const previousTable = doc.lastAutoTable;
    const previousFinalY = previousTable ? previousTable.finalY : 20;

    let myheight = previousFinalY + 10;
    let remainingSpace = pageHeight - myheight;

    // If not enough space for both header + table, add a new page
    if (remainingSpace < totalHeightNeeded) {
      doc.addPage();
      myheight = 20; // reset top margin
      currentY = 20;
      annexureY = 0;
    }

    // === Draw Header ===
    const headerTopY = myheight;
    console.log('headerTopY:', headerTopY);

    const headerBottomY = headerTopY + headerHeightNew;
    const textYNew = headerTopY + headerHeightNew / 2 + 1.5;
    const headerWidth = pageWidth - margin * 2;

    doc.setTextColor("#4d606b");
    doc.setFillColor(193, 223, 242);
    doc.rect(margin, headerTopY, headerWidth, headerHeightNew, "F"); // Filled rectangle
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, headerTopY, headerWidth, headerHeightNew); // Border

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(annexureText, pageWidth / 2, textYNew, { align: "center" });
    doc.setFont("helvetica", "normal");

    // === Draw Table ===
    doc.autoTable({
      startY: headerBottomY,
      columns: header2,
      body: row2,
      theme: 'grid',
      showHead: 'firstPage',
      headStyles: {
        fillColor: [193, 223, 242],
        textColor: "#4d606b",
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        fontSize: 8,
      },
      bodyStyles: {
        halign: 'center',
        lineColor: "#4d606b",
        lineWidth: 0.4,
        textColor: "#000",
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
      },
      margin: { left: margin, right: margin },
      tableWidth: headerWidth,
      tableLineColor: "#4d606b",
      tableLineWidth: 0.4,
    });

    doc.addPage();
    const headingYPosition = 10;

    // New Page for Notes
    // addFooter(doc); // Add footer for this page

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SPECIAL NOTES, TERMS AND CONDITIONS", pageWidth / 2, headingYPosition + 5, { align: "center" });
    doc.rect(margin, headingYPosition, headerWidth, 10); // Rectangle for heading
    doc.setTextColor(0, 0, 0); // Black text

    // Notes Section
    const notesYPosition = headingYPosition + 15;
    const notes = [
      "1. Payments should be made via cheques/DDs/NEFT/RTGS transfers as per the payment details shown above.",
      "2. All the payments should be payable in the name of M/s. 'SCREENINGSTAR SOLUTIONS PRIVATE LIMITED'.",
      "3. All cheques should be drawn crossed A/c Payee.",
      "4. While making payment please handover payment advice with full details.",
      "5. Kindly revert back in writing regarding any query pertaining to this bill within 7 days from the date of bill, otherwise this bill shall be deemed to be correct and payable by you.",
      "6. Please email us at accounts@screeningstar.com.",
      "7. Invoice to be paid on or before 30 days from the date of invoice or within the credit period as per agreement.",
      "8. Any delay in payment attracts an interest @24% per annum."
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(notes, margin + 2, notesYPosition, { maxWidth: headerWidth - 4, lineHeightFactor: 1.5 });

    // Add Stamp and Signature
    const stampYPosition = notesYPosition + (notes.length * 5) + 10;
    doc.addImage(
      "/stampsign.png",
      "PNG",
      margin + 5,
      stampYPosition,
      60,
      30
    );
    doc.setFontSize(9);
    const leftMarging = 20; // or whatever your margin is
    doc.text("Authorized Signatory", leftMarging, stampYPosition + 40);

    // Border for Notes Section
    const notesSectionHeight = stampYPosition + 50 - notesYPosition;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, notesYPosition - 5, headerWidth, notesSectionHeight);

    addFooter(doc);

    const invoiceDate = new Date(formData.invoice_date);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedDate = `${monthNames[invoiceDate.getMonth()]}_${invoiceDate.getFullYear()}`;

    doc.save(`${clientCode || "N/A"}-${formattedDate}`);

    fetchPdfData(overAllCgstTaxs, overAllSgstTaxs, overAllIGSTTaxs, totalGsts, totalAmounts, taxableValuess, overAllAmountWithTaxs, companynames, customer);


  };



  return (
    <>
      <div className="w-full border border-black overflow-hidden">
        <div className="bg-white text-left  md:p-12 p-6   w-full mx-auto">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label htmlFor="clrefin" className="block mb-2">
                Client Code<span className="text-red-500 text-xl">*</span>
              </label>
              <SelectSearch
                options={options.length === 0 ? [{ value: '0', name: 'No data available in table' }] : options}
                value={formData.client_code}
                name="client_code"
                placeholder={options.length === 0 ? 'No data available in table' : 'Choose your language'}
                onChange={(value) => {
                  // Update formData with selected client.id
                  handleChange({ target: { name: 'client_code', value } });

                  // Find original client in activeList using ID
                  const selectedClient = activeList.find(client => client.id === value);

                  // Set client_unique_id (e.g., 'ss-ind') to state
                  setClientCode(selectedClient?.client_unique_id || '');
                }}
                search
                disabled={options.length === 0}
              />



              {errors.client_code && <p className="text-red-500 text-sm">{errors.client_code}</p>}
            </div>

            <div>
              <label htmlFor="invnum" className="block mb-2">
                Invoice Number:<span className="text-red-500 text-xl">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                id="invoice"
                placeholder="Invoice Number"
                onChange={handleChange}
                value={formData.invoice_number}
                className="w-full p-3 bg-[#f7f6fb]  border border-gray-300 rounded-md"
              />
              {errors.invoice_number && <p className="text-red-500 text-sm">{errors.invoice_number}</p>}
            </div>

            <div>
              <label htmlFor="invoice_date" className="block mb-2">
                Invoice Date:<span className="text-red-500 text-xl">*</span>
              </label>
              <DatePicker
                id="invoice_date"
                name="invoice_date"
                selected={
                  formData.invoice_date && formData.invoice_date.trim() !== ""
                    ? parseISO(formData.invoice_date)
                    : null
                }
                onChange={(date) => {
                  if (!date) {
                    setFormData({ ...formData, invoice_date: "" });
                    return;
                  }
                  const formatted = format(date, "yyyy-MM-dd"); // Save in backend format
                  setFormData({ ...formData, invoice_date: formatted });
                }}
                dateFormat="dd-MM-yyyy" // Show in user-friendly format
                placeholderText="DD-MM-YYYY"
                className="uppercase w-full p-3 bg-[#f7f6fb] border border-gray-300 rounded-md"
              />
              {errors.invoice_date && <p className="text-red-500 text-sm">{errors.invoice_date}</p>}
            </div>

            <div>
              <label htmlFor="moinv" className="block mb-2">
                Month:<span className="text-red-500 text-xl">*</span>
              </label>
              <select
                id="month"
                name="month"
                onChange={handleChange}
                value={formData.month}
                className="w-full p-3 mb-[20px] bg-[#f7f6fb]  border border-gray-300 rounded-md"
              >
                <option>--Select Month--</option>
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
              {errors.month && <p className="text-red-500 text-sm">{errors.month}</p>}
            </div>
            <div>
              <label htmlFor="moinv" className="block mb-2">
                Year:<span className="text-red-500 text-xl">*</span>
              </label>
              <select
                id="year"
                name="year"
                onChange={handleChange}
                value={formData.year}
                className="w-full p-3 mb-[20px] bg-[#f7f6fb] border border-gray-300 rounded-md"
              >
                <option value="">--Select Year--</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
            </div>

            <div className="text-left">
              <button
                type="submit"
                className={`p-6 py-3 bg-[#2c81ba] text-white  hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GenerateInvoice;
