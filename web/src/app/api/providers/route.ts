import providers from "@/data/providers.json";

type ProviderType =
  | "THERAPIST"
  | "DEVELOPMENTAL_PEDIATRICS"
  | "SLP"
  | "OT"
  | "ABA"
  | "BEHAVIORAL_THERAPY";

type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  city: string;
  zip: string;
  address: string;
  phone?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim();
    const city = searchParams.get("city")?.toLowerCase().trim();
    const zip = searchParams.get("zip")?.toLowerCase().trim();
    const type = searchParams.get("type");
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10), 100);

    let filtered: Provider[] = providers as Provider[];

    if (type && type !== "ALL") {
      filtered = filtered.filter((p) => p.type === type);
    }

    if (q) {
      filtered = filtered.filter((p) => {
        const hay = `${p.name} ${p.address} ${p.city} ${p.zip}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (city) {
      filtered = filtered.filter((p) => p.city.toLowerCase() === city);
    }

    if (zip) {
      filtered = filtered.filter((p) => p.zip.toLowerCase() === zip);
    }

    return Response.json({
      success: true,
      count: filtered.length,
      data: filtered.slice(0, limit),
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch providers:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch providers",
      },
      { status: 500 }
    );
  }
}
