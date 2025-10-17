
import { Home, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col items-center z-50 transition-all duration-300",
        collapsed ? "w-8" : "w-20"
      )}
    >
      {/* Collapse/Expand Arrow - Centered vertically */}
      <div className="relative h-full w-full flex flex-col items-center justify-center">
        <button
          className={cn(
            "flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[hsl(var(--sidebar-accent))] shadow-md hover:bg-[hsl(var(--sidebar-primary))] transition-colors border border-[hsl(var(--sidebar-border))]",
            "z-10"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-[hsl(var(--sidebar-primary))]" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-[hsl(var(--sidebar-primary))]" />
          )}
          {/* Decorative dot */}
          <span className="ml-1 w-2 h-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
        </button>

        {/* Sidebar content (hidden when collapsed) */}
        <div className={cn("w-full flex flex-col items-center transition-all duration-300", collapsed && "opacity-0 pointer-events-none")}> 
          {/* Star Logo */}
          <div className={cn("mb-8 transition-all duration-300", collapsed && "mb-2")}> 
            <Star
              className={cn(
                "w-10 h-10 text-[hsl(var(--sidebar-primary))] fill-[hsl(var(--sidebar-primary))] transition-all duration-300",
                collapsed && "w-7 h-7"
              )}
            />
          </div>

          {/* Navigation */}
          <nav className={cn("flex flex-col gap-6", collapsed && "gap-2")}> 
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all hover:bg-[hsl(var(--sidebar-accent))]",
                  isActive && "bg-[hsl(var(--sidebar-accent))]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Home
                    className={cn(
                      "w-6 h-6 transition-colors",
                      isActive
                        ? "text-[hsl(var(--sidebar-primary))]"
                        : "text-[hsl(var(--sidebar-foreground))]",
                      collapsed && "w-5 h-5"
                    )}
                  />
                  {!collapsed && (
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isActive
                          ? "text-[hsl(var(--sidebar-primary))]"
                          : "text-[hsl(var(--sidebar-foreground))]"
                      )}
                    >
                      Home
                    </span>
                  )}
                </>
              )}
            </NavLink>
            {/* Chatbot temporariamente oculto */}
          </nav>
        </div>
      </div>
    </aside>
  );
};
