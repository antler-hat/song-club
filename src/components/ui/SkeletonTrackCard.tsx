import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SkeletonTrackCard() {
  return (
    <Card className={cn("trackCard border-muted")}>
      <CardContent>
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="h-[50px] w-[50px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SkeletonTrackCard;
