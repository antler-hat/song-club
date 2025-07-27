import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SimpleHeaderProps {
  title: ReactNode;
  backTo?: string;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({ title, backTo = "/" }) => (
  <header className="border-b-brutalist p-4">
    <div className="max-w-4xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to={backTo}>
          <Button variant="outline" size="sm" className="">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>
    </div>
  </header>
);

export default SimpleHeader;
