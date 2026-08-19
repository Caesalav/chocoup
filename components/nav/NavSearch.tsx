"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import {
  SEARCH_KIND_LABEL,
  type SearchKind,
  type SearchSuggestion,
} from "@/lib/search-kinds";

const KIND_CHIP: Record<SearchKind, string> = {
  ciudad: "bg-land text-selva",
  caso: "bg-need-mid-soft text-need-mid-strong",
  necesidad: "bg-lavanda text-ink",
  seccion: "bg-selva/15 text-selva",
};

function KindTag({ kind }: { kind: SearchKind }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 ${KIND_CHIP[kind]}`}
    >
      {SEARCH_KIND_LABEL[kind]}
    </span>
  );
}

export function useNavSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return {
    open,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
  };
}

/** El mando de buscar: sin JS va a /buscar; con JS abre el campo en la barra. */
export function SearchTabLink({
  href,
  className,
  children,
  onOpen,
  label,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onOpen: () => void;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      {children}
    </Link>
  );
}

export function NavSearch({
  variant,
  onClose,
}: {
  variant: "dock" | "header";
  onClose: () => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const delay = query.trim().length < 2 ? 0 : 160;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = (await response.json()) as { suggestions?: SearchSuggestion[] };
        setSuggestions(body.suggestions ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const list = (
    <ul className="max-h-[min(50vh,22rem)] overflow-y-auto py-1">
      {suggestions.map((item) => (
        <li key={`${item.kind}:${item.href}`}>
          <button
            type="button"
            onClick={() => go(item.href)}
            className="flex w-full min-h-12 items-center gap-3 px-4 text-left hover:bg-line"
          >
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{item.title}</span>
            <KindTag kind={item.kind} />
          </button>
        </li>
      ))}
      {query.trim().length >= 2 && suggestions.length === 0 && (
        <li className="px-4 py-3 text-[14px] text-muted">
          Nada coincide. Prueba un municipio o una causa.
        </li>
      )}
    </ul>
  );

  const field = (
    <form
      action="/buscar"
      className="flex min-w-0 flex-1 items-center gap-2"
      onSubmit={(event) => {
        if (suggestions[0]) {
          event.preventDefault();
          go(suggestions[0].href);
        }
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Qué buscas
      </label>
      <SearchIcon className="size-5 shrink-0 text-faint" />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Un municipio, una familia…"
        enterKeyHint="search"
        autoComplete="off"
        className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-faint"
      />
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-panel px-3 text-[13px] font-medium text-body hover:text-ink"
      >
        <CloseIcon className="size-3.5" />
        Cancelar
      </button>
    </form>
  );

  if (variant === "dock") {
    return (
      <>
        <button
          type="button"
          aria-label="Cerrar búsqueda"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/15 lg:hidden"
        />
        <div
          className="fixed inset-x-3 z-50 lg:hidden"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="overflow-hidden rounded-3xl border border-line bg-panel-high shadow-float">
            {list}
            <div className="border-t border-line px-3 py-1.5">{field}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative ml-auto min-w-0 flex-1">
      <div className="flex min-h-10 items-center rounded-full border border-line bg-panel-high px-3">
        {field}
      </div>
      <div className="absolute inset-x-0 top-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-2xl border border-line bg-panel-high shadow-float">
        {list}
      </div>
    </div>
  );
}
