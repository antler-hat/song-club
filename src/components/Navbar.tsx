import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, LogIn } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import UploadModal from "@/components/UploadModal";
import SearchBar from "@/components/SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import "./navbar.scss";
import React, { useState } from "react";

interface NavbarProps {
  user: any;
  signOut?: () => Promise<void>;
  showSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  showUpload?: boolean;
  onUploadComplete?: () => void;
  showLoginButton?: boolean;
  mobileSearch?: boolean;
  setMobileSearchOpen?: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  signOut,
  showSearch = true,
  searchQuery = "",
  setSearchQuery,
  showUpload = true,
  onUploadComplete,
  showLoginButton = false,
  mobileSearch = false,
  setMobileSearchOpen,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpenInternal] = useState(false);

  // Use internal state if not provided
  const effectiveMobileSearchOpen = setMobileSearchOpen ? mobileSearch : mobileSearchOpen;
  const setEffectiveMobileSearchOpen = setMobileSearchOpen || setMobileSearchOpenInternal;

  return (
    <header className="">
      <div className="p-4 pb-6 max-w-4xl mx-auto flex items-center justify-between gap-4">
        {isMobile && showSearch && effectiveMobileSearchOpen ? (
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery!}
              mobileOpen={effectiveMobileSearchOpen}
              setMobileOpen={setEffectiveMobileSearchOpen}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Link to="/"><h1 className="navbar-title">Song Club</h1></Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {showSearch && (
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery!}
                  mobileOpen={effectiveMobileSearchOpen}
                  setMobileOpen={setEffectiveMobileSearchOpen}
                />
              )}
              {user && showUpload && (
                <UploadModal onUploadComplete={onUploadComplete} />
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="navbar-userButton">
                      <Avatar>
                        <AvatarFallback>
                          {user?.user_metadata?.username?.[0]?.toUpperCase() ||
                            user?.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        My songs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (signOut) {
                          await signOut();
                          navigate("/auth");
                        }
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!user && showLoginButton && (
                <Link to="/auth">
                  <Button variant="outline" className="">
                    Log in to upload
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
