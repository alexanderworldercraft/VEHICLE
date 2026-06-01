import React from "react";

const PaginationPage = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center space-x-4 bg-neutral-950/50 rounded-full shadow-md border border-neutral-100/30">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-s-full ${
          currentPage === 1
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-sky-800 to-sky-700 text-white hover:from-sky-900 hover:to-sky-950"
        }`}
      >
        Précédent
      </button>
      <span className="text-neutral-200">
        {currentPage} sur {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-e-full ${
          currentPage === totalPages
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-l from-sky-800 to-sky-700 text-white hover:from-sky-900 hover:to-sky-950"
        }`}
      >
        Suivant
      </button>
    </div>
    </div>
  );
};

export default PaginationPage;
