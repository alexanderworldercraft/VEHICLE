import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";

const ITEMS_PER_PAGE = 10;

const emptyForms = {
  types: { Nom: "" },
  marques: { Nom: "" },
  carburants: { Nom: "", Couleur: "#38bdf8" },
  "categories-entretien": { Nom: "", Couleur: "#38bdf8", Icone: "" },
  "entretiens-types": { Nom: "", Description: "", CategorieEntretienID: "" },
};

const resourceConfigs = [
  {
    key: "types",
    title: "Types de véhicule",
    countKey: "types",
    idField: "TypeID",
    columns: [{ key: "Nom", label: "Nom" }],
  },
  {
    key: "marques",
    title: "Marques de véhicule",
    countKey: "marques",
    idField: "MarqueID",
    columns: [{ key: "Nom", label: "Nom" }],
  },
  {
    key: "carburants",
    title: "Carburants",
    countKey: "carburants",
    idField: "CarburantID",
    columns: [
      { key: "Nom", label: "Nom" },
      { key: "Couleur", label: "Couleur", type: "color" },
    ],
  },
  {
    key: "categories-entretien",
    title: "Catégories d'entretien",
    countKey: "categoriesEntretien",
    idField: "CategorieEntretienID",
    columns: [
      { key: "Nom", label: "Nom" },
      { key: "Couleur", label: "Couleur", type: "color" },
      { key: "Icone", label: "Icône" },
    ],
  },
  {
    key: "entretiens-types",
    title: "Entretiens types",
    countKey: "entretiensTypes",
    idField: "EntretienTypeID",
    columns: [
      { key: "Nom", label: "Nom" },
      { key: "Description", label: "Description" },
      { key: "CategorieEntretienID", label: "Catégorie", type: "category" },
    ],
  },
];

const getInitialData = () => ({
  types: [],
  marques: [],
  carburants: [],
  categoriesEntretien: [],
  entretiensTypes: [],
});

const getResourceItems = (data, config) => data[config.countKey] || [];

const getFieldValue = (item, column) => {
  if (column.type === "category") {
    return item.CategorieEntretien?.Nom || "-";
  }
  return item[column.key] || "-";
};

const normalizeFormFromItem = (item, config) => {
  const form = { ...emptyForms[config.key] };
  Object.keys(form).forEach((key) => {
    form[key] = item[key] === null || item[key] === undefined ? "" : String(item[key]);
  });
  return form;
};

const getSearchableText = (item, config) => (
  [
    item[config.idField],
    ...config.columns.map((column) => getFieldValue(item, column)),
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase()
);

const clampPage = (page, totalPages) => Math.min(Math.max(page, 1), Math.max(totalPages, 1));

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .reduce((items, page, index, sortedPages) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) items.push("ellipsis");
      items.push(page);
      return items;
    }, []);
};

function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;

  const safeCurrentPage = clampPage(currentPage, totalPages);
  const startItem = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  const goToPage = (page) => {
    onPageChange(clampPage(page, totalPages));
  };

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="relative inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-300">
          Affichage <span className="font-medium">{startItem}</span> à <span className="font-medium">{endItem}</span> sur{" "}
          <span className="font-medium">{totalItems}</span> résultat{totalItems > 1 ? "s" : ""}
        </p>
        <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md">
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="sr-only">Précédent</span>
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </button>
          {paginationItems.map((item, index) => (
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-700 focus:outline-offset-0">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                aria-current={item === safeCurrentPage ? "page" : undefined}
                className={item === safeCurrentPage
                  ? "relative z-10 inline-flex items-center bg-sky-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-200 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0"}
              >
                {item}
              </button>
            )
          ))}
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="sr-only">Suivant</span>
            <ChevronRightIcon aria-hidden="true" className="size-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}

const ReferenceDataAdmin = () => {
  const [data, setData] = useState(getInitialData);
  const [activeKey, setActiveKey] = useState(resourceConfigs[0].key);
  const [form, setForm] = useState(emptyForms[resourceConfigs[0].key]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activeConfig = useMemo(
    () => resourceConfigs.find((config) => config.key === activeKey) || resourceConfigs[0],
    [activeKey]
  );
  const items = getResourceItems(data, activeConfig);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearchTerm) return items;
    return items.filter((item) => getSearchableText(item, activeConfig).includes(normalizedSearchTerm));
  }, [activeConfig, items, normalizedSearchTerm]);
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const safeCurrentPage = clampPage(currentPage, totalPages);
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const loadReferenceData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/reference-data");
      setData(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des données de référence:", err.response?.data || err.message);
      setError("Impossible de charger les données de référence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const resetForm = (nextKey = activeKey) => {
    setForm({ ...emptyForms[nextKey] });
    setEditingItem(null);
  };

  const handleResourceChange = (resourceKey) => {
    setActiveKey(resourceKey);
    setError("");
    setSuccess("");
    setSearchTerm("");
    setCurrentPage(1);
    resetForm(resourceKey);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setError("");
    setSuccess("");
    setForm(normalizeFormFromItem(item, activeConfig));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const id = editingItem?.[activeConfig.idField];
      if (id) {
        await api.put(`/admin/reference-data/${activeConfig.key}/${id}`, form);
        setSuccess("Élément mis à jour.");
      } else {
        await api.post(`/admin/reference-data/${activeConfig.key}`, form);
        setSuccess("Élément ajouté.");
      }
      resetForm();
      await loadReferenceData();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Impossible d'enregistrer cet élément.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item[activeConfig.idField];
    if (!window.confirm(`Supprimer "${item.Nom}" ?`)) return;

    setError("");
    setSuccess("");
    try {
      await api.delete(`/admin/reference-data/${activeConfig.key}/${id}`);
      setSuccess("Élément supprimé.");
      if (editingItem?.[activeConfig.idField] === id) resetForm();
      await loadReferenceData();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Impossible de supprimer cet élément.");
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
              <TagIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-sky-300">Base de données</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">Données de référence</h2>
            </div>
          </div>
          <span className="rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
            {filteredItems.length} / {items.length} élément{items.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[260px_minmax(280px,0.45fr)_minmax(0,1fr)]">
        <nav className="space-y-2">
          {resourceConfigs.map((config) => (
            <button
              key={config.key}
              type="button"
              onClick={() => handleResourceChange(config.key)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                activeKey === config.key
                  ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5"
              }`}
            >
              <span>{config.title}</span>
              <span className="text-xs text-slate-400">{getResourceItems(data, config).length}</span>
            </button>
          ))}
        </nav>

        <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-50">
                {editingItem ? "Modifier" : "Ajouter"}
              </h3>
              <p className="mt-1 text-xs text-slate-400">{activeConfig.title}</p>
            </div>
            {editingItem && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/5"
                title="Annuler"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {Object.keys(emptyForms[activeConfig.key]).map((field) => (
              <label key={field} className="block text-sm">
                <span className="mb-1 block font-medium text-slate-200">
                  {field === "CategorieEntretienID" ? "Catégorie" : field}
                </span>
                {field === "Couleur" ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form[field] || "#38bdf8"}
                      onChange={(event) => handleChange(field, event.target.value)}
                      className="h-10 w-14 rounded border border-white/10 bg-slate-900"
                    />
                    <input
                      type="text"
                      value={form[field] || ""}
                      onChange={(event) => handleChange(field, event.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
                      required
                    />
                  </div>
                ) : field === "CategorieEntretienID" ? (
                  <select
                    value={form[field] || ""}
                    onChange={(event) => handleChange(field, event.target.value)}
                    className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {data.categoriesEntretien.map((category) => (
                      <option key={category.CategorieEntretienID} value={category.CategorieEntretienID}>
                        {category.Nom}
                      </option>
                    ))}
                  </select>
                ) : field === "Description" ? (
                  <textarea
                    value={form[field] || ""}
                    onChange={(event) => handleChange(field, event.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field] || ""}
                    onChange={(event) => handleChange(field, event.target.value)}
                    className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
                    required={field !== "Icone"}
                  />
                )}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            {saving ? "Enregistrement..." : editingItem ? "Mettre à jour" : "Ajouter"}
          </button>

          {error && (
            <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {success}
            </p>
          )}
        </form>

        <div className="min-w-0 rounded-lg border border-white/10 bg-slate-950/60">
          <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-slate-50">{activeConfig.title}</h3>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Rechercher</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-md border border-white/10 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
              />
            </label>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  {activeConfig.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading && (
                  <tr>
                    <td colSpan={activeConfig.columns.length + 2} className="px-4 py-6 text-slate-400">
                      Chargement...
                    </td>
                  </tr>
                )}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={activeConfig.columns.length + 2} className="px-4 py-6 text-slate-400">
                      {searchTerm ? "Aucun élément ne correspond à la recherche." : "Aucun élément."}
                    </td>
                  </tr>
                )}
                {!loading && paginatedItems.map((item) => (
                  <tr key={item[activeConfig.idField]} className="text-slate-300 hover:bg-slate-900/60">
                    <td className="px-4 py-3 text-slate-500">{item[activeConfig.idField]}</td>
                    {activeConfig.columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {column.type === "color" ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-white/20"
                              style={{ backgroundColor: item[column.key] || "#38bdf8" }}
                            />
                            {item[column.key] || "-"}
                          </span>
                        ) : (
                          getFieldValue(item, column)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-md border border-sky-500/30 p-2 text-sky-200 hover:bg-sky-500/10"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-md border border-rose-500/30 p-2 text-rose-200 hover:bg-rose-500/10"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filteredItems.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  );
};

export default ReferenceDataAdmin;
