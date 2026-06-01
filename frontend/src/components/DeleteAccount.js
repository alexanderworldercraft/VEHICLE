import React, { useState } from "react";
import axios from "axios";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ConfirmModal = ({ title, children, confirmLabel, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
    <div className="w-full max-w-lg overflow-hidden rounded-lg border border-rose-500/30 bg-slate-950 shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-300">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
            <div className="mt-1 text-sm text-slate-400">{children}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
        >
          <span className="sr-only">Fermer</span>
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-wrap justify-end gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const DeleteAccount = () => {
  const [showFirstModal, setShowFirstModal] = useState(false);
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    console.log("handleDelete called"); // Vérifiez si cette ligne s'affiche
    try {
      await axios.put(
        `${process.env.REACT_APP_URL_LOCAL}/api/users/delete-account`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Request sent to backend"); // Confirmez si la requête est envoyée

      // Déconnexion après suppression
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to delete account:", error); // Déboguez l'erreur exacte
      setErrorMessage("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-rose-500/30 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-300">
            <ShieldExclamationIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-rose-300">Zone danger</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">Supprimer mon compte</h2>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm leading-6 text-slate-400">
          Vous pouvez supprimer votre compte définitivement. Cette action est irréversible et supprimera vos données personnelles.
        </p>
        {errorMessage && (
          <p className="mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          onClick={() => setShowFirstModal(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <TrashIcon className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </div>

      {showFirstModal && (
        <ConfirmModal
          title="Confirmer la suppression"
          confirmLabel="Continuer"
          onCancel={() => setShowFirstModal(false)}
          onConfirm={() => {
            setShowFirstModal(false);
            setShowSecondModal(true);
          }}
        >
          Êtes-vous sûr de vouloir supprimer votre compte ?
        </ConfirmModal>
      )}

      {showSecondModal && (
        <ConfirmModal
          title="Action irréversible"
          confirmLabel="Supprimer définitivement"
          onCancel={() => setShowSecondModal(false)}
          onConfirm={() => {
            console.log("Delete confirmation clicked"); // Vérifiez si ce message s'affiche
            handleDelete();
          }}
        >
          En confirmant, votre compte et vos données personnelles seront définitivement supprimés.
        </ConfirmModal>
      )}
    </section>
  );
};

export default DeleteAccount;
