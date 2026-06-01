import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  EnvelopeIcon,
  LockClosedIcon,
  PhotoIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import ImagePreview from "./ImagePreview";

const inputClassName = "mt-1 block min-h-10 w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-700 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm";
const labelClassName = "block text-xs font-semibold uppercase text-slate-400";

const FormNewAdmin = () => {
  const [surnom, setSurnom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Vérifie si l'utilisateur est super admin

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.data.GradeID === 1) {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error("Failed to verify super admin:", error);
      }
    };

    checkSuperAdmin();
  }, []);

  const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 20;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      password.length <= maxLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!validatePassword(motDePasse)) {
      setErrorMessage(
        "Le mot de passe doit contenir entre 8 et 20 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("surnom", surnom);
      formData.append("email", email);
      formData.append("motDePasse", motDePasse);
      formData.append("gradeId", 2); // Ajouter le gradeId
      if (image) formData.append("image", image);

      const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;

      const response = await axios.post(
        `${apiBaseUrl}/api/users/register`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log("Admin created successfully:", response.data);
      setErrorMessage("");
      setSurnom("");
      setEmail("");
      setMotDePasse("");
      setImage(null);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || "Une erreur inattendue est survenue."
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
            <UserPlusIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-sky-300">Administrateurs</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">Créer un administrateur</h2>
          </div>
        </div>
      </div>

      {!isSuperAdmin ? (
        <div className="p-6 text-sm leading-6 text-slate-300">
          <span className="font-semibold text-sky-300">Accès interdit :</span> cette section est réservée au super administrateur.
        </div>
      ) : (
        <>
        {errorMessage && (
          <div className="mx-5 mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:mx-6">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleCreateAdmin} className="space-y-5 p-5 sm:p-6">
          <div>
            <label className={labelClassName}>Surnom</label>
            <input
              type="text"
              className={inputClassName}
              value={surnom}
              onChange={(e) => setSurnom(e.target.value)}
              required
            />
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
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClassName}>Mot de passe</label>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className={`${inputClassName} pl-9`}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Le mot de passe doit contenir entre 8 et 20 caractères, inclure une
              majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <PhotoIcon className="h-5 w-5 text-sky-300" />
              <label className="text-sm font-semibold text-slate-50">Photo de profil</label>
            </div>
            <ImagePreview onImageSelect={setImage} />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Créer
          </button>
        </form>
        </>
      )}
    </section>
  );
};

export default FormNewAdmin;
