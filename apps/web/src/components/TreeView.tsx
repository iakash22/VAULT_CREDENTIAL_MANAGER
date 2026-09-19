import { useState } from "react";
import type { CollectionTreeNode, SecretTreeNode } from "@vault/types";
import { SecretTypeBadge } from "./SecretTypeBadge";

interface TreeViewProps {
  tree: CollectionTreeNode[];
  rootSecrets: SecretTreeNode[];
  onOpenCollection?: (collection: CollectionTreeNode) => void;
  onOpenSecret?: (secret: SecretTreeNode) => void;
}

export function TreeView({ tree, rootSecrets, onOpenCollection, onOpenSecret }: TreeViewProps) {
  if (tree.length === 0 && rootSecrets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
        No collections yet. Create one to start organizing encrypted secrets.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {tree.map((node) => (
        <CollectionBranch
          key={node.id}
          node={node}
          depth={0}
          onOpenCollection={onOpenCollection}
          onOpenSecret={onOpenSecret}
        />
      ))}
      {rootSecrets.length > 0 ? (
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Root secrets</p>
          <ul className="mt-2 grid gap-2">
            {rootSecrets.map((secret) => (
              <SecretLeaf key={secret.id} secret={secret} onOpen={onOpenSecret} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CollectionBranch({
  node,
  depth,
  onOpenCollection,
  onOpenSecret,
}: {
  node: CollectionTreeNode;
  depth: number;
  onOpenCollection?: (collection: CollectionTreeNode) => void;
  onOpenSecret?: (secret: SecretTreeNode) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0 || node.secrets.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex flex-1 items-center gap-3 px-4 py-3 text-left"
          style={{ paddingLeft: `${16 + depth * 12}px` }}
        >
          <Chevron open={open && hasChildren} muted={!hasChildren} />
          <FolderIcon />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{node.name}</span>
          <CountBadge count={node.children.length + node.secrets.length} />
        </button>
        {onOpenCollection ? (
          <button
            type="button"
            onClick={() => onOpenCollection(node)}
            className="mr-3 rounded-lg border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400 hover:text-white"
          >
            Open
          </button>
        ) : null}
      </div>

      {open && hasChildren ? (
        <div className="border-t border-white/5 pb-3 pt-1">
          {node.secrets.map((secret) => (
            <div key={secret.id} style={{ paddingLeft: `${28 + depth * 12}px` }} className="px-4 py-1">
              <SecretLeaf secret={secret} onOpen={onOpenSecret} />
            </div>
          ))}
          {node.children.map((child) => (
            <div key={child.id} className="mx-3 mt-2">
              <CollectionBranch
                node={child}
                depth={depth + 1}
                onOpenCollection={onOpenCollection}
                onOpenSecret={onOpenSecret}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SecretLeaf({
  secret,
  onOpen,
}: {
  secret: SecretTreeNode;
  onOpen?: (secret: SecretTreeNode) => void;
}) {
  const content = (
    <>
      <KeyIcon />
      <span className="min-w-0 flex-1 truncate text-sm">{secret.title}</span>
      <SecretTypeBadge type={secret.secretType} />
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(secret)}
        className="flex w-full items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-left text-xs text-slate-300 hover:bg-black/30"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-slate-300">
      {content}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">{count}</span>
  );
}

function Chevron({ open, muted }: { open: boolean; muted: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""} ${
        muted ? "text-slate-600" : "text-slate-400"
      }`}
      fill="currentColor"
    >
      <path d="M8 5l5 5-5 5V5z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent-300" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h5l2 2h9v10H4V7z" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="3" />
      <path d="M11 11l9 9" strokeLinecap="round" />
    </svg>
  );
}

export function TreeSkeleton() {
  return (
    <div className="grid animate-pulse gap-2">
      <div className="h-12 rounded-2xl bg-white/5" />
      <div className="h-12 rounded-2xl bg-white/5" />
      <div className="h-12 rounded-2xl bg-white/5" />
    </div>
  );
}
