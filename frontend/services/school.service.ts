import { api } from "./api";
import type { School, SchoolClass } from "@/types/api.types";

export async function fetchSchools(): Promise<School[]> {
  const { data } = await api.get<School[]>("/schools/");
  return data;
}

export async function fetchSchoolClasses(schoolSlug: string): Promise<SchoolClass[]> {
  const { data } = await api.get<SchoolClass[]>(`/schools/${schoolSlug}/classes/`);
  return data;
}
