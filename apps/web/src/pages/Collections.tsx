const upcoming = [
  { name: "Personal", hint: "Default collection after first unlock" },
  { name: "Infrastructure", hint: "SSH keys, tokens, service accounts" },
  { name: "Shared later", hint: "Multi-user sharing is out of scope for Phase 1" },
];

export function CollectionsPage() {
  return (
    <section className="grid gap-4">
      <div className="glass-panel rounded-3xl p-6">
        <h1 className="font-display text-3xl font-semibold">Collections</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Hierarchy is Workspace → Collections → Secrets. These cards are placeholders so the
          navigation is real before persistence exists.
        </p>
      </div>
      <div className="grid gap-3">
        {upcoming.map((item, index) => (
          <article
            key={item.name}
            className="glass-panel rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <h2 className="text-lg font-medium">{item.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{item.hint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
