import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootShell, SiteLayout } from "@/components/layout/AppShell";
import HomePage from "@/pages/HomePage";

/* every page except the home page is its own chunk; the curriculum (~1 MB) loads with the first one that needs it */
const lazy = (load) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    element: <RootShell />,
    children: [
      /* front matter: header, centred page, colophon */
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "grades", lazy: lazy(() => import("@/pages/GradesPage")) },
          { path: "profile", lazy: lazy(() => import("@/pages/ProfilePage")) },
          { path: "*", lazy: lazy(() => import("@/pages/NotFoundPage")) },
        ],
      },
      /* the book: contents sidebar + page */
      {
        lazy: lazy(() => import("@/components/layout/BookLayout")),
        children: [
          { path: "grade/:n", lazy: lazy(() => import("@/pages/GradePage")) },
          { path: "grade/:n/tools/:tool", lazy: lazy(() => import("@/pages/ToolPage")) },
          { path: "grade/:n/:chapterId", lazy: lazy(() => import("@/pages/ChapterPage")) },
          { path: "grade/:n/:chapterId/:lesson", lazy: lazy(() => import("@/pages/LessonPage")) },
        ],
      },
      /* the exam room: full screen, no site navigation */
      { path: "grade/12/exam/:examId", lazy: lazy(() => import("@/pages/ExamPage")) },
      { path: "grade/:n/:chapterId/test", lazy: lazy(() => import("@/pages/ChapterTestPage")) },
      /* the teacher's register: its own shell */
      { path: "teacher", lazy: lazy(() => import("@/pages/TeacherPage")) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
