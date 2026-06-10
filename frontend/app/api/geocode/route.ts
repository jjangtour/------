import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "주소 쿼리가 없습니다." }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || "ootfqhmvvi";
  const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET || "nOpb2OogYHq0RGOPZFPHYeKD77YDU61lTyL8wftW";

  try {
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
      {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "네이버 API 호출에 실패했습니다." }, { status: response.status });
    }

    const data = await response.json();

    if (data.addresses && data.addresses.length > 0) {
      const firstMatch = data.addresses[0];
      return NextResponse.json({
        address: firstMatch.roadAddress || firstMatch.jibunAddress,
        latitude: parseFloat(firstMatch.y), // 위도
        longitude: parseFloat(firstMatch.x), // 경도
      });
    }

    return NextResponse.json({ error: "주소 검색 결과가 없습니다." }, { status: 404 });
  } catch (error) {
    console.error("Geocoding API Proxy Error:", error);
    return NextResponse.json({ error: "서버 내부 오류가 발생했습니다." }, { status: 500 });
  }
}
