export default function HowItWorksCard({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  const bits = Number(n).toString(2).padStart(3, "0").split("");

  return (
    <div className="p-4 flex flex-col border border-gray-50 bg-gray-50">
      <div className="flex flex-row justify-between items-center mb-1">
        <span className="text-xl font-bold text-gray-200">{n}</span>
        <div className="flex flex-row gap-1 mb-1">
          {bits.map((bit, i) => (
            <span
              key={i}
              className={`w-2 h-2 ${bit === "1" ? "bg-brand-primary" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <span className="text-sm text-gray-400">{desc}</span>
    </div>
  );
}
