import { NextResponse } from "next/server"

import { ApiClientError, authenticatedApiFetch } from "@/lib/api-client"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.toString()

  try {
    const response = await authenticatedApiFetch<unknown>(
      `/admin/users${search ? `?${search}` : ""}`,
      { cache: "no-store" }
    )

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ApiClientError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { message: "Unable to load users." },
      { status: 500 }
    )
  }
}
