import React from "react";

const MarqueList = ({ marques, selectedMarque, setSelectedMarque }) => {

  const handleChange = (e) => {
    setSelectedMarque(e.target.value);
  };

  return (
      <div>
        <label className="block font-bold text-xl text-neutral-200 italic">Sélectionner une marque</label>
        <select
          value={selectedMarque}
          onChange={handleChange}
          className="block w-full rounded-md border-0 px-3 py-1.5 text-neutral-200 bg-neutral-900/50 shadow-sm ring-1 ring-inset ring-neutral-200/50 focus:ring-2 focus:ring-inset focus:ring-sky-600 outline-none placeholder:text-neutral-700 sm:text-sm/6 min-h-9"
        >
          <option value="">-- Sélectionner une marque --</option>
          {marques.map((marque) => (
            <option key={marque.MarqueID} value={marque.MarqueID}>
              {marque.Nom}
            </option>
          ))}
        </select>
      </div>
  );
};

export default MarqueList;
