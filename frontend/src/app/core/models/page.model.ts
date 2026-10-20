export interface PageRequest {
  limit: number;
  offset: number;
}

export interface Page<T> extends PageRequest {
  items: T[];
  total: number;
}
