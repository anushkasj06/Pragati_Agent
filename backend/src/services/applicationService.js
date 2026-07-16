const applications = [];
const notifications = [];

function buildNotification({ sellerId, title, message, type = "info", link = "/seller/history" }) {
  return {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sellerId,
    title,
    message,
    type,
    link,
    timestamp: new Date().toISOString(),
    read: false,
  };
}

export function createApplication(payload) {
  const application = {
    id: `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sellerId: payload.sellerId,
    sellerName: payload.sellerName || "Seller",
    phoneNumber: payload.phoneNumber || "",
    amount: Number(payload.amount || 0),
    requestedAmount: Number(payload.requestedAmount || payload.amount || 0),
    purpose: payload.purpose || "Working capital",
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: "",
    decisionMessage: payload.decisionMessage || "Documents submitted. Awaiting admin review.",
    documents: payload.documents || {},
    riskClass: payload.riskClass || "Pending",
    language: payload.language || "English",
  };

  applications.unshift(application);
  notifications.unshift(
    buildNotification({
      sellerId: application.sellerId,
      title: "Loan application submitted",
      message: `${application.sellerName} submitted documents for a loan of ₹${application.amount.toLocaleString("en-IN")}.`,
      type: "pending",
      link: "/seller/history",
    })
  );

  return application;
}

export function listApplications({ sellerId, status } = {}) {
  return applications
    .filter((app) => !sellerId || app.sellerId === sellerId)
    .filter((app) => !status || app.status === status)
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function updateApplicationStatus(id, action, adminNote = "") {
  const application = applications.find((item) => item.id === id);
  if (!application) {
    throw new Error("Application not found");
  }

  application.status = action === "approved" ? "approved" : "rejected";
  application.reviewedAt = new Date().toISOString();
  application.reviewedBy = "Admin";
  application.adminNote = adminNote;
  application.decisionMessage =
    action === "approved"
      ? "Loan sanctioned and documents approved."
      : "Documents reviewed and the loan request was rejected.";

  notifications.unshift(
    buildNotification({
      sellerId: application.sellerId,
      title: action === "approved" ? "Loan approved" : "Loan rejected",
      message:
        action === "approved"
          ? `Your loan request for ₹${application.amount.toLocaleString("en-IN")} has been approved.`
          : `Your loan request for ₹${application.amount.toLocaleString("en-IN")} was reviewed and rejected.`,
      type: action === "approved" ? "success" : "rejected",
      link: "/seller/history",
    })
  );

  return application;
}

export function getNotificationsForSeller(sellerId) {
  return notifications.filter((n) => !sellerId || n.sellerId === sellerId).slice(0, 50);
}
