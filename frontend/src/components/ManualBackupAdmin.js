import React, { useState } from "react";
import { ArrowDownTrayIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import api from "../services/api";

const getFilenameFromHeaders = (headers) => {
  const explicitName = headers["x-backup-filename"];
  if (explicitName) return explicitName;

  const disposition = headers["content-disposition"];
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || "sauvegarde_vehicle.sql";
};

const readErrorMessage = async (error) => {
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.error || "Erreur lors de la sauvegarde.";
    } catch (_) {
      return "Erreur lors de la sauvegarde.";
    }
  }

  return data?.error || "Erreur lors de la sauvegarde.";
};

const ManualBackupAdmin = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!password) {
      setMessage({ type: "error", text: "Mot de passe requis." });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        "/admin/backup/manual",
        { motDePasse: password },
        { responseType: "blob" }
      );

      const filename = getFilenameFromHeaders(response.headers);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/sql" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setPassword("");
      setMessage({
        type: "success",
        text: `Sauvegarde créée dans uploads/BDD/${filename} et téléchargement lancé.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: await readErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <CircleStackIcon className="size-6 text-amber-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-50">Sauvegarde manuelle</h2>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Crée une copie SQL dans <span className="font-mono text-amber-100">uploads/BDD</span> et lance une
            seconde copie en téléchargement. Action réservée au superadmin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3 lg:max-w-md">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Mot de passe superadmin</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowDownTrayIcon className="size-5" aria-hidden="true" />
            {loading ? "Sauvegarde en cours..." : "Créer et télécharger la sauvegarde"}
          </button>

          {message && (
            <p className={message.type === "success" ? "text-sm text-emerald-300" : "text-sm text-red-300"}>
              {message.text}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default ManualBackupAdmin;
