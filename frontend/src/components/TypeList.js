import React from "react";

const TypeList = ({ types, selectedType, setSelectedType }) => {

  const handleChange = (e) => {
    setSelectedType(e.target.value);
  };

  return (
      <div>
        <label className="block font-bold text-xl text-neutral-200 italic">Sélectionner un type</label>
        <select
          value={selectedType}
          onChange={handleChange}
          className="block w-full rounded-md border-0 px-3 py-1.5 text-neutral-200 bg-neutral-900/50 shadow-sm ring-1 ring-inset ring-neutral-200/50 focus:ring-2 focus:ring-inset focus:ring-sky-600 outline-none placeholder:text-neutral-700 sm:text-sm/6 min-h-9"
        >
          <option value="">-- Sélectionner un type --</option>
          {types.map((type) => (
            <option key={type.TypeID} value={type.TypeID}>
              {type.Nom}
            </option>
          ))}
        </select>
      </div>
  );
};

export default TypeList;
