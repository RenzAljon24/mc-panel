import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { installPluginFromUpload } from "@/lib/plugins";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  const { serverId } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = await prisma.server.findFirst({
    where: { id: serverId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart payload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await installPluginFromUpload(server.id, file.name, buf);

    await prisma.auditEvent.create({
      data: {
        serverId: server.id,
        userId: session.user.id,
        kind: "plugin.install",
        payloadJson: JSON.stringify({
          source: "upload",
          slug: result.name,
          filename: result.filename,
        }),
      },
    });

    revalidatePath(`/servers/${serverId}/plugins`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
