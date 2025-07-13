
export interface TModel {
  id: string;
  name: string;
  release_date: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  tool_call: boolean;
  cost: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  limit: {
    context: number;
    output: number;
  };
  options: Record<string, unknown>;
}

export interface TProvider {
  api?: string;
  name: string;
  env: string[];
  id: string;
  npm?: string;
  models: Record<string, TModel>;
}

export interface TProvidersResponse {
  providers: TProvider[];
  default: Record<string, string>;
}

export interface TSelectedModel  {
  providerID: string;
  modelID: string;
};


export interface TSession {
  id: string;
  title: string;
  version: string;
  time: {
    created: number;
  };
}

export interface TPart {
  type: string;
  text?: string;
  tool?: string;
  state?: {
    status?: string;
    title?: string;
    input?: unknown;
    output?: any;
    metadata?: any;
  };
}

export interface TMessage {
  id: string;
  role: "user" | "assistant";
  time: {
    created: number;
  };
  parts: TPart[];
}