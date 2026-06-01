import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { shieldFetch } from '../services/api';
import { maskSensitiveValue, usePrivacy } from '../privacy/PrivacyContext';
import { roundPrivacyNumber } from '../privacy/privacyDisplay';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";

const SimulationPage = () => {
  const navigate = useNavigate();
  const { isPrivacyMode, isShieldModeLevel2 } = usePrivacy();
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [kmInput, setKmInput] = useState('');
  const [results, setResults] = useState([]);
  const wearCostPerKmByType = {
    voiture: 0.04,
    moto: 0.055,
  };
  const displayCost = (value) => (isShieldModeLevel2 ? roundPrivacyNumber(value, 'price') : isPrivacyMode ? maskSensitiveValue(value) : value);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('users/me');
        setUser(response.data);
        console.log('User profile fetched:', response.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const fetchVehicles = async () => {
    if (user) {
      try {
        const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/cost/simulation/rolling`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log('Vehicles data fetched:', result);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const calculateMedian = (values) => {
    console.log('Calculating median for values:', values);
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  };

  const handleCalculate = () => {
    const km = parseFloat(kmInput);
    if (isNaN(km)) {
      console.error('Invalid km input:', kmInput);
      return;
    }

    const results = [];

    // Regrouper les relevés par VehiculeID
    const vehiclesMap = {};
    data.forEach(releve => {
      if (!vehiclesMap[releve.VehiculeID]) {
        vehiclesMap[releve.VehiculeID] = {
          Nom: releve.Vehicule.Nom,
          TypeNom: releve.Vehicule?.Type?.Nom,
          releves: []
        };
      }
      vehiclesMap[releve.VehiculeID].releves.push(releve);
    });

    console.log('Vehicles map:', vehiclesMap);

    for (const vehiculeID in vehiclesMap) {
      const vehicule = vehiclesMap[vehiculeID];
      console.log('Processing vehicle:', vehicule.Nom);

      const releves = vehicule.releves.sort((a, b) => new Date(a.Date) - new Date(b.Date));

      if (releves.length < 2) {
        console.warn('Not enough relevés for vehicle:', vehicule.Nom);
        continue;
      }

      const costsPerKm = [];
      for (let i = 1; i < releves.length; i++) {
        const distance = releves[i].Kilometre - releves[i - 1].Kilometre;
        if (distance > 0) {
          const costPerKm = releves[i].PrixTotal / distance;
          costsPerKm.push(costPerKm);
        }
      }

      const medianCostPerKm = calculateMedian(costsPerKm);
      const typeKey = (vehicule.TypeNom || '').trim().toLowerCase();
      const wearCostPerKm = wearCostPerKmByType[typeKey] || 0;
      const fuelCostPerKm = medianCostPerKm;
      const fuelTotalCost = fuelCostPerKm * km;
      const wearTotalCost = wearCostPerKm * km;
      const totalCost = fuelTotalCost + wearTotalCost;
      const totalCostPerKm = totalCost / km;

      results.push({
        vehicule: vehicule.Nom,
        totalCost: totalCost.toFixed(3),
        totalCostPerKm: totalCostPerKm.toFixed(3),
        fuelTotalCost: fuelTotalCost.toFixed(3),
        fuelCostPerKm: fuelCostPerKm.toFixed(3),
        wearTotalCost: wearTotalCost.toFixed(3),
        wearCostPerKm: wearCostPerKm.toFixed(3),
      });
    }

    console.log('Calculation results:', results);
    setResults(results);
  };

  return (
    <main className="container grow mx-auto px-4">
      <div className='mt-8 p-6 bg-gradient-to-b from-slate-950 to-slate-900 text-neutral-100 rounded-xl shadow-xl border-blue-500 border-2'>
        <h3 className="text-4xl text-center italic font-black underline mb-8">Simulation des coûts de roulage</h3>
        <div className='grid grid-cols-1 gap-8 mb-8'>
          <div>
            <label className="block font-bold text-xl text-neutral-200 italic">Kilomètres</label>
            <input
              type="number"
              value={kmInput}
              onChange={(e) => setKmInput(e.target.value)}
              className="block w-96 rounded-md border-0 px-3 py-1.5 text-neutral-200 bg-neutral-900/50 shadow-sm ring-1 ring-inset ring-neutral-200/50 focus:ring-2 focus:ring-inset focus:ring-sky-600 outline-none placeholder:text-neutral-700 sm:text-sm/6"
            />
          </div>
        </div>
        <button
          onClick={handleCalculate}
          className="mb-8 bg-gradient-to-r from-sky-800 to-sky-700 text-white px-4 py-2 rounded hover:from-sky-900 hover:to-sky-950"
        >
          Calculer
        </button>


        <div className='border border-blue-500 rounded-lg overflow-auto w-fit mx-auto'>
          <table className='table-auto'>
            <thead>
              <tr>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Véhicule</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût total</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût total/km</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût essence total</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût essence/km</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût entretien total</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Coût entretien/km</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{result.vehicule}</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.totalCost)} €</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.totalCostPerKm)} €</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.fuelTotalCost)} €</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.fuelCostPerKm)} €</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.wearTotalCost)} €</td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'>{displayCost(result.wearCostPerKm)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default SimulationPage;
