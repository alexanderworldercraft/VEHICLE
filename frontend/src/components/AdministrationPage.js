import React, { useEffect, useState } from "react";
import FormNewAdmin from "./FormNewAdmin";
import AdminList from "./AdminList";
import UserList from "./UserList";
import ReferenceDataAdmin from "./ReferenceDataAdmin";
import ManualBackupAdmin from "./ManualBackupAdmin";
import api from "../services/api";

const AdministrationPage = () => {
    const [reload, setReload] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const handleStateChange = () => {
        setReload((prev) => !prev);
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.get("/users/me");
                setCurrentUser(response.data);
            } catch (error) {
                setCurrentUser(null);
            }
        };

        fetchCurrentUser();
    }, []);

    return (
        <main className="mx-auto max-w-7xl grow">
            <div className="space-y-6 text-neutral-100">
                <header>
                    <h1 className="text-2xl font-semibold text-slate-50">Administration</h1>
                    <p className="mt-1 text-sm text-slate-400">Gérez les administrateurs, les états des comptes et les données de référence.</p>
                </header>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(320px,0.42fr)_minmax(0,1fr)]">
                    <FormNewAdmin />
                    <AdminList />
                </section>

                {currentUser?.GradeID === 1 && <ManualBackupAdmin />}

                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-slate-50">Utilisateurs</h2>
                        <p className="mt-1 text-sm text-slate-400">Vue par état des comptes standard.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                        <UserList
                            key={`actif-${reload}`}
                            gradeId={3}
                            etatId={1}
                            onStateChange={handleStateChange}
                        />
                        <UserList
                            key={`bloque-${reload}`}
                            gradeId={3}
                            etatId={3}
                            onStateChange={handleStateChange}
                        />
                        <UserList
                            key={`supprime-${reload}`}
                            gradeId={3}
                            etatId={2}
                            onStateChange={handleStateChange}
                        />
                    </div>
                </section>

                <ReferenceDataAdmin />
            </div>
        </main>
    );
};

export default AdministrationPage;
