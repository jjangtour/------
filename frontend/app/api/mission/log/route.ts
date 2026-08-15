import { NextRequest, NextResponse } from "next/server";
import { MissionExecutionLog } from "@/types/learningMission";

// 서버 메모리 캐시 (MySQL 연동 전/오프라인 백업용)
const inMemoryLogs: MissionExecutionLog[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: MissionExecutionLog = await request.json();

    if (!body.student_id || !body.mission_id || !body.skill) {
      return NextResponse.json(
        { error: "필수 데이터(student_id, mission_id, skill)가 누락되었습니다." },
        { status: 400 }
      );
    }

    inMemoryLogs.push(body);

    // 향후 MySQL Connection Pool 연동 시:
    // await db.query('INSERT INTO learning_mission_logs (...) VALUES (...)');

    return NextResponse.json(
      {
        success: true,
        message: "학습 로그가 성공적으로 기록되었습니다.",
        logId: inMemoryLogs.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mission Log API POST error:", error);
    return NextResponse.json(
      { error: "학습 로그 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");
  const skill = searchParams.get("skill");

  let filtered = [...inMemoryLogs];

  if (studentId) {
    filtered = filtered.filter((l) => l.student_id === studentId);
  }
  if (skill) {
    filtered = filtered.filter((l) => l.skill === skill);
  }

  return NextResponse.json({
    total: filtered.length,
    logs: filtered,
  });
}
