import { useState, useEffect, useRef, ReactNode, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyDashboardCardProps {
  children: ReactNode;
  minHeight?: string;
  className?: string;
}

export function LazyDashboardCard({ children, minHeight = "200px", className = "" }: LazyDashboardCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Load 100px before entering viewport
        threshold: 0,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div ref={cardRef} className={className} style={{ minHeight }}>
        <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={
        <Card className="h-full border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </CardContent>
        </Card>
      }>
        {children}
      </Suspense>
    </div>
  );
}

// Skeleton específico para o Production Board
export function ProductionBoardSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-36 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-12 w-full mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1">
              <Skeleton className="h-8 w-full mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
