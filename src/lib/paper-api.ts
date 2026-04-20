const BASE = "https://api.papermc.io/v2/projects/paper";

export type PaperBuild = {
  build: number;
  channel: "default" | "experimental";
  downloads: { application: { name: string; sha256: string } };
};

export async function listVersions(): Promise<string[]> {
  const res = await fetch(BASE, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`PaperMC API: ${res.status}`);
  const data = (await res.json()) as { versions: string[] };
  return data.versions.reverse();
}

export async function listBuilds(version: string): Promise<PaperBuild[]> {
  const res = await fetch(`${BASE}/versions/${version}/builds`, {
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`PaperMC API: ${res.status}`);
  const data = (await res.json()) as { builds: PaperBuild[] };
  return data.builds.reverse();
}

export function downloadUrl(version: string, build: number, jarName: string): string {
  return `${BASE}/versions/${version}/builds/${build}/downloads/${jarName}`;
}
