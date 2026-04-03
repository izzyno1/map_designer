import { requestJson } from "./client";

type SnapPoint = {
  lat: number;
  lng: number;
};

export async function snapPath(points: SnapPoint[]): Promise<SnapPoint[]> {
  const response = await requestJson<{ points: SnapPoint[] }>("/api/v1/snap-path", {
    method: "POST",
    body: JSON.stringify({ points }),
  });

  return response.points;
}
