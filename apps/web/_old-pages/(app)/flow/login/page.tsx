import LogInForm from './_components/login-form';

export default async function LogInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="container max-w-sm">
        <LogInForm next={next} />
      </div>
    </div>
  );
}
