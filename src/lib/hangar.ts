const BASE = "https://hangar.papermc.io/api/v1";

export type HangarHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  downloads: number;
  icon_url: string | null;
  latest_version: string;
};

export type HangarVersion = {
  name: string;
  platformDependencies: Partial<Record<"PAPER" | "WATERFALL" | "VELOCITY", string[]>>;
  downloads: Partial<
    Record<
      "PAPER" | "WATERFALL" | "VELOCITY",
      {
        fileInfo?: { name: string; sizeBytes: number; sha256Hash: string };
        externalUrl?: string | null;
        downloadUrl?: string;
      }
    >
  >;
};

type HangarSearchResponse = {
  result: Array<{
    name: string;
    namespace: { owner: string; slug: string };
    description: string;
    stats?: { downloads?: number };
    avatarUrl?: string | null;
  }>;
};

type HangarVersionsResponse = {
  result: HangarVersion[];
};

export async function searchPlugins(query: string, _mcVersion?: string): Promise<HangarHit[]> {
  const url = new URL(`${BASE}/projects`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("platform", "PAPER");

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Hangar: ${res.status}`);
  const data = (await res.json()) as HangarSearchResponse;

  return data.result.map((p) => ({
    project_id: `${p.namespace.owner}/${p.namespace.slug}`,
    slug: p.namespace.slug,
    title: p.name,
    description: p.description ?? "",
    downloads: p.stats?.downloads ?? 0,
    icon_url: p.avatarUrl ?? null,
    latest_version: "",
  }));
}

export async function getProjectVersions(slug: string, _mcVersion?: string): Promise<HangarVersion[]> {
  const url = new URL(`${BASE}/projects/${encodeURIComponent(slug)}/versions`);
  url.searchParams.set("limit", "25");
  url.searchParams.set("platform", "PAPER");

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Hangar: ${res.status}`);
  const data = (await res.json()) as HangarVersionsResponse;
  return data.result;
}

export function buildDownloadUrl(slug: string, versionName: string): string {
  return `${BASE}/projects/${encodeURIComponent(slug)}/versions/${encodeURIComponent(
    versionName,
  )}/PAPER/download`;
}
