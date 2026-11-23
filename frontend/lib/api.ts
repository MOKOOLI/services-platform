export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "boolean" | "select";
  required?: boolean;
  options?: string[];
};

export type ProductType = {
  id: number;
  slug: string;
  name: string;
  category: "academic" | "technical";
  description: string;
  schema_json: { fields: FieldDef[] };
};

export async function getProductTypes(): Promise<ProductType[]> {
  try {
    const r = await fetch(`${API}/api/product-types`, { cache: "no-store" });
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

export async function getProductType(slug: string): Promise<ProductType | null> {
  try {
    const r = await fetch(`${API}/api/product-types/${slug}`, { cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}
