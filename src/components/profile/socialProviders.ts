import type { IconType } from "react-icons";
import { FaGithub, FaGoogle, FaMicrosoft, FaApple } from "react-icons/fa6";

export type SocialProviderMeta = {
  label: string;
  Icon: IconType;
};

const SOCIAL_PROVIDERS: Record<string, SocialProviderMeta> = {
  google: { label: "Google", Icon: FaGoogle },
  github: { label: "GitHub", Icon: FaGithub },
  microsoft: { label: "Microsoft", Icon: FaMicrosoft },
  apple: { label: "Apple", Icon: FaApple },
};

export function getSocialProviderMeta(target: string): SocialProviderMeta {
  const known = SOCIAL_PROVIDERS[target.toLowerCase()];
  if (known) return known;
  return {
    label: target.charAt(0).toUpperCase() + target.slice(1),
    Icon: FaGithub,
  };
}
