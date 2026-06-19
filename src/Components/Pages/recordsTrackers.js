import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';
const RecordTrackers = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null); // Track which row is loading
  const [excelIndex, setExcelIndex] = useState(null);
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



  const [allApplications, setAllApplications] = useState([]);
  const [companyInfo, setCompanyInfo] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [costInfo, setCostInfo] = useState([]);
  const [serviceInfo, setServiceInfo] = useState([]);
  const [serviceNames, setServiceNames] = useState([]);
  const [noValuesMatched, setNoValuesMatched] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);  // Track selected row for check-in
  const [expandedRow, setExpandedRow] = useState(null);
  const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
  const token = localStorage.getItem('_token');
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "fromMonth") setFromMonth(value);
    else if (name === "toMonth") setToMonth(value);
    else if (name === "fromYear") setFromYear(value);
    else if (name === "toYear") setToYear(value);
  };

  const handleSearch = async () => {
    // Validate inputs
    const finalFromMonth = fromMonth || month;
    const finalToMonth = toMonth || month;
    const finalFromYear = fromYear || year;
    const finalToYear = toYear || year;

    if (!finalFromMonth || !finalToMonth || !finalFromYear || !finalToYear) {
      alert("Please select either month/year or full filter range.");
      return;
    }

    setLoading(true);
    setNoValuesMatched(false);

    try {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };

      const response = await fetch(
        `https://api.screeningstar.co.in/record-tracker?admin_id=${adminId}&_token=${token}&from_month=${finalFromMonth}&to_month=${finalToMonth}&from_year=${finalFromYear}&to_year=${finalToYear}`,
        requestOptions
      );

      if (!response.ok) {
        const errorMessage = `Error ${response.status}: ${response.statusText}`;
        Swal.fire({ icon: 'error', title: 'Oops...', text: errorMessage });
        return;
      }

      const result = await response.json();

      if (result?.customers?.length > 0) {
        setTableData(result.customers);
      } else {
        setNoValuesMatched(true);
        setTableData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while fetching the data.' });
    } finally {
      setLoading(false);
    }
  };

  const generateExcelDownload = async ({ applications, serviceInfo, companyInfo, customer }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const headers = [
      "SR No.",
      "Application ID",
      "Sub Client",
      "Employee Id",
      "Check Id ",
      "Ticket id",
      "Case Received",
      "Candidate Full Name",
      ...serviceInfo.map((s) => s.shortCode),
      "Pricing",
      "Report Date"
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: "left" }; // 👈 Left align header cells
      cell.font = { bold: true };
    });

    let sr = 1;
    const serviceTotals = serviceInfo.map((s) => ({
      serviceId: s.serviceId,
      shortCode: s.shortCode,
      price: 0,
    }));
    let grandTotal = 0;

    applications.forEach((branchData) => {
      branchData.applications.forEach((app) => {
        const appServiceArr = app.services.split(',');
        let applicationPricing = 0;

        const servicePrices = serviceInfo.map((service) => {
          const matched = appServiceArr.includes(String(service.serviceId));
          const price = matched ? service.price : 0;

          const index = serviceTotals.findIndex(s => s.serviceId === service.serviceId);
          if (index !== -1) {
            serviceTotals[index].price += price;
          }

          if (matched) applicationPricing += price;

          return matched ? service.price : "NIL";
        });

        grandTotal += applicationPricing;

        const row = worksheet.addRow([
          sr++,
          app.application_id,
          app.sub_client,
          app.employee_id,
          app.check_id,
          app.ticket_id,
          formatDate(app.created_at),
          app.name,
          ...servicePrices,
          applicationPricing,
          formatDate(app.report_date)
        ]);

        row.eachCell((cell) => {
          cell.alignment = { horizontal: "left" }; // 👈 Left align each data cell
        });
      });
    });

    // ✅ TOTAL row
    const totalRow = worksheet.addRow([
      "TOTAL",
      "",
      "",
      "",
      ...serviceTotals.map((s) => s.price || 0),
      grandTotal,
      ""
    ]);

    totalRow.eachCell((cell) => {
      cell.alignment = { horizontal: "left" };
      cell.font = { bold: true };
    });

    // Auto column width
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Report_${customer?.company_name || "Data"}.xlsx`);
  };

  const handleCheckIn = async (customerId, rowIndex, isDownload) => {
    if (loadingIndex !== null || excelIndex !== null) return;
    if (expandedRow === rowIndex) {
      setExpandedRow(null);
      return;
    }
    if (isDownload === "yes") {
      setExcelIndex(rowIndex); // Set separate loading for Excel
    } else {
      setLoadingIndex(rowIndex); // Set normal loading
    }
    const finalFromMonth = fromMonth || month;
    const finalToMonth = toMonth || month;
    const finalFromYear = fromYear || year;
    const finalToYear = toYear || year;

    if (!finalFromMonth || !finalToMonth || !finalFromYear || !finalToYear) {
      alert("Please select either month/year or full filter range.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/record-tracker/report?customer_id=${customerId}&admin_id=${adminId}&_token=${token}&from_month=${finalFromMonth}&to_month=${finalToMonth}&from_year=${finalFromYear}&to_year=${finalToYear}`,
        { method: "GET" }
      );
      const result = await response.json();

      if (response.ok) {
        if (isDownload === "yes") {
          // ✅ Just generate Excel and skip expanding UI
          const serviceNames = result?.serviceNames || [];
          const serviceInfo = result?.finalArr?.serviceInfo || [];

          const updatedServiceInfo = serviceInfo.map((service) => {
            const matchingService = serviceNames.find((name) => name.id === service.serviceId);
            return {
              ...service,
              shortCode: matchingService?.shortCode || null,
            };
          });

          await generateExcelDownload({
            applications: result?.applications || [],
            serviceInfo: updatedServiceInfo,
            companyInfo: result?.companyInfo || [],
            customer: result?.customer || [],
          });
        } else {
          // ✅ Normal UI expansion flow
          if (expandedRow === rowIndex) {
            setExpandedRow(null);
            return;
          }

          setSelectedRow(customerId);
          setExpandedRow(rowIndex);
          setAllApplications(result?.applications || []);
          setCompanyInfo(result?.companyInfo || []);
          setCustomer(result?.customer || []);
          setCostInfo(result?.finalArr?.costInfo || []);

          const serviceNames = result?.serviceNames || [];
          setServiceNames(serviceNames);

          const serviceInfo = result?.finalArr?.serviceInfo || [];
          const updatedServiceInfo = serviceInfo.map((service) => {
            const matchingService = serviceNames.find((name) => name.id === service.serviceId);
            return {
              ...service,
              shortCode: matchingService?.shortCode || null,
            };
          });
          setServiceInfo(updatedServiceInfo);
        }
      } else {
        console.error("Failed to fetch check-in data:", result);
      }
    } catch (error) {
      console.error("Error fetching check-in data:", error);
    } finally {
      if (isDownload === "yes") {
        setExcelIndex(null);
      } else {
        setLoadingIndex(null);
      }
    }
  };
  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [tableData, loading]);


  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    XLSX.writeFile(workbook, `RecordTrackers_${month}_${year}.xlsx`);
  };
  const toggleRow = (rowIndex) => {
    console.log('expandedRow', expandedRow)
    // setExpandedRow(expandedRow === rowIndex ? null : rowIndex);
  };
  const formatDate = (date) => {
    if (!date) return "NOT APPLICABLE"; // Check for null, undefined, or empty
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Nill"; // Check for invalid date
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  let servicePricingArr = [];
  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
      <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        <div className="border border-gray-400 shadow-lg p-10 md:w-full w-full mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#4d606b] px-3 pb-8">
            RECORDS & TRACKERS
          </h2>
          <div className="bg-[#c1dff2] p-8 rounded-2xl shadow-xl max-w-5xl mx-auto">
            {/* MONTH RANGE */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Select Month Range</h2>
              <div className="flex flex-col md:flex-row md:items-end gap-6 backdrop-blur-sm bg-white/70 rounded-xl">
                {/* FROM MONTH */}
                <div className="flex-1  rounded-xl p-4 ">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Month</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="fromMonth"
                    value={fromMonth}
                    onChange={handleInputChange}
                  >
                    <option value="">SELECT MONTH</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TO MONTH */}
                <div className="flex-1   rounded-xl p-4 ">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To Month</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2  focus:outline-none focus:ring-2 focus:ring-green-500"
                    name="toMonth"
                    value={toMonth}
                    onChange={handleInputChange}
                  >
                    <option value="">SELECT MONTH</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* YEAR RANGE */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Select Year Range</h2>
              <div className="flex flex-col md:flex-row md:items-end gap-6 backdrop-blur-sm bg-white/70 rounded-xl">
                {/* FROM YEAR */}
                <div className="flex-1  rounded-xl p-4 ">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Year</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="fromYear"
                    value={fromYear}
                    onChange={handleInputChange}
                  >
                    <option value="">--Select Year--</option>

                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TO YEAR */}
                <div className="flex-1  rounded-xl p-4 d">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To Year</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2  focus:outline-none focus:ring-2 focus:ring-green-500"
                    name="toYear"
                    value={toYear}
                    onChange={handleInputChange}
                  >
                    <option value="">--Select Year--</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                  </select>
                </div>
              </div>
            </div>
          </div>



          <div className="flex justify-center items-center mt-3 w-full">
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-[#2c81ba] text-white   hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] transition duration-200"
            >
              SUBMIT
            </button>
          </div>
        </div>



        <div className="table-container rounded-lg">
          {/* Top Scroll */}
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
          </div>

          {/* Actual Table Scroll */}
          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table className="min-w-full border-collapse border border-black overflow-scroll" id="table_invoice">
              <thead>
                <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b]">
                  <th className="border border-black px-4 uppercase py-2">Sl</th>
                  <th className="border border-black px-4 uppercase py-2">Client Code</th>
                  <th className="border border-black px-4 text-left uppercase py-2">Client Company Name</th>
                  <th className="border border-black px-4 uppercase py-2">CHECK IN</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="border border-black px-4 py-2 text-center">
                      <div className="flex w-full justify-center items-center h-20">
                        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : tableData.length > 0 ? (
                  tableData.map((item, index) => (
                    <React.Fragment key={index}>
                      {/* Main Row */}
                      <tr
                        className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                        onClick={() => toggleRow(index)} // Toggle the row expansion
                      >
                        <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                        <td className="border border-black text-center px-4 py-2">{item.client_unique_id}</td>
                        <td className="border border-black text-left px-4 py-2">{item.name}</td>
                        <td className="border border-black text-center px-4 py-2">
                          <div className='flex gap-5 items-center justify-center'>
                            <button
                              className={`p-6 py-3 font-bold whitespace-nowrap transition duration-200 text-white rounded-md
     ${loadingIndex === index
                                  ? "bg-[#2c81ba] opacity-50 cursor-not-allowed"
                                  : expandedRow === index
                                    ? "bg-red-600 hover:bg-red-700 hover:scale-105"
                                    : "bg-[#2c81ba] hover:bg-[#0f5381] hover:scale-105"
                                }`}
                              onClick={() => handleCheckIn(item.main_id, index, 'no')}
                              disabled={loadingIndex !== null} // Disable all when any is loading
                            >
                              {loadingIndex === index ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : expandedRow === index ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 mx-auto"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                "CHECK IN"
                              )}
                            </button>


                            <button
                              onClick={() => handleCheckIn(item.main_id, index, 'yes')}
                              className={`p-6 py-3 font-bold whitespace-nowrap transition duration-200 text-white rounded-md
                           ${excelIndex === index
                                  ? "bg-[#2c81ba] opacity-50 cursor-not-allowed"
                                  : "bg-green-500 hover:bg-green-600 hover:scale-105"
                                }`
                              }
                            >
                              {excelIndex === index ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                "Download Excel"
                              )}

                            </button>

                          </div>
                        </td>
                      </tr>


                      {expandedRow === index && serviceInfo.length > 0 && loadingIndex == null && (
                        <tr>
                          <td colSpan="3" className="border border-black px-4 py-2">
                            {/* Nested Table */}
                            <table className="min-w-full border-collapse border border-black">
                              <thead>
                                <tr className="bg-[#f0f0f0] text-[#4d606b]">
                                  <th className="border border-black px-4 py-2">SR No.</th>
                                  <th className="border border-black px-4 py-2">Application ID</th>
                                  <th className="border border-black px-4 py-2">Case Received</th>
                                  <th className="border border-black px-4 py-2">Candidate Full Name</th>
                                  {serviceInfo.map((service) => {
                                    return (
                                      <th className="border border-black px-4 py-2" key={service.serviceId}>
                                        {service.shortCode}
                                      </th>
                                    );
                                  })}
                                  <th className="border border-black px-4 py-2">Pricing</th>
                                  <th className="border border-black px-4 py-2">Report Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allApplications.map((branchData, branchIndex) => {
                                  const { applications } = branchData;

                                  return applications.map((application, appIndex) => {
                                    const appServiceArr = application.services.split(',');
                                    let applicationPricing = 0;

                                    return (
                                      <tr key={application.id}>
                                        <td className="border border-black px-4 py-2">{appIndex + 1}</td>
                                        <td className="border border-black px-4 py-2">{application.application_id}</td>
                                        <td className="border border-black px-4 py-2">
                                          {formatDate(application.created_at)}
                                        </td>
                                        <td className="border border-black px-4 py-2">{application.name}</td>

                                        {/* Render service prices */}
                                        {serviceInfo.map((service) => {
                                          const matchingService = appServiceArr.find(
                                            (serviceId) => serviceId === String(service.serviceId)
                                          );

                                          if (matchingService && service.price) {
                                            applicationPricing += service.price;
                                          }

                                          const rawServicePriceForArr = {
                                            serviceId: service.serviceId,
                                            price: service.price,
                                          };

                                          const servicePricingArrIndex = servicePricingArr.findIndex(
                                            (item) => item.serviceId === service.serviceId
                                          );

                                          // ✅ Fix: Add prices cumulatively for totals
                                          if (servicePricingArrIndex !== -1) {
                                            servicePricingArr[servicePricingArrIndex].price +=
                                              matchingService ? service.price : 0;
                                          } else {
                                            servicePricingArr.push({
                                              serviceId: service.serviceId,
                                              price: matchingService ? service.price : 0,
                                            });
                                          }

                                          return (
                                            <td className="border border-black px-4 py-2" key={service.serviceId}>
                                              {matchingService ? service.price : 'NIL'}
                                            </td>
                                          );
                                        })}

                                        <td className="border border-black px-4 py-2">{applicationPricing || 0}</td>

                                        <td className="border border-black px-4 py-2">
                                          {formatDate(application.report_date)}
                                        </td>
                                      </tr>
                                    );
                                  });
                                })}

                                {/* TOTAL ROW */}
                                <tr>
                                  <td className="border border-black px-4 py-2 font-bold" colSpan={4}>TOTAL</td>
                                  {serviceInfo.map((service) => {
                                    const matchingService = servicePricingArr.find(
                                      (servicePrice) => servicePrice.serviceId === service.serviceId
                                    );
                                    return (
                                      <td className="border border-black px-4 py-2 font-bold" key={service.serviceId}>
                                        {matchingService ? matchingService.price : '0'}
                                      </td>
                                    );
                                  })}
                                  <td className="border border-black px-4 py-2 font-bold">
                                    {servicePricingArr.reduce((sum, service) => sum + service.price, 0)}
                                  </td>
                                  <td className="border border-black px-4 py-2 font-bold"></td>
                                </tr>
                              </tbody>

                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="border border-black px-4 py-2 text-center text-red-600">
                      {noValuesMatched
                        ? "No results matched your search criteria."
                        : "No data available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Display check-in data if available */}


      </div>
    </div>
  );
};

export default RecordTrackers;
