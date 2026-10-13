import Link from "next/link";
import { IconType } from "react-icons";
import { MdArrowForward } from "react-icons/md";

export default function NavCard({
  icon: Icon,
  title,
  href,
  desc,
}: {
  icon: IconType;
  title: string;
  href: string;
  desc: string;
}) {
  return (
    <Link href={href} className="flex w-full cursor-pointer group">
      <div className="flex flex-col h-full w-full bg-gray-100 p-5 border border-gray-100 default-radius card-hover-primary gap-3 transition duration-150">
        <div>
          <Icon className="text-5xl text-gray-200 mb-3 group-hover:text-[var(--brand-tertiary)] transition duration-150" />
          <div className="flex flex-col gap-1 text-left">
            <h3 className="flex text-left text-xl font-semibold">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
        <MdArrowForward className="text-xl self-end text-gray-400 transition-colors duration-150 group-hover:text-[var(--brand-primary)]" />
      </div>
    </Link>
  );
}
