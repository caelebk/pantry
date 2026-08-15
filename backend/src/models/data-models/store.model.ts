export interface StoreDTO {
  id: string;
  name: string;
  archived: boolean;
}

export interface CreateStoreDTO {
  name: string;
}
export interface UpdateStoreDTO {
  name?: string;
  archived?: boolean;
}
