export default function StatCard({
  label,
  value,
  sub,
  small,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  small?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="default-radius relative overflow-hidden flex flex-col justify-between bg-gray-50 p-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="block text-md font-semibold text-gray-300">
            {label}
          </span>
          {icon && (
            <span className="text-gray-200 text-2xl">{icon}</span>
          )}
        </div>
        <span
          className={`font-semibold text-gray-800 ${small ? "text-base" : "text-2xl"}`}
        >
          {value}
        </span>
      </div>

      <span className="mt-1 block text-sm text-gray-500">{sub}</span>
    </div>
  );
}
