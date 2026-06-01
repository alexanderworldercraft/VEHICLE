import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;

const getStatusClasses = (etatId) => {
  if (etatId === 1) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (etatId === 3) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-rose-500/30 bg-rose-500/10 text-rose-200";
};

const getStatusLabel = (etatId) => {
  if (etatId === 1) return "Actif";
  if (etatId === 3) return "Bloqué";
  return "Supprimé";
};

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [currentUserGrade, setCurrentUserGrade] = useState(null); // Grade de l'utilisateur connecté
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users/admins`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAdmins(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des admins:", error.response?.data || error.message);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Current user data:", response.data); // Log pour vérifier les données de l'utilisateur actuel
      setCurrentUserGrade(response.data.GradeID);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur connecté:", error.response?.data || error.message);
    }
  };

  const handleChangeEtat = async (userId, currentEtat) => {
    const newEtat = currentEtat === 1 ? 3 : 1; // Bloquer si Actif, Activer si Bloqué
    try {
      await axios.put(
        `${apiBaseUrl}/api/users/change-etat`,
        { userId, newEtat },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchAdmins(); // Recharger la liste après modification
    } catch (error) {
      console.error("Erreur lors du changement d'état de l'utilisateur:", error.response?.data || error.message);
      setErrorMessage("Une erreur est survenue lors du changement d'état.");
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, []);

  return (
    <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
              <UserGroupIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-sky-300">Équipe</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">Liste des administrateurs</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
            <ShieldCheckIcon className="h-4 w-4 text-sky-300" />
            {admins.length} compte{admins.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {errorMessage && (
        <div className="mx-5 mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:mx-6">
          {errorMessage}
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="max-h-[28rem] overflow-auto rounded-lg border border-sky-500/20 bg-slate-950/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-950 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Surnom</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">État</th>
              {currentUserGrade === 1 && (
                  <th className="px-4 py-3 font-semibold">Action</th>
              )}
            </tr>
          </thead>
            <tbody className="divide-y divide-white/10">
              {(admins || []).map((admin) => (
                <tr key={admin.UtilisateurID} className="text-slate-300 hover:bg-slate-900/60">
                  <td className="px-4 py-3 text-slate-400">{admin.UtilisateurID}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{admin.Surnom}</td>
                  <td className="px-4 py-3">{admin.Email}</td>
                  <td className="px-4 py-3">{admin.Grade?.Nom || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(admin.EtatID)}`}>
                      {getStatusLabel(admin.EtatID)}
                    </span>
                  </td>
                  {currentUserGrade === 1 && (
                    <td className="px-4 py-3">
                      {admin.GradeID === 2 && admin.EtatID !== 2 ? (
                        <button
                          type="button"
                          onClick={() => handleChangeEtat(admin.UtilisateurID, admin.EtatID)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                            admin.EtatID === 1
                              ? "bg-amber-600 hover:bg-amber-500"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          }`}
                        >
                          {admin.EtatID === 1 ? "Bloquer" : "Activer"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminList;
