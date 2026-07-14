import React from "react";
import AdminVendorListing from "./AdminVendorListing";

const AdminInactiveVendorListing = () => (
  <AdminVendorListing statusFilter="inactive" title="INACTIVE VENDORS" />
);

export default AdminInactiveVendorListing;