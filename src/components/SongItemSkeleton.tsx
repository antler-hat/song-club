import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import './SongItem.scss';

export function SkeletonTrackCard() {
  return (
    <div className="songItem-skeleton">
      <Skeleton className="h-[40px] w-[40px] rounded-full" />
      <Skeleton className="h-3 rounded-full" />
      <Skeleton className="h-3 rounded-full" />
      <Skeleton className="h-3 rounded-full" />
    </div>
  );
}

export default SkeletonTrackCard;
