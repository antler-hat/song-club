import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
}) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    if (!mobileOpen) {
      return (
        <Button
          variant="outline"
          aria-label="Open search"
          onClick={() => setMobileOpen(true)}
          className={clsx("h-9 w-9", className)}
        >
          <Search size={20} />
        </Button>
      );
    }
    return (
      <div className={clsx("flex-1 max-w-full flex items-center", className)}>
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          className={clsx("pr-20 border-brutalist w-full", inputClassName)}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange("")}
              className="h-6 w-6 p-0"
              aria-label="Clear search"
              tabIndex={-1}
            >
              <X size={14} />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMobileOpen(false)}
            className="h-6 w-6 p-0"
            aria-label="Close search"
            tabIndex={-1}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: always show input
  return (
    <div className={clsx("relative flex-1 max-w-md flex items-center", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={clsx("pr-20 border-brutalist", inputClassName)}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {value && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
            className="h-6 w-6 p-0"
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X size={14} />
          </Button>
        )}
        <Search size={16} className="text-muted-foreground" />
      </div>
    </div>
  );
};

export default SearchBar;
