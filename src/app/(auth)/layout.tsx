export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-muted/50 px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
