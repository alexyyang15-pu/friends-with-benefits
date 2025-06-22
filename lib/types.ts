export interface Connection {
  'First Name': string;
  'Last Name': string;
  Company: string;
  Position: string;
  'Connected On': string;
  URL: string;
  location?: string | null;
}

export interface SearchApiRequest {
  query: string;
  connections: Connection[];
}

export interface StructuredQuery {
  keywords?: string[];
  roles?: string[];
  companies?: string[];
  industries?: string[];
  searchDirective?: string;
}

export interface SearchQuery {
  positive_keywords?: string[];
  negative_keywords?: string[];
  company?: string;
  position?: string;
  location?: string;
}

export type SearchResult = Connection & {
  reason?: string;
};

export type ClosestConnection = Connection & {
  reason: string;
  email?: string;
};

export interface GeneratedEmail {
  subject: string;
  body: string;
} 