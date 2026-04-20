const BASE = "https://api.modrinth.com/v2";

export type ModrinthHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  downloads: number;
  icon_url: string | null;
  versions: string[];
  latest_version: string;
};

export type ModrinthVersion = {
  id: string;
  version_number: string;
  game_versions: string[];
  files: { url: string; filename: string; primary: boolean; hashes: { sha512: string } }[];
};

export async function searchPlugins(query: string, mcVersion?: string): Promise<ModrinthHit[]> {
  const facets: string[][] = [["project_type:plugin"]];
  if (mcVersion) facets.push([`versions:${mcVersion}`]);
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("facets", JSON.stringify(facets));
  url.searchParams.set("limit", "20");

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Modrinth: ${res.status}`);
  const data = (await res.json()) as { hits: ModrinthHit[] };
  return data.hits;
}

export async function getProjectVersions(
  slug: string,
  mcVersion?: string,
): Promise<ModrinthVersion[]> {
  const url = new URL(`${BASE}/project/${slug}/version`);
  if (mcVersion) {
    url.searchParams.set("game_versions", JSON.stringify([mcVersion]));
    url.searchParams.set("loaders", JSON.stringify(["paper", "spigot", "bukkit"]));
  }
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Modrinth: ${res.status}`);
  return (await res.json()) as ModrinthVersion[];
}
