"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Business = {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  onboarded: boolean;
};

type BusinessContextType = {
  businesses: Business[];
  currentBusiness: Business | null;
  setCurrentBusiness: (b: Business | null) => void;
  loading: boolean;
  error: string | null;
};

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

const STORAGE_KEY = "crewlink_admin_current_business_id";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrentBusiness = (b: Business | null) => {
    setCurrentBusinessState(b);
    if (typeof window !== "undefined") {
      if (b) {
        localStorage.setItem(STORAGE_KEY, b.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);

      // Attempt to fetch with new metadata fields
      let { data, error } = await supabase
        .from("businesses")
        .select("id, slug, name, industry, onboarded")
        .order("name", { ascending: true });

      // Fallback: If the migration hasn't been run yet, fetch without the new fields
      if (error) {
        console.warn("Retrying fetch without industry/onboarded fields (migration might be missing)", error.message);
        const fallbackRes = await supabase
          .from("businesses")
          .select("id, slug, name")
          .order("name", { ascending: true });

        data = (fallbackRes.data || []).map(b => ({
          ...b,
          industry: null,
          onboarded: true
        })) as any;
        error = fallbackRes.error;
      }

      if (error) {
        console.error("Error loading businesses", error);
        setError("Failed to load businesses");
        setLoading(false);
        return;
      }

      const bizList = (data || []).map(b => ({
        ...b,
        onboarded: b.onboarded ?? true // Default to true if column missing to avoid wizard loop
      })) as Business[];
      setBusinesses(bizList);

      let savedId: string | null = null;
      if (typeof window !== "undefined") {
        savedId = localStorage.getItem(STORAGE_KEY);
      }

      if (savedId) {
        const match = bizList.find((b) => b.id === savedId) || null;
        setCurrentBusinessState(match);
      } else {
        setCurrentBusinessState(bizList[0] ?? null);
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, []);

  return (
    <BusinessContext.Provider
      value={{ businesses, currentBusiness, setCurrentBusiness, loading, error }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return ctx;
}
