import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';

// Create the context
const ClientContext = createContext();

// Create the provider component
export const ClientProvider = ({ children }) => {
    const [selectedClient, setSelectedClient] = useState({});
    const [client_spoc_id, setclient_spoc_id] = useState([]);
    const [escalation_manager_id, Setescalation_manager_id] = useState([]);
    const [billing_spoc_id, setbilling_spoc_id] = useState([]);
    const [billing_escalation_id, setbilling_escalation_id] = useState([]);
    const [authorized_detail_id, setauthorized_detail_id] = useState([]);
    const [services, setServices] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [finalLoading, setFinalLoading] = useState(false);
 

    console.log('author1',billing_escalation_id);

    const AllSpocs = useCallback(async () => {
        setFinalLoading(true);
        try {
            // Retrieve admin ID and token from localStorage
            const admin = JSON.parse(localStorage.getItem("admin"));
            const storedToken = localStorage.getItem("_token");
    
            if (!admin?.id || !storedToken) {
                console.error("Missing admin_id or _token");
                return;
            }
    
            const admin_id = admin.id;
            console.log('myadminid',admin_id)
            const url = `https://api.screeningstar.co.in/admin/add-client-listings?admin_id=${admin_id}&_token=${storedToken}`;
    
            // Fetch data from the API
            const response = await fetch(url, { method: "GET", redirect: "follow" });
            const data = await response.json();
    
            if (!response.ok) {
                  Swal.fire('Error!', `${data.message}`, 'error');
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
    
            console.log(`data - `, data);
    
            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
    
            if (!data?.data) {
                throw new Error("Invalid API response: Missing data");
            }
    
            console.log("authordata", data.data);
    
            // Extracting and setting dropdown options
            setclient_spoc_id(data.data.client_spocs.map(spoc => ({
                name: spoc.name,
                value: spoc.id,
            })));
    
            Setescalation_manager_id(data.data.escalation_managers.map(escalation => ({
                name: escalation.name,
                value: escalation.id,
            })));
    
            setbilling_spoc_id(data.data.billing_spocs.map(spoc => ({
                name: spoc.name,
                value: spoc.id,
            })));
    
            setbilling_escalation_id(data.data.billing_escalations.map(escalation => ({
                name: escalation.name,
                value: escalation.id,
            })));
    
            const authorized_detail_idOptions = data.data.authorized_details.map(escalation => ({
                name: escalation.name,
                value: escalation.id,
            }));
    
            setauthorized_detail_id(authorized_detail_idOptions);
            console.log("author2", authorized_detail_idOptions);
    
            // Processing services_with_Group
            const servicesData = [...data.data.services_with_Group];
    
            servicesData.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
            servicesData.forEach((group) => {
                group.services = group.services.sort((a, b) => {
                    const numA = parseInt(a.service_code.replace(/[^\d]/g, ""), 10) || 0;
                    const numB = parseInt(b.service_code.replace(/[^\d]/g, ""), 10) || 0;
                    return numA - numB;
                });
            });
    
            setServices(servicesData);
    
            // Setting packages
            setPackageList(data.data.packages);
    
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setFinalLoading(false); // Ensure loading is stopped even if an error occurs
        }
    }, []);
    
 
    console.log('author3', authorized_detail_id)

    return (
        <ClientContext.Provider
            value={{
                services,
                packageList,
                client_spoc_id,
                AllSpocs,
                escalation_manager_id,
                billing_spoc_id,
                billing_escalation_id,
                authorized_detail_id,
                selectedClient, setSelectedClient,finalLoading
            }}
        >
            {children}
        </ClientContext.Provider>
    );
};

// Custom hook to use the context
export const useClientContext = () => {
    return useContext(ClientContext);
};
