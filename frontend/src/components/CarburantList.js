import React from "react";

const CarburantList = ({ carburants, selectedCarburant, setSelectedCarburant }) => {

  const handleChange = (e) => {
    setSelectedCarburant(e.target.value);
  };

  return (
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400">Carburant</label>
        <select
          value={selectedCarburant}
          onChange={handleChange}
          className="mt-1 block min-h-10 w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-700 outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
        >
          <option value="">-- Sélectionner un carburant --</option>
          {carburants.map((carburant) => (
            <option key={carburant.CarburantID} value={carburant.CarburantID}>
              {carburant.Nom}
            </option>
          ))}
        </select>
      </div>
  );
};

export default CarburantList;
