export interface PrInfo {
  number: number;
  owner: string;
  repo: string;
}

export interface ReviewComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  path: string;
  line: number | null;
  diff_hunk: string;
  created_at: string;
}

export interface ReplyOptions {
  commentId: number;
  body: string;
  prInfo: PrInfo;
}

export interface GhApiError {
  message: string;
  documentation_url?: string;
}
