import React, { useState, useRef, useEffect, useCallback } from 'react';

import { AiFillFilePdf } from 'react-icons/ai'; // PDF icon
import { AiFillFileExcel } from 'react-icons/ai'; // Excel icon
import { AiFillFileWord } from 'react-icons/ai';
import pdfIcon from "../../imgs/pdfIcon.png";
import docsIcon from "../../imgs/docsIcon.png";
import excelIcon from "../../imgs/excelIcon.png";
import { useNavigate } from "react-router-dom";
import { useApiLoadingBranch } from '../BranchApiLoadingContext';


console.log(localStorage)
const ChecklistAndEscalation = () => {
  const navigate = useNavigate();
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();

  const [branchData, setBranchData] = useState(null);
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem("branch"));
    if (branchInfo) {
      setBranchData(branchInfo);
    }
  }, []);
  const fetchCustomerInfo = useCallback(async () => {
    setLoading(true);
    setApiLoadingBranch(true);
    const branchData = JSON.parse(localStorage.getItem("branch"));

    const { id: branch_id, type } = branchData;
    const branch_token = localStorage.getItem("branch_token");
    const url = `https://api.screeningstar.co.in/branch/escalation-matrix?branch_id=${branch_id}&_token=${branch_token}`;

    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };

    try {
      let response;

      if (type === "sub_user") {
        const sub_user_id = branchData?.id ?? null;
        response = await fetch(`${url}&sub_user_id=${sub_user_id}`, requestOptions);
      } else {
        response = await fetch(url, requestOptions);
      }

      // Check for token in the response regardless of status
      const result = await response.json();
      const newToken = result.token || result._token || '';

      if (newToken) {
        localStorage.setItem("branch_token", newToken);
      }

      if (response.ok) {
        setData(result.data);
      } else {
        console.error('Error fetching data:', response.statusText);
        // Optional: set error state
        // setError('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optional: set error state
      // setError(error.message);
    } finally {
      setApiLoadingBranch(false);
      setLoading(false); // Ensures loading is set to false whether the request succeeds or fails
    }
  }, []);


  const emails = JSON.parse(data.client_spoc_email || "[]");

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoadingBranch == false) {
          await validateBranchLogin();
          await fetchCustomerInfo();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/userLogin');
      }
    };

    initialize();
  }, [fetchCustomerInfo, navigate]);



  console.log('localStorage', localStorage);
  return (
    <div className="bg-[#c1dff2] border border-black">
      <div className="bg-white md:p-12 p-6 overflow-x-auto w-full mx-auto">
        <table className='m-auto w-full border-collapse border border-black  rounded-lg'>
          <thead>
            <tr className='bg-[#c1dff2] text-[#4d606b] whitespace-nowrap'>
              <th className='border border-black  px-4 py-2 text-center'>SL NO</th>
              <th className='border border-black  px-4 py-2'>PARTICULARS</th>
              <th className='border border-black  px-4 py-2'>DOWNLOAD DOCUMENT</th>
            </tr>
          </thead>
          <tbody>
            <tr className=''>
              <td className='border border-black  px-4 py-2 text-center'>1</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Employee Background Verification Standard Form</td>
              <td className='border border-black  px-4 py-2 '>

                <a
                  href="https://screeningstar.in/chkmatrixfiles/Screeningstar_Standard_BackGround_Verification_Form.pdf"
                  download=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4"
                >
                  Standard PDF BGV Form
                  <img
                    src={pdfIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />


                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>2</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Employee Background Verification Standard Form</td>
              <td className='border border-black  px-4 py-2'>
                <a
                  href="https://screeningstar.in/chkmatrixfiles/Screeningstar_Standard_BackGround_Verification_Form.xls"
                  download=""
                  className="flex items-center justify-between gap-3"
                >
                  Standard Excel BGV Form
                  <img
                    src={excelIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>3</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Checklist and List of documents required for BGV</td>
              <td className='border border-black  px-4 py-2'>
                <a
                  href="https://screeningstar.in/chkmatrixfiles/DOCUMENT_CHECKLIST.pdf"
                  download=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3"
                >
                  Document Checklist
                  <img
                    src={docsIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>4</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Screeningstar Colour Code Matrix</td>
                <td className='border border-black  px-4 py-2'>
                  <a
                    href="https://screeningstar.in/chkmatrixfiles/Colour_Code_Matrix.xlsx"
                    download=""
                    className="flex items-center justify-between gap-3"
                  >
                    Colour Code Matrix
                    <img
                      src={excelIcon}
                      alt="PDF Icon"
                      className="w-10 mr-[50px]"
                      style={{ color: 'red', fontSize: '40px' }}
                    />
                  </a>
                </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>5</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap' >Screeningstar Scope of Process</td>
              <td className='border border-black  px-4 py-2'>
                <a
                  href="https://screeningstar.in/chkmatrixfiles/Scope_of_Process.pdf"
                  download=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3"
                >
                  Scope of Process
                  <img
                    src={pdfIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>6</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Business Proposal for Employee Background Verification Services</td>
              <td className='border border-black  px-4 py-2'>
                <a
                  href="https://screeningstar.in/chkmatrixfiles/SCREENINGSTAR_BUSINESS_PROPOSAL_FOR_BGV.pdf"
                  download=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3"
                >
                  Business Proposal
                  <img
                    src={pdfIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>7</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Background Verification Sample Report</td>
              <td className='border border-black  px-4 py-2'>
                <a
                  href="https://screeningstar.in/chkmatrixfiles/Screeningstar_Standard_BackGround_Verification_Form.pdf"
                  download=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3"
                >
                  Sample BGV Report
                  <img
                    src={pdfIcon}
                    alt="PDF Icon"
                    className="w-10 mr-[50px]"
                    style={{ color: 'red', fontSize: '40px' }}
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>8</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Candidate Absence Declaration/Consent form from Client</td>
              <td className='border border-black  px-4 py-2'><a href="#">Absence Declaration Form</a></td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>9</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Client Authorization to Initiate the BGV to Screeningstar Solutions Pvt Ltd</td>
              <td className='border border-black  px-4 py-2'><a href="#">Client Authorization Form</a></td>
            </tr>
            <tr>
              <td className='border border-black  px-4 py-2 text-center'>10</td>
              <td className='border border-black  px-4 py-2 whitespace-nowrap'>Escalation Matrix - Call dedicated Point of Contact or Email To</td>
              <td className='border border-black  px-4 py-2'>
                <div>
                  <strong>1st Level: {data.client_spoc_name || 'N/A'} </strong><br />
                  Designation: {data.client_spoc_desgn || 'N/A'} <br />
                  Mobile Number: <a href={`tel:${data.client_spoc_mobile || 'N/A'}`}>{data.client_spoc_mobile || 'N/A'}</a><br />
                  Email ID:&nbsp;
                  {emails.length > 0
                    ? emails.map((email, index) => (
                      <span key={index}>
                        <a href={`mailto:${email}`}>{email}</a>
                        {index < emails.length - 1 ? ', ' : ''}
                      </span>
                    ))
                    : 'N/A'}
                </div>
                <div>
                  <strong>2nd Level: Mr. Manjunath HS</strong><br />
                  Designation: Head of Business Operations<br />
                  Mobile Number: <a href="tel:9945891310">9945891310</a><br />
                  Email ID: <a href="mailto:manjunath@screeningstar.com">manjunath@screeningstar.com</a>
                </div>
                <div>
                  <strong>Final level: Mrs Rajitha V </strong><br />
                  Designation: CEO <br />
                  Mobile Number: <a href="tel:9036688049">9036688049</a><br />
                  Email ID: <a href="ceo@screeningstar.com">ceo@screeningstar.com </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChecklistAndEscalation;
