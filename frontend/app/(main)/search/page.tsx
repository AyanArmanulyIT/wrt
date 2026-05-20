import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
          <CardDescription>Поиск пользователей и постов — в следующих этапах.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Скоро здесь будет поиск по школе.</p>
        </CardContent>
      </Card>
    </div>
  );
}
