import React from "react";
import UpdateSettings from "./UpdateSettings";
import DeleteAccount from "./DeleteAccount";

const SettingsPage = () => {
  return (
    <main className="mx-auto max-w-7xl grow">
      <div className="space-y-6 text-neutral-100">
        <header>
          <h1 className="text-2xl font-semibold text-slate-50">Paramètres</h1>
          <p className="mt-1 text-sm text-slate-400">Gérez votre profil, votre photo et la sécurité du compte.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
          <UpdateSettings />
          <DeleteAccount />
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
