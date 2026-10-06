import { NextResponse } from "next/server";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized" },
    { status: 401 }
  );
}

export async function POST(request) {
  try {
    // Secreto compartido entre Google Apps Script y Vercel
    const expectedSecret = process.env.INGEST_SECRET;
    const authorization = request.headers.get("authorization") || "";

    if (
      !expectedSecret ||
      authorization !== `Bearer ${expectedSecret}`
    ) {
      return unauthorized();
    }

    const body = await request.json();

    const sourceRow = Number(body?.source_row);
    const formTimestamp = body?.form_timestamp || null;
    const payload = body?.payload;

    if (
      !Number.isInteger(sourceRow) ||
      sourceRow < 2 ||
      !payload ||
      typeof payload !== "object"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Credenciales privadas de Supabase almacenadas en Vercel
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Server configuration incomplete"
        },
        { status: 500 }
      );
    }

    const row = {
      source: "google_form",
      source_row: sourceRow,
      form_timestamp: formTimestamp,
      payload: payload
    };

    // Inserción en Supabase.
    // Si Google intenta enviar dos veces la misma fila,
    // la combinación source + source_row evita duplicados.
    const response = await fetch(
      `${supabaseUrl}/rest/v1/responses?on_conflict=source,source_row`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(row),
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "Supabase ingest error:",
        response.status,
        detail
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Database insert failed"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    console.error("Ingest error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error"
      },
      { status: 500 }
    );
  }
}
