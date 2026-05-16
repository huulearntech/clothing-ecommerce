import { PATHS } from "@/lib/constants";
import SignInForm from "./sign-in-form";

export default function SignInPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const callbackUrl = searchParams.callbackUrl ?? PATHS.home;
  return <SignInForm callbackUrl={callbackUrl} />;
}