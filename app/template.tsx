import { RootPageTemplate } from "@/components/providers/root-page-template";

export default function Template({ children }: { children: React.ReactNode }) {
  return <RootPageTemplate>{children}</RootPageTemplate>;
}
