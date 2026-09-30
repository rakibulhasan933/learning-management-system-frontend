import { Toaster } from 'sonner';

import { PlateEditor } from '@/components/editor/plate-editor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Page() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Course content</p>
          <h1 className="text-2xl font-semibold tracking-tight">Create lesson content</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Write and format your lesson with the configured shadcn/ui and Plate editor.
          </p>
        </header>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-background">
            <CardTitle>Lesson editor</CardTitle>
            <CardDescription>
              Use the toolbar to structure headings, lists, links, media, and rich text.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PlateEditor />
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </main>
  );
}
