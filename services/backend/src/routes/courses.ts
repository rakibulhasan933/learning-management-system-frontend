import { Router, type Router as ExpressRouter } from "express"
import { z } from "zod"
import type {
  CourseDetailDto,
  CourseListResponse,
  CourseSummaryDto,
} from "@workspace/types"
import { courseLevels } from "@workspace/types"
import {
  and,
  asc,
  count,
  courses,
  desc,
  eq,
  ilike,
  lectures,
  or,
  profiles,
  sections,
  sql,
} from "@workspace/db"

import { asyncHandler, HttpError } from "../http/errors.js"
import { db } from "../lib/database.js"

export const coursesRouter: ExpressRouter = Router()

const courseListQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  level: z.enum(courseLevels).optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  q: z.string().trim().min(1).optional(),
})
const courseSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
})

function serializeDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function toCourseSummary(row: {
  category: string | null
  currency: string
  id: string
  instructorName: string | null
  level: CourseSummaryDto["level"]
  price: string
  publishedAt: Date | null
  shortDescription: string | null
  slug: string
  thumbnailUrl: string | null
  title: string
}): CourseSummaryDto {
  return {
    category: row.category,
    currency: row.currency,
    id: row.id,
    instructorName: row.instructorName,
    level: row.level,
    price: row.price,
    publishedAt: serializeDate(row.publishedAt),
    shortDescription: row.shortDescription,
    slug: row.slug,
    thumbnailUrl: row.thumbnailUrl,
    title: row.title,
  }
}

coursesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = courseListQuerySchema.parse(request.query)
    const filters = [eq(courses.status, "published")]

    if (query.q) {
      filters.push(
        or(
          ilike(courses.title, `%${query.q}%`),
          ilike(courses.shortDescription, `%${query.q}%`),
          ilike(courses.category, `%${query.q}%`),
        )!,
      )
    }

    if (query.category) {
      filters.push(eq(courses.category, query.category))
    }

    if (query.level) {
      filters.push(eq(courses.level, query.level))
    }

    if (query.maxPrice !== undefined) {
      filters.push(sql`${courses.price} <= ${query.maxPrice}`)
    }

    const where = and(...filters)
    const offset = (query.page - 1) * query.pageSize

    const [totalRow] = await db
      .select({ total: count() })
      .from(courses)
      .where(where)

    const rows = await db
      .select({
        category: courses.category,
        currency: courses.currency,
        id: courses.id,
        instructorName: profiles.fullName,
        level: courses.level,
        price: courses.price,
        publishedAt: courses.publishedAt,
        shortDescription: courses.shortDescription,
        slug: courses.slug,
        thumbnailUrl: courses.thumbnailUrl,
        title: courses.title,
      })
      .from(courses)
      .innerJoin(profiles, eq(courses.instructorId, profiles.id))
      .where(where)
      .orderBy(desc(courses.publishedAt), desc(courses.createdAt))
      .limit(query.pageSize)
      .offset(offset)

    const total = totalRow?.total ?? 0
    const payload: CourseListResponse = {
      courses: rows.map(toCourseSummary),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }

    response.status(200).json(payload)
  }),
)

coursesRouter.get(
  "/:slug",
  asyncHandler(async (request, response) => {
    const params = courseSlugParamsSchema.parse(request.params)
    const [course] = await db
      .select({
        category: courses.category,
        currency: courses.currency,
        description: courses.description,
        id: courses.id,
        instructorName: profiles.fullName,
        level: courses.level,
        price: courses.price,
        publishedAt: courses.publishedAt,
        shortDescription: courses.shortDescription,
        slug: courses.slug,
        thumbnailUrl: courses.thumbnailUrl,
        title: courses.title,
      })
      .from(courses)
      .innerJoin(profiles, eq(courses.instructorId, profiles.id))
      .where(and(eq(courses.slug, params.slug), eq(courses.status, "published")))
      .limit(1)

    if (!course) {
      throw new HttpError(404, "Course not found.")
    }

    const sectionRows = await db
      .select({
        id: sections.id,
        position: sections.position,
        title: sections.title,
      })
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(asc(sections.position))

    const lectureRows = await db
      .select({
        durationSeconds: lectures.durationSeconds,
        id: lectures.id,
        isPreview: lectures.isPreview,
        position: lectures.position,
        sectionId: lectures.sectionId,
        title: lectures.title,
      })
      .from(lectures)
      .innerJoin(sections, eq(lectures.sectionId, sections.id))
      .where(and(eq(sections.courseId, course.id), eq(lectures.isPublished, true)))
      .orderBy(asc(sections.position), asc(lectures.position))

    const payload: CourseDetailDto = {
      ...toCourseSummary(course),
      description: course.description,
      sections: sectionRows.map((section) => ({
        id: section.id,
        lectures: lectureRows
          .filter((lecture) => lecture.sectionId === section.id)
          .map((lecture) => ({
            durationSeconds: lecture.durationSeconds,
            id: lecture.id,
            isPreview: lecture.isPreview,
            position: lecture.position,
            title: lecture.title,
          })),
        position: section.position,
        title: section.title,
      })),
    }

    response.status(200).json(payload)
  }),
)
