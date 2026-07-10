import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MultiSelect } from "react-multi-select-component";
import { State } from "country-state-city";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";

const emptyPerson = { name: "", email: "", mobile: "", designation: "" };
const emptyForm = {
  name_of_organization: "",
  vendor_code: "",
  registered_address: "",
  state: "",
  pin_code: "",
  gst: "",
  tat: "",
  agreement_date: "",
  email_id: "",
  password: "",
  vendor_spoc: { ...emptyPerson },
  escalation_manager: { ...emptyPerson },
  authorized_details: { ...emptyPerson },
};

const states = State.getStatesOfCountry("IN");
const API = "http://localhost:5000";

const parseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const isTruthyFlag = (value) => {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

const getServiceId = (service) => Number(service?.service_id ?? service?.id ?? service?.serviceId);

const isVendorEnabled = (service) => isTruthyFlag(
  service?.show_in_vendor_management ??
  service?.showInVendorManagement ??
  service?.vendor_management ??
  service?.show_vendor_management
);

const buildGroupsFromServiceList = (serviceList) => {
  const groupMap = new Map();
  serviceList.filter(isVendorEnabled).forEach((service) => {
    const groupId = service.group_id || "ungrouped";
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        group_id: groupId,
        symbol: service.group_symbol || "",
        group_title: service.group_name || "Other Services",
        services: [],
      });
    }
    groupMap.get(groupId).services.push({
      service_id: Number(service.id),
      service_title: service.title,
      service_code: service.service_code,
      show_in_vendor_management: service.show_in_vendor_management,
    });
  });
  return Array.from(groupMap.values());
};

const normalizeVendor = (vendor) => ({
  ...emptyForm,
  ...vendor,
  agreement_date: vendor?.agreement_date ? String(vendor.agreement_date).slice(0, 10) : "",
  vendor_spoc: { ...emptyPerson, ...parseJson(vendor?.vendor_spoc, {}) },
  escalation_manager: { ...emptyPerson, ...parseJson(vendor?.escalation_manager, {}) },
  authorized_details: { ...emptyPerson, ...parseJson(vendor?.authorized_details, {}) },
});

export const VendorForm = ({ mode = "create", initialVendor = null, onSaved, onCancel }) => {
  const { validateAdminLogin, setApiLoading } = useApiLoading();
  const navigate = useNavigate();
  const initializedRef = useRef(false);
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState("100%");

  const [formData, setFormData] = useState(initialVendor ? normalizeVendor(initialVendor) : emptyForm);
  const [services, setServices] = useState([]);
  const [packageList, setPackageList] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [priceData, setPriceData] = useState({});
  const [selectedPackages, setSelectedPackages] = useState({});
  const [loading, setLoading] = useState(false);

  const packageOptions = useMemo(() => packageList.map((pkg) => ({ value: pkg.id, label: pkg.title })), [packageList]);

  const syncScroll = (e) => {
    if (!topScrollRef.current || !tableScrollRef.current) return;
    if (e.target === topScrollRef.current) tableScrollRef.current.scrollLeft = e.target.scrollLeft;
    else topScrollRef.current.scrollLeft = e.target.scrollLeft;
  };

  const loadListings = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);
    const admin = JSON.parse(localStorage.getItem("admin"));
    const token = localStorage.getItem("_token");
    try {
      await validateAdminLogin();
      const response = await fetch(`${API}/admin/add-client-listings?admin_id=${admin?.id}&_token=${token}`);
      const data = await response.json();
      const newToken = data.token || data._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok) throw new Error(data.message || "Unable to fetch services.");

      let activeToken = newToken || token;
      let serviceList = [];
      try {
        const serviceResponse = await fetch(`${API}/service/list?admin_id=${admin?.id}&_token=${activeToken}`);
        const serviceData = await serviceResponse.json();
        const serviceToken = serviceData.token || serviceData._token;
        if (serviceToken) {
          localStorage.setItem("_token", serviceToken);
          activeToken = serviceToken;
        }
        if (serviceResponse.ok && serviceData.status) {
          serviceList = serviceData.services || [];
        }
      } catch (serviceError) {
        console.warn("Unable to fetch service management fallback.", serviceError);
      }

      const serviceById = new Map(serviceList.map((service) => [Number(service.id), service]));
      const vendorEnabledIds = new Set(
        serviceList
          .filter(isVendorEnabled)
          .map((service) => Number(service.id))
          .filter(Boolean)
      );

      let groups = [...(data.data?.services_with_Group || [])]
        .map((group) => ({
          ...group,
          services: (group.services || [])
            .map((service) => {
              const id = getServiceId(service);
              const fallbackService = serviceById.get(id) || {};
              return {
                ...service,
                service_id: id,
                service_title: service.service_title || fallbackService.title,
                service_code: service.service_code || fallbackService.service_code,
                show_in_vendor_management: service.show_in_vendor_management ?? fallbackService.show_in_vendor_management,
              };
            })
            .filter((service) => isVendorEnabled(service) || vendorEnabledIds.has(getServiceId(service))),
        }))
        .filter((group) => group.services.length);

      if (!groups.length && serviceList.length) {
        groups = buildGroupsFromServiceList(serviceList);
      }

      groups.sort((a, b) => String(a.symbol || "").localeCompare(String(b.symbol || "")));
      groups.forEach((group) => {
        group.services.sort((a, b) => String(a.service_code || "").localeCompare(String(b.service_code || ""), undefined, { numeric: true }));
      });

      setServices(groups);
      setPackageList(data.data?.packages || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Unable to fetch vendor form data.", "error");
      if (String(error.message || "").toLowerCase().includes("login")) navigate("/admin-login");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, [navigate, setApiLoading, validateAdminLogin]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (!initialVendor) return;
    const next = normalizeVendor(initialVendor);
    setFormData(next);
    const existingServices = parseJson(initialVendor.services, []);
    const checked = {};
    const prices = {};
    const packages = {};
    existingServices.forEach((group) => {
      (group.services || []).forEach((service) => {
        const id = Number(service.serviceId);
        checked[id] = true;
        prices[id] = { pricingPackages: service.price || "" };
        packages[id] = (service.packages || []).map((pkg) => Number(pkg.id || pkg.value || pkg));
      });
    });
    setSelectedServices(checked);
    setPriceData(prices);
    setSelectedPackages(packages);
  }, [initialVendor]);

  useEffect(() => {
    if (tableScrollRef.current) setScrollWidth(tableScrollRef.current.scrollWidth + "px");
  }, [services, selectedServices, priceData, selectedPackages]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (section, field, value) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const toggleService = (group, service) => {
    const id = Number(service.service_id);
    setSelectedServices((prev) => {
      const checked = !prev[id];
      if (!checked) {
        setPriceData((old) => ({ ...old, [id]: { pricingPackages: "" } }));
        setSelectedPackages((old) => ({ ...old, [id]: [] }));
      }
      return { ...prev, [id]: checked };
    });
  };

  const buildServicesPayload = () => services.map((group) => ({
    group_id: group.group_id,
    group_title: group.group_title,
    symbol: group.symbol,
    services: (group.services || [])
      .filter((service) => selectedServices[Number(service.service_id)])
      .map((service) => ({
        serviceId: Number(service.service_id),
        serviceTitle: service.service_title,
        serviceCode: service.service_code,
        price: priceData[service.service_id]?.pricingPackages || "",
        packages: (selectedPackages[service.service_id] || []).map((pkgId) => {
          const pkg = packageList.find((item) => Number(item.id) === Number(pkgId));
          return { id: Number(pkgId), name: pkg?.title || String(pkgId) };
        }),
      })),
  })).filter((group) => group.services.length);

  const validate = () => {
    const required = ["name_of_organization", "vendor_code", "registered_address", "state", "pin_code", "tat", "agreement_date", "email_id", "password"];
    const missing = required.filter((key) => !String(formData[key] || "").trim());
    if (!buildServicesPayload().length) missing.push("services");
    ["vendor_spoc", "escalation_manager", "authorized_details"].forEach((section) => {
      ["name", "email", "mobile", "designation"].forEach((field) => {
        if (!String(formData[section]?.[field] || "").trim()) missing.push(`${section} ${field}`);
      });
    });
    if (missing.length) {
      Swal.fire("Error", `Missing required fields: ${missing.join(", ")}`, "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiLoading(true);
    const admin = JSON.parse(localStorage.getItem("admin"));
    const token = localStorage.getItem("_token");
    const payload = {
      ...formData,
      vendor_id: initialVendor?.id,
      admin_id: admin?.id,
      _token: token,
      services: buildServicesPayload(),
    };

    try {
      const response = await fetch(`${API}/vendor/${mode === "edit" ? "update" : "create"}`, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const newToken = data.token || data._token;
      if (newToken) localStorage.setItem("_token", newToken);
      if (!response.ok) throw new Error(data.message || "Unable to save vendor.");
      Swal.fire("Success", data.message || "Vendor saved successfully.", "success");
      if (mode === "create") {
        setFormData(emptyForm);
        setSelectedServices({});
        setPriceData({});
        setSelectedPackages({});
      }
      onSaved?.();
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to save vendor.", "error");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const inputClass = "w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]";
  const personSections = [
    ["vendor_spoc", "Vendor Spoc"],
    ["escalation_manager", "Escalation Manager"],
    ["authorized_details", "Authorized Details"],
  ];

  return (
    <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 w-full text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div><label>Name of Organization<span className="text-red-500">*</span></label><input name="name_of_organization" value={formData.name_of_organization} onChange={handleFieldChange} placeholder="Enter Organization Name" className={inputClass} /></div>
          <div><label>Vendor Code<span className="text-red-500">*</span></label><input name="vendor_code" value={formData.vendor_code} onChange={handleFieldChange} placeholder="Enter Vendor Code" className={inputClass} /></div>
          <div><label>Registered Address<span className="text-red-500">*</span></label><input name="registered_address" value={formData.registered_address} onChange={handleFieldChange} placeholder="Enter Registered Address" className={inputClass} /></div>
          <div><label>State<span className="text-red-500">*</span></label><select name="state" value={formData.state} onChange={handleFieldChange} className={inputClass}><option value="">Select State</option>{states.map((state) => <option key={state.isoCode} value={state.name}>{state.name}</option>)}</select></div>
          <div><label>Pin Code<span className="text-red-500">*</span></label><input name="pin_code" value={formData.pin_code} onChange={handleFieldChange} placeholder="Enter Pin Code" className={inputClass} /></div>
          <div><label>GST (optional)</label><input name="gst" value={formData.gst} onChange={handleFieldChange} placeholder="Enter GST" className={inputClass} /></div>
          <div><label>TAT<span className="text-red-500">*</span></label><input name="tat" value={formData.tat} onChange={handleFieldChange} placeholder="Enter TAT" className={inputClass} /></div>
          <div><label>Agreement Date<span className="text-red-500">*</span></label><input type="date" name="agreement_date" value={formData.agreement_date} onChange={handleFieldChange} className={inputClass} /></div>
          <div><label>Email ID<span className="text-red-500">*</span></label><input type="email" name="email_id" value={formData.email_id} onChange={handleFieldChange} placeholder="Enter Email" className={inputClass} /></div>
          <div><label>Password<span className="text-red-500">*</span></label><input name="password" value={formData.password} onChange={handleFieldChange} placeholder="Enter Password" className={inputClass} /></div>
        </div>

        {personSections.map(([section, title]) => (
          <div key={section} className="pt-4">
            <h3 className="font-bold mb-6">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4">
              {["name", "email", "mobile", "designation"].map((field) => (
                <div key={field}>
                  <label className="capitalize">{field}</label>
                  <input value={formData[section]?.[field] || ""} onChange={(e) => handlePersonChange(section, field, e.target.value)} placeholder={`Enter ${field === "name" && section === "authorized_details" ? "Authorized Person Name" : field.charAt(0).toUpperCase() + field.slice(1)}`} className={inputClass} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="clientserviceTable pt-4">
          <div className="table-container rounded-lg">
            <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}><div className="top-scroll-inner" style={{ width: scrollWidth }} /></div>
            <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
              <table className="min-w-full border border-black text-sm md:text-base">
                <thead><tr className="bg-[#c1dff2] text-[#4d606b] border-black">
                  <th className="py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">Group</th>
                  <th className="py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">Service Code</th>
                  <th className="py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">Verification Service</th>
                  <th className="py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">Price</th>
                  <th className="py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">Select Package</th>
                </tr></thead>
                <tbody>
                  {services.length === 0 ? <tr><td colSpan={5} className="py-4 text-center border border-black text-red-500">No vendor-enabled services available.</td></tr> : services.reduce((acc, group) => {
                    acc.push(<tr key={`group-${group.group_id}`} className="bg-[#c1dff2] text-[#4d606b]"><th className="py-3 px-4 border-r border-b border-black text-center uppercase whitespace-nowrap">{group.symbol}</th><th colSpan={4} className="py-3 px-4 border-r border-b border-black text-center uppercase whitespace-nowrap">{group.group_title}</th></tr>);
                    group.services.forEach((service) => {
                      const id = Number(service.service_id);
                      acc.push(<tr key={`${group.group_id}-${id}`}>
                        <td className="py-3 px-4 border-l border-r border-b border-black whitespace-nowrap"></td>
                        <td className="py-3 px-4 border-l border-r border-b border-black whitespace-nowrap">{service.service_code}</td>
                        <td className="py-3 px-4 border-l border-r border-b border-black whitespace-nowrap"><input type="checkbox" checked={!!selectedServices[id]} onChange={() => toggleService(group, service)} className="mr-2 w-5 h-5" /><span>{service.service_title}</span></td>
                        <td className="py-3 px-4 border-r border-b border-black whitespace-nowrap"><input type="number" disabled={!selectedServices[id]} value={priceData[id]?.pricingPackages || ""} onChange={(e) => setPriceData((prev) => ({ ...prev, [id]: { pricingPackages: e.target.value } }))} className="p-2 border rounded" /></td>
                        <td className="py-3 px-4 border-r border-b border-black whitespace-nowrap uppercase text-left"><MultiSelect options={packageOptions} value={(selectedPackages[id] || []).map((pkgId) => ({ value: pkgId, label: packageList.find((pkg) => Number(pkg.id) === Number(pkgId))?.title || String(pkgId) }))} onChange={(selectedList) => setSelectedPackages((prev) => ({ ...prev, [id]: selectedList.map((item) => item.value) }))} labelledBy="Select" disabled={!selectedServices[id]} className="uppercase" /></td>
                      </tr>);
                    });
                    return acc;
                  }, [])}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button type="submit" disabled={loading} className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>{mode === "edit" ? "Update" : "Submit"}</button>
          {onCancel && <button type="button" onClick={onCancel} className="p-6 py-3 bg-red-500 text-white hover:scale-105 font-bold rounded-md hover:bg-red-600">Cancel</button>}
        </div>
      </form>
    </div>
  );
};

const AdminVendorOnboarding = () => <VendorForm mode="create" />;

export default AdminVendorOnboarding;


