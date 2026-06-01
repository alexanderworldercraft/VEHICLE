import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ArchiveBoxXMarkIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;

const stateMeta = {
  1: {
    label: "Actif",
    title: "Utilisateurs actifs",
    icon: CheckCircleIcon,
    accent: "text-emerald-300",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  2: {
    label: "Supprimé",
    title: "Utilisateurs supprimés",
    icon: ArchiveBoxXMarkIcon,
    accent: "text-rose-300",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
  3: {
    label: "Bloqué",
    title: "Utilisateurs bloqués",
    icon: NoSymbolIcon,
    accent: "text-amber-300",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
};

const UserList = ({ gradeId = 3, etatId, onStateChange }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = stateMeta[etatId] || {
    label: "Utilisateurs",
    title: "Utilisateurs",
    icon: UserIcon,
    accent: "text-sky-300",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  };
  const HeaderIcon = meta.icon;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/users/get-users`,
        {
          params: { gradeId, etatId },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Une erreur est survenue lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEtat = async (userId, currentEtat) => {
    try {
      const newEtat = currentEtat === 1 ? 3 : 1; // Alterne entre Actif (1) et Bloqué (3)
      await axios.put(
        `${apiBaseUrl}/api/users/change-etat`,
        { userId, newEtat },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Notifie le parent que l'état a changé
      if (onStateChange) onStateChange();
    } catch (err) {
      console.error("Failed to change user state:", err);
      setError("Une erreur est survenue lors de la modification de l'état.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [gradeId, etatId]);

  return (
    <section className="overflow-hidden rounded-lg border border-sky-500/20 bg-slate-950/60">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 ${meta.accent}`}>
            <HeaderIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-50">{meta.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{users.length} compte{users.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading && <p className="text-sm text-amber-200">Chargement...</p>}
        {error && (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {!loading && !error && users.length === 0 && (
          <p className="rounded-md border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
            Aucun compte dans cet état.
          </p>
        )}
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.UtilisateurID} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-sky-500/20 bg-slate-950">
                    <img
                      src={
                        user.CheminImage
                          ? `${apiBaseUrl}${user.CheminImage}`
                          : "/imageDefault.png"
                      }
                      alt={user.Surnom}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">{user.Surnom}</p>
                    <p className="truncate text-sm text-slate-400">{user.Email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stateMeta[user.EtatID]?.badge || meta.badge}`}>
                    {stateMeta[user.EtatID]?.label || "N/A"}
                  </span>
                  {user.EtatID !== 2 && (
                    <button
                      type="button"
                      onClick={() => handleChangeEtat(user.UtilisateurID, user.EtatID)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                        user.EtatID === 1
                          ? "bg-amber-600 hover:bg-amber-500"
                          : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {user.EtatID === 1 ? "Bloquer" : "Activer"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default UserList;
