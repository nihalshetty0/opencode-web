import { useQuery } from "@tanstack/react-query";

export type TAppInfo = {
  user: string;
  hostname: string;
  git: {
    branch?: string;
    commit?: string;
    dirty?: boolean;
  };
  path: {
    config: string;
    data: string;
    root: string;
    cwd: string;
    state: string;
  };
  time: {
    initialized?: number;
  };
};

export const useGetAppInfo = () =>
  useQuery<TAppInfo & { projectName: string }>({
    queryKey: ["appInfo"],
    queryFn: async () => {
      const res = await fetch("/api/app");
      if (!res.ok) throw new Error("Failed to fetch app info");
      const data: TAppInfo = await res.json();

      // Cross-platform: get last segment of path.root
      // Handles both / and \ as separators
      const root = data.path.root;
      let projectName = "";
      if (typeof root === "string") {
        // Remove trailing slash/backslash if present
        const normalized = root.replace(/[\\/]+$/, "");
        // Split by both / and \
        const parts = normalized.split(/[/\\]+/);
        projectName = parts[parts.length - 1] || "";
      }

      return { ...data, projectName };
    },
  });

