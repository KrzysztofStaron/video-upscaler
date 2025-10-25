export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const image = searchParams.get("image") ?? "demowki109.jpg";
  const n = searchParams.get("n") ?? "10";
  const m = searchParams.get("m") ?? "10";

  const target = `http://109.199.102.132:4105/split?image=${encodeURIComponent(image)}&n=${encodeURIComponent(
    n
  )}&m=${encodeURIComponent(m)}`;

  const upstream = await fetch(target);
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "text/plain",
    },
  });
}
