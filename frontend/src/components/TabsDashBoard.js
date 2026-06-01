import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { shieldFetch } from '../services/api';

import AddVehicleForm from './AddVehicleForm';
import VehicleDetails from './VehicleDetails';
import { usePrivacy } from '../privacy/PrivacyContext';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";

const TabsDashBoard = () => {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPrivacyMode } = usePrivacy();
  const selectedVehicleId = searchParams.get('vehicleId');
  const isAddVehicleView = searchParams.get('addVehicle') === 'true';
  const selectedVehicle = useMemo(() => {
    if (data.length === 0) return null;
    if (!selectedVehicleId) return data[0];
    return data.find((item) => String(item.VehiculeID) === String(selectedVehicleId)) || null;
  }, [data, selectedVehicleId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const fetchVehicles = useCallback(async () => {
    if (user) {
      try {
        const [activeResponse, soldResponse] = await Promise.all([
          shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}`),
          shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/sold`),
        ]);
        if (!activeResponse.ok || !soldResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const [activeResult, soldResult] = await Promise.all([
          activeResponse.json(),
          soldResponse.json(),
        ]);
        setData([
          ...(Array.isArray(activeResult) ? activeResult : []),
          ...(Array.isArray(soldResult) ? soldResult : []),
        ]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (isPrivacyMode && isAddVehicleView) {
      navigate('/vehicule', { replace: true });
    }
  }, [isAddVehicleView, isPrivacyMode, navigate]);

  useEffect(() => {
    if (user && selectedVehicle && !isAddVehicleView) {
      let ignore = false;
      const fetchVehicleDetails = async () => {
        setVehicleDetails(null);
        try {
          const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/${selectedVehicle.VehiculeID}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const result = await response.json();
          if (!ignore) {
            setVehicleDetails(result);
          }
        } catch (error) {
          if (!ignore) {
            console.error('Failed to fetch vehicle details:', error);
          }
        }
      };

      fetchVehicleDetails();
      return () => {
        ignore = true;
      };
    }
  }, [user, selectedVehicle, isAddVehicleView]);

  const handleAddVehicle = async (newVehicle) => {
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVehicle),
      });

      if (!response.ok) {
        throw new Error('Failed to add vehicle');
      }

      const updatedData = await response.json();
      setData([...data, updatedData]);
      fetchVehicles(); // Recharge la liste des véhicules
    } catch (error) {
      console.error('Failed to add vehicle:', error);
    }
  };

  return (
    <div className='mb-8'>
      <div className="text-neutral-100">
        {!isAddVehicleView ? (
          <VehicleDetails vehicle={vehicleDetails} onRefresh={fetchVehicles} />
        ) : (
          <AddVehicleForm onAddVehicle={handleAddVehicle} onRefresh={fetchVehicles} />
        )}
      </div>
    </div>
  );
};

export default TabsDashBoard;
