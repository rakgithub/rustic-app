import * as React from "react";

export type AppHeaderItem = {
  label: string;
  to?: string;
  children?: Array<{ label: string; to: string }>;
};

type AppHeaderProps = {
  items: AppHeaderItem[];
  onNavigate: (to: string) => void;
  endContent?: React.ReactNode;
  brand?: string;
};

function AppHeader({ brand = "Rustic", endContent, items, onNavigate }: AppHeaderProps) {
  const [openMenu, setOpenMenu] = React.useState<string>();

  function navigate(to: string) {
    setOpenMenu(undefined);
    onNavigate(to);
  }

  return (
    <header className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-5 px-4 sm:px-6">
        <button
          className="text-base font-semibold tracking-tight outline-none focus-visible:rounded-[var(--radius-sm)] focus-visible:ring-3 focus-visible:ring-[var(--color-border-focus)]/50"
          onClick={() => navigate("/")}
          type="button"
        >
          {brand}
        </button>

        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {items.map((item) =>
            item.children ? (
              <div className="relative" key={item.label}>
                <button
                  aria-expanded={openMenu === item.label}
                  aria-haspopup="menu"
                  className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--color-text-secondary)] outline-none transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] focus-visible:ring-3 focus-visible:ring-[var(--color-border-focus)]/50"
                  onClick={() =>
                    setOpenMenu((current) => (current === item.label ? undefined : item.label))
                  }
                  type="button"
                >
                  {item.label}
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {openMenu === item.label && (
                  <div
                    className="absolute left-0 z-10 mt-2 min-w-44 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-1 shadow-[var(--shadow-md)]"
                    role="menu"
                  >
                    {item.children.map((child) => (
                      <button
                        className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] outline-none transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-surface-sunken)]"
                        key={child.to}
                        onClick={() => navigate(child.to)}
                        role="menuitem"
                        type="button"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                className="h-9 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--color-text-secondary)] outline-none transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text-primary)] focus-visible:ring-3 focus-visible:ring-[var(--color-border-focus)]/50"
                key={item.label}
                onClick={() => item.to && navigate(item.to)}
                type="button"
              >
                {item.label}
              </button>
            ),
          )}
        </nav>

        {endContent && <div className="ml-auto flex items-center gap-2">{endContent}</div>}
      </div>
    </header>
  );
}

export { AppHeader };
