"use client";

import { createContext, useState } from "react";

export const AdminContext = createContext(undefined);

export const AdminProvider = ({ children }) => {
  // Mock data - will be replaced with API calls
  const [users, setUsers] = useState([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "customer",
      orders: 12,
      joinDate: "2024-03-15",
      status: "active",
      verified: true,
      totalSales: "$2,450"
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "seller",
      orders: 45,
      joinDate: "2024-05-20",
      status: "active",
      verified: true,
      totalSales: "$8,920"
    },
  ]);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [businessVerifications, setBusinessVerifications] = useState([]);

  // User actions
  const banUser = (userId) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: "banned" } : user
    ));
    console.log("User banned:", userId);
    // TODO: Call API
  };

  const verifyUser = (userId) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, verified: true } : user
    ));
    console.log("User verified:", userId);
    // TODO: Call API
  };

  const updateUser = (userId, data) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, ...data } : user
    ));
    console.log("User updated:", userId, data);
    // TODO: Call API
  };

  // Product actions
  const approveProduct = (productId) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, status: "active" } : product
    ));
    console.log("Product approved:", productId);
    // TODO: Call API
  };

  const rejectProduct = (productId, reason) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, status: "rejected" } : product
    ));
    console.log("Product rejected:", productId, reason);
    // TODO: Call API
  };

  // Flagged content actions
  const approveFlaggedContent = (flagId) => {
    setFlaggedContent(flaggedContent.map(item => 
      item.id === flagId ? { ...item, status: "approved" } : item
    ));
    console.log("Flagged content approved:", flagId);
    // TODO: Call API
  };

  const removeFlaggedContent = (flagId) => {
    setFlaggedContent(flaggedContent.map(item => 
      item.id === flagId ? { ...item, status: "removed" } : item
    ));
    console.log("Flagged content removed:", flagId);
    // TODO: Call API
  };

  // Appeal actions
  const approveAppeal = (appealId) => {
    setAppeals(appeals.map(appeal => 
      appeal.id === appealId ? { ...appeal, status: "approved" } : appeal
    ));
    console.log("Appeal approved:", appealId);
    // TODO: Call API
  };

  const rejectAppeal = (appealId, reason) => {
    setAppeals(appeals.map(appeal => 
      appeal.id === appealId ? { ...appeal, status: "rejected" } : appeal
    ));
    console.log("Appeal rejected:", appealId, reason);
    // TODO: Call API
  };

  // Payout actions
  const approvePayout = (payoutId) => {
    setPayoutRequests(payoutRequests.map(payout => 
      payout.id === payoutId ? { ...payout, status: "approved" } : payout
    ));
    console.log("Payout approved:", payoutId);
    // TODO: Call API
  };

  const rejectPayout = (payoutId, reason) => {
    setPayoutRequests(payoutRequests.map(payout => 
      payout.id === payoutId ? { ...payout, status: "rejected" } : payout
    ));
    console.log("Payout rejected:", payoutId, reason);
    // TODO: Call API
  };

  // Business verification actions
  const approveBusinessVerification = (verificationId) => {
    setBusinessVerifications(businessVerifications.map(verification => 
      verification.id === verificationId ? { ...verification, status: "approved" } : verification
    ));
    console.log("Business verification approved:", verificationId);
    // TODO: Call API
  };

  const rejectBusinessVerification = (verificationId, reason) => {
    setBusinessVerifications(businessVerifications.map(verification => 
      verification.id === verificationId ? { ...verification, status: "rejected" } : verification
    ));
    console.log("Business verification rejected:", verificationId, reason);
    // TODO: Call API
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        products,
        orders,
        flaggedContent,
        appeals,
        payoutRequests,
        businessVerifications,
        banUser,
        verifyUser,
        updateUser,
        approveProduct,
        rejectProduct,
        approveFlaggedContent,
        removeFlaggedContent,
        approveAppeal,
        rejectAppeal,
        approvePayout,
        rejectPayout,
        approveBusinessVerification,
        rejectBusinessVerification,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

