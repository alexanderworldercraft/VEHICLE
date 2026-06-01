import React from "react";

const Notification = ({ message, icon, type }) => {
  // Définir les classes de couleur en fonction du type
  const backgroundColor = {
    success: "bg-green-800",
    error: "bg-red-800",
    info: "bg-blue-800",
    warning: "bg-yellow-800",
  };

  return (
    <div className={`notification ${backgroundColor[type] || "bg-gray-500"} z-50 p-4 rounded-md text-white shadow-md fixed top-0 right-0 m-4`}>
      <span className="mr-2">{icon}</span>
      {message}
    </div>
  );
};

export default Notification;
