import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhotoIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ImagePreview from "./ImagePreview";

const inputClassName = "mt-1 block min-h-10 w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-700 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm";
const labelClassName = "block text-xs font-semibold uppercase text-slate-400";

const UpdateSettings = () => {
  const [user, setUser] = useState({});
  const [surnom, setSurnom] = useState("");
  const [email, setEmail] = useState("")
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(response.data);
        setSurnom(response.data.Surnom);
        setEmail(response.data.Email);

        // Si l'utilisateur a une image, utiliser son URL, sinon une image par défaut
        setImage(response.data.CheminImage ? `${apiBaseUrl}${response.data.CheminImage}` : null);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("surnom", surnom);
    formData.append("email", email);
    if (oldPassword || newPassword || confirmPassword) {
      const passwordData = JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      formData.append("motDePasse", passwordData);
    }

    // Gérer l'image : suppression ou remplacement
    if (removeImage) {
      formData.append("removeImage", true);
    } else if (image && typeof image !== "string") {
      formData.append("image", image);
    }

    try {
      const response = await axios.put("/api/users/update", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccessMessage("Les paramètres ont été mis à jour avec succès.");
      setErrorMessage(""); // Réinitialiser le message d'erreur

      if (response.data.user.CheminImage) {
        setImage(`${apiBaseUrl}${response.data.user.CheminImage}`);
        setRemoveImage(false);
      } else {
        setImage(null);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "An error occurred");
      setSuccessMessage(""); // Réinitialiser le message de succès
    }
  };

  const handleImageSelect = (selectedImage) => {
    setImage(selectedImage);
    setRemoveImage(false); // Désactiver la suppression si une nouvelle image est sélectionnée
  };

  const handleRemoveImage = (e) => {
    const isChecked = e.target.checked;
    setRemoveImage(isChecked);
    if (isChecked) {
      setImage(null); // Réinitialise l'image si "Supprimer" est coché
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-sky-300">Profil</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">Informations personnelles</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
            <UserCircleIcon className="h-4 w-4 text-sky-300" />
            {user?.Surnom || "Compte"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6">
        {errorMessage && (
          <p className="mb-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mb-5 inline-flex w-full items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircleIcon className="h-4 w-4" />
            {successMessage}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
          <div className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">Identité et sécurité</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClassName}>Surnom</label>
                <div className="relative">
                  <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className={`${inputClassName} pl-9`}
                    value={surnom}
                    onChange={(e) => setSurnom(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Email</label>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    className={`${inputClassName} pl-9`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Ancien mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    className={`${inputClassName} pl-9`}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClassName}>Nouveau mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    className={`${inputClassName} pl-9`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClassName}>Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    className={`${inputClassName} pl-9`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <div className="flex items-center gap-2">
              <PhotoIcon className="h-5 w-5 text-sky-300" />
              <h3 className="text-base font-semibold text-slate-50">Photo de profil</h3>
            </div>
            <div className="mt-5">
              <ImagePreview
                initialImage={image}
                onImageSelect={handleImageSelect}
              />
            </div>
            <label htmlFor="removeImage" className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-300 hover:border-sky-500/30">
              <input
                id="removeImage"
                name="removeImage"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                checked={removeImage}
                onChange={handleRemoveImage}
              />
              Supprimer l'image de profil
            </label>
          </aside>
        </div>

        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
          >
            Sauvegarder
          </button>
        </div>
      </form>
    </section>
  );
};

export default UpdateSettings;
