import { mockProductLibrary } from "../mock-data/product-library";
import type { ProductLibraryData } from "./types";

export interface ProductLibraryRepository {
  load(): ProductLibraryData;
}

export const mockProductLibraryRepository: ProductLibraryRepository = {
  load: () => structuredClone(mockProductLibrary),
};
