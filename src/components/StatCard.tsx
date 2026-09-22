export default function StatCard({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string;
  sub: string;
  small?: boolean;
}) {
  return (
    <div className="default-radius relative overflow-hidden flex flex-col justify-between bg-gray-50 p-4">
      <div>
        <p className="block text-md font-semibold text-gray-300">{label}</p>
        <p
          className={`mt-2 font-semibold text-gray-800 ${small ? "text-base" : "text-2xl"}`}
        >
          {value}
        </p>
      </div>

      <p className="mt-1 block text-sm text-gray-500">{sub}</p>
    </div>
  );
}
