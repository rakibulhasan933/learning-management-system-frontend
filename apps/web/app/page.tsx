import Link from "next/link"

import { BrandMark, SiteHeader } from "@/components/site-header"

const topics = [
  {
    title: "Development",
    description: "Build what you imagine.",
    query: "development",
    color: "#202D2B",
    ink: "#95B9A8",
    kind: "code",
  },
  {
    title: "Design",
    description: "Make your ideas matter.",
    query: "design",
    color: "#2B2732",
    ink: "#B6A4C9",
    kind: "design",
  },
  {
    title: "Business",
    description: "Turn ambition into action.",
    query: "business",
    color: "#302B22",
    ink: "#C9AD7A",
    kind: "business",
  },
  {
    title: "Data & technology",
    description: "Discover a new perspective.",
    query: "data",
    color: "#222D35",
    ink: "#93ACBF",
    kind: "data",
  },
]

function TopicArtwork({ kind, ink }: { kind: string; ink: string }) {
  return (
    <svg viewBox="0 0 280 172" fill="none" aria-hidden="true">
      <circle cx="140" cy="86" r="66" stroke={ink} opacity=".13" />
      {kind === "code" ? (
        <>
          <rect
            x="60"
            y="39"
            width="160"
            height="100"
            rx="7"
            fill="#18231F"
            stroke={ink}
            strokeOpacity=".4"
          />
          <path d="M60 62h160" stroke={ink} strokeOpacity=".25" />
          <circle cx="72" cy="51" r="2" fill={ink} />
          <circle cx="80" cy="51" r="2" fill={ink} opacity=".5" />
          <circle cx="88" cy="51" r="2" fill={ink} opacity=".3" />
          <path
            d="m111 81-18 16 18 16m58-32 18 16-18 16m-22-38-13 47"
            stroke={ink}
            strokeWidth="2.5"
          />
        </>
      ) : kind === "design" ? (
        <>
          <rect
            x="93"
            y="37"
            width="94"
            height="98"
            rx="1"
            stroke={ink}
            strokeDasharray="3 4"
          />
          <circle cx="121" cy="81" r="31" fill="#685878" stroke={ink} />
          <path d="m160 62 35 61h-70z" fill="#30283B" stroke={ink} />
          <path
            d="M90 34h6v6h-6zM184 34h6v6h-6zM90 132h6v6h-6zM184 132h6v6h-6z"
            fill={ink}
          />
          <path d="m189 114 3 23 6-7 9-3z" fill={ink} />
        </>
      ) : kind === "business" ? (
        <>
          <path d="M73 130h137" stroke={ink} strokeOpacity=".4" />
          <rect
            x="87"
            y="99"
            width="23"
            height="31"
            rx="2"
            fill={ink}
            opacity=".25"
          />
          <rect
            x="127"
            y="77"
            width="23"
            height="53"
            rx="2"
            fill={ink}
            opacity=".45"
          />
          <rect
            x="167"
            y="49"
            width="23"
            height="81"
            rx="2"
            fill={ink}
            opacity=".7"
          />
          <path
            d="m86 76 41-24 27 7 36-29m-19 0h19v19"
            stroke={ink}
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <path
            d="m140 37-48 26v48l48 26 48-26V63zm0 0v100M92 63l48 26 48-26M92 111l48-26 48 26"
            stroke={ink}
            strokeOpacity=".7"
            strokeWidth="1.5"
          />
          {[
            [140, 37],
            [92, 63],
            [92, 111],
            [140, 137],
            [188, 111],
            [188, 63],
            [140, 87],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill="#222D35"
              stroke={ink}
              strokeWidth="1.5"
            />
          ))}
          <circle cx="140" cy="87" r="13" stroke={ink} opacity=".25" />
        </>
      )}
    </svg>
  )
}

function LearningPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[490px] lg:mr-0 lg:ml-auto">
      <div className="mb-4 flex items-center justify-between px-1 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> A glimpse of
          your learning space
        </span>
        <span>Made for you</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#3A3D43] bg-[#1B1F27]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="flex items-center gap-2 text-xs">
            <span className="h-4 w-[3px] rounded-full bg-primary" /> Your next
            chapter
          </span>
          <span className="rounded border border-border px-2 py-1 font-mono text-[9px] text-muted-foreground">
            Learning preview
          </span>
        </div>
        <div className="relative h-[205px] overflow-hidden border-b border-border bg-[#242C2A]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 488 205"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 41h488M0 82h488M0 123h488M0 164h488M61 0v205M122 0v205M183 0v205M244 0v205M305 0v205M366 0v205M427 0v205"
              stroke="#8CA292"
              strokeOpacity=".08"
            />
            <circle
              cx="253"
              cy="105"
              r="86"
              stroke="#C9A15A"
              strokeOpacity=".22"
            />
            <circle
              cx="253"
              cy="105"
              r="68"
              stroke="#C9A15A"
              strokeOpacity=".13"
            />
            <rect
              x="145"
              y="30"
              width="215"
              height="145"
              rx="7"
              fill="#171D1E"
              stroke="#718276"
            />
            <path
              d="M145 53h215M202 53v122"
              stroke="#718276"
              strokeOpacity=".35"
            />
            <circle cx="157" cy="42" r="2" fill="#C9A15A" />
            <circle cx="165" cy="42" r="2" fill="#718276" />
            <circle cx="173" cy="42" r="2" fill="#718276" />
            <rect
              x="157"
              y="68"
              width="33"
              height="5"
              rx="2"
              fill="#C9A15A"
              fillOpacity=".6"
            />
            <path
              d="M157 85h25m-25 13h29m-29 13h20m-20 13h28"
              stroke="#718276"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x="218"
              y="69"
              width="125"
              height="45"
              rx="3"
              fill="#30443B"
            />
            <path
              d="m233 99 13-13 11 6 17-15 19 19 13-8 20 13"
              stroke="#99B7A0"
              strokeWidth="1.5"
            />
            <rect
              x="218"
              y="125"
              width="36"
              height="32"
              rx="3"
              stroke="#718276"
              strokeOpacity=".5"
            />
            <rect
              x="262"
              y="125"
              width="36"
              height="32"
              rx="3"
              stroke="#718276"
              strokeOpacity=".5"
            />
            <rect
              x="306"
              y="125"
              width="36"
              height="32"
              rx="3"
              stroke="#718276"
              strokeOpacity=".5"
            />
            <rect x="99" y="110" width="95" height="57" rx="5" fill="#C9A15A" />
            <path
              d="m126 128-11 10 11 10m30-20 11 10-11 10m-11-24-7 28"
              stroke="#333023"
              strokeWidth="2"
            />
            <rect
              x="335"
              y="57"
              width="48"
              height="48"
              rx="24"
              fill="#344A3D"
              stroke="#718276"
            />
            <path d="m349 81 7 7 14-14" stroke="#B6CCB5" strokeWidth="2" />
          </svg>
          <span className="absolute right-4 bottom-3 font-mono text-[9px] text-[#B7C4B9]">
            Learn. Build. Become.
          </span>
        </div>
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-[10px] text-[#ACC4B7]">
            <span className="rounded bg-secondary/20 px-2 py-1">
              Development
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Sample course</span>
          </div>
          <h2 className="display-heading text-[27px]">Advanced web systems</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            From understanding the fundamentals to building with confidence.
          </p>
          <div className="mt-6 flex justify-between text-[11px]">
            <span className="text-muted-foreground">
              Your learning progress
            </span>
            <span className="font-mono text-primary">68%</span>
          </div>
          <div
            className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Sample course progress"
            aria-valuenow={68}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full w-[68%] bg-primary" />
          </div>
          <Link
            className="mt-5 flex items-center justify-between rounded-md border border-border bg-background/30 px-4 py-3 text-xs transition-colors hover:border-primary/60"
            href="/courses"
          >
            <span>Find your first course</span>
            <span className="text-primary" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-5 hidden items-center gap-3 rounded-lg border border-[#46554D] bg-[#202C26] px-4 py-3 sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#718A73] text-[#BDD0B7]">
          ✓
        </span>
        <div>
          <p className="text-xs text-[#E4EADF]">Small steps. Real progress.</p>
          <p className="mt-1 text-[10px] text-[#9BAD9D]">
            A little closer to your next milestone.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <>
      <a className="skip-link button-primary" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="page-container grid gap-16 pt-14 pb-20 lg:grid-cols-[1.12fr_1fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow">A better way to move forward</p>
            <h1 className="mt-7 text-[52px] leading-[1.08] tracking-[-.045em] sm:text-[68px] xl:text-[76px]">
              New skills.
              <br />
              New perspectives.
              <br />
              <em className="font-normal text-primary">New possibilities.</em>
            </h1>
            <p className="mt-7 max-w-[420px] text-[15px] leading-[1.9] text-muted-foreground">
              Invest in the person you want to become. Explore thoughtful
              courses, learn at your own pace, and turn your next step into real
              progress.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link className="button-primary" href="/courses">
                Explore courses <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button-secondary" href="#how-it-works">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[8px]"
                  aria-hidden="true"
                >
                  ▶
                </span>{" "}
                How it works
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span>
                <span className="mr-1.5 text-primary">✓</span> Learn at your
                pace
              </span>
              <span>
                <span className="mr-1.5 text-primary">✓</span> Build practical
                skills
              </span>
            </div>
          </div>
          <LearningPreview />
        </section>

        <section
          aria-label="The learning experience"
          className="border-y border-border bg-[#161A21]"
        >
          <div className="page-container grid divide-y divide-border py-3 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-7">
            {[
              [
                "01",
                "Learning that fits your life",
                "Your pace. Your place. Your next chapter.",
              ],
              [
                "02",
                "More than just watching",
                "Put your knowledge to work with assignments.",
              ],
              [
                "03",
                "Progress you can be proud of",
                "Track every milestone. Earn your certificate.",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex gap-4 py-5 md:px-7 md:py-0 md:first:pl-0 md:last:pr-0"
              >
                <span className="mt-1 font-mono text-[11px] text-primary/70">
                  {number}
                </span>
                <div>
                  <h2 className="text-[13px] font-medium">{title}</h2>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="page-container py-20" id="explore">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Follow your curiosity</p>
              <h2 className="display-heading mt-4 text-4xl sm:text-[43px]">
                Where will you go next?
              </h2>
            </div>
            <Link
              className="nav-link flex items-center gap-5 !text-foreground"
              href="/courses"
            >
              View all courses{" "}
              <span className="text-primary" aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <Link
                href={`/courses?q=${topic.query}`}
                key={topic.title}
                className="topic-card group"
              >
                <div className="topic-art" style={{ background: topic.color }}>
                  <TopicArtwork kind={topic.kind} ink={topic.ink} />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-medium">{topic.title}</h3>
                    <span
                      className="text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          className="page-container grid gap-12 border-t border-border py-20 lg:grid-cols-2 lg:gap-24"
          id="how-it-works"
        >
          <div>
            <p className="eyebrow">Built around your journey</p>
            <h2 className="display-heading mt-5 max-w-md text-[43px] leading-[1.15]">
              Less in your way.
              <br />
              <span className="text-primary">More ahead of you.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
              A considered space for learning and teaching. Everything you need
              to take the next step, with nothing to distract you from it.
            </p>
            <Link
              className="mt-7 inline-flex items-center gap-6 text-sm text-primary"
              href="/auth/signup"
            >
              Find your place <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div>
            <details className="role-detail !pt-0" open>
              <summary>For the endlessly curious</summary>
              <p>
                Discover a course, create your account, and start your learning
                journey. Pick up where you left off, test your knowledge, and
                earn a certificate when you complete your course.
              </p>
              <Link
                className="mt-4 inline-flex text-xs text-primary"
                href="/courses"
              >
                Explore the catalog ↗
              </Link>
            </details>
            <details className="role-detail" id="for-instructors">
              <summary>For those with something to share</summary>
              <p>
                Bring your expertise to life with structured courses, video
                lessons, quizzes, and assignments. Follow your students’
                progress from your instructor workspace. Instructor access is
                granted by an administrator.
              </p>
              <Link
                className="mt-4 inline-flex text-xs text-primary"
                href="/auth/login"
              >
                Sign in to teach ↗
              </Link>
            </details>
            <details className="role-detail">
              <summary>For the people behind the scenes</summary>
              <p>
                Keep your learning community running smoothly. Manage courses,
                review payments, and support students and instructors from one
                organized admin workspace.
              </p>
              <Link
                className="mt-4 inline-flex text-xs text-primary"
                href="/auth/login"
              >
                Open your workspace ↗
              </Link>
            </details>
          </div>
        </section>

        <section className="page-container mb-20 flex flex-col items-start justify-between gap-8 rounded-xl border border-primary/25 bg-[#1C201F] p-8 sm:p-12 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow">Your next chapter starts here</p>
            <h2 className="display-heading mt-4 text-4xl sm:text-[43px]">
              Make room for what’s next.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              A new skill. A fresh start. A step toward something bigger.
            </p>
          </div>
          <Link href="/auth/signup" className="button-primary shrink-0">
            Start your journey <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <footer className="border-t border-border py-8">
        <div className="page-container flex flex-wrap items-center justify-between gap-6">
          <Link href="/" aria-label="LMS home">
            <BrandMark />
          </Link>
          <p className="text-xs text-muted-foreground">
            Thoughtful learning. Lasting progress.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link className="hover:text-primary" href="/courses">
              Courses
            </Link>
            <Link className="hover:text-primary" href="/auth/login">
              Sign in
            </Link>
            <span>© {new Date().getFullYear()} lms.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
